import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';

const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (opts: { data: Uint8Array }) => { getText(): Promise<{ text: string }> };
};
const mammoth = require('mammoth') as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> };

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif']);

/**
 * Extract plain text from a document (PDF, DOCX) or image (via OCR).
 * Used by document study and citation tools.
 */
export async function extractDocumentText(filePath: string, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const data = await parser.getText();
    return data.text?.trim() ?? '';
  }

  if (ext === '.docx' || ext === '.doc') {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return (result.value ?? '').trim();
  }

  if (IMAGE_EXT.has(ext)) {
    const { data } = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
    return (data?.text ?? '').trim();
  }

  throw new Error(`Unsupported format for text extraction: ${ext}. Use PDF, DOCX, or images.`);
}
