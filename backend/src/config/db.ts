import mongoose from 'mongoose';
import { env } from './env';

let _connected = false;

export function isDbAvailable(): boolean {
  return _connected;
}

export async function connectDb(): Promise<void> {
  if (!env.MONGODB_URI) {
    console.warn('[db] MONGODB_URI not set — running without database');
    return;
  }
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      _connected = true;
      console.log('[db] MongoDB connected');
      return;
    } catch (err) {
      console.warn(`[db] Connection attempt ${attempt}/5 failed`);
      if (attempt === 5) {
        console.error('[db] All connection attempts failed — running without database');
        return;
      }
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
}

export async function disconnectDb(): Promise<void> {
  if (_connected) {
    await mongoose.disconnect();
    _connected = false;
    console.log('[db] MongoDB disconnected');
  }
}
