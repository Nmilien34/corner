import { v4 as uuidv4 } from 'uuid';
import { isDbAvailable } from '../config/db';
import { ProcessedFile } from '../models/ProcessedFile';

const FILE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SaveFileOpts {
  filePath: string;
  fileName: string;
  toolName: string;
  params: Record<string, unknown>;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Saves a file record to MongoDB (when available) and returns a fileId.
 * Falls back to a UUID-only approach when DB is unavailable — the file
 * is still accessible on disk via the static file server.
 */
export async function saveFileRecord(opts: SaveFileOpts): Promise<string> {
  const fileId = uuidv4();
  if (isDbAvailable()) {
    await ProcessedFile.create({
      fileId,
      ...opts,
      status: 'done',
      expiresAt: new Date(Date.now() + FILE_TTL_MS),
    });
  }
  return fileId;
}

/**
 * Looks up a file record by fileId. Returns null when DB is unavailable
 * or the record has expired / doesn't exist.
 */
export async function getFileRecord(
  fileId: string,
): Promise<{ filePath: string; fileName: string; mimeType: string } | null> {
  if (!isDbAvailable()) return null;
  const rec = await ProcessedFile.findOne({ fileId });
  if (!rec) return null;
  return { filePath: rec.filePath, fileName: rec.fileName, mimeType: rec.mimeType };
}

/**
 * Marks a file record as errored.
 */
export async function markFileError(fileId: string, message: string): Promise<void> {
  if (!isDbAvailable()) return;
  await ProcessedFile.updateOne({ fileId }, { status: 'error', errorMessage: message });
}
