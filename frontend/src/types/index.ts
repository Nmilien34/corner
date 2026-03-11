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
  // Document intelligence (study + citation)
  | 'summarize_document' | 'generate_study_questions' | 'extract_key_terms' | 'generate_citation'
  // Audio
  | 'transcribe_audio' | 'extract_audio' | 'remove_silence' | 'convert_audio' | 'audio_to_pdf'

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
  /** Resolved from the filename extension by the backend — display as a static badge, not from Claude. */
  fileExtension?: string
}

export interface VersionNode {
  id: string
  label: string
  timestamp: Date
  status: VersionStatus
  fileSnapshot?: Blob
  downloadUrl?: string
  isCurrent: boolean
  /** Friendly operation label for history (e.g. "PDF → Word", "Compressed", "Signed") */
  operation?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'corner' | 'system'
  content: string
  timestamp: number
  attachmentName?: string
  /** When present, show inline result card in corner message */
  result?: ToolResult
  /** When set, used to show inline text + Export for study tools */
  toolName?: string
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
  textContent?: string
  studyTool?: string
  walkthrough?: WalkthroughStep[]
  transcriptionResult?: {
    transcript: string
    duration: number
    language: string
    wordCount: number
    speakerCount?: number
    segmentCount: number
    durationLabel: string
  }
  formattedTranscript?: string
  durationLabel?: string
}

export interface ProcessingState {
  progress: number
  label: string
  stepCurrent?: number
  stepTotal?: number
  /** Tool names from orchestrator plan (for loading animation) */
  toolNames?: string[]
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

/** Folder (project) for grouping conversations. */
export interface Folder {
  id: string
  name: string
  createdAt?: number
}

/** Conversation list item (API or localStorage). Used for left panel. */
export interface ConversationListItem {
  id: string
  title: string
  lastMessageAt: Date
  messageCount: number
  toolsUsed: string[]
  latestResultFileId?: string
  latestResultFileName?: string
  latestResultMimeType?: string
  archived?: boolean
  pinned?: boolean
  folderId?: string
}

/** Payload for adding a message (API or hook). Use 'corner' for assistant messages. */
export interface AddMessagePayload {
  role: 'user' | 'corner' | 'assistant' | 'system'
  content: string
  attachments?: Array<{ fileId: string; fileName: string; mimeType: string; sizeBytes: number }>
  toolCall?: {
    toolName: string
    resultFileId?: string
    resultFileName?: string
    resultMimeType?: string
    resultSizeBytes?: number
  }
}

/** Loaded conversation: messages as ChatMessage[] and latest result doc for view. */
export interface LoadedConversation {
  messages: ChatMessage[]
  latestResult: ToolResult | null
}
