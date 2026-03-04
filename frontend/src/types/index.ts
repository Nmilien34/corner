export type ToolName =
  | 'pdf_to_word' | 'pdf_to_ppt' | 'pdf_to_excel' | 'word_to_pdf'
  | 'compress_pdf' | 'merge_pdf' | 'split_pdf'
  | 'compress_image' | 'convert_image' | 'remove_background' | 'resize_image'
  | 'ocr' | 'generate_qr' | 'esign' | 'fill_form' | 'annotate_pdf' | 'password_protect'

export type ExecutionMode = 'silent' | 'interactive'
export type VersionStatus = 'processing' | 'complete' | 'error'
export type AppMode = 'empty' | 'processing' | 'result' | 'esign' | 'clarifying'

export interface ParsedIntent {
  intent: string
  tool: ToolName
  mode: ExecutionMode
  confidence: number
  clarification: string | null
  params: {
    input_type: string
    output_type: string
    options: Record<string, unknown>
  }
  steps: Array<{ tool: ToolName; params: Record<string, unknown>; description: string }>
}

export interface VersionNode {
  id: string
  label: string
  toolName: ToolName | string
  timestamp: number
  status: VersionStatus
  fileId: string
  fileUrl: string
  isCurrent: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'corner'
  content: string
  timestamp: number
  attachmentName?: string
}

export interface SavedSignature {
  dataUrl: string
  initialsDataUrl: string
  method: 'draw' | 'type' | 'upload'
  createdAt: number
}

export interface ToolResult {
  fileId: string
  downloadUrl: string
  fileName: string
  mimeType: string
  sizeBytes: number
  previewUrl?: string
}

export interface ProcessingState {
  progress: number
  label: string
  stepCurrent?: number
  stepTotal?: number
}

export interface SignatureField {
  page: number
  x: number       // percent 0-100
  y: number       // percent 0-100
  width: number   // percent
  height: number  // percent
  label: string
  placed: boolean
}
