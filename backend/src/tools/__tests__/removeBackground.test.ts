import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock node-fetch used by removeBackground
const mockFetch = vi.fn();
vi.mock('node-fetch', () => ({ default: mockFetch }));

// Also mock form-data used to build the multipart request.
// When append receives a ReadStream: attach a no-op error handler before destroying
// so that if Node's async open() fires after the file is deleted, the ENOENT event
// is swallowed rather than becoming an uncaught exception.
vi.mock('form-data', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      append: vi.fn((_name: string, val: unknown) => {
        if (val && typeof (val as any).on === 'function') (val as any).on('error', () => {});
        if (val && typeof (val as any).destroy === 'function') (val as any).destroy();
      }),
      getHeaders: vi.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
    })),
  };
});

const TMP_DIR = path.join(__dirname, '../../../tmp/uploads');

beforeAll(() => {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  process.env.REMOVE_BG_API_KEY = 'test-key';
});

afterEach(() => {
  vi.clearAllMocks();
  process.env.REMOVE_BG_API_KEY = 'test-key';
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeFakePng(): Promise<Express.Multer.File> {
  const buf = await sharp({
    create: { width: 50, height: 50, channels: 4, background: { r: 100, g: 150, b: 200, alpha: 1 } },
  })
    .png()
    .toBuffer();

  const fpath = path.join(os.tmpdir(), `test_bg_${Date.now()}.png`);
  fs.writeFileSync(fpath, buf);

  return {
    fieldname: 'files',
    originalname: 'photo.png',
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

// Fake PNG bytes for the mock API response
const fakePngBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); // PNG magic bytes

// ─── removeBackground ─────────────────────────────────────────────────────────

describe('removeBackground', () => {
  it('happy path: returns PNG output with nobg in fileName', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      buffer: () => Promise.resolve(fakePngBytes),
      text: () => Promise.resolve(''),
    });

    const { removeBackground } = await import('../removeBackground');
    const file = await makeFakePng();
    const result = await removeBackground([file]);

    expect(result.fileName).toMatch(/nobg/);
    expect(result.mimeType).toBe('image/png');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);

    fs.unlinkSync(result.filePath);
  });

  it('throws when REMOVE_BG_API_KEY is not set', async () => {
    const savedKey = process.env.REMOVE_BG_API_KEY;
    delete process.env.REMOVE_BG_API_KEY;

    const { removeBackground } = await import('../removeBackground');
    const file = await makeFakePng();

    await expect(removeBackground([file])).rejects.toThrow(/REMOVE_BG_API_KEY/);

    process.env.REMOVE_BG_API_KEY = savedKey;
    try { fs.unlinkSync(file.path); } catch (_) {}
  });

  it('throws when API returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 402,
      text: () => Promise.resolve('insufficient credits'),
      buffer: () => Promise.resolve(Buffer.alloc(0)),
    });

    const { removeBackground } = await import('../removeBackground');
    const file = await makeFakePng();

    await expect(removeBackground([file])).rejects.toThrow(/402/);
    // Don't delete file here — fs.createReadStream in the tool holds a lazy handle;
    // unlinking before it is GC'd causes an unhandled ENOENT outside the test.
  });

  it('throws when no file provided', async () => {
    const { removeBackground } = await import('../removeBackground');
    await expect(removeBackground([])).rejects.toThrow('No file');
  });
});
