import { Router } from 'express';
import { upload } from '../middleware/upload';
import { handleOrchestrate } from '../controllers/orchestrateController';

export const orchestrateRoute = Router();

orchestrateRoute.post('/', upload.array('files', 10), handleOrchestrate);
