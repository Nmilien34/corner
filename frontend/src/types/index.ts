export type ToolName =
  // PDF conversions
  | 'pdf_to_word' | 'pdf_to_excel' | 'pdf_to_pptx' | 'pdf_to_jpg' | 'pdf_to_png'
  | 'word_to_pdf' | 'excel_to_pdf' | 'pptx_to_pdf' | 'jpg_to_pdf' | 'png_to_pdf'
  // PDF utilities
  | 'merge_pdf' | 'split_pdf' | 'compress_pdf' | 'rotate_pdf' | 'repair_pdf'
  | 'add_page_numbers' | 'password_protect_pdf' | 'remove_pdf_password'
  | 'add_watermark_pdf' | 'ocr' | 'html_to_pdf' | 'url_to_pdf'
  | 'fill_pdf_form' | 'esign'
  // legacy frontend aliases (kept for RightPanel compatibility)
  | 'pdf_to_powerpoint' | 'crop_pdf' | 'redact_pdf' | 'page_setup'
  | 'document_properties' | 'headers_footers' | 'typography_defaults' | 'export_options'
  | 'password_protect' | 'remove_password' | 'redact_content' | 'add_watermark'
  // Image tools
  | 'remove_background' | 'resize_image' | 'crop_image' | 'flip_rotate_image'
  | 'add_border_image' | 'watermark_image' | 'image_to_pdf' | 'compress_image'
  | 'convert_image' | 'jpg_to_png' | 'png_to_jpg' | 'webp_to_jpg' | 'jpg_to_webp'
  // legacy image aliases
  | 'add_border' | 'upscale_image'
  // Office utilities
  | 'add_page_numbers_word' | 'track_changes_word' | 'csv_to_excel' | 'excel_to_csv'
  // E-sign
  | 'request_signatures' | 'place_fields' | 'bulk_send' | 'in_person_signing'
  | 'templates' | 'identity_verification' | 'audit_trail'
  | 'certificate_of_completion' | 'tamper_detection'
  | 'annotate_pdf' | 'add_signature_line' | 'stamp_document' | 'decline_void'
  // Misc
  | 'generate_qr' | 'barcode' | 'invoice_pdf' | 'certificate_pdf'
  | 'extract_text' | 'extract_images' | 'extract_tables'

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

export interface WalkthroughRegion {
  page: number
  x: number
  y: number
  width: number
  height: number
}

export interface WalkthroughStep {
  id: string
  title: string
  description: string
  region?: WalkthroughRegion
  kind?: string
}

export interface ToolResult {
  fileId: string
  downloadUrl: string
  fileName: string
  mimeType: string
  sizeBytes: number
  previewUrl?: string
  walkthrough?: WalkthroughStep[]
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
