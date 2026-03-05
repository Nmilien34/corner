import axios from 'axios';
import type { ParsedIntent, ToolResult } from '../types';

export const api = {
  parseIntent: (
    message: string,
    fileContext?: { name: string; type: string; size: number }
  ) =>
    axios
      .post<ParsedIntent>('/api/parse', { message, fileContext })
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
};
