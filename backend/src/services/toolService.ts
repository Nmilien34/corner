import type { ToolName } from '@corner/shared';
import type { ServerToolResult } from '../types';
import { makeStub } from '../tools/stubs';

type ToolFn = (
  files: Express.Multer.File[],
  params: Record<string, unknown>,
) => Promise<ServerToolResult>;

/**
 * Lazy-loaded tool registry.
 * Only tools with real implementations are listed here; everything else
 * falls through to the stub factory.
 */
function buildRegistry(): Partial<Record<ToolName, ToolFn>> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { pdfToWord }        = require('../tools/pdfToWord');
  const { compressPdf }      = require('../tools/compressPdf');
  const { mergePdf }         = require('../tools/mergePdf');
  const { splitPdf }         = require('../tools/splitPdf');
  const { wordToPdf }        = require('../tools/wordToPdf');
  const { convertImage }     = require('../tools/convertImage');
  const { compressImage }    = require('../tools/compressImage');
  const { resizeImage }      = require('../tools/resizeImage');
  const { removeBackground } = require('../tools/removeBackground');
  const { runOcr }           = require('../tools/ocr');
  const { generateQr }       = require('../tools/generateQr');
  const { eSign }            = require('../tools/esign');
  const { rotatePdf }        = require('../tools/rotatePdf');
  const { addPageNumbers }   = require('../tools/addPageNumbers');
  const { addWatermarkPdf }  = require('../tools/addWatermarkPdf');
  const { removePasswordPdf }= require('../tools/removePasswordPdf');
  const { flipRotateImage }  = require('../tools/flipRotateImage');
  const { addBorderImage }   = require('../tools/addBorderImage');
  const { watermarkImage }   = require('../tools/watermarkImage');
  const { imageToPdf }       = require('../tools/imageToPdf');

  return {
    pdf_to_word:         pdfToWord,
    compress_pdf:        compressPdf,
    merge_pdf:           mergePdf,
    split_pdf:           splitPdf,
    word_to_pdf:         wordToPdf,
    convert_image:       convertImage,
    compress_image:      compressImage,
    resize_image:        resizeImage,
    remove_background:   removeBackground,
    ocr:                 runOcr,
    generate_qr:         generateQr,
    esign:               eSign,
    rotate_pdf:          rotatePdf,
    add_page_numbers:    addPageNumbers,
    add_watermark_pdf:   addWatermarkPdf,
    remove_pdf_password: removePasswordPdf,
    flip_rotate_image:   flipRotateImage,
    add_border_image:    addBorderImage,
    watermark_image:     watermarkImage,
    image_to_pdf:        imageToPdf,
  };
}

let _registry: Partial<Record<ToolName, ToolFn>> | null = null;

function getRegistry(): Partial<Record<ToolName, ToolFn>> {
  if (!_registry) _registry = buildRegistry();
  return _registry;
}

export interface ToolExecutionResult extends ServerToolResult {
  isStub?: boolean;
}

/**
 * Executes a tool by name.
 * - If the tool is implemented, runs it and returns the result.
 * - If the tool is a stub (not yet implemented), returns a stub result
 *   with `isStub: true` so the controller can return HTTP 501.
 */
export async function executeTool(
  tool: string,
  files: Express.Multer.File[],
  params: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const registry = getRegistry();
  const toolFn = registry[tool as ToolName];

  if (!toolFn) {
    // Check if it's a known tool name (stub) or completely unknown
    return { ...makeStub(tool as ToolName), isStub: true };
  }

  const result = await toolFn(files, params);
  return { ...result, isStub: false };
}

/**
 * Returns true if the given tool name is a known tool (even if stubbed).
 */
export function isKnownTool(tool: string): tool is ToolName {
  const KNOWN_TOOLS = new Set<string>([
    'pdf_to_word', 'pdf_to_excel', 'pdf_to_pptx', 'pdf_to_jpg', 'pdf_to_png',
    'word_to_pdf', 'excel_to_pdf', 'pptx_to_pdf', 'jpg_to_pdf', 'png_to_pdf',
    'merge_pdf', 'split_pdf', 'compress_pdf', 'rotate_pdf', 'add_page_numbers',
    'password_protect_pdf', 'remove_pdf_password', 'add_watermark_pdf',
    'repair_pdf', 'ocr', 'html_to_pdf', 'url_to_pdf', 'fill_pdf_form', 'esign',
    'remove_background', 'resize_image', 'crop_image', 'flip_rotate_image',
    'add_border_image', 'watermark_image', 'image_to_pdf', 'compress_image', 'convert_image',
    'jpg_to_png', 'png_to_jpg', 'webp_to_jpg', 'jpg_to_webp',
    'add_page_numbers_word', 'track_changes_word', 'csv_to_excel', 'excel_to_csv',
    'generate_qr', 'extract_text', 'extract_images', 'extract_tables',
  ]);
  return KNOWN_TOOLS.has(tool);
}
