import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function compressImage(
  files: Express.Multer.File[],
  params: { quality?: number } = {}
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const quality = Math.min(100, Math.max(1, params.quality ?? 75));
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '') || 'jpg';
  const fmt = ext === 'jpg' ? 'jpeg' : (ext as 'jpeg' | 'png' | 'webp');

  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.${ext}`);

  await sharp(file.path).toFormat(fmt, { quality }).toFile(outPath);
  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_compressed_${file.originalname}`,
    mimeType: file.mimetype,
    sizeBytes: fs.statSync(outPath).size,
  };
}
