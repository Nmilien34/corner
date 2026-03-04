import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

beforeAll(() => {
  const tmpDir = path.join(__dirname, '../../../tmp/uploads');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
});

describe('generateQr', () => {
  it('generates a PNG QR code from a URL', async () => {
    const { generateQr } = await import('../generateQr');
    const result = await generateQr([], { url: 'https://example.com', format: 'png' });

    expect(result.fileName).toBe('corner_qr.png');
    expect(result.mimeType).toBe('image/png');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);

    fs.unlinkSync(result.filePath);
  });

  it('generates an SVG QR code from text', async () => {
    const { generateQr } = await import('../generateQr');
    const result = await generateQr([], { text: 'Hello Corner', format: 'svg' });

    expect(result.mimeType).toBe('image/svg+xml');
    expect(result.sizeBytes).toBeGreaterThan(0);

    const content = fs.readFileSync(result.filePath, 'utf-8');
    expect(content).toContain('<svg');

    fs.unlinkSync(result.filePath);
  });

  it('defaults to PNG when no format is provided', async () => {
    const { generateQr } = await import('../generateQr');
    const result = await generateQr([], { url: 'https://corner.app' });

    expect(result.fileName).toMatch(/\.png$/);
    fs.unlinkSync(result.filePath);
  });

  it('throws when no content is provided', async () => {
    const { generateQr } = await import('../generateQr');
    await expect(generateQr([], {})).rejects.toThrow('No URL or text provided');
  });
});
