const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (opts: { data: Uint8Array }) => { getText(): Promise<{ text: string }> };
};
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function pdfToWord(
  files: Express.Multer.File[]
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const pdfBuffer = fs.readFileSync(file.path);
  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
  const data = await parser.getText();

  // Split extracted text into paragraphs by double newline
  const rawParagraphs = data.text
    .split(/\n{2,}/)
    .map((p: string) => p.replace(/\n/g, ' ').trim())
    .filter((p: string) => p.length > 0);

  const paragraphs =
    rawParagraphs.length > 0
      ? rawParagraphs.map(
          (text: string) =>
            new Paragraph({ children: [new TextRun({ text, size: 24 })] })
        )
      : [new Paragraph({ children: [new TextRun({ text: '(No text found)', size: 24 })] })];

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const docxBuffer = await Packer.toBuffer(doc);

  const fileId = uuidv4();
  const baseName = path.basename(file.originalname, path.extname(file.originalname));
  const outName = `corner_${baseName}.docx`;
  const outPath = path.join(TMP_DIR, `${fileId}.docx`);
  fs.writeFileSync(outPath, docxBuffer);

  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: outName,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: fs.statSync(outPath).size,
  };
}
