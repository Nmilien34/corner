import { Router } from 'express';
import {
  listConversations,
  createConversation,
  getMessages,
  addMessage,
} from '../controllers/conversationController';
import { requireAuth } from '../middleware/auth';

export const conversationsRoute = Router();

conversationsRoute.use(requireAuth);

conversationsRoute.get('/',                  listConversations);
conversationsRoute.post('/',                 createConversation);
conversationsRoute.get('/:id/messages',      getMessages);
conversationsRoute.post('/:id/messages',     addMessage);
