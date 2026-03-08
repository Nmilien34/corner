import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Conversation } from '../models/Conversation';
import { Message, type IAttachment, type IToolCall, type IMessage } from '../models/Message';
import { createError } from '../middleware/errorHandler';
import { isDbAvailable } from '../config/db';

// GET /api/conversations
export async function listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDbAvailable()) { next(createError(503, 'Database unavailable')); return; }

  try {
    const { archived = 'false', limit = '20', page = '1' } = req.query as Record<string, string>;
    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const conversations = await Conversation.find({
      userId:   req.user!.userId,
      archived: archived === 'true',
    })
      .sort({ pinned: -1, lastMessageAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-__v');

    res.json({ conversations, page: pageNum, limit: limitNum });
  } catch (err) {
    next(createError(500, 'Failed to list conversations'));
  }
}

// POST /api/conversations
export async function createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDbAvailable()) { next(createError(503, 'Database unavailable')); return; }

  try {
    const { title } = req.body as { title?: string };
    const conversation = await Conversation.create({
      userId: req.user!.userId,
      title:  title?.trim() || 'New Conversation',
    });
    res.status(201).json(conversation);
  } catch (err) {
    next(createError(500, 'Failed to create conversation'));
  }
}

// GET /api/conversations/:id/messages
export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDbAvailable()) { next(createError(503, 'Database unavailable')); return; }

  try {
    const { id } = req.params;
    const { limit = '50', before } = req.query as Record<string, string>;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const conversation = await Conversation.findOne({ _id: id, userId: req.user!.userId });
    if (!conversation) { next(createError(404, 'Conversation not found')); return; }

    const query: Record<string, unknown> = { conversationId: id };
    if (before) query['_id'] = { $lt: before };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .select('-__v');

    res.json({ messages: messages.reverse(), hasMore: messages.length === limitNum });
  } catch (err) {
    next(createError(500, 'Failed to fetch messages'));
  }
}

// POST /api/conversations/:id/messages
export async function addMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDbAvailable()) { next(createError(503, 'Database unavailable')); return; }

  try {
    const { id } = req.params;
    const { role, content, attachments, toolCall } = req.body as {
      role?: string;
      content?: string;
      attachments?: unknown[];
      toolCall?: unknown;
    };

    if (!role || !content?.trim()) {
      next(createError(400, 'role and content are required', 'VALIDATION_ERROR'));
      return;
    }

    const conversation = await Conversation.findOne({ _id: id, userId: req.user!.userId });
    if (!conversation) { next(createError(404, 'Conversation not found')); return; }

    const message = await Message.create({
      conversationId: new Types.ObjectId(id as string),
      userId:         new Types.ObjectId(req.user!.userId as string),
      role,
      content:        content.trim(),
      attachments:    (attachments ?? []) as IAttachment[],
      toolCall:       toolCall as IToolCall | undefined,
    }) as IMessage;

    // Update conversation metadata (denormalized)
    const toolsUsed = [...conversation.toolsUsed];
    const tc = toolCall as {
      toolName?: string;
      resultFileId?: string;
      resultFileName?: string;
      resultMimeType?: string;
    } | undefined;
    if (tc?.toolName && !toolsUsed.includes(tc.toolName)) toolsUsed.push(tc.toolName);

    const update: Record<string, unknown> = {
      lastMessageAt: message.createdAt,
      $inc: { messageCount: 1 },
      toolsUsed,
    };
    if (tc?.resultFileId) {
      update.latestResultFileId = tc.resultFileId;
      if (tc.resultFileName != null) update.latestResultFileName = tc.resultFileName;
      if (tc.resultMimeType != null) update.latestResultMimeType = tc.resultMimeType;
    }

    await Conversation.updateOne({ _id: id }, update);

    res.status(201).json(message);
  } catch (err) {
    next(createError(500, 'Failed to save message'));
  }
}
