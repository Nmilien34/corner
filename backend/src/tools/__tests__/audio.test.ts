import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock node-fetch used by transcribeAudio (Whisper route)
vi.mock('node-fetch', () => {
  const mockResponse = {
    ok: true,
    status: 200,
    text: () => Promise.resolve(''),
    json: () =>
      Promise.resolve({
        text: 'Hello world from Corner.',
        duration: 2.0,
        language: 'en',
        segments: [
          { id: 0, start: 0, end: 2.0, text: 'Hello world from Corner.' },
        ],
      }),
  };
  return {
    default: vi.fn().mockResolvedValue(mockResponse),
  };
});

// Also mock form-data used to build the multipart request.
// When append receives a ReadStream: attach a no-op error handler before destroying
// so that if Node's async open() fires after the file is deleted, the ENOENT event
// is swallowed rather than becoming an uncaught exception.
vi.mock('form-data', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      append: vi.fn((_name: string, val: unknown) => {
        if (val && typeof (val as any).on === 'function') (val as any).on('error', () => {});
        if (val && typeof (val as any).destroy === 'function') (val as any).destroy();
      }),
      getHeaders: vi.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
    })),
  };
});

const TMP_DIR = path.join(__dirname, '../../../tmp/uploads');

let savedDeepgram: string | undefined;
let savedOpenAI: string | undefined;

beforeAll(() => {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  // Save existing env values
  savedDeepgram = process.env.DEEPGRAM_API_KEY;
  savedOpenAI = process.env.OPENAI_API_KEY;

  // Route through Whisper (node-fetch mock)
  delete process.env.DEEPGRAM_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
});

afterAll(() => {
  // Restore env
  if (savedDeepgram !== undefined) process.env.DEEPGRAM_API_KEY = savedDeepgram;
  else delete process.env.DEEPGRAM_API_KEY;

  if (savedOpenAI !== undefined) process.env.OPENAI_API_KEY = savedOpenAI;
  else delete process.env.OPENAI_API_KEY;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFakeWav(): Express.Multer.File {
  // Minimal 44-byte WAV header (RIFF PCM, 0 samples)
  const buf = Buffer.alloc(44);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);   // chunk size
  buf.writeUInt16LE(1, 20);    // PCM
  buf.writeUInt16LE(1, 22);    // mono
  buf.writeUInt32LE(44100, 24); // sample rate
  buf.writeUInt32LE(88200, 28); // byte rate
  buf.writeUInt16LE(2, 32);    // block align
  buf.writeUInt16LE(16, 34);   // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(0, 40);    // data size

  const fpath = path.join(os.tmpdir(), `test_audio_${Date.now()}.wav`);
  fs.writeFileSync(fpath, buf);

  return {
    fieldname: 'files',
    originalname: 'test_audio.wav',
    encoding: '7bit',
    mimetype: 'audio/wav',
    destination: os.tmpdir(),
    filename: path.basename(fpath),
    path: fpath,
    size: buf.length,
    buffer: buf,
    stream: null as any,
  };
}

function cleanup(...paths: string[]) {
  for (const p of paths) {
    try { fs.unlinkSync(p); } catch (_) {}
  }
}

// ─── transcribeAudioTool ──────────────────────────────────────────────────────

describe('transcribeAudioTool', () => {
  it('plain format produces transcript text file', async () => {
    const { transcribeAudioTool } = await import('../transcribeAudio');
    const file = makeFakeWav();
    const result = await transcribeAudioTool([file], { format: 'plain' });

    expect(result.mimeType).toBe('text/plain');
    expect(result.fileName).toMatch(/transcript/);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(0);
    expect(fs.existsSync(result.filePath)).toBe(true);
    cleanup(result.filePath);
  });

  it('srt format output contains --> SRT markers', async () => {
    const { transcribeAudioTool } = await import('../transcribeAudio');
    const file = makeFakeWav();
    const result = await transcribeAudioTool([file], { format: 'srt' });

    expect(result.formattedTranscript).toContain('-->');
    cleanup(result.filePath);
  });

  it('vtt format output starts with WEBVTT', async () => {
    const { transcribeAudioTool } = await import('../transcribeAudio');
    const file = makeFakeWav();
    const result = await transcribeAudioTool([file], { format: 'vtt' });

    expect(result.formattedTranscript).toMatch(/^WEBVTT/);
    cleanup(result.filePath);
  });

  it('timestamped format output contains [HH:MM:SS] pattern', async () => {
    const { transcribeAudioTool } = await import('../transcribeAudio');
    const file = makeFakeWav();
    const result = await transcribeAudioTool([file], { format: 'timestamped' });

    expect(result.formattedTranscript).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
    cleanup(result.filePath);
  });

  it('transcriptionResult has wordCount and durationLabel', async () => {
    const { transcribeAudioTool } = await import('../transcribeAudio');
    const file = makeFakeWav();
    const result = await transcribeAudioTool([file], { format: 'plain' });

    expect(result.transcriptionResult).toBeDefined();
    expect(result.transcriptionResult!.wordCount).toBeGreaterThan(0);
    expect(result.durationLabel).toBeTruthy();
    cleanup(result.filePath);
  });

  it('throws when no file provided', async () => {
    const { transcribeAudioTool } = await import('../transcribeAudio');
    await expect(transcribeAudioTool([], {})).rejects.toThrow('No audio file');
  });

  it('throws when no API keys are set', async () => {
    vi.doMock('../../config/env', () => ({
      env: {
        DEEPGRAM_API_KEY: null,
        OPENAI_API_KEY: null,
        OPENAI_MODEL: 'gpt-4o',
        ANTHROPIC_API_KEY: 'k',
        PORT: 3001,
        NODE_ENV: 'test',
        MONGODB_URI: null,
        JWT_SECRET: 's',
        JWT_REFRESH_SECRET: 's',
        JWT_ACCESS_EXPIRES: '15m',
        JWT_REFRESH_EXPIRES: '30d',
        get REMOVE_BG_API_KEY(): string | null {
          return process.env.REMOVE_BG_API_KEY ?? null;
        },
      },
    }));
    vi.resetModules();
    const { transcribeAudioTool } = await import('../transcribeAudio');
    const file = makeFakeWav();

    await expect(transcribeAudioTool([file], {})).rejects.toThrow(/No transcription API key/);

    cleanup(file.path);
  });
});
