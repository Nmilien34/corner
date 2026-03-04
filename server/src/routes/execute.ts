import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { upload } from '../middleware/upload';
import { ServerToolResult } from '../types';
import { ToolResult } from '../types';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

type ToolFn = (
  files: Express.Multer.File[],
  params: Record<string, unknown>
) => Promise<ServerToolResult>;

// Lazy-loaded tool registry — avoids circular import issues at startup
function getToolMap(): Record<string, ToolFn> {
  const { pdfToWord } = require('../tools/pdfToWord');
  const { compressPdf } = require('../tools/compressPdf');
  const { mergePdf } = require('../tools/mergePdf');
  const { splitPdf } = require('../tools/splitPdf');
  const { convertImage } = require('../tools/convertImage');
  const { compressImage } = require('../tools/compressImage');
  const { removeBackground } = require('../tools/removeBackground');
  const { runOcr } = require('../tools/ocr');
  const { generateQr } = require('../tools/generateQr');
  const { eSign } = require('../tools/esign');

  return {
    pdf_to_word: pdfToWord,
    compress_pdf: compressPdf,
    merge_pdf: mergePdf,
    split_pdf: splitPdf,
    convert_image: convertImage,
    compress_image: compressImage,
    remove_background: removeBackground,
    ocr: runOcr,
    generate_qr: generateQr,
    esign: eSign,
  };
}

export const executeRoute = Router();

executeRoute.post(
  '/execute',
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const { tool, params } = req.body as { tool: string; params?: string };

    if (!tool) {
      res.status(400).json({ error: 'tool is required' });
      return;
    }

    const toolMap = getToolMap();
    const toolFn = toolMap[tool];
    if (!toolFn) {
      res.status(400).json({ error: `Unknown tool: ${tool}` });
      return;
    }

    try {
      const parsedParams = params ? JSON.parse(params) : {};
      const result = await toolFn(files, parsedParams);

      const clientResult: ToolResult = {
        fileId: result.fileId,
        downloadUrl: `/api/file/${result.fileId}`,
        fileName: result.fileName,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes,
      };
      res.json(clientResult);
    } catch (err) {
      console.error(`[execute:${tool}]`, err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Tool execution failed',
      });
    }
  }
);

executeRoute.get('/file/:fileId', (req: Request, res: Response) => {
  const { fileId } = req.params;
  // Match any file whose name starts with the fileId UUID
  let matched: string | undefined;
  try {
    matched = fs.readdirSync(TMP_DIR).find((f) => f.startsWith(fileId));
  } catch (_) {
    res.status(500).json({ error: 'Could not read file directory' });
    return;
  }

  if (!matched) {
    res.status(404).json({ error: 'File not found or expired' });
    return;
  }

  res.sendFile(path.join(TMP_DIR, matched));
});
