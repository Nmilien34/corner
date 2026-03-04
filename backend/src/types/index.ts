export interface ToolResult {
  fileId: string;
  downloadUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl?: string;
}

export interface ServerToolResult {
  fileId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SignatureField {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  placed?: boolean;
}
