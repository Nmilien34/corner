import type { Request, Response, NextFunction } from 'express';
import { parseIntent } from '../services/intentService';
import { createError } from '../middleware/errorHandler';

export async function handleParse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, fileContext, conversationHistory } = req.body as {
      message: string;
      fileContext?: { name: string; type: string; size: number; pageCount?: number };
      conversationHistory?: Array<{ role: string; content: string }>;
    };

    if (!message?.trim()) {
      next(createError(400, 'message is required'));
      return;
    }

    const fileExtension = fileContext?.name.split('.').pop()?.toUpperCase() ?? 'UNKNOWN';
    const parsed = await parseIntent(message, fileContext, conversationHistory);
    res.json({ ...parsed, fileExtension });
  } catch (err) {
    console.error('[parse]', err);
    next(createError(500, 'Failed to parse intent'));
  }
}
