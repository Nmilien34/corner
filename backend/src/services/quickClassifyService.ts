import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import type { FileMetadata, AnalysisType } from '@corner/shared';
import { ANALYSIS_TYPES } from '@corner/shared';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const QUICK_CLASSIFY_SYSTEM = `You are a fast request classifier for Corner, a document and file processing tool.

Given a user request (and optional file info), determine if it maps to:
1) Exactly ONE file-operation tool (use type "direct" and toolName from the TOOL LIST), or
2) An analysis-only intent (use type "analysis" and analysisType from the ANALYSIS list — no file output, returns text in chat), or
3) Complex/multi-step/ambiguous (use type "orchestrate").

TOOL LIST (use exact snake_case names for type "direct"):
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

ANALYSIS-ONLY (use type "analysis" and analysisType — one of): summarize, study_questions, key_terms, citation_generator, contract_review, action_items, email_draft, sensitive_data.

Return ONLY valid JSON. No markdown, no explanation.

If exactly ONE tool: {"type":"direct","toolName":"<exact_name>","params":{}}
If analysis-only: {"type":"analysis","analysisType":"<summarize|study_questions|key_terms|citation_generator|contract_review|action_items|email_draft|sensitive_data>"}
Otherwise: {"type":"orchestrate"}

Examples:
- "compress this pdf" → {"type":"direct","toolName":"compress_pdf","params":{}}
- "summarize this" → {"type":"analysis","analysisType":"summarize"}
- "generate study questions" → {"type":"analysis","analysisType":"study_questions"}
- "extract key terms" → {"type":"analysis","analysisType":"key_terms"}
- "cite this" / "give me a citation" → {"type":"analysis","analysisType":"citation_generator"}
- "review this contract" → {"type":"analysis","analysisType":"contract_review"}
- "what are the action items" → {"type":"analysis","analysisType":"action_items"}
- "draft an email from this" → {"type":"analysis","analysisType":"email_draft"}
- "scan for sensitive data" → {"type":"analysis","analysisType":"sensitive_data"}
- "transcribe this audio" → {"type":"direct","toolName":"transcribe_audio","params":{}}
- "compress then convert to word" → {"type":"orchestrate"}`;

export type RequestClass =
  | { type: 'direct'; toolName: string; params: Record<string, unknown> }
  | { type: 'analysis'; analysisType: AnalysisType }
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
    if (result.type === 'analysis' && typeof result.analysisType === 'string' && ANALYSIS_TYPES.includes(result.analysisType as AnalysisType)) {
      return { type: 'analysis', analysisType: result.analysisType as AnalysisType };
    }
    return { type: 'orchestrate' };
  } catch {
    // Any error (API, parse) → fall back to full orchestration
    return { type: 'orchestrate' };
  }
}
