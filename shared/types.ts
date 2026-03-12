// Monorepo-level shared types used by both backend and frontend.
// Backend: import via @corner/shared (tsconfig paths + tsconfig-paths/register)
// Frontend: import via @corner/shared (vite resolve alias)

export type ToolName =
  // PDF ↔ Office
  | 'pdf_to_word'
  | 'pdf_to_excel'
  | 'pdf_to_pptx'
  | 'pdf_to_jpg'
  | 'pdf_to_png'
  | 'word_to_pdf'
  | 'excel_to_pdf'
  | 'pptx_to_pdf'
  | 'jpg_to_pdf'
  | 'png_to_pdf'
  // PDF utilities
  | 'merge_pdf'
  | 'split_pdf'
  | 'compress_pdf'
  | 'rotate_pdf'
  | 'add_page_numbers'
  | 'password_protect_pdf'
  | 'remove_pdf_password'
  | 'add_watermark_pdf'
  | 'repair_pdf'
  | 'ocr'
  | 'html_to_pdf'
  | 'url_to_pdf'
  | 'fill_pdf_form'
  | 'esign'
  // Image tools
  | 'remove_background'
  | 'resize_image'
  | 'crop_image'
  | 'flip_rotate_image'
  | 'add_border_image'
  | 'watermark_image'
  | 'image_to_pdf'
  | 'compress_image'
  | 'convert_image'
  // Image format conversions
  | 'jpg_to_png'
  | 'png_to_jpg'
  | 'webp_to_jpg'
  | 'jpg_to_webp'
  // Office utilities
  | 'add_page_numbers_word'
  | 'track_changes_word'
  | 'csv_to_excel'
  | 'excel_to_csv'
  // Misc
  | 'generate_qr'
  | 'extract_text'
  | 'extract_images'
  | 'extract_tables'
  // Document intelligence (study + citation)
  | 'summarize_document'
  | 'generate_study_questions'
  | 'extract_key_terms'
  | 'generate_citation'
  // Audio
  | 'transcribe_audio'
  | 'extract_audio'
  | 'remove_silence'
  | 'convert_audio'
  | 'audio_to_pdf';

export interface ParsedIntent {
  tool: ToolName | null;
  params: Record<string, unknown>;
  mode: 'silent' | 'interactive';
  confidence: number;
  clarification: string | null;
  intent: string;
  steps: Array<{ tool: string; params: Record<string, unknown>; description: string }>;
  /** File format badge resolved from the filename extension — injected by the backend, not Claude. */
  fileExtension?: string;
}

/** Study tools that return inline text + optional export (no doc switch) */
export type StudyToolName = 'summarize_document' | 'generate_study_questions' | 'extract_key_terms';

/** Client-facing result after tool execution */
export interface ToolResult {
  fileId: string;
  downloadUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl?: string;
  /** For study tools: full text to show inline in chat */
  textContent?: string;
  /** For study tools: which tool produced this result */
  studyTool?: StudyToolName;
  transcriptionResult?: {
    transcript: string;
    duration: number;
    language: string;
    wordCount: number;
    speakerCount?: number;
    segmentCount: number;
    durationLabel: string;
  };
  formattedTranscript?: string;
  durationLabel?: string;
}

export interface SignatureField {
  id?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  required?: boolean;
  placed?: boolean;
}

export type ExecutionMode = 'silent' | 'interactive';

export type PlanTier = 'free' | 'pro';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  plan: PlanTier;
  emailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Orchestration Types ────────────────────────────────────────────────────

export interface ChefStep {
  toolName: string;
  params: Record<string, unknown>;
  description: string;
  reasoning: string;
  requiresPreviousOutput: boolean;
}

export interface ChefPlan {
  understanding: string;
  clarification: string | null;
  confidence: number;
  steps: ChefStep[];
}

export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  index: number;
}

export interface StepResult {
  stepIndex: number;
  toolName: string;
  success: boolean;
  result?: ToolResult;
  error?: string;
}

export interface OrchestrateResult {
  sessionId: string;
  plan: ChefPlan;
  steps: StepResult[];
  finalResult: ToolResult | null;
  message: string;
}

export type OrchestrateEventType =
  | 'planning'
  | 'plan_ready'
  | 'clarification'
  | 'step_start'
  | 'step_complete'
  | 'step_error'
  | 'done'
  | 'error'
  | 'thinking_chunk';

export interface OrchestrateEvent {
  type: OrchestrateEventType;
  sessionId?: string;
  message?: string;
  plan?: ChefPlan;
  stepIndex?: number;
  tool?: string;
  description?: string;
  result?: ToolResult;
  error?: string;
  question?: string;
  finalResult?: ToolResult | null;
  allSteps?: StepResult[];
  /** For thinking_chunk events: the streamed text fragment */
  chunk?: string;
}
