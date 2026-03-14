import axios from 'axios';
import type { ParsedIntent, ToolResult, AnalysisType } from '../types';
import { ANALYSIS_TYPES } from '../types';

export const api = {
  parseIntent: (
    message: string,
    fileContext?: { name: string; type: string; size: number },
    formatMeta?: { fileFormat: string; fileCategory: string; canOCR: boolean; isImage: boolean }
  ) =>
    axios
      .post<ParsedIntent>('/api/parse', { message, fileContext, ...formatMeta })
      .then((r) => r.data),

  executeTool: (
    tool: string,
    files: File[],
    params: Record<string, unknown> = {}
  ) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    fd.append('tool', tool);
    fd.append('params', JSON.stringify(params));
    return axios
      .post<ToolResult>('/api/execute', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /** Tier 2 analysis: document → Claude prompt → text response (no file). Same shape as /api/analyze/text. */
  analyzeDocument: (
    file: File,
    analysisType: string
  ): Promise<{ success: boolean; analysisType: string; result: string; exportable: boolean }> => {
    if (!ANALYSIS_TYPES.includes(analysisType as AnalysisType)) {
      return Promise.reject(new Error(`Invalid analysisType: ${analysisType}`));
    }
    const fd = new FormData();
    fd.append('files', file);
    fd.append('analysisType', analysisType);
    return axios
      .post<{ success: boolean; analysisType: string; result: string; exportable: boolean }>(
        '/api/analyze',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((r) => r.data);
  },
};
