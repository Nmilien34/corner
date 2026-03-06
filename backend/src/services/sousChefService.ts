import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import type { ChefPlan, ChefStep, StepResult, OrchestrateEvent, ToolResult } from '@corner/shared';
import { executeTool, isKnownTool } from './toolService';
import { saveFileRecord } from './fileService';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ─── Tool Descriptor Builder ─────────────────────────────────────────────────

interface ParamSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: { type: string };
}

interface ToolDescriptor {
  name: string;
  description: string;
  params: Record<string, ParamSchema>;
  required?: string[];
}

const TOOL_DESCRIPTORS: ToolDescriptor[] = [
  // PDF Conversions
  { name: 'pdf_to_word',   description: 'Convert a PDF file to DOCX Word format',              params: {} },
  { name: 'pdf_to_excel',  description: 'Convert a PDF file to XLSX Excel format',             params: {} },
  { name: 'pdf_to_pptx',  description: 'Convert a PDF file to PPTX PowerPoint format',        params: {} },
  { name: 'pdf_to_jpg',   description: 'Convert PDF pages to JPG images (returns zip)',       params: {} },
  { name: 'pdf_to_png',   description: 'Convert PDF pages to PNG images (returns zip)',       params: {} },
  { name: 'word_to_pdf',  description: 'Convert a Word DOCX/DOC file to PDF',                 params: {} },
  { name: 'excel_to_pdf', description: 'Convert an Excel XLSX file to PDF',                   params: {} },
  { name: 'pptx_to_pdf',  description: 'Convert a PowerPoint PPTX file to PDF',               params: {} },
  { name: 'jpg_to_pdf',   description: 'Convert a JPG image to PDF',                          params: {} },
  { name: 'png_to_pdf',   description: 'Convert a PNG image to PDF',                          params: {} },
  // PDF Utilities
  { name: 'merge_pdf',    description: 'Merge multiple PDF files into one document',           params: {} },
  { name: 'split_pdf',    description: 'Split a PDF into individual page files (returns zip)', params: {} },
  { name: 'compress_pdf', description: 'Reduce the file size of a PDF',                       params: {} },
  {
    name: 'rotate_pdf', description: 'Rotate pages in a PDF document',
    params: {
      direction: { type: 'string', description: 'Rotation direction', enum: ['clockwise', 'counter'] },
      applyTo:   { type: 'string', description: 'Which pages to rotate', enum: ['all', 'range'] },
      pageRange: { type: 'string', description: 'Page range e.g. "1,3,5-8" when applyTo=range' },
    },
  },
  {
    name: 'add_page_numbers', description: 'Add page numbers to a PDF',
    params: {
      position:    { type: 'string', description: 'Position', enum: ['bottom-center', 'bottom-left', 'bottom-right', 'top-center', 'top-left', 'top-right'] },
      startNumber: { type: 'number', description: 'Starting page number (default: 1)' },
      fontSize:    { type: 'number', description: 'Font size (default: 12)' },
    },
  },
  {
    name: 'password_protect_pdf', description: 'Add a password to a PDF file',
    params: { password: { type: 'string', description: 'Password to set on the PDF' } },
    required: ['password'],
  },
  {
    name: 'remove_pdf_password', description: 'Remove the password from a PDF',
    params: { password: { type: 'string', description: 'Current password of the PDF' } },
    required: ['password'],
  },
  {
    name: 'add_watermark_pdf', description: 'Add a text watermark to all PDF pages',
    params: {
      text:     { type: 'string',  description: 'Watermark text' },
      opacity:  { type: 'number',  description: 'Opacity 1-100' },
      rotation: { type: 'number',  description: 'Angle in degrees' },
      fontSize: { type: 'number',  description: 'Font size' },
      color:    { type: 'string',  description: 'Hex color e.g. #FF0000' },
      tile:     { type: 'boolean', description: 'Tile watermark across pages' },
    },
  },
  { name: 'repair_pdf',    description: 'Attempt to fix a corrupted PDF',                     params: {} },
  { name: 'ocr',           description: 'Extract text from scanned PDF or image using OCR',   params: {} },
  {
    name: 'html_to_pdf', description: 'Convert HTML string to PDF',
    params: { html: { type: 'string', description: 'HTML content to convert' } },
    required: ['html'],
  },
  {
    name: 'url_to_pdf', description: 'Convert a web page URL to PDF',
    params: { url: { type: 'string', description: 'URL to convert' } },
    required: ['url'],
  },
  {
    name: 'fill_pdf_form', description: 'Fill form fields in a PDF',
    params: { fields: { type: 'object', description: 'Field name → value pairs' } },
    required: ['fields'],
  },
  {
    name: 'esign', description: 'Add electronic signature to a PDF',
    params: { fields: { type: 'array', description: 'Signature field definitions', items: { type: 'object' } } },
  },
  // Image Tools
  { name: 'remove_background', description: 'Remove background from an image using AI', params: {} },
  {
    name: 'resize_image', description: 'Resize an image to specified dimensions',
    params: {
      width:               { type: 'number',  description: 'Target width in pixels' },
      height:              { type: 'number',  description: 'Target height in pixels' },
      maintainAspectRatio: { type: 'boolean', description: 'Maintain aspect ratio (default: true)' },
    },
  },
  {
    name: 'crop_image', description: 'Crop an image',
    params: {
      x:      { type: 'number', description: 'X offset from top-left' },
      y:      { type: 'number', description: 'Y offset from top-left' },
      width:  { type: 'number', description: 'Crop width in pixels' },
      height: { type: 'number', description: 'Crop height in pixels' },
    },
    required: ['x', 'y', 'width', 'height'],
  },
  {
    name: 'flip_rotate_image', description: 'Flip or rotate an image',
    params: { action: { type: 'string', description: 'Operation', enum: ['flip_h', 'flip_v', 'rotate_90', 'rotate_180', 'rotate_270'] } },
    required: ['action'],
  },
  {
    name: 'add_border_image', description: 'Add a border around an image',
    params: {
      width: { type: 'number', description: 'Border width in pixels' },
      color: { type: 'string', description: 'Border color hex e.g. #FF0000' },
    },
  },
  {
    name: 'watermark_image', description: 'Add text watermark to an image',
    params: {
      text:     { type: 'string', description: 'Watermark text' },
      opacity:  { type: 'number', description: 'Opacity 0-100' },
      position: { type: 'string', description: 'center | top-left | top-right | bottom-left | bottom-right' },
      fontSize: { type: 'number', description: 'Font size in pixels' },
      color:    { type: 'string', description: 'Text color hex' },
    },
  },
  { name: 'image_to_pdf',   description: 'Convert an image file to PDF',                      params: {} },
  {
    name: 'compress_image', description: 'Compress an image to reduce file size',
    params: { quality: { type: 'number', description: 'Quality 1-100 (default: 80)' } },
  },
  {
    name: 'convert_image', description: 'Convert an image to a different format',
    params: { format: { type: 'string', description: 'Target format', enum: ['jpeg', 'png', 'webp', 'avif'] } },
    required: ['format'],
  },
  // Image Format Shortcuts
  { name: 'jpg_to_png',  description: 'Convert JPG to PNG', params: {} },
  { name: 'png_to_jpg',  description: 'Convert PNG to JPG', params: {} },
  { name: 'webp_to_jpg', description: 'Convert WEBP to JPG', params: {} },
  { name: 'jpg_to_webp', description: 'Convert JPG to WEBP', params: {} },
  // Office Utilities
  {
    name: 'add_page_numbers_word', description: 'Add page numbers to a Word document',
    params: { position: { type: 'string', description: 'top or bottom (default: bottom)' } },
  },
  {
    name: 'track_changes_word', description: 'Manage tracked changes in a Word document',
    params: { action: { type: 'string', description: 'Action to perform', enum: ['accept_all', 'reject_all', 'show'] } },
    required: ['action'],
  },
  { name: 'csv_to_excel', description: 'Convert CSV to Excel XLSX', params: {} },
  { name: 'excel_to_csv', description: 'Convert Excel XLSX to CSV', params: {} },
  // Misc
  {
    name: 'generate_qr', description: 'Generate a QR code from text or URL',
    params: {
      text:   { type: 'string', description: 'Text to encode' },
      url:    { type: 'string', description: 'URL to encode' },
      format: { type: 'string', description: 'Output format', enum: ['png', 'svg'] },
    },
  },
  { name: 'extract_text',   description: 'Extract all text from a document', params: {} },
  { name: 'extract_images', description: 'Extract embedded images from a document', params: {} },
  { name: 'extract_tables', description: 'Extract tables from a document', params: {} },
];

