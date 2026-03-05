import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// Maps our position key to sharp gravity values
const GRAVITY_MAP: Record<string, string> = {
  'top-left': 'northwest',
  'top-center': 'north',
  'top-right': 'northeast',
  'middle-left': 'west',
  'center': 'centre',
  'middle-right': 'east',
  'bottom-left': 'southwest',
  'bottom-center': 'south',
  'bottom-right': 'southeast',
};

export async function watermarkImage(
  files: Express.Multer.File[],
  params: Record<string, unknown> = {},
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const text = (params.text as string) || 'CONFIDENTIAL';
  const rawOpacity = Math.min(100, Math.max(1, Number(params.opacity ?? 50)));
  const opacity = rawOpacity / 100;
  const rotation = Number(params.rotation ?? -45);
  const fontSize = Number(params.fontSize ?? 48);
  const color = (params.color as string) || '#000000';
  const positionKey = (params.position as string) || 'center';
  const gravity = GRAVITY_MAP[positionKey] ?? 'centre';

  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const fileId = uuidv4();
  const outPath = path.join(TMP_DIR, `${fileId}${ext}`);

  // Size the SVG canvas large enough so rotated text isn't clipped
  const meta = await sharp(file.path).metadata();
  const w = meta.width ?? 800;
  const h = meta.height ?? 600;
  const diag = Math.ceil(Math.sqrt(w * w + h * h));
  const cx = diag / 2;
  const cy = diag / 2;

  const svgBuffer = Buffer.from(
    `<svg width="${diag}" height="${diag}" xmlns="http://www.w3.org/2000/svg">` +
    `<text` +
    ` x="${cx}" y="${cy}"` +
    ` text-anchor="middle"` +
    ` dominant-baseline="middle"` +
    ` font-family="sans-serif"` +
    ` font-size="${fontSize}"` +
    ` fill="${color}"` +
    ` fill-opacity="${opacity}"` +
    ` transform="rotate(${rotation}, ${cx}, ${cy})"` +
    `>${text}</text>` +
    `</svg>`,
  );

  await sharp(file.path)
    .composite([{ input: svgBuffer, gravity: gravity as sharp.Gravity }])
    .toFile(outPath);

  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_watermarked${ext}`,
    mimeType: MIME_MAP[ext] ?? 'image/jpeg',
    sizeBytes: fs.statSync(outPath).size,
  };
}
