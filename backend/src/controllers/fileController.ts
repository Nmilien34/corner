import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { getFileRecord } from '../services/fileService';
import { createError } from '../middleware/errorHandler';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');
const TMP_DIR_RESOLVED = path.resolve(TMP_DIR);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && UUID_REGEX.test(value);
}

function isPathUnderDir(filePath: string, dir: string): boolean {
  const resolved = path.resolve(filePath);
  const dirResolved = path.resolve(dir);
  return resolved === dirResolved || resolved.startsWith(dirResolved + path.sep);
}

export async function handleGetFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const fileId = req.params['fileId'] as string;

  if (!isValidUUID(fileId)) {
    next(createError(400, 'Invalid file ID'));
    return;
  }

  // 1. Try DB record first (when available)
  try {
    const record = await getFileRecord(fileId);
    if (record) {
      if (!isPathUnderDir(record.filePath, TMP_DIR_RESOLVED)) {
        next(createError(404, 'File not found or expired'));
        return;
      }
      res.sendFile(path.resolve(record.filePath));
      return;
    }
  } catch (_) {
    // DB unavailable — fall through to filesystem scan
  }

  // 2. Fallback: scan tmp dir for a file whose name starts with fileId UUID
  let matched: string | undefined;
  try {
    matched = fs.readdirSync(TMP_DIR).find((f) => f.startsWith(fileId));
  } catch (_) {
    next(createError(500, 'Could not read file directory'));
    return;
  }

  if (!matched) {
    next(createError(404, 'File not found or expired'));
    return;
  }

  const fallbackPath = path.join(TMP_DIR, matched);
  if (!isPathUnderDir(fallbackPath, TMP_DIR_RESOLVED)) {
    next(createError(404, 'File not found or expired'));
    return;
  }
  res.sendFile(path.resolve(fallbackPath));
}
