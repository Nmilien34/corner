import { Router } from 'express';
import { upload } from '../middleware/upload';
import { handleAnalyze, handleAnalyzeFromBody } from '../controllers/analyzeController';

export const analyzeRoute = Router();

/** Multipart: file + analysisType → extract text server-side, return { content }. */
analyzeRoute.post('/', upload.array('files', 1), handleAnalyze);

/** JSON body: analysisType, fileName, fileText, conversationHistory → return { success, analysisType, result, exportable }. */
analyzeRoute.post('/text', handleAnalyzeFromBody);
