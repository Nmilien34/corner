import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { extractDocumentText } from '../lib/extractDocumentText';
import type { ServerToolResult } from '../types';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

const STUDY_PROMPTS: Record<string, string> = {
  summarize: `You are a study assistant. The user has provided a document (e.g. textbook chapter, research paper, lecture notes). Your task is to produce a clear, structured summary.

Output format:
1. **Overview** — 2–3 sentences on what the document is about.
2. **Main points** — Bullet list of the key ideas (5–10 bullets).
3. **Conclusion / Takeaways** — 1–2 sentences on the main conclusion or what the reader should remember.

Keep the summary concise but complete. Use markdown for headings and bullets. Do not include any preamble or meta-commentary—only the summary.`,

  study_questions: `You are a study assistant. The user has provided a document (e.g. textbook chapter, research paper, lecture notes). Your task is to generate practice exam questions based on the content.

Output format:
1. **Recall questions** — 3–5 short-answer questions that test understanding of key facts.
2. **Application questions** — 2–3 questions that ask the reader to apply concepts.
3. **Discussion / essay-style questions** — 1–2 broader questions suitable for longer answers.

Number each question. Do not include answers. Do not include any preamble—only the questions.`,

  key_terms: `You are a study assistant. The user has provided a document (e.g. textbook chapter, research paper, lecture notes). Your task is to extract key technical or important terms and provide a brief glossary.

Output format:
For each term, give:
- **Term** — Brief definition or explanation (1–2 sentences). Use the document's context to define it accurately.

List terms in order of appearance or by importance. Include 10–25 terms depending on document length. Use markdown. Do not include any preamble—only the glossary.`,
};

export type DocumentStudyMode = 'summarize' | 'study_questions' | 'key_terms';

export async function documentStudy(
  files: Express.Multer.File[],
  params: Record<string, unknown>,
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];
  const mode = (params.mode as DocumentStudyMode) ?? 'summarize';

  const text = await extractDocumentText(file.path, file.originalname);
  if (!text || text.length < 50) {
    try { fs.unlinkSync(file.path); } catch (_) {}
    throw new Error('Document has too little extractable text. Try a different file or run OCR on a scanned PDF first.');
  }

  const systemPrompt = STUDY_PROMPTS[mode] ?? STUDY_PROMPTS.summarize;
  const truncated = text.length > 120_000 ? text.slice(0, 120_000) + '\n\n[Document truncated for length.]' : text;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Document content:\n\n${truncated}`,
      },
    ],
  });

  const block = response.content[0];
  const outputText = block.type === 'text' ? block.text : '';

  const fileId = uuidv4();
  const baseName = path.basename(file.originalname, path.extname(file.originalname));
  const suffix = mode === 'summarize' ? 'summary' : mode === 'study_questions' ? 'study_questions' : 'key_terms';
  const outPath = path.join(TMP_DIR, `${fileId}.txt`);
  fs.writeFileSync(outPath, outputText, 'utf-8');

  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_${baseName}_${suffix}.txt`,
    mimeType: 'text/plain',
    sizeBytes: Buffer.byteLength(outputText, 'utf-8'),
  };
}
