import type { ErrorRequestHandler } from 'express';

export interface AppError extends Error {
  statusCode: number;
  code?: string;
}

/**
 * Factory for creating structured HTTP errors.
 * Usage: throw createError(404, 'File not found', 'FILE_NOT_FOUND')
 */
export function createError(statusCode: number, message: string, code?: string): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

/**
 * Express error-handling middleware. Must be registered last via app.use().
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = (err as AppError).statusCode ?? 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  const code = (err as AppError).code;

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    error: message,
    ...(code ? { code } : {}),
  });
};
