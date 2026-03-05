import type { ToolName } from '@corner/shared';
import type { ServerToolResult } from '../types';

/**
 * Creates a stub ServerToolResult for tools that are not yet implemented.
 * The filename prefix `corner_stub_` is used by the execute controller
 * to detect stubs and return HTTP 501.
 */
export function makeStub(toolName: ToolName | string): ServerToolResult {
  return {
    fileId: `stub-${toolName}`,
    filePath: '',
    fileName: `corner_stub_${toolName}.txt`,
    mimeType: 'text/plain',
    sizeBytes: 0,
  };
}
