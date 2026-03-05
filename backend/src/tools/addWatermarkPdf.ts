import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

export async function addWatermarkPdf(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {},
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const text = (params.text as string) || 'CONFIDENTIAL';
  const rawOpacity = Math.min(100, Math.max(1, Number(params.opacity ?? 30)));
  const opacity = rawOpacity / 100;
  const rotationAngle = Number(params.rotation ?? -45);
  const fontSize = Number(params.fontSize ?? 48);
  const colorHex = (params.color as string) || '#000000';
  const tile = Boolean(params.tile ?? false);

  const [r, g, b] = hexToRgb(colorHex);

  const pdfBytes = fs.readFileSync(file.path);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    if (tile) {
      const stepX = Math.max(textWidth + 40, 200);
      const stepY = Math.max(fontSize + 40, 120);
      for (let x = 0; x < width; x += stepX) {
        for (let y = 0; y < height; y += stepY) {
          page.drawText(text, {
            x, y,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            opacity,
            rotate: degrees(rotationAngle),
          });
        }
      }
    } else {
      page.drawText(text, {
        x: width / 2 - textWidth / 2,
        y: height / 2 - fontSize / 2,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity,
        rotate: degrees(rotationAngle),
      });
    }
  }

  const outBytes = await pdfDoc.save();
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.writeFileSync(outPath, outBytes);
  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_watermarked_${file.originalname}`,
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
  };
}
