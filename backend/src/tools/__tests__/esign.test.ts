import { describe, it, expect, beforeAll } from 'vitest';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 1x1 transparent PNG as base64 (minimal valid signature image)
const FAKE_SIG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

beforeAll(() => {
  const tmpDir = path.join(__dirname, '../../../tmp/uploads');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
});

async function makePdf(text = 'Sign here: _______'): Promise<Express.Multer.File> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 100, size: 12, font, color: rgb(0, 0, 0) });
  const bytes = await doc.save();
  const fpath = path.join(os.tmpdir(), `esign_test_${Date.now()}.pdf`);
  fs.writeFileSync(fpath, bytes);

  return {
    fieldname: 'files',
    originalname: 'contract.pdf',
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

describe('eSign', () => {
  it('embeds signature using explicitly provided field positions', async () => {
    const { eSign } = await import('../esign');
    const file = await makePdf();

    const fields = [
      { page: 1, x: 10, y: 80, width: 30, height: 8, label: 'Signature', placed: true },
    ];

    const result = await eSign([file], {
      signatureDataUrl: FAKE_SIG,
      fields,
    });

    expect(result.fileName).toContain('signed');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.filePath)).toBe(true);

    fs.unlinkSync(result.filePath);
  });

  it('throws when no signature is provided', async () => {
    const { eSign } = await import('../esign');
    const file = await makePdf();

    await expect(eSign([file], {})).rejects.toThrow('No signature provided');
    // Clean up file that wasn't processed
    try { fs.unlinkSync(file.path); } catch (_) {}
  });

  it('throws when no PDF is provided', async () => {
    const { eSign } = await import('../esign');
    await expect(eSign([], { signatureDataUrl: FAKE_SIG })).rejects.toThrow('No PDF provided');
  });
});
