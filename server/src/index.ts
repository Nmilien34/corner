import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const TMP_DIR = path.join(__dirname, '../tmp/uploads');

// Ensure tmp dir exists
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve processed files directly
app.use('/api/files', express.static(TMP_DIR));

// Routes (imported lazily to avoid circular deps at startup)
import { parseRoute } from './routes/parse';
import { executeRoute } from './routes/execute';

app.use('/api/parse', parseRoute);
app.use('/api', executeRoute);

// Cleanup files older than 1 hour — runs every 10 minutes
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

app.listen(PORT, () => {
  console.log(`Corner API running on http://localhost:${PORT}`);
});

export default app;
