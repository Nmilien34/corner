import type { Request, Response, NextFunction } from 'express';
import { orchestrate } from '../services/orchestratorService';
import { createError } from '../middleware/errorHandler';
import type { OrchestrateEvent } from '@corner/shared';

export async function handleOrchestrate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const { message, sessionId } = req.body as { message?: string; sessionId?: string };

  if (!message?.trim()) {
    next(createError(400, 'message is required'));
    return;
  }

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  function sendEvent(event: OrchestrateEvent): void {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  // Keep-alive ping every 15s to prevent proxy timeouts
  const pingInterval = setInterval(() => {
    if (!res.writableEnded) res.write(': ping\n\n');
  }, 15_000);

  req.on('close', () => clearInterval(pingInterval));

  try {
    await orchestrate({
      message: message.trim(),
      files,
      sessionId,
      userId: req.user?.userId?.toString(),
      onEvent: sendEvent,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Orchestration failed';
    console.error('[orchestrate]', err);
    sendEvent({ type: 'error', message: errorMsg });
  } finally {
    clearInterval(pingInterval);
    if (!res.writableEnded) res.end();
  }
}
