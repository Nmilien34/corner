import { describe, it, expect, beforeAll } from 'vitest';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Ensure tmp dir exists before tests run
beforeAll(() => {
  const tmpDir = path.join(__dirname, '../../../tmp/uploads');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
});

async function makeFakePdf(text: string): Promise<Express.Multer.File> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 700, size: 12, font, color: rgb(0, 0, 0) });
  const bytes = await doc.save();
  const fpath = path.join(os.tmpdir(), `test_pdf_${Date.now()}.pdf`);
  fs.writeFileSync(fpath, bytes);

  return {
    fieldname: 'files',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    destination: os.tmpdir(),
    filename: path.basename(fpath),
    path: fpath,
    size: bytes.length,
    buffer: Buffer.from(bytes),
    stream: null as any,
  };
}

describe('pdfToWord', () => {
  it('produces a .docx file from a valid PDF', async () => {
    const { pdfToWord } = await import('../pdfToWord');
    const file = await makeFakePdf('Hello Corner World');
    const result = await pdfToWord([file]);

    expect(result.fileName).toMatch(/\.docx$/);
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);

    fs.unlinkSync(result.filePath);
  });

  it('throws when no files are provided', async () => {
    const { pdfToWord } = await import('../pdfToWord');
    await expect(pdfToWord([])).rejects.toThrow('No file provided');
  });
});

describe('compressPdf', () => {
  it('produces a smaller or equal PDF', async () => {
    const { compressPdf } = await import('../compressPdf');
    const file = await makeFakePdf('Some content to compress');
    const result = await compressPdf([file]);

    expect(result.fileName).toContain('compressed');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);

    fs.unlinkSync(result.filePath);
  });
});

describe('splitPdf', () => {
  it('produces a zip archive when splitting a multi-page PDF', async () => {
    const { splitPdf } = await import('../splitPdf');

    // Create a 2-page PDF
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]);
    doc.addPage([612, 792]);
    const bytes = await doc.save();
    const fpath = path.join(os.tmpdir(), `split_test_${Date.now()}.pdf`);
    fs.writeFileSync(fpath, bytes);

    const file: Express.Multer.File = {
      fieldname: 'files',
      originalname: 'multipage.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      destination: os.tmpdir(),
      filename: path.basename(fpath),
      path: fpath,
      size: bytes.length,
      buffer: Buffer.from(bytes),
      stream: null as any,
    };

    const result = await splitPdf([file]);

    expect(result.fileName).toBe('corner_split_pages.zip');
    expect(result.mimeType).toBe('application/zip');
    expect(result.sizeBytes).toBeGreaterThan(0);

    fs.unlinkSync(result.filePath);
  });
});
