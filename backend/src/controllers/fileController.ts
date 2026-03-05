import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { getFileRecord } from '../services/fileService';
import { createError } from '../middleware/errorHandler';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export async function handleGetFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const fileId = req.params['fileId'] as string;

  // 1. Try DB record first (when available)
  try {
    const record = await getFileRecord(fileId);
    if (record) {
      res.sendFile(record.filePath);
      return;
    }
  } catch (_) {
    // DB unavailable — fall through to filesystem scan
  }

  // 2. Fallback: scan tmp dir for a file whose name starts with fileId UUID
  let matched: string | undefined;
  try {
    matched = fs.readdirSync(TMP_DIR).find((f) => f.startsWith(String(fileId)));
  } catch (_) {
    next(createError(500, 'Could not read file directory'));
    return;
  }

  if (!matched) {
    next(createError(404, 'File not found or expired'));
    return;
  }

  res.sendFile(path.join(TMP_DIR, matched));
}
