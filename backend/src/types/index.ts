// Re-export shared types so existing `import { ToolResult } from '../types'`
// imports continue to work after the shared-types migration.
export type { ToolResult, SignatureField } from '@corner/shared';

/** Internal server-side result returned by tool implementations. */
export interface ServerToolResult {
  fileId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}
