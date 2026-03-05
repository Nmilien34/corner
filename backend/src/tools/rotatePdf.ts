import { PDFDocument, degrees } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

function parsePageRange(rangeStr: string, pageCount: number): number[] {
  const indices: number[] = [];
  for (const part of rangeStr.split(',')) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      for (let i = start; i <= Math.min(end, pageCount); i++) {
        indices.push(i - 1);
      }
    } else {
      const n = parseInt(trimmed, 10);
      if (n >= 1 && n <= pageCount) indices.push(n - 1);
    }
  }
  return indices;
}

export async function rotatePdf(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {},
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const direction = (params.direction as string) ?? 'clockwise';
  const applyTo = (params.applyTo as string) ?? 'all';
  const pageRange = (params.pageRange as string) || '';
  const rotationDelta = direction === 'counter' ? -90 : 90;

  const pdfBytes = fs.readFileSync(file.path);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  const indices =
    applyTo === 'range' && pageRange
      ? parsePageRange(pageRange, pages.length)
      : pages.map((_, i) => i);

  for (const i of indices) {
    const page = pages[i];
    const current = page.getRotation().angle;
    page.setRotation(degrees(current + rotationDelta));
  }

  const outBytes = await pdfDoc.save();
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.writeFileSync(outPath, outBytes);
  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_rotated_${file.originalname}`,
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
  };
}
