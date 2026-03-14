import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import type { ParsedIntent, AnalysisType } from '@corner/shared';
import { ANALYSIS_TYPES } from '@corner/shared';
import { CORNER_SYSTEM_PROMPT, buildDocumentAnalysisPrompt } from '../prompts/documentIntelligence';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const INTENT_PARSING_ADDENDUM = `

---
INTENT PARSING OUTPUT:
When responding to this request, you are also driving tool execution. You MUST end your response with a single line that contains ONLY a valid JSON object (no markdown fences, no explanation after it). The JSON must have these exact keys:
- intent (string): brief description of what the user wants
- tool (string | null): exact tool name from the Corner registry, or null if no tool applies
- mode ("silent" | "interactive" | "analysis")
- confidence (number 0-1)
- clarification (string | null)
- params: { "input_type": string, "output_type": string, "options": object } or for analysis intents: { "analysisType": "<intent>" }
- steps: array of { "tool": string, "params": object, "description": string }

Use ONLY these tool names for file operations: pdf_to_word, pdf_to_excel, pdf_to_pptx, pdf_to_jpg, pdf_to_png, word_to_pdf, excel_to_pdf, pptx_to_pdf, jpg_to_pdf, png_to_pdf, merge_pdf, split_pdf, compress_pdf, rotate_pdf, add_page_numbers, password_protect_pdf, remove_pdf_password, add_watermark_pdf, repair_pdf, ocr, html_to_pdf, url_to_pdf, fill_pdf_form, esign, remove_background, resize_image, crop_image, flip_rotate_image, add_border_image, watermark_image, image_to_pdf, compress_image, convert_image, jpg_to_png, png_to_jpg, webp_to_jpg, jpg_to_webp, add_page_numbers_word, track_changes_word, csv_to_excel, excel_to_csv, generate_qr, extract_text, extract_images, extract_tables, summarize_document, generate_study_questions, extract_key_terms, generate_citation, transcribe_audio, extract_audio, remove_silence, convert_audio, audio_to_pdf.

For the following analysis-only intents use tool null and mode "analysis", and set params to { "analysisType": "<intent>" }: summarize (summarize document into key points), study_questions (generate exam/study questions), key_terms (extract and define important terms), citation_generator (formatted citation for document), contract_review (review contract: unusual clauses, risks, key dates), action_items (extract action items, tasks, owners, deadlines), email_draft (draft professional email from document), sensitive_data (scan for sensitive personal information). For these, steps may be empty.

If the user's request does not map to any tool, set tool to null and clarification to a message explaining what Corner can do. The primary "tool" field must equal the first step's tool. Always populate steps (at least one item for single-step tasks), except when mode is "analysis".`;

/** Extract the last complete JSON object from text (for parsing intent from document-intelligence response). */
function extractLastJson(text: string): string {
  const endIdx = text.lastIndexOf('}');
  if (endIdx === -1) return '{}';
  let depth = 0;
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
  conversationHistory?: Array<{ role: string; content: string }>,
): Promise<ParsedIntent> {
  const isFirstMessage = !conversationHistory || conversationHistory.length <= 1;
  const previousContext = conversationHistory && conversationHistory.length > 1
    ? conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')
    : undefined;

  const userContent = fileContext
    ? buildDocumentAnalysisPrompt(message, fileContext.name, fileContext.type, fileContext.pageCount, isFirstMessage, previousContext)
    : buildDocumentAnalysisPrompt(message, '', 'none', undefined, isFirstMessage, previousContext);

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

  // Normalize analysis intents: force tool null, mode analysis, params.analysisType
  const analysisTypeFromParams = parsed.params?.analysisType as string | undefined;
  const analysisTypeFromTool = parsed.tool && ANALYSIS_TYPES.includes(parsed.tool as AnalysisType) ? (parsed.tool as AnalysisType) : null;
  const analysisType = analysisTypeFromParams && ANALYSIS_TYPES.includes(analysisTypeFromParams as AnalysisType)
    ? (analysisTypeFromParams as AnalysisType)
    : analysisTypeFromTool;

  if (analysisType) {
    parsed.tool = null;
    parsed.mode = 'analysis';
    parsed.params = { ...parsed.params, analysisType };
    parsed.steps = parsed.steps?.length ? parsed.steps : [];
  } else if (parsed.mode !== 'silent' && parsed.mode !== 'interactive' && parsed.mode !== 'analysis') {
    parsed.mode = 'silent';
  }

  return parsed;
}
