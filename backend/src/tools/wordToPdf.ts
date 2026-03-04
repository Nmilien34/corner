import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const execAsync = promisify(exec);
const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

// Resolve the LibreOffice binary — 'soffice' on macOS/Linux, 'libreoffice' elsewhere
async function getLibreOfficeBin(): Promise<string> {
  for (const bin of ['soffice', 'libreoffice']) {
    try {
      await execAsync(`which ${bin}`);
      return bin;
    } catch (_) {}
  }
  throw new Error(
    'LibreOffice is required for DOCX → PDF conversion but was not found. ' +
    'Install it with: brew install --cask libreoffice'
  );
}

export async function wordToPdf(
  files: Express.Multer.File[],
  _params: Record<string, unknown> = {}
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const bin = await getLibreOfficeBin();

  // LibreOffice converts in place, naming the output after the input basename
  await execAsync(
    `${bin} --headless --convert-to pdf --outdir "${TMP_DIR}" "${file.path}"`
  );

  const inputBasename = path.basename(file.path, path.extname(file.path));
  const libreOutputPath = path.join(TMP_DIR, `${inputBasename}.pdf`);

  if (!fs.existsSync(libreOutputPath)) {
    throw new Error('LibreOffice conversion failed — output file not found');
  }

  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.pdf`);
  fs.renameSync(libreOutputPath, outPath);

  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_${path.basename(file.originalname, path.extname(file.originalname))}.pdf`,
    mimeType: 'application/pdf',
    sizeBytes: fs.statSync(outPath).size,
  };
}
