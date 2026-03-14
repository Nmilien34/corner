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

async function makeFakePng(w = 100, h = 100): Promise<Express.Multer.File> {
  const buf = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 255, g: 128, b: 0 } },
  })
    .png()
    .toBuffer();

  const fpath = path.join(os.tmpdir(), `test_img_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
  fs.writeFileSync(fpath, buf);

  return {
    fieldname: 'files',
    originalname: 'test.png',
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

function cleanup(...paths: string[]) {
  for (const p of paths) {
    try { fs.unlinkSync(p); } catch (_) {}
  }
}

// ─── resizeImage ──────────────────────────────────────────────────────────────

describe('resizeImage', () => {
  it('resizes by width only', async () => {
    const { resizeImage } = await import('../resizeImage');
    const file = await makeFakePng(300, 300);
    const result = await resizeImage([file], { width: 200 });

    expect(result.fileName).toMatch(/resized/);
    expect(result.mimeType).toBe('image/png');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);
    cleanup(result.filePath);
  });

  it('resizes by height only', async () => {
    const { resizeImage } = await import('../resizeImage');
    const file = await makeFakePng(300, 300);
    const result = await resizeImage([file], { height: 150 });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('resizes by width and height', async () => {
    const { resizeImage } = await import('../resizeImage');
    const file = await makeFakePng(300, 300);
    const result = await resizeImage([file], { width: 200, height: 150 });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no dimensions provided', async () => {
    const { resizeImage } = await import('../resizeImage');
    const file = await makeFakePng();
    await expect(resizeImage([file], {})).rejects.toThrow(/width|height/i);
    cleanup(file.path);
  });

  it('throws when no file provided', async () => {
    const { resizeImage } = await import('../resizeImage');
    await expect(resizeImage([], { width: 100 })).rejects.toThrow('No file');
  });
});

// ─── compressImage ────────────────────────────────────────────────────────────

describe('compressImage', () => {
  it('compresses with default quality', async () => {
    const { compressImage } = await import('../compressImage');
    const file = await makeFakePng();
    const result = await compressImage([file], {});

    expect(result.fileName).toMatch(/compressed/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('compresses with quality=50', async () => {
    const { compressImage } = await import('../compressImage');
    const file = await makeFakePng(200, 200);
    const result = await compressImage([file], { quality: 50 });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('clamps quality above 100 and still produces valid output', async () => {
    const { compressImage } = await import('../compressImage');
    const file = await makeFakePng();
    const result = await compressImage([file], { quality: 200 });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { compressImage } = await import('../compressImage');
    await expect(compressImage([], {})).rejects.toThrow('No file');
  });
});

// ─── convertImage ─────────────────────────────────────────────────────────────

describe('convertImage', () => {
  it('converts PNG to JPEG', async () => {
    const { convertImage } = await import('../convertImage');
    const file = await makeFakePng();
    const result = await convertImage([file], { format: 'jpeg' });

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.fileName).toMatch(/\.jpg$/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('converts PNG to WEBP', async () => {
    const { convertImage } = await import('../convertImage');
    const file = await makeFakePng();
    const result = await convertImage([file], { format: 'webp' });

    expect(result.mimeType).toBe('image/webp');
    cleanup(result.filePath);
  });

  it('accepts jpg alias (normalizes to jpeg)', async () => {
    const { convertImage } = await import('../convertImage');
    const file = await makeFakePng();
    const result = await convertImage([file], { format: 'jpg' });

    expect(result.mimeType).toBe('image/jpeg');
    cleanup(result.filePath);
  });

  it('throws on unsupported format', async () => {
    const { convertImage } = await import('../convertImage');
    const file = await makeFakePng();
    await expect(convertImage([file], { format: 'bmp' })).rejects.toThrow(/Unsupported format/);
    cleanup(file.path);
  });

  it('throws when no file provided', async () => {
    const { convertImage } = await import('../convertImage');
    await expect(convertImage([], { format: 'png' })).rejects.toThrow('No file');
  });
});

// ─── flipRotateImage ──────────────────────────────────────────────────────────

describe('flipRotateImage', () => {
  it('flip_h (horizontal mirror)', async () => {
    const { flipRotateImage } = await import('../flipRotateImage');
    const file = await makeFakePng();
    const result = await flipRotateImage([file], { action: 'flip_h' });

    expect(result.fileName).toMatch(/transformed/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('flip_v (vertical mirror)', async () => {
    const { flipRotateImage } = await import('../flipRotateImage');
    const file = await makeFakePng();
    const result = await flipRotateImage([file], { action: 'flip_v' });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('rotate_90', async () => {
    const { flipRotateImage } = await import('../flipRotateImage');
    const file = await makeFakePng(100, 200);
    const result = await flipRotateImage([file], { action: 'rotate_90' });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('rotate_180', async () => {
    const { flipRotateImage } = await import('../flipRotateImage');
    const file = await makeFakePng();
    const result = await flipRotateImage([file], { action: 'rotate_180' });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws on unknown action', async () => {
    const { flipRotateImage } = await import('../flipRotateImage');
    const file = await makeFakePng();
    await expect(flipRotateImage([file], { action: 'zoom' })).rejects.toThrow(/Unknown/);
    cleanup(file.path);
  });

  it('throws when no file provided', async () => {
    const { flipRotateImage } = await import('../flipRotateImage');
    await expect(flipRotateImage([], {})).rejects.toThrow('No file');
  });
});

// ─── addBorderImage ───────────────────────────────────────────────────────────

describe('addBorderImage', () => {
  it('adds default 10px black border', async () => {
    const { addBorderImage } = await import('../addBorderImage');
    const file = await makeFakePng();
    const result = await addBorderImage([file], {});

    expect(result.fileName).toMatch(/bordered/);
    expect(result.mimeType).toBe('image/png');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('adds 20px red (#FF0000) border', async () => {
    const { addBorderImage } = await import('../addBorderImage');
    const file = await makeFakePng();
    const result = await addBorderImage([file], { borderWidth: 20, borderColor: '#FF0000' });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { addBorderImage } = await import('../addBorderImage');
    await expect(addBorderImage([], {})).rejects.toThrow('No file');
  });
});

// ─── watermarkImage ───────────────────────────────────────────────────────────

describe('watermarkImage', () => {
  it('adds center watermark with default text', async () => {
    const { watermarkImage } = await import('../watermarkImage');
    const file = await makeFakePng(200, 200);
    const result = await watermarkImage([file], {});

    expect(result.fileName).toMatch(/watermarked/);
    expect(result.mimeType).toBe('image/png');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('adds watermark with custom opacity and font size', async () => {
    const { watermarkImage } = await import('../watermarkImage');
    const file = await makeFakePng(200, 200);
    const result = await watermarkImage([file], { text: 'DRAFT', opacity: 30, fontSize: 24 });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('adds watermark at bottom-right position', async () => {
    const { watermarkImage } = await import('../watermarkImage');
    const file = await makeFakePng(200, 200);
    const result = await watermarkImage([file], { position: 'bottom-right' });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { watermarkImage } = await import('../watermarkImage');
    await expect(watermarkImage([], {})).rejects.toThrow('No file');
  });
});

// ─── imageToPdf ───────────────────────────────────────────────────────────────

describe('imageToPdf', () => {
  it('converts PNG to A4 portrait PDF (fit mode)', async () => {
    const { imageToPdf } = await import('../imageToPdf');
    const file = await makeFakePng(200, 300);
    const result = await imageToPdf([file], { pageSize: 'a4', orientation: 'portrait', fitMode: 'fit' });

    expect(result.fileName).toBe('corner_image.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);
    cleanup(result.filePath);
  });

  it('converts PNG to letter landscape PDF', async () => {
    const { imageToPdf } = await import('../imageToPdf');
    const file = await makeFakePng(300, 200);
    const result = await imageToPdf([file], { pageSize: 'letter', orientation: 'landscape' });

    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('converts PNG in fill mode', async () => {
    const { imageToPdf } = await import('../imageToPdf');
    const file = await makeFakePng(100, 100);
    const result = await imageToPdf([file], { fitMode: 'fill' });

    expect(result.sizeBytes).toBeGreaterThan(0);
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { imageToPdf } = await import('../imageToPdf');
    await expect(imageToPdf([], {})).rejects.toThrow('No file');
  });
});
