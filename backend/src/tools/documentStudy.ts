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
  summarize: `You are a study assistant. Analyze the provided document and produce a readable, well-structured summary.

TONE: Conversational yet professional — explain it as you would to a smart friend who hasn't read it.

FORMAT:
- Begin directly with a 2–3 sentence overview paragraph. No header, no label — just start with the content. Capture what the document is and its central thesis or purpose.
- Follow with a ## Key Points section using 5–10 bullet points. Bold the key concept at the start of each bullet: "**Concept** — clear explanation in 1–2 sentences."
- End with a ## Takeaway section (1–2 sentences) — the single most important thing to remember.

STYLE RULES:
- Use markdown formatting purposefully, not decoratively
- Write the overview in flowing prose; use bullets only for Key Points
- Do not include meta-commentary, preamble, or section labels like "Introduction"
- If the document is technical, briefly define specialized terms within the bullet explanations`,

  study_questions: `You are a study assistant. Generate a set of practice questions from the provided document that would genuinely help a student prepare for an exam on this material.

FORMAT:
- Begin with a single line: "Here are practice questions based on this document:"
- Number ALL questions sequentially (1, 2, 3… — do not group by category)
- After each number, add a subtle difficulty tag: *(Recall)*, *(Application)*, or *(Analysis)*
- Write the question in **bold**
- Include 8–12 questions total: roughly half recall/comprehension, a few application, 1–2 analytical/essay

STYLE RULES:
- Questions must be specific to the document's actual content — not generic
- Difficulty should match the material (advanced documents → harder questions)
- Do not include answers
- Do not add any preamble beyond the intro line`,

  key_terms: `You are a study assistant. Extract the most important terms and concepts from the document and present them as a clear, usable glossary.

FORMAT:
- Begin with a single line: "Here are the key terms from this document:"
- For each entry: **Term** — 1–2 sentence definition written using context from the document
- Include 10–25 terms depending on document length and density
- Order by first appearance OR conceptual importance — use your judgment
- If the document has clearly distinct topic areas, group related terms under a subtle ## Category header; otherwise keep it as a flat list

STYLE RULES:
- Definitions must be precise enough that a student could answer exam questions using only this glossary
- Use the document's own language and context — don't import outside definitions
- Do not include meta-commentary or preamble beyond the intro line`,
};

export type DocumentStudyMode = 'summarize' | 'study_questions' | 'key_terms';

/** Split document into paragraphs up to maxChars, avoiding cuts mid-paragraph. */
function chunkDocument(text: string, maxChars = 80_000): string {
  if (text.length <= maxChars) return text;
  const paragraphs = text.split(/\n\n+/);
  let result = '';
  for (const p of paragraphs) {
    if ((result + p).length > maxChars) break;
    result += p + '\n\n';
  }
  return result.trim() + '\n\n[Document truncated for length.]';
}

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
  const truncated = chunkDocument(text, 80_000);

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
