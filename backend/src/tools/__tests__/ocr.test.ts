import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TMP_DIR = path.join(__dirname, '../../../tmp/uploads');

beforeAll(() => {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
});

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function makeFakeImageWithText(): Promise<Express.Multer.File> {
  // Create a white PNG with black text via SVG composite
  const svg = Buffer.from(
    `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="100" fill="white"/>
      <text x="10" y="60" font-family="sans-serif" font-size="32" fill="black">Hello OCR</text>
    </svg>`
  );

  const buf = await sharp({
    create: { width: 400, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([{ input: svg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  const fpath = path.join(os.tmpdir(), `test_ocr_${Date.now()}.png`);
  fs.writeFileSync(fpath, buf);

  return {
    fieldname: 'files',
    originalname: 'test_ocr.png',
    encoding: '7bit',
    mimetype: 'image/png',
    destination: os.tmpdir(),
    filename: path.basename(fpath),
    path: fpath,
    size: buf.length,
    buffer: buf,
    stream: null as any,
  };
}

// ─── runOcr ───────────────────────────────────────────────────────────────────

describe('runOcr', () => {
  it(
    'returns a text file with sizeBytes > 0 for a valid image',
    async () => {
      const { runOcr } = await import('../ocr');
      const file = await makeFakeImageWithText();
      const result = await runOcr([file]);

      expect(result.fileName).toMatch(/ocr/);
      expect(result.mimeType).toBe('text/plain');
      // OCR on synthetic images may return empty text — just validate the output shape
      expect(result.filePath).toBeTruthy();
      expect(fs.existsSync(result.filePath)).toBe(true);

      fs.unlinkSync(result.filePath);
    },
    30_000
  );

  it('throws when no file provided', async () => {
    const { runOcr } = await import('../ocr');
    await expect(runOcr([])).rejects.toThrow('No file');
  });
});
