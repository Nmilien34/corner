export type ToolName =
  | 'pdf_to_word' | 'pdf_to_powerpoint' | 'pdf_to_excel' | 'word_to_pdf'
  | 'compress_pdf' | 'merge_pdf' | 'split_pdf' | 'rotate_pdf' | 'crop_pdf' | 'repair_pdf'
  | 'ocr' | 'add_page_numbers' | 'redact_pdf'
  | 'page_setup' | 'document_properties' | 'headers_footers' | 'typography_defaults' | 'export_options'
  | 'compress_image' | 'convert_image' | 'remove_background' | 'resize_image'
  | 'crop_image' | 'flip_rotate_image' | 'add_border' | 'upscale_image' | 'image_to_pdf' | 'watermark_image'
  | 'esign' | 'request_signatures' | 'place_fields' | 'bulk_send' | 'in_person_signing' | 'templates'
  | 'identity_verification' | 'audit_trail' | 'certificate_of_completion' | 'tamper_detection'
  | 'fill_pdf_form' | 'annotate_pdf' | 'add_signature_line' | 'stamp_document' | 'decline_void'
  | 'generate_qr' | 'barcode' | 'invoice_pdf' | 'certificate_pdf'
  | 'password_protect' | 'remove_password' | 'redact_content' | 'add_watermark'

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
  timestamp: Date
  status: VersionStatus
  fileSnapshot?: Blob
  downloadUrl?: string
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
