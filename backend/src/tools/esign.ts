import { PDFDocument, PDFImage } from 'pdf-lib';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult, SignatureField, WalkthroughStep } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Use Claude vision to detect signature field positions on each PDF page.
 * Returns an array of SignatureField objects (percent-based coordinates).
 * Falls back to a default bottom-left field if detection fails.
 */
async function detectSignatureFields(pdfPath: string): Promise<SignatureField[]> {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const fields: SignatureField[] = [];

  // Analyze up to 5 pages to avoid excessive API calls
  for (let i = 0; i < Math.min(pages.length, 5); i++) {
    try {
      const { width: pw, height: ph } = pages[i].getSize();
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Analyze page ${i + 1} of a PDF document (page size: ${Math.round(pw)}x${Math.round(ph)} pts).
Return a JSON array of likely signature/initials field locations.
Return ONLY a JSON array with no explanation or markdown:
[{"page": ${i + 1}, "x": number, "y": number, "width": number, "height": number, "label": string}]
All values are percentages (0-100) of page dimensions. x/y is the top-left corner.
For page ${i + 1} of ${pages.length}: place signature fields near y=82-90% if this looks like a final/signature page.
If this is a middle/content page, return [].`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
      const cleaned = text.replace(/^```(?:json)?\n?|\n?```$/gm, '').trim();
      const pageFields: Omit<SignatureField, 'placed'>[] = JSON.parse(cleaned);
      fields.push(...pageFields.map((f) => ({ ...f, placed: true })));
    } catch (_) {
      // Vision detection failed for this page — skip it silently
    }
  }

  // If no fields were detected at all, add a default field at the bottom of page 1
  if (!fields.length) {
    fields.push({
      page: 1,
      x: 10,
      y: 82,
      width: 35,
      height: 8,
      label: 'Signature',
      placed: true,
    });
  }

  return fields;
}

async function embedSignatures(
  pdfBytes: Buffer,
  fields: SignatureField[],
  signatureDataUrl: string,
  initialsDataUrl?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  // Decode base64 signature PNG
  const sigBase64 = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const sigBytes = Buffer.from(sigBase64, 'base64');
  const sigImage: PDFImage = await pdfDoc.embedPng(sigBytes);

  let initialsImage: PDFImage | null = null;
  if (initialsDataUrl) {
    const initBase64 = initialsDataUrl.replace(/^data:image\/\w+;base64,/, '');
    initialsImage = await pdfDoc.embedPng(Buffer.from(initBase64, 'base64'));
  }

  for (const field of fields) {
    if (!field.placed) continue;
    if (field.page < 1 || field.page > pages.length) continue;

    const page = pages[field.page - 1];
    const { width: pw, height: ph } = page.getSize();

    // Convert percent coords to PDF points (PDF origin is bottom-left)
    const x = (field.x / 100) * pw;
    const fieldHeightPt = (field.height / 100) * ph;
    const y = ph - ((field.y / 100) * ph) - fieldHeightPt;
    const w = (field.width / 100) * pw;

    const isInitials = field.label.toLowerCase().includes('initial');
    const img = isInitials && initialsImage ? initialsImage : sigImage;
    page.drawImage(img, { x, y, width: w, height: fieldHeightPt });
  }

  return pdfDoc.save();
}

function buildEsignWalkthrough(fields: SignatureField[]): WalkthroughStep[] {
  const placed = fields.filter((f) => f.placed);
  if (!placed.length) return [];

  const steps: WalkthroughStep[] = [];

  // Overview step on the first signature page
  const first = placed[0];
  steps.push({
    id: 'esign-overview',
    title: 'Signatures applied',
    description: 'We placed your signature in the key spots on this document.',
    region: {
      page: first.page,
      x: Math.max(0, first.x - 5),
      y: Math.max(0, first.y - 5),
      width: Math.min(100 - first.x, first.width + 10),
      height: Math.min(100 - first.y, first.height + 10),
    },
    kind: 'overview',
  });

  // One step per placed field
  placed.forEach((field, idx) => {
    steps.push({
      id: `esign-field-${idx}`,
      title: field.label || 'Signature',
      description:
        idx === 0
          ? 'This is where your primary signature appears.'
          : 'Here is another place where we placed your signature or initials.',
      region: {
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
      },
      kind: 'signature',
    });
  });

  return steps;
}

export async function eSign(
  files: Express.Multer.File[],
  params: {
    signatureDataUrl?: string;
    initialsDataUrl?: string;
    fields?: SignatureField[];
  } = {}
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No PDF provided');
  if (!params.signatureDataUrl) throw new Error('No signature provided');

  const file = files[0];
  const pdfBytes = fs.readFileSync(file.path);

  // Use provided field positions or auto-detect via Claude vision
  const fields: SignatureField[] =
    params.fields?.length
      ? params.fields
      : await detectSignatureFields(file.path);

  const signedBytes = await embedSignatures(pdfBytes, fields, params.signatureDataUrl, params.initialsDataUrl);

  try { fs.unlinkSync(file.path); } catch (_) {}

  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.writeFileSync(outPath, signedBytes);

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_signed_${file.originalname}`,
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
    walkthrough: buildEsignWalkthrough(fields),
  };
}
