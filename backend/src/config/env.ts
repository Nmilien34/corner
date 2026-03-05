import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  ANTHROPIC_API_KEY: (() => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY is required');
    return key;
  })(),
  MONGODB_URI: process.env.MONGODB_URI ?? null,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};
