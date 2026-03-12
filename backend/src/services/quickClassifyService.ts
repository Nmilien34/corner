import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import type { FileMetadata } from '@corner/shared';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const QUICK_CLASSIFY_SYSTEM = `You are a fast request classifier for Corner, a document and file processing tool.

Given a user request (and optional file info), determine if it maps clearly to exactly ONE tool with determinable parameters, or if it's complex/multi-step/ambiguous and needs deeper planning.

TOOL LIST (use exact snake_case names):
pdf_to_word, pdf_to_excel, pdf_to_pptx, pdf_to_jpg, pdf_to_png
word_to_pdf, excel_to_pdf, pptx_to_pdf, jpg_to_pdf, png_to_pdf
merge_pdf, split_pdf, compress_pdf, compress_image
rotate_pdf, add_page_numbers, password_protect_pdf, remove_pdf_password
add_watermark_pdf, repair_pdf, ocr, extract_text, extract_images, extract_tables
resize_image, crop_image, flip_rotate_image, add_border_image, watermark_image, image_to_pdf, convert_image
jpg_to_png, png_to_jpg, webp_to_jpg, jpg_to_webp
remove_background, generate_qr
add_page_numbers_word, track_changes_word, csv_to_excel, excel_to_csv
summarize_document, generate_study_questions, extract_key_terms, generate_citation
transcribe_audio, extract_audio, remove_silence, convert_audio, audio_to_pdf

Return ONLY valid JSON. No markdown, no explanation.

If the request clearly maps to exactly ONE tool with all needed params determinable:
{"type":"direct","toolName":"<exact_name>","params":{}}

Otherwise (multi-step, ambiguous, no clear single tool, needs clarification):
{"type":"orchestrate"}

Examples:
- "compress this pdf" → {"type":"direct","toolName":"compress_pdf","params":{}}
- "convert to word" → {"type":"direct","toolName":"pdf_to_word","params":{}}
- "summarize this" → {"type":"direct","toolName":"summarize_document","params":{"mode":"summarize"}}
- "generate study questions" → {"type":"direct","toolName":"generate_study_questions","params":{"mode":"study_questions"}}
- "extract key terms" → {"type":"direct","toolName":"extract_key_terms","params":{"mode":"key_terms"}}
- "transcribe this audio" → {"type":"direct","toolName":"transcribe_audio","params":{}}
- "remove the background" → {"type":"direct","toolName":"remove_background","params":{}}
- "compress then convert to word" → {"type":"orchestrate"}
- "rotate pages 1-3 clockwise" → {"type":"direct","toolName":"rotate_pdf","params":{"direction":"clockwise","applyTo":"range","pageRange":"1-3"}}
- "add watermark CONFIDENTIAL" → {"type":"direct","toolName":"add_watermark_pdf","params":{"text":"CONFIDENTIAL","opacity":50,"rotation":45,"fontSize":48,"color":"#FF0000","tile":true}}
- "what can you do" → {"type":"orchestrate"}
- "explain this document" → {"type":"direct","toolName":"summarize_document","params":{"mode":"summarize"}}`;

export type RequestClass =
  | { type: 'direct'; toolName: string; params: Record<string, unknown> }
  | { type: 'orchestrate' };

export async function quickClassify(
  message: string,
  fileMetadata: FileMetadata[],
): Promise<RequestClass> {
  try {
    const fileContext = fileMetadata.length > 0
      ? ` Files: ${fileMetadata.map((f) => `${f.name} (${f.type})`).join(', ')}`
      : '';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      system: QUICK_CLASSIFY_SYSTEM,
      messages: [{ role: 'user', content: `Request: "${message}"${fileContext}` }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return { type: 'orchestrate' };

    const result = JSON.parse(text.slice(start, end + 1)) as RequestClass;
    if (result.type === 'direct' && typeof result.toolName === 'string') {
      return { type: 'direct', toolName: result.toolName, params: result.params ?? {} };
    }
    return { type: 'orchestrate' };
  } catch {
    // Any error (API, parse) → fall back to full orchestration
    return { type: 'orchestrate' };
  }
}
