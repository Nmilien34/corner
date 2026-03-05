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
  '.avif': 'image/avif',
  '.gif': 'image/gif',
};

export async function flipRotateImage(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {},
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const action = (params.action as string) ?? 'rotate_90';
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}${ext}`);

  let pipeline = sharp(file.path);

  switch (action) {
    case 'flip_h':    pipeline = pipeline.flop(); break;   // horizontal mirror
    case 'flip_v':    pipeline = pipeline.flip(); break;   // vertical mirror
    case 'rotate_90': pipeline = pipeline.rotate(90); break;
    case 'rotate_180':pipeline = pipeline.rotate(180); break;
    default:
      throw new Error(`Unknown flip/rotate action: ${action}`);
  }

  await pipeline.toFile(outPath);
  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_transformed${ext}`,
    mimeType: MIME_MAP[ext] ?? 'image/jpeg',
    sizeBytes: fs.statSync(outPath).size,
  };
}
