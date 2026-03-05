import { Router } from 'express';
import { handleParse } from '../controllers/parseController';

export const parseRoute = Router();

parseRoute.post('/', handleParse);
