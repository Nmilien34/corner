import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import type { ServerToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export interface TranscriptSegment {
  id: number;
  start: number;    // seconds
  end: number;      // seconds
  text: string;
  speaker?: string; // "Speaker 1", "Speaker 2", etc if diarization enabled
}

export interface TranscriptionResult {
  transcript: string;
  duration: number;       // seconds
  language: string;       // detected language
  segments: TranscriptSegment[];
  wordCount: number;
  speakerCount?: number;
}

async function transcribeWithDeepgram(
  filePath: string,
  options: { language: string; speakerDiarization: boolean; punctuation: boolean }
): Promise<TranscriptionResult> {
  const audioBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');

  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg', mp4: 'audio/mp4', m4a: 'audio/mp4',
    wav: 'audio/wav', webm: 'audio/webm', ogg: 'audio/ogg',
    flac: 'audio/flac', aac: 'audio/aac', mov: 'video/quicktime',
  };

  const params = new URLSearchParams({
    model: 'nova-2',
    smart_format: 'true',
    punctuate: options.punctuation.toString(),
    diarize: options.speakerDiarization.toString(),
    utterances: 'true',
    paragraphs: 'true',
  });

  if (options.language !== 'auto') {
    params.set('language', options.language);
  } else {
    params.set('detect_language', 'true');
  }

  const response = await fetch(
    `https://api.deepgram.com/v1/listen?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
        'Content-Type': mimeTypes[ext] ?? 'audio/mpeg',
      },
      body: audioBuffer,
    }
  );

  if (!response.ok) {
    throw new Error(`Deepgram error: ${response.status} ${await response.text()}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await response.json() as any;
  const result = data.results?.channels?.[0]?.alternatives?.[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segments: TranscriptSegment[] = (result?.words ?? []).reduce((acc: TranscriptSegment[], word: any, i: number) => {
    const segIndex = Math.floor(i / 10);
    if (!acc[segIndex]) {
      acc[segIndex] = {
        id: segIndex,
        start: word.start,
        end: word.end,
        text: '',
        speaker: word.speaker != null ? `Speaker ${word.speaker + 1}` : undefined,
      };
    }
    acc[segIndex].text += (acc[segIndex].text ? ' ' : '') + word.punctuated_word;
    acc[segIndex].end = word.end;
    return acc;
  }, []);

  const transcript = result?.transcript ?? '';
  const words = transcript.split(' ').filter(Boolean);
  const duration = data.metadata?.duration ?? 0;
  const language = data.results?.channels?.[0]?.detected_language ?? options.language;

  const speakerSet = new Set(segments.map((s) => s.speaker).filter(Boolean));

  return {
    transcript,
    duration,
    language,
    segments,
    wordCount: words.length,
    speakerCount: speakerSet.size > 0 ? speakerSet.size : undefined,
  };
}

async function transcribeWithWhisper(
  filePath: string,
  options: { language: string; punctuation: boolean }
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment');
  if (options.language !== 'auto') {
    form.append('language', options.language);
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Whisper error: ${response.status} ${await response.text()}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await response.json() as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segments: TranscriptSegment[] = (data.segments ?? []).map((s: any, i: number) => ({
    id: i,
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));

  return {
    transcript: data.text ?? '',
    duration: data.duration ?? 0,
    language: data.language ?? 'en',
    segments,
    wordCount: (data.text ?? '').split(' ').filter(Boolean).length,
  };
}

async function transcribeAudio(
  filePath: string,
  options: {
    language?: string;
    format?: string;
    speakerDiarization?: boolean;
    punctuation?: boolean;
  } = {}
): Promise<TranscriptionResult> {
  const {
    language = 'auto',
    speakerDiarization = false,
    punctuation = true,
  } = options;

  if (env.DEEPGRAM_API_KEY) {
    return transcribeWithDeepgram(filePath, { language, speakerDiarization, punctuation });
  } else if (env.OPENAI_API_KEY) {
    return transcribeWithWhisper(filePath, { language, punctuation });
  } else {
    throw new Error('No transcription API key found. Set DEEPGRAM_API_KEY or OPENAI_API_KEY in .env');
  }
}

export function formatTranscript(
  result: TranscriptionResult,
  format: 'plain' | 'timestamped' | 'srt' | 'vtt'
): string {
  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
  const toTimestamp = (s: number) =>
    `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`;
  const toSrtTimestamp = (s: number) =>
    `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)},${String(Math.round((s % 1) * 1000)).padStart(3, '0')}`;

  switch (format) {
    case 'plain':
      return result.transcript;

    case 'timestamped':
      return result.segments
        .map((seg) => {
          const speaker = seg.speaker ? `[${seg.speaker}] ` : '';
          return `[${toTimestamp(seg.start)}] ${speaker}${seg.text}`;
        })
        .join('\n');

    case 'srt':
      return result.segments
        .map(
          (seg, i) =>
            `${i + 1}\n${toSrtTimestamp(seg.start)} --> ${toSrtTimestamp(seg.end)}\n${seg.speaker ? `[${seg.speaker}] ` : ''}${seg.text}\n`
        )
        .join('\n');

    case 'vtt':
      return (
        `WEBVTT\n\n` +
        result.segments
          .map(
            (seg, i) =>
              `${i + 1}\n${toTimestamp(seg.start)}.${String(Math.round((seg.start % 1) * 1000)).padStart(3, '0')} --> ${toTimestamp(seg.end)}.${String(Math.round((seg.end % 1) * 1000)).padStart(3, '0')}\n${seg.speaker ? `[${seg.speaker}] ` : ''}${seg.text}\n`
          )
          .join('\n')
      );

    default:
      return result.transcript;
  }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export async function transcribeAudioTool(
  files: Express.Multer.File[],
  params: Record<string, unknown>
): Promise<ServerToolResult> {
  const file = files[0];
  if (!file) throw new Error('No audio file provided');

  const language = (params.language as string | undefined) ?? 'auto';
  const format = (params.format as 'plain' | 'timestamped' | 'srt' | 'vtt' | undefined) ?? 'timestamped';
  const speakerDiarization = (params.speakerDiarization as boolean | undefined) ?? false;
  const punctuation = (params.punctuation as boolean | undefined) ?? true;

  const result = await transcribeAudio(file.path, { language, format, speakerDiarization, punctuation });
  const formattedTranscript = formatTranscript(result, format);
  const durationLabel = formatDuration(result.duration);

  // Write formatted transcript to a downloadable .txt file
  const fileId = uuidv4();
  const baseName = path.basename(file.originalname, path.extname(file.originalname));
  const outPath = path.join(TMP_DIR, `${fileId}.txt`);
  fs.writeFileSync(outPath, formattedTranscript, 'utf-8');

  const transcriptionResult = {
    transcript: result.transcript,
    duration: result.duration,
    language: result.language,
    segments: result.segments,
    wordCount: result.wordCount,
    speakerCount: result.speakerCount,
    segmentCount: result.segments.length,
    durationLabel,
  };

  return {
    fileId,
    filePath: outPath,
    fileName: `transcript_${baseName}.txt`,
    mimeType: 'text/plain',
    sizeBytes: fs.statSync(outPath).size,
    transcriptionResult,
    formattedTranscript,
    durationLabel,
  };
}
