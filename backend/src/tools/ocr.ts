import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function runOcr(
  files: Express.Multer.File[]
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const { data: { text } } = await Tesseract.recognize(file.path, 'eng', {
    logger: () => {}, // suppress progress logs
  });

  try { fs.unlinkSync(file.path); } catch (_) {}

  const fileId = uuidv4();
  const baseName = path.basename(file.originalname, path.extname(file.originalname));
  const outPath = path.join(TMP_DIR, `${fileId}.txt`);
  fs.writeFileSync(outPath, text, 'utf-8');

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_ocr_${baseName}.txt`,
    mimeType: 'text/plain',
    sizeBytes: Buffer.byteLength(text, 'utf-8'),
  };
}
