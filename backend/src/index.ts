import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { env } from './config/env';
import { connectDb, disconnectDb } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { optionalAuth } from './middleware/auth';
import { parseRoute } from './routes/parse';
import { executeRoute } from './routes/execute';
import { analyzeRoute } from './routes/analyze';
import { authRoute } from './routes/auth';
import { conversationsRoute } from './routes/conversations';
import { orchestrateRoute } from './routes/orchestrate';

const app = express();
const TMP_DIR = path.join(__dirname, '../tmp/uploads');

// Ensure tmp dir exists
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve processed files directly (fallback when no DB record)
app.use('/api/files', express.static(TMP_DIR));

app.use('/api/auth',          authRoute);
app.use('/api/conversations', conversationsRoute);
app.use('/api/orchestrate',   optionalAuth, orchestrateRoute);
app.use('/api/parse',         optionalAuth, parseRoute);
app.use('/api/analyze',       optionalAuth, analyzeRoute);
app.use('/api',               optionalAuth, executeRoute);

// Centralized error handler — must be last
app.use(errorHandler);

// Cleanup tmp files older than 1 hour — runs every 10 minutes
setInterval(() => {
  const now = Date.now();
  try {
    fs.readdirSync(TMP_DIR).forEach((file) => {
      const fpath = path.join(TMP_DIR, file);
      const stat = fs.statSync(fpath);
      if (now - stat.mtimeMs > 3_600_000) fs.unlinkSync(fpath);
    });
  } catch (_) {
    // ignore cleanup errors
  }
}, 600_000);

async function main() {
  await connectDb();

  const server = app.listen(env.PORT, () => {
    console.log(`Corner API running on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received — shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});

export default app;
