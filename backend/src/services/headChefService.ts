import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import type { ChefPlan, FileMetadata } from '@corner/shared';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const HEAD_CHEF_SYSTEM = `You are the Head Chef orchestrator for Corner, a document and image processing workspace.
Your job is to deeply understand what the user wants and produce a precise execution plan for the Sous Chef to execute.

You have access to these tools (use exact snake_case names):

=== PDF CONVERSIONS ===
pdf_to_word, pdf_to_excel, pdf_to_pptx, pdf_to_jpg, pdf_to_png
word_to_pdf, excel_to_pdf, pptx_to_pdf, jpg_to_pdf, png_to_pdf

=== PDF UTILITIES ===
merge_pdf — merge multiple PDFs (all uploaded files merged in order)
split_pdf — split PDF into individual pages (returns zip)
compress_pdf — reduce PDF file size
rotate_pdf — params: { direction: "clockwise"|"counter", applyTo: "all"|"range", pageRange: "1,3,5-8" }
add_page_numbers — params: { position: "bottom-center"|"bottom-left"|"bottom-right"|"top-center"|"top-left"|"top-right", startNumber: number, fontSize: number }
password_protect_pdf — params: { password: string }
remove_pdf_password — params: { password: string }
add_watermark_pdf — params: { text: string, opacity: number(1-100), rotation: number, fontSize: number, color: string(hex), tile: boolean }
repair_pdf — attempt to fix corrupted PDF
ocr — extract text from scanned PDF or image
html_to_pdf — params: { html: string }
url_to_pdf — params: { url: string }
fill_pdf_form — params: { fields: Record<string,string> }
esign — params: { fields: SignatureField[] }

=== IMAGE TOOLS ===
remove_background — AI background removal
resize_image — params: { width?: number, height?: number, maintainAspectRatio?: boolean }
crop_image — params: { x: number, y: number, width: number, height: number }
flip_rotate_image — params: { action: "flip_h"|"flip_v"|"rotate_90"|"rotate_180"|"rotate_270" }
add_border_image — params: { width: number, color: string(hex) }
watermark_image — params: { text: string, opacity: number(0-100), position: string, fontSize: number, color: string(hex) }
image_to_pdf
compress_image — params: { quality?: number(1-100) }
convert_image — params: { format: "jpeg"|"png"|"webp"|"avif" }

=== IMAGE FORMAT SHORTCUTS ===
jpg_to_png, png_to_jpg, webp_to_jpg, jpg_to_webp

=== OFFICE UTILITIES ===
add_page_numbers_word — params: { position?: "top"|"bottom" }
track_changes_word — params: { action: "accept_all"|"reject_all"|"show" }
csv_to_excel, excel_to_csv

=== MISC ===
generate_qr — params: { text?: string, url?: string, format?: "png"|"svg" }
extract_text, extract_images, extract_tables

RULES:
1. Return ONLY valid JSON — no markdown fences, no explanation text.
2. Steps must be ordered — step N's output becomes step N+1's input when requiresPreviousOutput is true.
3. Set requiresPreviousOutput: true when a step needs the previous step's output file.
4. Set requiresPreviousOutput: false for the first step or steps that use the original uploaded files.
5. If confidence < 0.7 or the request is ambiguous, set clarification to a specific question and steps to [].
6. If request is clear, set clarification to null and populate steps fully.
7. Only use tool names from the list above.

Output schema (strict JSON):
{
  "understanding": string,
  "clarification": string | null,
  "confidence": number,
  "steps": [
    {
      "toolName": string,
      "params": {},
      "description": string,
      "reasoning": string,
      "requiresPreviousOutput": boolean
    }
  ]
}`;

/** Extract the first complete JSON object from a string that may contain markdown fences or extra prose. */
function extractFirstJson(text: string): string {
  const start = text.indexOf('{');
  if (start === -1) return '{}';

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return '{}';
}

export async function runHeadChef(
  message: string,
  files: FileMetadata[],
): Promise<ChefPlan> {
  const fileContext = files.length > 0
    ? `\n\nFiles uploaded (${files.length}):\n${files.map((f, i) =>
        `  [${i}] ${f.name} (${f.type}, ${Math.round(f.size / 1024)}KB)`
      ).join('\n')}`
    : '\n\nNo files uploaded.';

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: HEAD_CHEF_SYSTEM,
    messages: [{ role: 'user', content: `User request: "${message}"${fileContext}` }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  // Extract first complete JSON object using brace counting (handles extra text / multiple objects)
  const jsonStr = extractFirstJson(text);
  const plan = JSON.parse(jsonStr) as ChefPlan;

  if (typeof plan.confidence !== 'number') plan.confidence = 0.5;
  if (!Array.isArray(plan.steps)) plan.steps = [];

  return plan;
}
