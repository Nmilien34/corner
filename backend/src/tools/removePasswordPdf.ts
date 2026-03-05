import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function removePasswordPdf(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {},
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const password = (params.currentPassword as string) || '';
  const raw = fs.readFileSync(file.path);

  // pdf-lib doesn't support password-based decryption in this version.
  // Load with ignoreEncryption and re-save to strip basic encryption metadata.
  // For strongly encrypted PDFs this will throw.
  void password; // kept for API consistency
  let pdfBytes: Uint8Array;
  try {
    const doc = await PDFDocument.load(raw, { ignoreEncryption: true });
    pdfBytes = await doc.save();
  } catch {
    throw new Error(
      'Could not process PDF — the file may be strongly encrypted or corrupted',
    );
  }

  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.writeFileSync(outPath, pdfBytes);
  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_unlocked_${file.originalname}`,
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
  };
}
