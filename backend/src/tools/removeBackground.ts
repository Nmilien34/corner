import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function removeBackground(
  files: Express.Multer.File[]
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];

  const apiKey = env.REMOVE_BG_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error(
      'REMOVE_BG_API_KEY is not configured. Set it in server/.env to use background removal.'
    );
  }

  const formData = new FormData();
  formData.append('image_file', fs.createReadStream(file.path));
  formData.append('size', 'auto');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`remove.bg API error (${response.status}): ${errText}`);
  }

  const buffer = await response.buffer();
  try { fs.unlinkSync(file.path); } catch (_) {}

  const fileId = uuidv4();
  const baseName = path.basename(file.originalname, path.extname(file.originalname));
  const outPath = path.join(TMP_DIR, `${fileId}.png`);
  fs.writeFileSync(outPath, buffer);

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_nobg_${baseName}.png`,
    mimeType: 'image/png',
    sizeBytes: fs.statSync(outPath).size,
  };
}