function buildOpenAITools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return TOOL_DESCRIPTORS.map((desc) => {
    const properties: Record<string, object> = {};
    for (const [key, schema] of Object.entries(desc.params)) {
      const prop: Record<string, unknown> = { type: schema.type, description: schema.description };
      if (schema.enum) prop['enum'] = schema.enum;
      if (schema.items) prop['items'] = schema.items;
      properties[key] = prop;
    }
    return {
      type: 'function' as const,
      function: {
        name: desc.name,
        description: desc.description,
        parameters: { type: 'object', properties, required: desc.required ?? [] },
      },
    };
  });
}

const OPENAI_TOOLS = buildOpenAITools();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SousChefOptions {
  plan: ChefPlan;
  files: Express.Multer.File[];
  userId?: string;
  onEvent: (event: OrchestrateEvent) => void;
}

// ─── File Chaining Helper ─────────────────────────────────────────────────────

function buildMulterFile(filePath: string, originalname: string, mimetype: string): Express.Multer.File {
  const stat = fs.statSync(filePath);
  return {
    fieldname: 'files',
    originalname,
    encoding: '7bit',
    mimetype,
    destination: path.dirname(filePath),
    filename: path.basename(filePath),
    path: filePath,
    size: stat.size,
    stream: fs.createReadStream(filePath),
    buffer: Buffer.alloc(0),
  };
}

