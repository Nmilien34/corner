import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createError } from './errorHandler';
import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: Types.ObjectId | string;
        email: string;
        plan: string;
      };
    }
  }
}

interface AccessTokenPayload {
  sub: string;
  email: string;
  plan: string;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(createError(401, 'Authentication required', 'AUTH_REQUIRED'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    req.user = { userId: payload.sub, email: payload.email, plan: payload.plan };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(createError(401, 'Token expired', 'TOKEN_EXPIRED'));
    } else {
      next(createError(401, 'Invalid token', 'TOKEN_INVALID'));
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) { next(); return; }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    req.user = { userId: payload.sub, email: payload.email, plan: payload.plan };
  } catch {
    // Invalid/expired token on optional route — treat as anonymous
  }
  next();
}
