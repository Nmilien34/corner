import { PDFDocument } from 'pdf-lib';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function splitPdf(
  files: Express.Multer.File[]
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const pdfBytes = fs.readFileSync(file.path);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const pagePaths: string[] = [];
  for (let i = 0; i < totalPages; i++) {
    const single = await PDFDocument.create();
    const [page] = await single.copyPages(pdfDoc, [i]);
    single.addPage(page);
    const singleBytes = await single.save();
    const p = path.join(TMP_DIR, `${uuidv4()}_page${i + 1}.pdf`);
    fs.writeFileSync(p, singleBytes);
    pagePaths.push(p);
  }

  try { fs.unlinkSync(file.path); } catch (_) {}

  // Zip all individual page PDFs
  const fileId = uuidv4();
  const zipPath = path.join(TMP_DIR, `${fileId}.zip`);

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    pagePaths.forEach((p, i) =>
      archive.file(p, { name: `page_${String(i + 1).padStart(3, '0')}.pdf` })
    );
    archive.finalize();
  });

  // Clean up individual page files
  pagePaths.forEach((p) => { try { fs.unlinkSync(p); } catch (_) {} });

  return {
    fileId,
    filePath: zipPath,
    fileName: 'corner_split_pages.zip',
    mimeType: 'application/zip',
    sizeBytes: fs.statSync(zipPath).size,
  };
}
