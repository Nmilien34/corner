import type { Request, Response, NextFunction } from 'express';
import { executeTool, isKnownTool } from '../services/toolService';
import { saveFileRecord } from '../services/fileService';
import { createError } from '../middleware/errorHandler';
import type { ToolResult } from '@corner/shared';

export async function handleExecute(req: Request, res: Response, next: NextFunction): Promise<void> {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const { tool, params } = req.body as { tool: string; params?: string };

  if (!tool) {
    next(createError(400, 'tool is required'));
    return;
  }

  if (!isKnownTool(tool)) {
    next(createError(400, `Unknown tool: ${tool}`));
    return;
  }

  try {
    const parsedParams: Record<string, unknown> = params ? JSON.parse(params) : {};
    const result = await executeTool(tool, files, parsedParams);

    // Stub detection — tool exists in registry but not yet implemented
    if (result.isStub || result.fileName.startsWith('corner_stub_')) {
      next(createError(501, `Tool '${tool}' is not yet implemented`, 'TOOL_NOT_IMPLEMENTED'));
      return;
    }

    // Persist file record to DB (no-op when DB is unavailable)
    const fileId = await saveFileRecord({
      filePath:  result.filePath,
      fileName:  result.fileName,
      toolName:  tool,
      params:    parsedParams,
      mimeType:  result.mimeType,
      sizeBytes: result.sizeBytes,
    });

    const clientResult: ToolResult = {
      fileId,
      downloadUrl: `/api/file/${fileId}`,
      fileName:    result.fileName,
      mimeType:    result.mimeType,
      sizeBytes:   result.sizeBytes,
    };

    res.json(clientResult);
  } catch (err) {
    console.error(`[execute:${tool}]`, err);
    next(createError(500, err instanceof Error ? err.message : 'Tool execution failed'));
  }
}