// ─── Main Sous Chef Function ──────────────────────────────────────────────────

export async function runSousChef(opts: SousChefOptions): Promise<StepResult[]> {
  const { plan, files, userId, onEvent } = opts;
  const completedSteps: StepResult[] = [];
  let currentFiles = [...files];
  let stepIndex = 0;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are the Sous Chef executor for Corner, a document processing workspace.
Your role is to execute the plan created by the Head Chef by calling tools in order.

Head Chef's understanding: "${plan.understanding}"

EXECUTION RULES:
1. Execute tools in the planned order
2. After each tool result, proceed to the next planned step
3. If a tool fails, try to adapt or report the error — do not retry indefinitely
4. After all steps complete, respond with a brief text summary — do NOT call more tools
5. Never call tools outside the plan unless recovering from an error`,
    },
    {
      role: 'user',
      content: buildPlanMessage(plan),
    },
  ];

  let maxIterations = Math.max(plan.steps.length * 3, 6);

  while (maxIterations-- > 0) {
    const allStepsDone = stepIndex >= plan.steps.length;

    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      tools: OPENAI_TOOLS,
      tool_choice: allStepsDone ? 'none' : 'auto',
    });

    const choice = response.choices[0];
    if (!choice) break;

    const assistantMsg: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
      role: 'assistant',
      content: choice.message.content ?? null,
      tool_calls: choice.message.tool_calls,
    };
    messages.push(assistantMsg);

    if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) break;

    for (const toolCall of choice.message.tool_calls) {
      const tc = toolCall as { id: string; function: { name: string; arguments: string } };
      const toolName = tc.function.name;
      const params = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      const plannedStep = plan.steps[stepIndex] as ChefStep | undefined;
      const description = plannedStep?.description ?? `Running ${toolName}`;

      onEvent({ type: 'step_start', stepIndex, tool: toolName, description });

      let toolResultMsg: string;
      let stepResult: StepResult;

      try {
        if (!isKnownTool(toolName)) throw new Error(`Unknown tool: ${toolName}`);

        const filesToUse = (plannedStep?.requiresPreviousOutput && stepIndex > 0)
          ? currentFiles
          : files;

        const rawResult = await executeTool(toolName, filesToUse, params);

        if (rawResult.isStub) throw new Error(`Tool '${toolName}' is not yet implemented`);

        const fileId = await saveFileRecord({
          filePath:  rawResult.filePath,
          fileName:  rawResult.fileName,
          toolName,
          params,
          mimeType:  rawResult.mimeType,
          sizeBytes: rawResult.sizeBytes,
          userId,
        });

        const clientResult: ToolResult = {
          fileId,
          downloadUrl: `/api/file/${fileId}`,
          fileName:    rawResult.fileName,
          mimeType:    rawResult.mimeType,
          sizeBytes:   rawResult.sizeBytes,
        };

        stepResult = { stepIndex, toolName, success: true, result: clientResult };

        // Update currentFiles for next step that requires previous output
        currentFiles = [buildMulterFile(rawResult.filePath, rawResult.fileName, rawResult.mimeType)];

        toolResultMsg = JSON.stringify({
          success: true,
          fileId,
          fileName: rawResult.fileName,
          mimeType: rawResult.mimeType,
          sizeBytes: rawResult.sizeBytes,
          message: `${toolName} succeeded. Output: ${rawResult.fileName}`,
        });

        onEvent({ type: 'step_complete', stepIndex, tool: toolName, result: clientResult });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Tool execution failed';
        stepResult = { stepIndex, toolName, success: false, error: errorMsg };
        toolResultMsg = JSON.stringify({ success: false, error: errorMsg, message: `${toolName} failed: ${errorMsg}` });
        onEvent({ type: 'step_error', stepIndex, tool: toolName, error: errorMsg });
      }

      completedSteps.push(stepResult);
      stepIndex++;

      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResultMsg });
    }
  }

  return completedSteps;
}

function buildPlanMessage(plan: ChefPlan): string {
  const stepsText = plan.steps
    .map((s, i) =>
      `Step ${i + 1}: ${s.toolName}\n  ${s.description}\n  Params: ${JSON.stringify(s.params)}\n  Uses previous output: ${s.requiresPreviousOutput}`
    )
    .join('\n\n');

  return `Execute the following plan:\n\n${stepsText}\n\nBegin by calling the tool for step 1.`;
}
