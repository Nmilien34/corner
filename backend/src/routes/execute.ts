import { Router } from 'express';
import { upload } from '../middleware/upload';
import { handleExecute } from '../controllers/executeController';
import { handleGetFile } from '../controllers/fileController';
import { handleExportText } from '../controllers/exportTextController';

export const executeRoute = Router();

executeRoute.post('/execute', upload.array('files', 10), handleExecute);
executeRoute.get('/file/:fileId', handleGetFile);
executeRoute.post('/export-text', handleExportText);
