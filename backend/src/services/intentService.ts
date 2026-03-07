import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import type { ParsedIntent } from '@corner/shared';
import { CORNER_SYSTEM_PROMPT, buildDocumentAnalysisPrompt } from '../prompts/documentIntelligence';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const INTENT_PARSING_ADDENDUM = `

---
INTENT PARSING OUTPUT:
When responding to this request, you are also driving tool execution. You MUST end your response with a single line that contains ONLY a valid JSON object (no markdown fences, no explanation after it). The JSON must have these exact keys:
- intent (string): brief description of what the user wants
- tool (string | null): exact tool name from the Corner registry, or null if no tool applies
- mode ("silent" | "interactive")
- confidence (number 0-1)
- clarification (string | null)
- params: { "input_type": string, "output_type": string, "options": object }
- steps: array of { "tool": string, "params": object, "description": string }

Use ONLY these tool names: pdf_to_word, pdf_to_excel, pdf_to_pptx, pdf_to_jpg, pdf_to_png, word_to_pdf, excel_to_pdf, pptx_to_pdf, jpg_to_pdf, png_to_pdf, merge_pdf, split_pdf, compress_pdf, rotate_pdf, add_page_numbers, password_protect_pdf, remove_pdf_password, add_watermark_pdf, repair_pdf, ocr, html_to_pdf, url_to_pdf, fill_pdf_form, esign, remove_background, resize_image, crop_image, flip_rotate_image, add_border_image, watermark_image, image_to_pdf, compress_image, convert_image, jpg_to_png, png_to_jpg, webp_to_jpg, jpg_to_webp, add_page_numbers_word, track_changes_word, csv_to_excel, excel_to_csv, generate_qr, extract_text, extract_images, extract_tables.
If the user's request does not map to any tool, set tool to null and clarification to a message explaining what Corner can do. The primary "tool" field must equal the first step's tool. Always populate steps (at least one item for single-step tasks).`;

/** Extract the last complete JSON object from text (for parsing intent from document-intelligence response). */
function extractLastJson(text: string): string {
  const endIdx = text.lastIndexOf('}');
  if (endIdx === -1) return '{}';
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = endIdx; i >= 0; i--) {
    const ch = text[i];
    if (ch === '}') depth++;
    else if (ch === '{') {
      depth--;
      if (depth === 0) return text.slice(i, endIdx + 1);
    }
    // When walking backwards we don't need full string/escape handling for finding the start of the object
  }
  return '{}';
}

export async function parseIntent(
  message: string,
  fileContext?: { name: string; type: string; size: number; pageCount?: number },
): Promise<ParsedIntent> {
  const userContent = fileContext
    ? buildDocumentAnalysisPrompt(message, fileContext.name, fileContext.type, fileContext.pageCount)
    : buildDocumentAnalysisPrompt(message, '', 'none');

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: CORNER_SYSTEM_PROMPT + INTENT_PARSING_ADDENDUM,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const jsonStr = extractLastJson(text.trim());
  let parsed: ParsedIntent;
  try {
    parsed = JSON.parse(jsonStr) as ParsedIntent;
  } catch {
    parsed = {
      intent: '',
      tool: null,
      mode: 'silent',
      confidence: 0,
      clarification: 'Could not parse response. Please try rephrasing.',
      params: { input_type: '', output_type: '', options: {} },
      steps: [],
    };
  }
  if (typeof parsed.confidence !== 'number') parsed.confidence = 0.5;
  if (!Array.isArray(parsed.steps)) parsed.steps = [];
  if (typeof parsed.params !== 'object' || parsed.params === null) {
    parsed.params = { input_type: '', output_type: '', options: {} };
  }
  if (typeof parsed.intent !== 'string') parsed.intent = '';
  if (parsed.tool !== null && typeof parsed.tool !== 'string') parsed.tool = null;
  if (parsed.mode !== 'silent' && parsed.mode !== 'interactive') parsed.mode = 'silent';
  return parsed;
}
