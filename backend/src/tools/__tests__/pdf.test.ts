import { describe, it, expect, beforeAll } from 'vitest';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TMP_DIR = path.join(__dirname, '../../../tmp/uploads');

beforeAll(() => {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
});

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function makeFakePdf(text = 'Corner test document', pages = 1): Promise<Express.Multer.File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`${text} — page ${i + 1}`, { x: 50, y: 700, size: 12, font, color: rgb(0, 0, 0) });
  }
  const bytes = await doc.save();
  const fpath = path.join(os.tmpdir(), `test_pdf_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
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

function cleanup(...paths: string[]) {
  for (const p of paths) {
    try { fs.unlinkSync(p); } catch (_) {}
  }
}

// ─── mergePdf ─────────────────────────────────────────────────────────────────

describe('mergePdf', () => {
  it('merges two PDFs into one', async () => {
    const { mergePdf } = await import('../mergePdf');
    const [a, b] = await Promise.all([makeFakePdf('Doc A'), makeFakePdf('Doc B')]);
    const result = await mergePdf([a, b]);

    expect(result.fileName).toBe('corner_merged.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);
    cleanup(result.filePath);
  });

  it('merges three PDFs preserving order', async () => {
    const { mergePdf } = await import('../mergePdf');
    const files = await Promise.all([makeFakePdf('A'), makeFakePdf('B'), makeFakePdf('C')]);
    const result = await mergePdf(files);

    const merged = await PDFDocument.load(fs.readFileSync(result.filePath));
    expect(merged.getPageCount()).toBe(3);
    cleanup(result.filePath);
  });

  it('throws when fewer than 2 files provided', async () => {
    const { mergePdf } = await import('../mergePdf');
    const file = await makeFakePdf();
    await expect(mergePdf([file])).rejects.toThrow(/2/);
    cleanup(file.path);
  });

  it('throws when no files provided', async () => {
    const { mergePdf } = await import('../mergePdf');
    await expect(mergePdf([])).rejects.toThrow();
  });
});

// ─── rotatePdf ────────────────────────────────────────────────────────────────

describe('rotatePdf', () => {
  it('rotates all pages clockwise', async () => {
    const { rotatePdf } = await import('../rotatePdf');
    const file = await makeFakePdf('Rotate test', 2);
    const result = await rotatePdf([file], { direction: 'clockwise', applyTo: 'all' });

    expect(result.fileName).toMatch(/rotated/);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('rotates counter-clockwise on a range', async () => {
    const { rotatePdf } = await import('../rotatePdf');
    const file = await makeFakePdf('Rotate range', 3);
    const result = await rotatePdf([file], { direction: 'counter', applyTo: 'range', pageRange: '1-2' });

    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('handles empty page range gracefully (rotates nothing, still produces valid PDF)', async () => {
    const { rotatePdf } = await import('../rotatePdf');
    const file = await makeFakePdf('No rotate', 2);
    const result = await rotatePdf([file], { direction: 'clockwise', applyTo: 'range', pageRange: '' });

    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { rotatePdf } = await import('../rotatePdf');
    await expect(rotatePdf([], {})).rejects.toThrow('No file');
  });
});

// ─── addPageNumbers ───────────────────────────────────────────────────────────

describe('addPageNumbers', () => {
  it('adds page numbers with default settings (bottom-center, start 1)', async () => {
    const { addPageNumbers } = await import('../addPageNumbers');
    const file = await makeFakePdf('Numbers test', 3);
    const result = await addPageNumbers([file], {});

    expect(result.fileName).toMatch(/numbered/);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('adds page numbers at top-right starting from 5', async () => {
    const { addPageNumbers } = await import('../addPageNumbers');
    const file = await makeFakePdf('Top-right nums', 2);
    const result = await addPageNumbers([file], { position: 'top-right', startNumber: 5, fontSize: 10 });

    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { addPageNumbers } = await import('../addPageNumbers');
    await expect(addPageNumbers([], {})).rejects.toThrow('No file');
  });
});

// ─── addWatermarkPdf ──────────────────────────────────────────────────────────

describe('addWatermarkPdf', () => {
  it('adds default CONFIDENTIAL watermark centered', async () => {
    const { addWatermarkPdf } = await import('../addWatermarkPdf');
    const file = await makeFakePdf('Watermark test');
    const result = await addWatermarkPdf([file], {});

    expect(result.fileName).toMatch(/watermark/);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('adds tiled watermark with custom text', async () => {
    const { addWatermarkPdf } = await import('../addWatermarkPdf');
    const file = await makeFakePdf('Tile watermark');
    const result = await addWatermarkPdf([file], { text: 'DRAFT', tile: true });

    expect(result.mimeType).toBe('application/pdf');
    cleanup(result.filePath);
  });

  it('handles custom hex color #FF0000', async () => {
    const { addWatermarkPdf } = await import('../addWatermarkPdf');
    const file = await makeFakePdf('Color watermark');
    const result = await addWatermarkPdf([file], { text: 'SECRET', color: '#FF0000' });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('clamps opacity above 100 to a valid value', async () => {
    const { addWatermarkPdf } = await import('../addWatermarkPdf');
    const file = await makeFakePdf('Opacity clamp');
    const result = await addWatermarkPdf([file], { opacity: 200 });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { addWatermarkPdf } = await import('../addWatermarkPdf');
    await expect(addWatermarkPdf([], {})).rejects.toThrow('No file');
  });
});

// ─── removePdfPassword (removePasswordPdf) ────────────────────────────────────

describe('removePdfPassword', () => {
  it('passes an unencrypted PDF through and returns unlocked output', async () => {
    const { removePasswordPdf } = await import('../removePasswordPdf');
    const file = await makeFakePdf('Unlock test');
    const result = await removePasswordPdf([file], {});

    expect(result.fileName).toMatch(/unlock/);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { removePasswordPdf } = await import('../removePasswordPdf');
    await expect(removePasswordPdf([], {})).rejects.toThrow('No file');
  });
});
