import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function generateQr(
  _files: Express.Multer.File[],
  params: { text?: string; url?: string; format?: 'png' | 'svg' } = {}
): Promise<ServerToolResult> {
  const content = params.url ?? params.text;
  if (!content) throw new Error('No URL or text provided for QR code generation');

  const fmt = params.format ?? 'png';
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}.${fmt}`);

  if (fmt === 'svg') {
    const svg = await QRCode.toString(content, { type: 'svg' });
    fs.writeFileSync(outPath, svg, 'utf-8');
  } else {
    await QRCode.toFile(outPath, content, { type: 'png', width: 400, margin: 2 });
  }

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_qr.${fmt}`,
    mimeType: fmt === 'svg' ? 'image/svg+xml' : 'image/png',
    sizeBytes: fs.statSync(outPath).size,
  };
}
