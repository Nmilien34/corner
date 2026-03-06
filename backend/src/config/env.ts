import dotenv from 'dotenv';
import path from 'path';
// .env lives at the monorepo root, two levels above backend/src/config/
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`${key} is required`);
  return val;
}

export const env = {
  PORT:                parseInt(process.env.PORT ?? '3001', 10),
  NODE_ENV:            process.env.NODE_ENV ?? 'development',
  ANTHROPIC_API_KEY:   required('ANTHROPIC_API_KEY'),
  OPENAI_API_KEY:      required('OPENAI_API_KEY'),
  OPENAI_MODEL:        process.env.OPENAI_MODEL ?? 'gpt-4o',
  MONGODB_URI:         process.env.MONGODB_URI ?? null,
  JWT_SECRET:          required('JWT_SECRET'),
  JWT_REFRESH_SECRET:  required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES:  process.env.JWT_ACCESS_EXPIRES  ?? '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ?? '30d',
};
