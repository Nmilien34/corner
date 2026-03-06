import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

export const authRoute = Router();

authRoute.post('/register', register);
authRoute.post('/login',    login);
authRoute.post('/refresh',  refresh);
authRoute.post('/logout',   logout);
authRoute.get('/me',        requireAuth, me);
