import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function resizeImage(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {}
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const options = (params.options ?? params) as Record<string, unknown>;
  const width = options.width ? Number(options.width) : undefined;
  const height = options.height ? Number(options.height) : undefined;
  const maintainAspectRatio = options.maintainAspectRatio !== false;

  if (!width && !height) throw new Error('At least one of width or height is required');

  const fileId = uuidv4();
  const ext = path.extname(file.originalname).toLowerCase();
  const outPath = path.join(TMP_DIR, `${fileId}${ext}`);

  await sharp(file.path)
    .resize(width, height, {
      fit: maintainAspectRatio ? 'inside' : 'fill',
      withoutEnlargement: true,
    })
    .toFile(outPath);

  try { fs.unlinkSync(file.path); } catch (_) {}

  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.gif': 'image/gif',
  };

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_resized${ext}`,
    mimeType: mimeMap[ext] ?? 'image/png',
    sizeBytes: fs.statSync(outPath).size,
  };
}
