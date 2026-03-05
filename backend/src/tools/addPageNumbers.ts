import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');
const MARGIN = 24;

export async function addPageNumbers(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {},
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const position = (params.position as string) ?? 'bottom-center';
  const startNumber = Number(params.startNumber ?? 1);
  const fontSize = Number(params.fontSize ?? 12);

  const pdfBytes = fs.readFileSync(file.path);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const label = String(startNumber + i);
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    // Vertical position
    const y = position.includes('top')
      ? height - MARGIN - fontSize
      : MARGIN;

    // Horizontal position
    let x: number;
    if (position.includes('left')) {
      x = MARGIN;
    } else if (position.includes('right')) {
      x = width - MARGIN - textWidth;
    } else {
      x = width / 2 - textWidth / 2;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  const outBytes = await pdfDoc.save();
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.writeFileSync(outPath, outBytes);
  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_numbered_${file.originalname}`,
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
  };
}
