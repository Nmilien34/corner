import { describe, it, expect, vi, beforeAll } from 'vitest';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock Anthropic SDK before any tool imports
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Mocked AI output for eval. This is a sufficiently long response from the AI assistant.' }],
  });
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

const TMP_DIR = path.join(__dirname, '../../../tmp/uploads');

beforeAll(() => {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
});

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function makeFakePdf(text = 'Corner AI test document — this document contains substantial content for evaluation purposes in Corner the document tool application'): Promise<Express.Multer.File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);
  page.drawText(text, { x: 50, y: 700, size: 12, font, color: rgb(0, 0, 0) });
  // Add more text to exceed the 50-char extractable text threshold
  page.drawText('Authors: Corner Team. Journal of Document Tools, 2024. Vol 1, pp 1-10.', {
    x: 50, y: 680, size: 10, font, color: rgb(0, 0, 0),
  });
  const bytes = await doc.save();
  const fpath = path.join(os.tmpdir(), `test_ai_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
  fs.writeFileSync(fpath, bytes);

  return {
    fieldname: 'files',
    originalname: 'research_paper.pdf',
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

// ─── documentStudy ────────────────────────────────────────────────────────────

describe('documentStudy', () => {
  it('mode=summarize produces a .txt file', async () => {
    const { documentStudy } = await import('../documentStudy');
    const file = await makeFakePdf();
    const result = await documentStudy([file], { mode: 'summarize' });

    expect(result.mimeType).toBe('text/plain');
    expect(result.fileName).toMatch(/summary/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);
    cleanup(result.filePath);
  });

  it('mode=study_questions produces fileName with study_questions', async () => {
    const { documentStudy } = await import('../documentStudy');
    const file = await makeFakePdf();
    const result = await documentStudy([file], { mode: 'study_questions' });

    expect(result.fileName).toMatch(/study_questions/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('mode=key_terms produces fileName with key_terms', async () => {
    const { documentStudy } = await import('../documentStudy');
    const file = await makeFakePdf();
    const result = await documentStudy([file], { mode: 'key_terms' });

    expect(result.fileName).toMatch(/key_terms/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { documentStudy } = await import('../documentStudy');
    await expect(documentStudy([], { mode: 'summarize' })).rejects.toThrow('No file');
  });
});

// ─── generateCitation ────────────────────────────────────────────────────────

describe('generateCitation', () => {
  it('style=apa produces a .txt file', async () => {
    const { generateCitation } = await import('../generateCitation');
    const file = await makeFakePdf();
    const result = await generateCitation([file], { style: 'apa' });

    expect(result.mimeType).toBe('text/plain');
    expect(result.fileName).toMatch(/citation_apa/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);
    cleanup(result.filePath);
  });

  it('style=mla produces fileName with mla', async () => {
    const { generateCitation } = await import('../generateCitation');
    const file = await makeFakePdf();
    const result = await generateCitation([file], { style: 'mla' });

    expect(result.fileName).toMatch(/citation_mla/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('style=chicago produces fileName with chicago', async () => {
    const { generateCitation } = await import('../generateCitation');
    const file = await makeFakePdf();
    const result = await generateCitation([file], { style: 'chicago' });

    expect(result.fileName).toMatch(/citation_chicago/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('unknown style defaults to apa', async () => {
    const { generateCitation } = await import('../generateCitation');
    const file = await makeFakePdf();
    const result = await generateCitation([file], { style: 'harvard' });

    expect(result.fileName).toMatch(/citation_apa/);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { generateCitation } = await import('../generateCitation');
    await expect(generateCitation([], { style: 'apa' })).rejects.toThrow('No file');
  });
});
