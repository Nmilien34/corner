import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function mergePdf(
  files: Express.Multer.File[]
): Promise<ServerToolResult> {
  if (files.length < 2) throw new Error('At least 2 PDF files are required to merge');

  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = fs.readFileSync(file.path);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    try { fs.unlinkSync(file.path); } catch (_) {}
  }

  const mergedBytes = await merged.save();
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.writeFileSync(outPath, mergedBytes);

  return {
    fileId,
    filePath: outPath,
    fileName: 'corner_merged.pdf',
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
  };
}
