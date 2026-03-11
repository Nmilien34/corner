import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { env } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { isDbAvailable } from '../config/db';

const BCRYPT_ROUNDS = 12;

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function issueAccessToken(userId: string, email: string, plan: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ sub: userId, email, plan }, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES } as any);
}

function parseDuration(str: string): number {
  const unit = str.slice(-1);
  const value = parseInt(str.slice(0, -1), 10);
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  throw new Error(`Unsupported duration format: ${str}`);
}

async function issueRefreshToken(
  userId: string,
  deviceInfo?: string,
): Promise<{ raw: string; expiresAt: Date }> {
  const raw = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES));

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    deviceInfo: deviceInfo?.slice(0, 255),
  });

  return { raw, expiresAt };
}

// POST /api/auth/register
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDbAvailable()) { next(createError(503, 'Database unavailable')); return; }

  const { email, password, displayName } = req.body as {
    email?: string; password?: string; displayName?: string;
  };

  if (!email?.trim() || !password || !displayName?.trim()) {
    next(createError(400, 'email, password, and displayName are required', 'VALIDATION_ERROR'));
    return;
  }
  if (password.length < 8) {
    next(createError(400, 'Password must be at least 8 characters', 'PASSWORD_TOO_SHORT'));
    return;
  }

  try {
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      next(createError(409, 'Email already registered', 'EMAIL_EXISTS'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ email, passwordHash, displayName });

    const accessToken = issueAccessToken(user._id.toString(), user.email, user.plan);
    const { raw: refreshToken } = await issueRefreshToken(
      user._id.toString(),
      req.headers['user-agent'],
    );

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, displayName: user.displayName, plan: user.plan },
    });
  } catch (err) {
    next(createError(500, 'Registration failed'));
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDbAvailable()) { next(createError(503, 'Database unavailable')); return; }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    next(createError(400, 'email and password are required', 'VALIDATION_ERROR'));
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      next(createError(401, 'No account found with this email', 'USER_NOT_FOUND'));
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      next(createError(401, 'Incorrect password', 'INVALID_CREDENTIALS'));
      return;
    }

    const accessToken = issueAccessToken(user._id.toString(), user.email, user.plan);
    const { raw: refreshToken } = await issueRefreshToken(
      user._id.toString(),
      req.headers['user-agent'],
    );
    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, displayName: user.displayName, plan: user.plan },
    });
  } catch (err) {
    next(createError(500, 'Login failed'));
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDbAvailable()) { next(createError(503, 'Database unavailable')); return; }

  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    next(createError(400, 'refreshToken is required', 'VALIDATION_ERROR'));
    return;
  }

  try {
    const tokenHash = hashToken(refreshToken);
    const record = await RefreshToken.findOne({ tokenHash });

    if (!record || record.expiresAt < new Date()) {
      if (record) await RefreshToken.deleteOne({ _id: record._id });
      next(createError(401, 'Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID'));
      return;
    }

    const user = await User.findById(record.userId);
    if (!user) {
      await RefreshToken.deleteOne({ _id: record._id });
      next(createError(401, 'User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Rotation: delete old, issue new pair
    await RefreshToken.deleteOne({ _id: record._id });
    const newAccessToken = issueAccessToken(user._id.toString(), user.email, user.plan);
    const { raw: newRefreshToken } = await issueRefreshToken(
      user._id.toString(),
      req.headers['user-agent'],
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(createError(500, 'Token refresh failed'));
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken && isDbAvailable()) {
    try {
      await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
    } catch (_) { /* best-effort */ }
  }
  res.json({ ok: true });
}

// GET /api/auth/me
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDbAvailable()) { next(createError(503, 'Database unavailable')); return; }

  try {
    const user = await User.findById(req.user!.userId);
    if (!user) { next(createError(404, 'User not found')); return; }
    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      plan: user.plan,
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    next(createError(500, 'Failed to fetch user'));
  }
}
