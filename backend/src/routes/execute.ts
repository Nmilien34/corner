import { Router } from 'express';
import { upload } from '../middleware/upload';
import { handleExecute } from '../controllers/executeController';
import { handleGetFile } from '../controllers/fileController';

export const executeRoute = Router();

executeRoute.post('/execute', upload.array('files', 10), handleExecute);
executeRoute.get('/file/:fileId', handleGetFile);
