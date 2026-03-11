import { Router } from 'express';
import {
  listConversations,
  createConversation,
  getMessages,
  addMessage,
  updateConversation,
  deleteConversation,
} from '../controllers/conversationController';
import { requireAuth } from '../middleware/auth';

export const conversationsRoute = Router();

conversationsRoute.use(requireAuth);

conversationsRoute.get('/',                  listConversations);
conversationsRoute.post('/',                 createConversation);
conversationsRoute.patch('/:id',             updateConversation);
conversationsRoute.delete('/:id',            deleteConversation);
conversationsRoute.get('/:id/messages',      getMessages);
conversationsRoute.post('/:id/messages',     addMessage);
