// Re-export shared types so existing `import { ToolResult } from '../types'`
// imports continue to work after the shared-types migration.
export type { ToolResult, SignatureField } from '@corner/shared';

/**
 * A rectangular region on a document page, expressed in percentage
 * coordinates (0–100) relative to the page width/height.
 */
export interface WalkthroughRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * One step in an AI-driven walkthrough of the result.
 * The front-end uses these to pan/zoom/highlight regions while
 * narrating what changed.
 */
export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  region?: WalkthroughRegion;
  kind?: string;
}

/** Internal server-side result returned by tool implementations. */
export interface ServerToolResult {
  fileId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /**
   * Optional walkthrough steps describing what changed, used by the
   * front-end to guide users through the result.
   */
  walkthrough?: WalkthroughStep[];
}
