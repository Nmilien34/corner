import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function compressPdf(
  files: Express.Multer.File[]
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const pdfBytes = fs.readFileSync(file.path);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  // Re-serialize with object stream compression (removes unused objects)
  const compressed = await pdfDoc.save({ useObjectStreams: true });

  const fileId = uuidv4();
  const outName = `corner_compressed_${file.originalname}`;
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.writeFileSync(outPath, compressed);

  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: outName,
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
  };
}
