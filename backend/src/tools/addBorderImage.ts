import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    alpha: 1,
  };
}

export async function addBorderImage(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {},
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const borderWidth = Math.max(1, Number(params.borderWidth ?? 10));
  const colorHex = (params.borderColor as string) || '#000000';
  const background = hexToRgba(colorHex);

  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}${ext}`);

  await sharp(file.path)
    .extend({
      top: borderWidth,
      bottom: borderWidth,
      left: borderWidth,
      right: borderWidth,
      background,
    })
    .toFile(outPath);

  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_bordered${ext}`,
    mimeType: MIME_MAP[ext] ?? 'image/jpeg',
    sizeBytes: fs.statSync(outPath).size,
  };
}
