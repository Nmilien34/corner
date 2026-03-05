import { PDFDocument, PageSizes } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

// pdf-lib PageSizes are [width, height] in points
const PAGE_SIZE_MAP: Record<string, [number, number]> = {
  a4: PageSizes.A4,
  letter: PageSizes.Letter,
  legal: PageSizes.Legal,
};

export async function imageToPdf(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {},
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const pageSizeKey = ((params.pageSize as string) ?? 'a4').toLowerCase();
  const orientation = (params.orientation as string) ?? 'portrait';
  const fitMode = (params.fitMode as string) ?? 'fit';

  let [pageW, pageH] = PAGE_SIZE_MAP[pageSizeKey] ?? PageSizes.A4;
  if (orientation === 'landscape') [pageW, pageH] = [pageH, pageW];

  // Convert image to PNG buffer so pdf-lib can always embed it
  const pngBuffer = await sharp(file.path).png().toBuffer();

  const pdfDoc = await PDFDocument.create();
  const embeddedImage = await pdfDoc.embedPng(pngBuffer);
  const { width: imgW, height: imgH } = embeddedImage;

  let drawW = pageW;
  let drawH = pageH;
  let drawX = 0;
  let drawY = 0;

  if (fitMode === 'fit') {
    // Scale down (or up) to fit inside page, preserving aspect ratio
    const scale = Math.min(pageW / imgW, pageH / imgH);
    drawW = imgW * scale;
    drawH = imgH * scale;
    drawX = (pageW - drawW) / 2;
    drawY = (pageH - drawH) / 2;
  } else if (fitMode === 'fill') {
    // Scale to fill page (may overflow on one axis — we still center it)
    const scale = Math.max(pageW / imgW, pageH / imgH);
    drawW = imgW * scale;
    drawH = imgH * scale;
    drawX = (pageW - drawW) / 2;
    drawY = (pageH - drawH) / 2;
  } else {
    // 'actual': use image at native resolution, centered, capped to page
    drawW = Math.min(imgW, pageW);
    drawH = Math.min(imgH, pageH);
    drawX = (pageW - drawW) / 2;
    drawY = (pageH - drawH) / 2;
  }

  const page = pdfDoc.addPage([pageW, pageH]);
  page.drawImage(embeddedImage, { x: drawX, y: drawY, width: drawW, height: drawH });

  const outBytes = await pdfDoc.save();
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.writeFileSync(outPath, outBytes);
  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: 'corner_image.pdf',
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
  };
}
