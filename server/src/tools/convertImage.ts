import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'avif'] as const;
type OutputFormat = typeof SUPPORTED_FORMATS[number];

const MIME_MAP: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

export async function convertImage(
  files: Express.Multer.File[],
  params: { format?: string } = {}
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  // Normalize format: jpg -> jpeg
  const rawFmt = (params.format ?? 'png').toLowerCase().replace('jpg', 'jpeg');
  if (!SUPPORTED_FORMATS.includes(rawFmt as OutputFormat)) {
    throw new Error(`Unsupported format: ${params.format}. Use jpeg, png, webp, or avif.`);
  }
  const fmt = rawFmt as OutputFormat;
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;

  const fileId = uuidv4();
  const baseName = path.basename(file.originalname, path.extname(file.originalname));
  const outPath = path.join(TMP_DIR, `${fileId}.${ext}`);

  await sharp(file.path).toFormat(fmt).toFile(outPath);
  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_${baseName}.${ext}`,
    mimeType: MIME_MAP[fmt],
    sizeBytes: fs.statSync(outPath).size,
  };
}
