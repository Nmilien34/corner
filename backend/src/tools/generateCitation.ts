import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { extractDocumentText } from '../lib/extractDocumentText';
import type { ServerToolResult } from '../types';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

const CITATION_SYSTEM = `You are a citation assistant. The user will provide text extracted from a document (e.g. a research paper, article, or book chapter). Your job is to:

1. Identify the document's bibliographic metadata from the text: title, author(s), year, publication/source, journal or book title if applicable, volume/issue, page range, DOI or URL if present.
2. Format a complete citation in the requested style (APA, MLA, or Chicago).

Output ONLY the formatted citation(s), one per line if there are multiple (e.g. book + chapter). Use the exact formatting rules for the requested style. Do not include labels like "APA:" or "Citation:"—just the citation text. If you cannot determine enough metadata from the text, output your best guess and note "[Some details inferred from document]".`;

export async function generateCitation(
  files: Express.Multer.File[],
  params: Record<string, unknown>,
): Promise<ServerToolResult> {
  if (!files.length) throw new Error('No file provided');
  const file = files[0];
  const style = ((params.style as string) ?? 'apa').toLowerCase();
  const validStyles = ['apa', 'mla', 'chicago'];
  const citationStyle = validStyles.includes(style) ? style : 'apa';

  const fullText = await extractDocumentText(file.path, file.originalname);
  if (!fullText || fullText.length < 20) {
    try { fs.unlinkSync(file.path); } catch (_) {}
    throw new Error('Document has too little text to generate a citation. Try a different file or run OCR on a scanned PDF first.');
  }

  // For long documents, first ~25k chars usually contain title, authors, abstract, metadata
  const textSample = fullText.length > 28000 ? fullText.slice(0, 28000) + '\n\n[Rest of document omitted.]' : fullText;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: CITATION_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Format a citation for this document in ${citationStyle.toUpperCase()} style.\n\nDocument text:\n\n${textSample}`,
      },
    ],
  });

  const block = response.content[0];
  const citationText = block.type === 'text' ? block.text.trim() : '';

  const fileId = uuidv4();
  const baseName = path.basename(file.originalname, path.extname(file.originalname));
  const outPath = path.join(TMP_DIR, `${fileId}.txt`);
  fs.writeFileSync(outPath, citationText, 'utf-8');

  try { fs.unlinkSync(file.path); } catch (_) {}

  return {
    fileId,
    filePath: outPath,
    fileName: `corner_${baseName}_citation_${citationStyle}.txt`,
    mimeType: 'text/plain',
    sizeBytes: Buffer.byteLength(citationText, 'utf-8'),
  };
}
