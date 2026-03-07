import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  PenLine,
  QrCode,
  Lock,
  Wrench,
  Eye,
  MoreHorizontal,
  FileOutput,
  Presentation,
  Table,
  PackageOpen,
  Combine,
  Scissors,
  RotateCw,
  Crop,
  ScanText,
  Hash,
  EyeOff,
  PackageMinus,
  RefreshCw,
  Maximize2,
  Eraser,
  FlipHorizontal,
  Square,
  ZoomIn,
  FilePlus,
  Stamp,
  ClipboardList,
  MessageSquare,
  Minus,
  Sparkles,
  BarChart2,
  Receipt,
  Award,
  Unlock,
  Droplets,
  Layout,
  FileEdit,
  AlignLeft,
  Send,
  LayoutGrid,
  Users,
  Tablet,
  BookTemplate,
  ShieldCheck,
  ClipboardEdit,
  XCircle,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { ToolResult } from '../../types';
import type { ToolName } from '../../types';

// ---------------------------------------------------------------------------
// RightPanelSettings — exported, covers all tool settings
// ---------------------------------------------------------------------------

export interface RightPanelSettings {
  // PDF
  pageRange?: string;
  preserveFormatting?: boolean;
  extractImages?: boolean;
  extractTablesOnly?: boolean;
  pdfQuality?: 'screen' | 'ebook' | 'printer' | 'prepress';
  // PDF → Word
  pdfToWordOutputFormat?: 'docx' | 'doc';
  pdfToWordPreserveHeadersFooters?: boolean;
  pdfToWordPreserveTables?: boolean;
  pdfToWordPreserveLists?: boolean;
  pdfToWordPageLayout?: 'original' | 'flow';
  pdfToWordFlattenFormFields?: boolean;
  pdfToWordImageQuality?: number;
  // PDF → PowerPoint
  pdfToPptSlidesPerPage?: 'one' | 'auto';
  pdfToPptSlideSize?: '16:9' | '4:3' | 'standard';
  pdfToPptIncludeNotes?: boolean;
  pdfToPptImageQuality?: number;
  // PDF → Excel
  pdfToExcelTableDetection?: 'auto' | 'lines' | 'whitespace';
  pdfToExcelOneTablePerSheet?: boolean;
  pdfToExcelPreserveCellFormatting?: boolean;
  pdfToExcelOutputFormat?: 'xlsx' | 'xls';
  pdfToWordIncludeComments?: boolean;
  pdfToWordRecognizeTextForScanned?: boolean;
  pdfToWordOpenAfterExport?: boolean;
  pdfToPptIncludeComments?: boolean;
  pdfToPptSlideTransition?: 'none' | 'fade' | 'slide';
  pdfToExcelIncludeNonTableText?: boolean;
  pdfToExcelSheetNaming?: 'by_page' | 'by_content' | 'custom';
  // Compress PDF
  compressImageDpi?: 72 | 96 | 144 | 200;
  compressJpegQuality?: number;
  optimizeForWeb?: boolean;
  preserveBookmarks?: boolean;
  // Merge PDFs
  mergeOrder?: 'manual' | 'alphabetical' | 'date';
  mergePreserveBookmarks?: boolean;
  mergeAddSeparatorPages?: boolean;
  mergeAddTableOfContents?: boolean;
  removeMetadata?: boolean;
  removeEmbeddedFonts?: boolean;
  outputNamingPattern?: string;
  splitMode?: 'every' | 'range' | 'size';
  splitEveryN?: number;
  splitMaxSizeMb?: number;
  splitOutputNaming?: string;
  extractToFolder?: boolean;
  rotateDirection?: 'clockwise' | 'counter';
  rotateApplyTo?: 'all' | 'range';
  rotateAngle?: 90 | 180 | 270;
  rotateByOrientation?: boolean;
  cropMarginTop?: number;
  cropMarginRight?: number;
  cropMarginBottom?: number;
  cropMarginLeft?: number;
  cropPdfUnits?: 'pt' | 'mm' | 'in';
  cropApplyTo?: 'all' | 'range';
  cropPageRange?: string;
  cropMarks?: boolean;
  repairAttemptRecovery?: boolean;
  repairOutputNaming?: string;
  ocrLanguages?: string[];
  ocrOutputFormat?: 'text' | 'markdown' | 'json';
  ocrOutputType?: 'pdf' | 'pdfa';
  ocrImageDpi?: number;
  ocrDeskew?: boolean;
  ocrForceFullPage?: boolean;
  ocrSkipExistingText?: boolean;
  preserveLayout?: boolean;
  pageNumberPosition?: string;
  pageNumberStart?: number;
  pageNumberFontSize?: number;
  pageNumberFormat?: '1' | 'i' | 'I' | 'a' | 'A' | '1_of';
  pageNumberPrefix?: string;
  pageNumberSuffix?: string;
  pageNumberRange?: string;
  redactSearchTerms?: string;
  redactStyle?: 'blackout' | 'whiteout';
  redactIncludeComments?: boolean;
  redactIncludeMetadata?: boolean;
  redactCaseSensitive?: boolean;
  redactUseRegex?: boolean;
  // Images
  imageQuality?: number;
  stripMetadata?: boolean;
  progressiveJpeg?: boolean;
  outputFormat?: 'jpg' | 'png' | 'webp' | 'avif';
  preserveTransparency?: boolean;
  resizeUnit?: 'px' | '%';
  resizeWidth?: number;
  resizeHeight?: number;
  maintainAspectRatio?: boolean;
  allowUpscale?: boolean;
  resizeMode?: 'fit' | 'fill' | 'exact';
  bgReplacementColor?: string;
  flipRotateAction?: 'flip_h' | 'flip_v' | 'rotate_90' | 'rotate_180';
  borderWidth?: number;
  borderColor?: string;
  upscaleScale?: '2x' | '4x';
  upscaleModel?: 'fast' | 'quality';
  imageToPdfPageSize?: 'a4' | 'letter' | 'legal';
  imageToPdfOrientation?: 'portrait' | 'landscape';
  imageToPdfFitMode?: 'fit' | 'fill' | 'actual';
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR';
  watermarkRotation?: number;
  watermarkFontSize?: number;
  watermarkColor?: string;
  watermarkTile?: boolean;
  // Sign & Fill
  placementMode?: 'auto' | 'manual';
  signatureScale?: number;
  addDateStamp?: boolean;
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  addTypedName?: boolean;
  addInitialsField?: boolean;
  // Request Signatures
  signers?: { name: string; email: string }[];
  signingOrder?: 'sequential' | 'parallel';
  requestDeadline?: boolean;
  requestDeadlineDays?: number;
  autoRemind?: boolean;
  reminderFrequency?: 'daily' | 'every_2_days' | 'every_3_days';
  messageToSigners?: string;
  requireEmailVerification?: boolean;
  requireSmsVerification?: boolean;
  requireAccessCode?: boolean;
  requestAccessCode?: string;
  // Place Fields
  placeFieldsFieldType?: string;
  autoDetectFields?: boolean;
  assignFieldsToSigner?: string;
  // Bulk Send
  bulkSendManualEntry?: boolean;
  bulkSendManualRecipients?: string;
  bulkSendPersonalization?: boolean;
  bulkSendShowPreview?: boolean;
  // In-Person Signing
  inPersonSignerName?: string;
  lockScreenAfterSigning?: boolean;
  collectIdPhoto?: boolean;
  // Templates
  templateName?: string;
  templateDescription?: string;
  // Identity Verification
  verificationMethods?: string[];
  verificationAccessCode?: string;
  verificationLevel?: 'standard' | 'enhanced' | 'maximum';
  // Audit Trail
  auditIncludeIp?: boolean;
  auditIncludeDeviceInfo?: boolean;
  auditIncludeGeolocation?: boolean;
  auditIncludeDocumentHash?: boolean;
  auditEmbedInFinalPdf?: boolean;
  // Certificate of Completion
  certificateIncludeSignerDetails?: boolean;
  certificateIncludeTimestamps?: boolean;
  certificateIncludeFingerprint?: boolean;
  certificateStyle?: 'minimal' | 'formal' | 'detailed';
  // Stamp Document (extended)
  stampRotation?: number;
  stampOutlineOnly?: boolean;
  stampPositionGrid?: string;
  // Fill PDF Form
  fillPdfAutoFillWithAi?: boolean;
  fillPdfAutoFillInstructions?: string;
  fillPdfFlattenAfter?: boolean;
  // Decline & Void
  declineVoidReason?: string;
  declineVoidNotifyParties?: boolean;
  // Legacy
  signatureLineLabel?: string;
  signatureLinePosition?: 'top' | 'middle' | 'bottom';
  stampText?: string;
  stampColor?: string;
  stampOpacity?: number;
  stampPosition?: string;
  // Generate
  qrContentType?: string;
  qrSize?: number;
  qrForeground?: string;
  qrBackground?: string;
  qrRoundedCorners?: boolean;
  qrErrorCorrection?: 'L' | 'M' | 'Q' | 'H';
  qrOutputFormat?: 'png' | 'svg';
  barcodeType?: string;
  barcodeContent?: string;
  barcodeWidth?: number;
  barcodeHeight?: number;
  // Security
  openPassword?: string;
  permissionsPassword?: string;
  restrictPrinting?: boolean;
  restrictEditing?: boolean;
  restrictCopying?: boolean;
  currentPassword?: string;
  // More / global
  watermarkEnabled?: boolean;
  autoDownload?: boolean;
  stripMetadataDefault?: boolean;
  defaultPdfFormat?: 'pdf' | 'docx' | 'pptx';
  defaultImageFormat?: 'original' | 'jpg' | 'png' | 'webp';
  // Export (Figma-style)
  exportFormat?: 'pdf' | 'png' | 'jpg' | 'svg';
  exportScale?: number;
  exportPagesMode?: 'all' | 'current' | 'range';
  exportPagesRange?: string;
  // Preview
  zoom?: number;
  fitToWidth?: boolean;
  showGrid?: boolean;
  previewBackground?: 'paper' | 'white' | 'gray' | 'dark';
  previewMode?: 'page' | 'text' | 'frames';
  // Document (Word/Docs-style)
  pageSize?: 'a4' | 'letter' | 'legal' | 'tabloid';
  pageOrientation?: 'portrait' | 'landscape';
  pageMarginTop?: number;
  pageMarginBottom?: number;
  pageMarginLeft?: number;
  pageMarginRight?: number;
  pageMarginUnits?: 'mm' | 'in' | 'pt';
  documentTitle?: string;
  documentAuthor?: string;
  documentSubject?: string;
  documentKeywords?: string;
  documentLanguage?: string;
  headerText?: string;
  footerText?: string;
  headerFooterDifferentFirstPage?: boolean;
  pageNumberInHeader?: boolean;
  pageNumberInFooter?: boolean;
  defaultFontFamily?: string;
  defaultFontSize?: number;
  lineSpacing?: 'single' | '1.5' | 'double' | 'custom';
  lineSpacingCustom?: number;
  paragraphAlignment?: 'left' | 'center' | 'right' | 'justify';
  hyphenation?: boolean;
  numberOfColumns?: 1 | 2 | 3;
  rulerUnits?: 'in' | 'cm' | 'pt';
  fitToPage?: boolean;
  printScale?: number;
  printRange?: 'all' | 'current' | 'range';
  includeAnnotations?: boolean;
  taggedPdf?: boolean;
  pageColor?: string;
  embedFonts?: boolean;
  pageApplyTo?: 'whole_doc' | 'section';
  marginGutter?: number;
  mirrorMargins?: boolean;
  firstPageDifferent?: boolean;
  documentCreator?: string;
  documentProducer?: string;
  documentCreationDate?: string;
  documentModDate?: string;
  customProperties?: string;
  headerDistance?: number;
  footerDistance?: number;
  differentOddEven?: boolean;
  linkToPrevious?: boolean;
  fontSizeBody?: number;
  fontSizeHeading?: number;
  paragraphSpacingBefore?: number;
  paragraphSpacingAfter?: number;
  widowOrphanControl?: boolean;
  duplex?: 'none' | 'long' | 'short';
  collate?: boolean;
  printRangeCustom?: string;
  pdfACompliance?: boolean;
  isoCompliance?: boolean;
  // Images extended
  compressTargetSizeKb?: number;
  compressMaxDimension?: number;
  compressDpi?: number;
  colorProfile?: 'srgb' | 'adobe_rgb';
  bitDepth?: 8 | 16;
  embedIcc?: boolean;
  backgroundColorForOpaque?: string;
  resizePreset?: string;
  resizeByLongestEdge?: number;
  resizeDpi?: number;
  bgRemovalTolerance?: number;
  bgRemovalFeather?: number;
  bgRemovalKeepShadow?: boolean;
  cropAspectRatio?: string;
  cropWidth?: number;
  cropHeight?: number;
  cropPosition?: string;
  cropUnits?: 'px' | '%' | 'in';
  flipRotateAngle?: number;
  rotateExpandCanvas?: boolean;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderPosition?: 'inner' | 'outer';
  borderRadius?: number;
  upscaleDenoise?: boolean;
  upscaleFaceEnhance?: boolean;
  upscaleOutputFormat?: 'png' | 'jpg';
  imageToPdfMargin?: number;
  imagesPerPage?: '1' | '2x2' | '3x3';
  imageToPdfDpi?: number;
  imageToPdfCompress?: boolean;
  watermarkFontFamily?: string;
  watermarkImageUrl?: string;
  watermarkScale?: number;
  // Sign & Fill small additions
  allowSignerDecline?: boolean;
  redirectUrlAfterSigning?: string;
  csvNameColumn?: string;
  csvEmailColumn?: string;
  bulkSendTestMode?: boolean;
  requireWitness?: boolean;
  // Generate extended
  qrMargin?: number;
  qrEncoding?: 'auto' | 'numeric' | 'alphanumeric' | 'byte';
  qrLogoUrl?: string;
  qrVersion?: number;
  barcodeShowText?: boolean;
  barcodeFormat?: 'png' | 'svg';
  barcodeChecksum?: boolean;
  invoiceTemplate?: 'simple' | 'detailed';
  invoiceCurrency?: string;
  invoiceTaxRate?: number;
  invoiceLogo?: string;
  invoiceItemsSource?: 'manual' | 'csv';
  certificatePdfTemplate?: 'minimal' | 'formal';
  certificatePdfPlaceholders?: string;
  certificatePdfLogo?: string;
  certificatePdfBorder?: string;
  // Security extended
  encryptionLevel?: 128 | 256;
  allowAccessibility?: boolean;
  allowFormFill?: boolean;
  passwordExpiry?: string;
  removeAllSecurity?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  isOpen: boolean;
  result: ToolResult | null;
  lastTool: ToolName | null;
  onToggle: () => void;
  onToolSelect: (tool: ToolName, settings?: Record<string, unknown>) => void;
  onOpenOnboarding: () => void;
  onSaveTemplate?: () => void;
  onZoomChange?: (zoom: number) => void;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  settings: RightPanelSettings;
  onSettingsChange: (patch: Partial<RightPanelSettings>) => void;
}

const fontFamily = "'Geist', sans-serif";

// ---------------------------------------------------------------------------
// Primitives (compact, for inline settings)
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 10,
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: 4,
        fontFamily,
      }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />;
}

function Toggle({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
        cursor: 'pointer',
        fontFamily,
      }}
    >
      <div>
        <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{label}</span>
        {sublabel && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{sublabel}</div>}
      </div>
      <div
        style={{
          width: 28,
          height: 16,
          borderRadius: 9999,
          background: value ? 'var(--accent)' : 'var(--border)',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 150ms ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 1,
            left: value ? 13 : 1,
            width: 14,
            height: 14,
            borderRadius: 9999,
            background: 'var(--white)',
            transition: 'left 150ms ease',
          }}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v: number) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--accent)' }}>{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: 'var(--accent)', width: '100%', cursor: 'pointer', height: 4 }}
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 11,
          color: 'var(--text-primary)',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontFamily,
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'password';
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 11,
          color: 'var(--text-primary)',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontFamily,
        }}
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  placeholder,
  onChange,
}: {
  label: string;
  value: number | undefined;
  min?: number;
  max?: number;
  placeholder?: string;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</span>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? undefined : Number(v));
        }}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 11,
          color: 'var(--text-primary)',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontFamily,
        }}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  onChange,
  rows = 3,
}: {
  label?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      {label && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</span>}
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 11,
          color: 'var(--text-primary)',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontFamily,
          resize: 'vertical',
        }}
      />
    </div>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</span>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '4px 6px',
              fontSize: 11,
              fontFamily,
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: value === o.value ? 'var(--accent)' : 'var(--white)',
              color: value === o.value ? 'var(--canvas)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 28,
            height: 28,
            padding: 2,
            border: '1px solid var(--border)',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{value}</span>
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (key: string) => {
    if (value.includes(key)) onChange(value.filter((k) => k !== key));
    else onChange([...value, key]);
  };
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontFamily,
              border: '1px solid var(--border)',
              borderRadius: 9999,
              background: value.includes(o.value) ? 'var(--accent)' : 'var(--white)',
              color: value.includes(o.value) ? 'var(--white)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const POSITIONS: { value: RightPanelSettings['watermarkPosition']; label: string }[] = [
  { value: 'TL', label: 'TL' },
  { value: 'TC', label: 'TC' },
  { value: 'TR', label: 'TR' },
  { value: 'ML', label: 'ML' },
  { value: 'MC', label: 'MC' },
  { value: 'MR', label: 'MR' },
  { value: 'BL', label: 'BL' },
  { value: 'BC', label: 'BC' },
  { value: 'BR', label: 'BR' },
];

function PositionGrid({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: NonNullable<RightPanelSettings['watermarkPosition']>) => void;
}) {
  return (
    <div style={{ marginBottom: 6, fontFamily }}>
      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 96 }}>
        {POSITIONS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            style={{
              width: 24,
              height: 24,
              padding: 0,
              fontSize: 8,
              fontFamily,
              border: '1px solid var(--border)',
              borderRadius: 4,
              background: value === p.value ? 'var(--accent)' : 'var(--white)',
              color: value === p.value ? 'var(--white)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool row + expandable settings
// ---------------------------------------------------------------------------

type ToolDef = {
  id: ToolName;
  label: string;
  icon: LucideIcon;
  hasSettings: boolean;
  renderSettings?: (props: {
    settings: RightPanelSettings;
    onSettingsChange: (p: Partial<RightPanelSettings>) => void;
    onOpenOnboarding?: () => void;
    onSaveTemplate?: () => void;
  }) => React.ReactNode;
};

function ToolRow({
  tool,
  expanded,
  onToggleExpand,
  onToolSelect,
  settings,
  onSettingsChange,
  onOpenOnboarding,
  onSaveTemplate,
}: {
  tool: ToolDef;
  expanded: boolean;
  onToggleExpand: () => void;
  onToolSelect: (tool: ToolName, settings?: Record<string, unknown>) => void;
  settings: RightPanelSettings;
  onSettingsChange: (p: Partial<RightPanelSettings>) => void;
  onOpenOnboarding?: () => void;
  onSaveTemplate?: () => void;
}) {
  const Icon = tool.icon;
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        style={{
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          gap: 8,
          cursor: 'pointer',
          background: 'transparent',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}
          onClick={() => onToolSelect(tool.id)}
        >
          <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-primary)', marginLeft: 8, flex: 1 }}>{tool.label}</span>
        </div>
        {tool.hasSettings && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronDown
              size={12}
              strokeWidth={1.5}
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}
            />
          </button>
        )}
      </div>
      {tool.hasSettings && expanded && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.02)',
            borderTop: '1px solid var(--border)',
          }}
        >
          {tool.renderSettings?.({ settings, onSettingsChange, onOpenOnboarding, onSaveTemplate })}
          <button
            type="button"
            onClick={() => onToolSelect(tool.id, settings as Record<string, unknown>)}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '6px 0',
              fontSize: 12,
              fontFamily,
              fontWeight: 500,
              color: 'var(--white)',
              background: 'var(--text-primary)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
          >
            Run {tool.label}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category section (collapsible, sticky header)
// ---------------------------------------------------------------------------

function CategorySection({
  id,
  label,
  icon: Icon,
  defaultOpen,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: 'var(--white)',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          fontFamily,
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--white)')}
      >
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 150ms ease' }}
        />
        <Icon size={14} strokeWidth={1.5} />
        {label}
      </button>
      {open && children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool definitions and their inline settings renderers
// ---------------------------------------------------------------------------

const OCR_LANGS = [
  { value: 'eng', label: 'English' },
  { value: 'spa', label: 'Spanish' },
  { value: 'fra', label: 'French' },
  { value: 'deu', label: 'German' },
  { value: 'por', label: 'Portuguese' },
  { value: 'chi_sim', label: 'Chinese' },
  { value: 'ara', label: 'Arabic' },
  { value: 'hin', label: 'Hindi' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'kor', label: 'Korean' },
];

function buildToolsList(onOpenOnboarding?: () => void): { id: string; label: string; icon: LucideIcon; tools: ToolDef[] }[] {
  return [
    {
      id: 'pdf',
      label: 'PDF',
      icon: FileText,
      tools: [
        {
          id: 'pdf_to_word',
          label: 'PDF → Word',
          icon: FileOutput,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Page range" value={settings.pageRange ?? ''} placeholder="e.g. 1–3, 5" onChange={(v) => onSettingsChange({ pageRange: v })} />
              <SegmentedControl label="Output format" value={settings.pdfToWordOutputFormat ?? 'docx'} onChange={(v) => onSettingsChange({ pdfToWordOutputFormat: v })} options={[{ value: 'docx', label: 'DOCX' }, { value: 'doc', label: 'DOC' }]} />
              <Toggle label="Preserve formatting" value={settings.preserveFormatting ?? false} onChange={(v) => onSettingsChange({ preserveFormatting: v })} />
              <Toggle label="Preserve headers & footers" value={settings.pdfToWordPreserveHeadersFooters ?? true} onChange={(v) => onSettingsChange({ pdfToWordPreserveHeadersFooters: v })} />
              <Toggle label="Preserve tables" sublabel="Keep table structure" value={settings.pdfToWordPreserveTables ?? true} onChange={(v) => onSettingsChange({ pdfToWordPreserveTables: v })} />
              <Toggle label="Preserve lists" sublabel="Bullets and numbering" value={settings.pdfToWordPreserveLists ?? true} onChange={(v) => onSettingsChange({ pdfToWordPreserveLists: v })} />
              <SegmentedControl label="Page layout" value={settings.pdfToWordPageLayout ?? 'original'} onChange={(v) => onSettingsChange({ pdfToWordPageLayout: v })} options={[{ value: 'original', label: 'Keep original' }, { value: 'flow', label: 'Flow text' }]} />
              <Toggle label="Extract images" value={settings.extractImages ?? false} onChange={(v) => onSettingsChange({ extractImages: v })} />
              {settings.extractImages && <Slider label="Image quality" value={settings.pdfToWordImageQuality ?? 85} min={50} max={100} onChange={(v) => onSettingsChange({ pdfToWordImageQuality: v })} formatValue={(v) => v + '%'} />}
              <Toggle label="Flatten form fields" sublabel="Convert form fields to static text" value={settings.pdfToWordFlattenFormFields ?? false} onChange={(v) => onSettingsChange({ pdfToWordFlattenFormFields: v })} />
              <Toggle label="Include comments" value={settings.pdfToWordIncludeComments ?? false} onChange={(v) => onSettingsChange({ pdfToWordIncludeComments: v })} />
              <Toggle label="Recognize text (scanned)" sublabel="OCR before conversion" value={settings.pdfToWordRecognizeTextForScanned ?? false} onChange={(v) => onSettingsChange({ pdfToWordRecognizeTextForScanned: v })} />
              <Toggle label="Open after export" value={settings.pdfToWordOpenAfterExport ?? false} onChange={(v) => onSettingsChange({ pdfToWordOpenAfterExport: v })} />
            </>
          ),
        },
        {
          id: 'pdf_to_powerpoint',
          label: 'PDF → PowerPoint',
          icon: Presentation,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Page range" value={settings.pageRange ?? ''} placeholder="e.g. 1–3, 5" onChange={(v) => onSettingsChange({ pageRange: v })} />
              <SegmentedControl label="Slides per page" value={settings.pdfToPptSlidesPerPage ?? 'one'} onChange={(v) => onSettingsChange({ pdfToPptSlidesPerPage: v })} options={[{ value: 'one', label: 'One per page' }, { value: 'auto', label: 'Auto-detect' }]} />
              <SegmentedControl label="Slide size" value={settings.pdfToPptSlideSize ?? '16:9'} onChange={(v) => onSettingsChange({ pdfToPptSlideSize: v })} options={[{ value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: 'standard', label: 'Standard' }]} />
              <Toggle label="Include speaker notes" sublabel="From PDF annotations" value={settings.pdfToPptIncludeNotes ?? false} onChange={(v) => onSettingsChange({ pdfToPptIncludeNotes: v })} />
              <Slider label="Image quality" value={settings.pdfToPptImageQuality ?? 85} min={50} max={100} onChange={(v) => onSettingsChange({ pdfToPptImageQuality: v })} formatValue={(v) => v + '%'} />
              <Toggle label="Include comments" value={settings.pdfToPptIncludeComments ?? false} onChange={(v) => onSettingsChange({ pdfToPptIncludeComments: v })} />
              <Select label="Slide transition" value={settings.pdfToPptSlideTransition ?? 'none'} onChange={(v) => onSettingsChange({ pdfToPptSlideTransition: v as RightPanelSettings['pdfToPptSlideTransition'] })} options={[{ value: 'none', label: 'None' }, { value: 'fade', label: 'Fade' }, { value: 'slide', label: 'Slide' }]} />
            </>
          ),
        },
        {
          id: 'pdf_to_excel',
          label: 'PDF → Excel',
          icon: Table,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Page range" value={settings.pageRange ?? ''} placeholder="e.g. 1–3" onChange={(v) => onSettingsChange({ pageRange: v })} />
              <Toggle label="Extract tables only" value={settings.extractTablesOnly ?? false} onChange={(v) => onSettingsChange({ extractTablesOnly: v })} />
              {settings.extractTablesOnly && (
                <>
                  <SegmentedControl label="Table detection" value={settings.pdfToExcelTableDetection ?? 'auto'} onChange={(v) => onSettingsChange({ pdfToExcelTableDetection: v })} options={[{ value: 'auto', label: 'Auto' }, { value: 'lines', label: 'By lines' }, { value: 'whitespace', label: 'By spacing' }]} />
                  <Toggle label="One table per sheet" value={settings.pdfToExcelOneTablePerSheet ?? true} onChange={(v) => onSettingsChange({ pdfToExcelOneTablePerSheet: v })} />
                  <Toggle label="Preserve cell formatting" value={settings.pdfToExcelPreserveCellFormatting ?? true} onChange={(v) => onSettingsChange({ pdfToExcelPreserveCellFormatting: v })} />
                </>
              )}
              <SegmentedControl label="Output format" value={settings.pdfToExcelOutputFormat ?? 'xlsx'} onChange={(v) => onSettingsChange({ pdfToExcelOutputFormat: v })} options={[{ value: 'xlsx', label: 'XLSX' }, { value: 'xls', label: 'XLS' }]} />
              <Toggle label="Include text outside tables" value={settings.pdfToExcelIncludeNonTableText ?? false} onChange={(v) => onSettingsChange({ pdfToExcelIncludeNonTableText: v })} />
              <Select label="Sheet naming" value={settings.pdfToExcelSheetNaming ?? 'by_page'} onChange={(v) => onSettingsChange({ pdfToExcelSheetNaming: v as RightPanelSettings['pdfToExcelSheetNaming'] })} options={[{ value: 'by_page', label: 'By page' }, { value: 'by_content', label: 'By content' }, { value: 'custom', label: 'Custom' }]} />
            </>
          ),
        },
        {
          id: 'compress_pdf',
          label: 'Compress PDF',
          icon: PackageOpen,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <SegmentedControl
                label="Quality"
                value={settings.pdfQuality ?? 'ebook'}
                onChange={(v) => onSettingsChange({ pdfQuality: v })}
                options={[
                  { value: 'screen', label: 'Low' },
                  { value: 'ebook', label: 'Med' },
                  { value: 'printer', label: 'High' },
                  { value: 'prepress', label: 'Max' },
                ]}
              />
              <Select label="Image downscale DPI" value={String(settings.compressImageDpi ?? 144)} onChange={(v) => onSettingsChange({ compressImageDpi: Number(v) as 72 | 96 | 144 | 200 })} options={[{ value: '72', label: '72' }, { value: '96', label: '96' }, { value: '144', label: '144' }, { value: '200', label: '200' }]} />
              <Slider label="JPEG quality" value={settings.compressJpegQuality ?? 60} min={1} max={100} onChange={(v) => onSettingsChange({ compressJpegQuality: v })} formatValue={(v) => v + '%'} />
              <Toggle label="Optimize for web" value={settings.optimizeForWeb ?? false} onChange={(v) => onSettingsChange({ optimizeForWeb: v })} />
              <Toggle label="Preserve bookmarks" value={settings.preserveBookmarks ?? true} onChange={(v) => onSettingsChange({ preserveBookmarks: v })} />
              <Toggle label="Remove metadata" value={settings.removeMetadata ?? false} onChange={(v) => onSettingsChange({ removeMetadata: v })} />
              <Toggle label="Remove embedded fonts" value={settings.removeEmbeddedFonts ?? false} onChange={(v) => onSettingsChange({ removeEmbeddedFonts: v })} />
            </>
          ),
        },
        {
          id: 'merge_pdf',
          label: 'Merge PDFs',
          icon: Combine,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Output naming" value={settings.outputNamingPattern ?? ''} placeholder="e.g. merged" onChange={(v) => onSettingsChange({ outputNamingPattern: v })} />
              <SegmentedControl label="File order" value={settings.mergeOrder ?? 'manual'} onChange={(v) => onSettingsChange({ mergeOrder: v })} options={[{ value: 'manual', label: 'Manual' }, { value: 'alphabetical', label: 'A–Z' }, { value: 'date', label: 'Date' }]} />
              <Toggle label="Preserve bookmarks" value={settings.mergePreserveBookmarks ?? true} onChange={(v) => onSettingsChange({ mergePreserveBookmarks: v })} />
              <Toggle label="Add separator pages" value={settings.mergeAddSeparatorPages ?? false} onChange={(v) => onSettingsChange({ mergeAddSeparatorPages: v })} />
              <Toggle label="Add table of contents" value={settings.mergeAddTableOfContents ?? false} onChange={(v) => onSettingsChange({ mergeAddTableOfContents: v })} />
            </>
          ),
        },
        {
          id: 'split_pdf',
          label: 'Split PDF',
          icon: Scissors,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <SegmentedControl
                label="Split by"
                value={settings.splitMode ?? 'every'}
                onChange={(v) => onSettingsChange({ splitMode: v })}
                options={[
                  { value: 'every', label: 'Every page' },
                  { value: 'range', label: 'By range' },
                  { value: 'size', label: 'By size' },
                ]}
              />
              {settings.splitMode === 'every' && (
                <NumberInput label="Every N pages" value={settings.splitEveryN ?? 1} onChange={(v) => onSettingsChange({ splitEveryN: v })} />
              )}
              {settings.splitMode === 'range' && (
                <TextInput label="Page range" value={settings.pageRange ?? ''} placeholder="e.g. 1–3, 5" onChange={(v) => onSettingsChange({ pageRange: v })} />
              )}
              {settings.splitMode === 'size' && (
                <NumberInput label="Max size (MB)" value={settings.splitMaxSizeMb} onChange={(v) => onSettingsChange({ splitMaxSizeMb: v })} />
              )}
              <TextInput label="Output naming" value={settings.splitOutputNaming ?? ''} placeholder="e.g. part" onChange={(v) => onSettingsChange({ splitOutputNaming: v })} />
              <Toggle label="Extract to folder" sublabel="One folder per split" value={settings.extractToFolder ?? false} onChange={(v) => onSettingsChange({ extractToFolder: v })} />
            </>
          ),
        },
        {
          id: 'rotate_pdf',
          label: 'Rotate PDF',
          icon: RotateCw,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select label="Angle" value={String(settings.rotateAngle ?? 90)} onChange={(v) => onSettingsChange({ rotateAngle: Number(v) as 90 | 180 | 270 })} options={[{ value: '90', label: '90°' }, { value: '180', label: '180°' }, { value: '270', label: '270°' }]} />
              <SegmentedControl
                label="Direction"
                value={settings.rotateDirection ?? 'clockwise'}
                onChange={(v) => onSettingsChange({ rotateDirection: v })}
                options={[{ value: 'clockwise', label: 'Clockwise' }, { value: 'counter', label: 'Counter' }]}
              />
              <SegmentedControl
                label="Apply to"
                value={settings.rotateApplyTo ?? 'all'}
                onChange={(v) => onSettingsChange({ rotateApplyTo: v })}
                options={[{ value: 'all', label: 'All pages' }, { value: 'range', label: 'Page range' }]}
              />
              {settings.rotateApplyTo === 'range' && (
                <TextInput label="Page range" value={settings.pageRange ?? ''} placeholder="e.g. 1–3" onChange={(v) => onSettingsChange({ pageRange: v })} />
              )}
              <Toggle label="Rotate by orientation" sublabel="Auto by page orientation" value={settings.rotateByOrientation ?? false} onChange={(v) => onSettingsChange({ rotateByOrientation: v })} />
            </>
          ),
        },
        {
          id: 'crop_pdf',
          label: 'Crop PDF',
          icon: Crop,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select label="Units" value={settings.cropPdfUnits ?? 'pt'} onChange={(v) => onSettingsChange({ cropPdfUnits: v as RightPanelSettings['cropPdfUnits'] })} options={[{ value: 'pt', label: 'Points' }, { value: 'mm', label: 'mm' }, { value: 'in', label: 'in' }]} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <NumberInput label="Top" value={settings.cropMarginTop} onChange={(v) => onSettingsChange({ cropMarginTop: v })} />
                <NumberInput label="Right" value={settings.cropMarginRight} onChange={(v) => onSettingsChange({ cropMarginRight: v })} />
                <NumberInput label="Bottom" value={settings.cropMarginBottom} onChange={(v) => onSettingsChange({ cropMarginBottom: v })} />
                <NumberInput label="Left" value={settings.cropMarginLeft} onChange={(v) => onSettingsChange({ cropMarginLeft: v })} />
              </div>
              <SegmentedControl label="Apply to" value={settings.cropApplyTo ?? 'all'} onChange={(v) => onSettingsChange({ cropApplyTo: v })} options={[{ value: 'all', label: 'All pages' }, { value: 'range', label: 'Page range' }]} />
              {settings.cropApplyTo === 'range' && (
                <TextInput label="Page range" value={settings.cropPageRange ?? ''} placeholder="e.g. 1–3" onChange={(v) => onSettingsChange({ cropPageRange: v })} />
              )}
              <Toggle label="Crop marks" value={settings.cropMarks ?? false} onChange={(v) => onSettingsChange({ cropMarks: v })} />
            </>
          ),
        },
        {
          id: 'repair_pdf',
          label: 'Repair PDF',
          icon: Wrench,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Toggle label="Attempt recovery of broken objects" value={settings.repairAttemptRecovery ?? true} onChange={(v) => onSettingsChange({ repairAttemptRecovery: v })} />
              <TextInput label="Output naming" value={settings.repairOutputNaming ?? ''} placeholder="e.g. repaired" onChange={(v) => onSettingsChange({ repairOutputNaming: v })} />
            </>
          ),
        },
        {
          id: 'ocr',
          label: 'OCR PDF',
          icon: ScanText,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <MultiSelect
                label="Language"
                options={OCR_LANGS}
                value={settings.ocrLanguages ?? ['eng']}
                onChange={(v) => onSettingsChange({ ocrLanguages: v })}
              />
              <SegmentedControl
                label="Output format"
                value={settings.ocrOutputFormat ?? 'text'}
                onChange={(v) => onSettingsChange({ ocrOutputFormat: v })}
                options={[{ value: 'text', label: 'Text' }, { value: 'markdown', label: 'Markdown' }, { value: 'json', label: 'JSON' }]}
              />
              <Toggle label="Preserve layout" value={settings.preserveLayout ?? false} onChange={(v) => onSettingsChange({ preserveLayout: v })} />
              <Select label="Output type" value={settings.ocrOutputType ?? 'pdf'} onChange={(v) => onSettingsChange({ ocrOutputType: v as RightPanelSettings['ocrOutputType'] })} options={[{ value: 'pdf', label: 'Searchable PDF' }, { value: 'pdfa', label: 'PDF/A' }]} />
              <NumberInput label="Image DPI" value={settings.ocrImageDpi} onChange={(v) => onSettingsChange({ ocrImageDpi: v })} />
              <Toggle label="Deskew pages" value={settings.ocrDeskew ?? true} onChange={(v) => onSettingsChange({ ocrDeskew: v })} />
              <Toggle label="Force OCR on full page" value={settings.ocrForceFullPage ?? false} onChange={(v) => onSettingsChange({ ocrForceFullPage: v })} />
              <Toggle label="Skip existing text layer" value={settings.ocrSkipExistingText ?? false} onChange={(v) => onSettingsChange({ ocrSkipExistingText: v })} />
            </>
          ),
        },
        {
          id: 'add_page_numbers',
          label: 'Add Page Numbers',
          icon: Hash,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select
                label="Position"
                value={settings.pageNumberPosition ?? 'bottom-center'}
                onChange={(v) => onSettingsChange({ pageNumberPosition: v })}
                options={[
                  { value: 'top-left', label: 'Top left' },
                  { value: 'top-center', label: 'Top center' },
                  { value: 'top-right', label: 'Top right' },
                  { value: 'bottom-left', label: 'Bottom left' },
                  { value: 'bottom-center', label: 'Bottom center' },
                  { value: 'bottom-right', label: 'Bottom right' },
                ]}
              />
              <Select label="Format" value={settings.pageNumberFormat ?? '1'} onChange={(v) => onSettingsChange({ pageNumberFormat: v as RightPanelSettings['pageNumberFormat'] })} options={[{ value: '1', label: '1, 2, 3' }, { value: 'i', label: 'i, ii, iii' }, { value: 'I', label: 'I, II, III' }, { value: 'a', label: 'a, b, c' }, { value: 'A', label: 'A, B, C' }, { value: '1_of', label: '1/10' }]} />
              <TextInput label="Prefix" value={settings.pageNumberPrefix ?? ''} placeholder="e.g. Page " onChange={(v) => onSettingsChange({ pageNumberPrefix: v })} />
              <TextInput label="Suffix" value={settings.pageNumberSuffix ?? ''} placeholder="e.g. of 10" onChange={(v) => onSettingsChange({ pageNumberSuffix: v })} />
              <NumberInput label="Start number" value={settings.pageNumberStart} onChange={(v) => onSettingsChange({ pageNumberStart: v })} />
              <Slider label="Font size" value={settings.pageNumberFontSize ?? 12} min={8} max={24} onChange={(v) => onSettingsChange({ pageNumberFontSize: v })} formatValue={(v) => v + ' px'} />
              <TextInput label="Apply to range" value={settings.pageNumberRange ?? ''} placeholder="e.g. 1–10 or leave blank for all" onChange={(v) => onSettingsChange({ pageNumberRange: v })} />
            </>
          ),
        },
        {
          id: 'redact_pdf',
          label: 'Redact PDF',
          icon: EyeOff,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextArea label="Search terms" value={settings.redactSearchTerms ?? ''} placeholder="One term per line" onChange={(v) => onSettingsChange({ redactSearchTerms: v })} rows={4} />
              <SegmentedControl label="Redact style" value={settings.redactStyle ?? 'blackout'} onChange={(v) => onSettingsChange({ redactStyle: v as RightPanelSettings['redactStyle'] })} options={[{ value: 'blackout', label: 'Blackout' }, { value: 'whiteout', label: 'Whiteout' }]} />
              <Toggle label="Include comments" value={settings.redactIncludeComments ?? true} onChange={(v) => onSettingsChange({ redactIncludeComments: v })} />
              <Toggle label="Include metadata" value={settings.redactIncludeMetadata ?? true} onChange={(v) => onSettingsChange({ redactIncludeMetadata: v })} />
              <Toggle label="Case sensitive" value={settings.redactCaseSensitive ?? false} onChange={(v) => onSettingsChange({ redactCaseSensitive: v })} />
              <Toggle label="Use regex" value={settings.redactUseRegex ?? false} onChange={(v) => onSettingsChange({ redactUseRegex: v })} />
            </>
          ),
        },
      ],
    },
    {
      id: 'document',
      label: 'Document',
      icon: Layout,
      tools: [
        {
          id: 'page_setup',
          label: 'Page setup',
          icon: Layout,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select
                label="Page size"
                value={settings.pageSize ?? 'a4'}
                onChange={(v) => onSettingsChange({ pageSize: v as RightPanelSettings['pageSize'] })}
                options={[
                  { value: 'a4', label: 'A4' },
                  { value: 'letter', label: 'Letter' },
                  { value: 'legal', label: 'Legal' },
                  { value: 'tabloid', label: 'Tabloid' },
                ]}
              />
              <SegmentedControl
                label="Orientation"
                value={settings.pageOrientation ?? 'portrait'}
                onChange={(v) => onSettingsChange({ pageOrientation: v })}
                options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]}
              />
              <Select
                label="Margin units"
                value={settings.pageMarginUnits ?? 'mm'}
                onChange={(v) => onSettingsChange({ pageMarginUnits: v as RightPanelSettings['pageMarginUnits'] })}
                options={[{ value: 'mm', label: 'mm' }, { value: 'in', label: 'in' }, { value: 'pt', label: 'pt' }]}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <NumberInput label="Top" value={settings.pageMarginTop} placeholder={settings.pageMarginUnits === 'in' ? '1"' : '25'} onChange={(v) => onSettingsChange({ pageMarginTop: v })} />
                <NumberInput label="Bottom" value={settings.pageMarginBottom} onChange={(v) => onSettingsChange({ pageMarginBottom: v })} />
                <NumberInput label="Left" value={settings.pageMarginLeft} onChange={(v) => onSettingsChange({ pageMarginLeft: v })} />
                <NumberInput label="Right" value={settings.pageMarginRight} onChange={(v) => onSettingsChange({ pageMarginRight: v })} />
              </div>
              <Select label="Apply to" value={settings.pageApplyTo ?? 'whole_doc'} onChange={(v) => onSettingsChange({ pageApplyTo: v as RightPanelSettings['pageApplyTo'] })} options={[{ value: 'whole_doc', label: 'Whole document' }, { value: 'section', label: 'Section' }]} />
              <NumberInput label="Gutter" value={settings.marginGutter} placeholder="0" onChange={(v) => onSettingsChange({ marginGutter: v })} />
              <Toggle label="Mirror margins" sublabel="Facing pages" value={settings.mirrorMargins ?? false} onChange={(v) => onSettingsChange({ mirrorMargins: v })} />
              <Toggle label="First page different" value={settings.firstPageDifferent ?? false} onChange={(v) => onSettingsChange({ firstPageDifferent: v })} />
            </>
          ),
        },
        {
          id: 'document_properties',
          label: 'Document properties',
          icon: FileEdit,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Title" value={settings.documentTitle ?? ''} placeholder="Document title" onChange={(v) => onSettingsChange({ documentTitle: v })} />
              <TextInput label="Author" value={settings.documentAuthor ?? ''} placeholder="Author name" onChange={(v) => onSettingsChange({ documentAuthor: v })} />
              <TextInput label="Subject" value={settings.documentSubject ?? ''} placeholder="Subject" onChange={(v) => onSettingsChange({ documentSubject: v })} />
              <TextInput label="Keywords" value={settings.documentKeywords ?? ''} placeholder="Comma-separated keywords" onChange={(v) => onSettingsChange({ documentKeywords: v })} />
              <Select
                label="Language"
                value={settings.documentLanguage ?? 'en'}
                onChange={(v) => onSettingsChange({ documentLanguage: v })}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'pt', label: 'Portuguese' },
                  { value: 'zh', label: 'Chinese' },
                  { value: 'ja', label: 'Japanese' },
                ]}
              />
              <TextInput label="Creator" value={settings.documentCreator ?? ''} placeholder="Application name" onChange={(v) => onSettingsChange({ documentCreator: v })} />
              <TextInput label="Producer" value={settings.documentProducer ?? ''} placeholder="Producer" onChange={(v) => onSettingsChange({ documentProducer: v })} />
              <TextInput label="Creation date" value={settings.documentCreationDate ?? ''} placeholder="YYYY-MM-DD" onChange={(v) => onSettingsChange({ documentCreationDate: v })} />
              <TextInput label="Modification date" value={settings.documentModDate ?? ''} placeholder="YYYY-MM-DD" onChange={(v) => onSettingsChange({ documentModDate: v })} />
              <TextArea label="Custom properties" value={settings.customProperties ?? ''} placeholder="key: value — one per line" onChange={(v) => onSettingsChange({ customProperties: v })} rows={3} />
            </>
          ),
        },
        {
          id: 'headers_footers',
          label: 'Headers & footers',
          icon: FileEdit,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Header text" value={settings.headerText ?? ''} placeholder="e.g. Company name" onChange={(v) => onSettingsChange({ headerText: v })} />
              <TextInput label="Footer text" value={settings.footerText ?? ''} placeholder="e.g. Confidential" onChange={(v) => onSettingsChange({ footerText: v })} />
              <Toggle label="Different first page" sublabel="No header/footer on page 1" value={settings.headerFooterDifferentFirstPage ?? false} onChange={(v) => onSettingsChange({ headerFooterDifferentFirstPage: v })} />
              <Toggle label="Different odd/even" sublabel="Mirror for facing pages" value={settings.differentOddEven ?? false} onChange={(v) => onSettingsChange({ differentOddEven: v })} />
              <Toggle label="Link to previous" sublabel="Continue from previous section" value={settings.linkToPrevious ?? true} onChange={(v) => onSettingsChange({ linkToPrevious: v })} />
              <NumberInput label="Header distance from edge" value={settings.headerDistance} placeholder="12" onChange={(v) => onSettingsChange({ headerDistance: v })} />
              <NumberInput label="Footer distance from edge" value={settings.footerDistance} placeholder="12" onChange={(v) => onSettingsChange({ footerDistance: v })} />
              <Toggle label="Page number in header" value={settings.pageNumberInHeader ?? false} onChange={(v) => onSettingsChange({ pageNumberInHeader: v })} />
              <Toggle label="Page number in footer" value={settings.pageNumberInFooter ?? true} onChange={(v) => onSettingsChange({ pageNumberInFooter: v })} />
            </>
          ),
        },
        {
          id: 'typography_defaults',
          label: 'Typography defaults',
          icon: AlignLeft,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select
                label="Default font"
                value={settings.defaultFontFamily ?? 'Helvetica'}
                onChange={(v) => onSettingsChange({ defaultFontFamily: v })}
                options={[
                  { value: 'Helvetica', label: 'Helvetica' },
                  { value: 'Arial', label: 'Arial' },
                  { value: 'Times New Roman', label: 'Times New Roman' },
                  { value: 'Georgia', label: 'Georgia' },
                  { value: 'Courier', label: 'Courier' },
                ]}
              />
              <NumberInput label="Default font size (pt)" value={settings.defaultFontSize} min={6} max={72} placeholder="12" onChange={(v) => onSettingsChange({ defaultFontSize: v })} />
              <NumberInput label="Body font size (pt)" value={settings.fontSizeBody} placeholder="12" onChange={(v) => onSettingsChange({ fontSizeBody: v })} />
              <NumberInput label="Heading font size (pt)" value={settings.fontSizeHeading} placeholder="14" onChange={(v) => onSettingsChange({ fontSizeHeading: v })} />
              <NumberInput label="Paragraph spacing before" value={settings.paragraphSpacingBefore} placeholder="0" onChange={(v) => onSettingsChange({ paragraphSpacingBefore: v })} />
              <NumberInput label="Paragraph spacing after" value={settings.paragraphSpacingAfter} placeholder="0" onChange={(v) => onSettingsChange({ paragraphSpacingAfter: v })} />
              <Toggle label="Widow/orphan control" value={settings.widowOrphanControl ?? true} onChange={(v) => onSettingsChange({ widowOrphanControl: v })} />
              <SegmentedControl
                label="Line spacing"
                value={settings.lineSpacing ?? 'single'}
                onChange={(v) => onSettingsChange({ lineSpacing: v })}
                options={[
                  { value: 'single', label: 'Single' },
                  { value: '1.5', label: '1.5' },
                  { value: 'double', label: 'Double' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
              {settings.lineSpacing === 'custom' && (
                <NumberInput label="Custom line spacing" value={settings.lineSpacingCustom} min={1} max={3} step={0.1} onChange={(v) => onSettingsChange({ lineSpacingCustom: v })} />
              )}
              <SegmentedControl
                label="Alignment"
                value={settings.paragraphAlignment ?? 'left'}
                onChange={(v) => onSettingsChange({ paragraphAlignment: v })}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right', label: 'Right' },
                  { value: 'justify', label: 'Justify' },
                ]}
              />
              <Toggle label="Hyphenation" sublabel="Auto hyphenate text" value={settings.hyphenation ?? false} onChange={(v) => onSettingsChange({ hyphenation: v })} />
              <Select
                label="Columns"
                value={String(settings.numberOfColumns ?? 1)}
                onChange={(v) => onSettingsChange({ numberOfColumns: (v === '2' ? 2 : v === '3' ? 3 : 1) as RightPanelSettings['numberOfColumns'] })}
                options={[{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }]}
              />
              <Select
                label="Ruler units"
                value={settings.rulerUnits ?? 'in'}
                onChange={(v) => onSettingsChange({ rulerUnits: v as RightPanelSettings['rulerUnits'] })}
                options={[{ value: 'in', label: 'Inches' }, { value: 'cm', label: 'cm' }, { value: 'pt', label: 'Points' }]}
              />
            </>
          ),
        },
        {
          id: 'export_options',
          label: 'Export & print options',
          icon: FileOutput,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Toggle label="Fit to page" sublabel="Scale to fit when printing" value={settings.fitToPage ?? false} onChange={(v) => onSettingsChange({ fitToPage: v })} />
              <Slider label="Print scale (%)" value={settings.printScale ?? 100} min={50} max={200} onChange={(v) => onSettingsChange({ printScale: v })} formatValue={(v) => v + '%'} />
              <Select
                label="Print range"
                value={settings.printRange ?? 'all'}
                onChange={(v) => onSettingsChange({ printRange: v as RightPanelSettings['printRange'] })}
                options={[
                  { value: 'all', label: 'All pages' },
                  { value: 'current', label: 'Current page' },
                  { value: 'range', label: 'Page range' },
                ]}
              />
              <Toggle label="Embed fonts" sublabel="Always renders correctly" value={settings.embedFonts ?? false} onChange={(v) => onSettingsChange({ embedFonts: v })} />
              <Toggle label="Include annotations" sublabel="Comments, highlights" value={settings.includeAnnotations ?? true} onChange={(v) => onSettingsChange({ includeAnnotations: v })} />
              <Toggle label="Tagged PDF" sublabel="Accessibility / structure" value={settings.taggedPdf ?? false} onChange={(v) => onSettingsChange({ taggedPdf: v })} />
              <ColorPicker label="Page color" value={settings.pageColor ?? '#FFFFFF'} onChange={(v) => onSettingsChange({ pageColor: v })} />
              <Select label="Duplex" value={settings.duplex ?? 'none'} onChange={(v) => onSettingsChange({ duplex: v as RightPanelSettings['duplex'] })} options={[{ value: 'none', label: 'Single-sided' }, { value: 'long', label: 'Long edge' }, { value: 'short', label: 'Short edge' }]} />
              <Toggle label="Collate" value={settings.collate ?? true} onChange={(v) => onSettingsChange({ collate: v })} />
              <TextInput label="Print range (custom)" value={settings.printRangeCustom ?? ''} placeholder="e.g. 1-3, 5" onChange={(v) => onSettingsChange({ printRangeCustom: v })} />
              <Toggle label="PDF/A compliance" value={settings.pdfACompliance ?? false} onChange={(v) => onSettingsChange({ pdfACompliance: v })} />
              <Toggle label="ISO compliance" value={settings.isoCompliance ?? false} onChange={(v) => onSettingsChange({ isoCompliance: v })} />
            </>
          ),
        },
      ],
    },
    {
      id: 'images',
      label: 'Images',
      icon: Image,
      tools: [
        {
          id: 'compress_image',
          label: 'Compress Image',
          icon: PackageMinus,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Slider label="Quality" value={settings.imageQuality ?? 75} min={1} max={100} onChange={(v) => onSettingsChange({ imageQuality: v })} formatValue={(v) => v + '%'} />
              <NumberInput label="Target file size (KB)" value={settings.compressTargetSizeKb} placeholder="Optional" onChange={(v) => onSettingsChange({ compressTargetSizeKb: v })} />
              <NumberInput label="Max dimension (px)" value={settings.compressMaxDimension} placeholder="Optional" onChange={(v) => onSettingsChange({ compressMaxDimension: v })} />
              <NumberInput label="DPI" value={settings.compressDpi} placeholder="72" onChange={(v) => onSettingsChange({ compressDpi: v })} />
              <Toggle label="Strip metadata" value={settings.stripMetadata ?? false} onChange={(v) => onSettingsChange({ stripMetadata: v })} />
              <Toggle label="Progressive JPEG" value={settings.progressiveJpeg ?? false} onChange={(v) => onSettingsChange({ progressiveJpeg: v })} />
            </>
          ),
        },
        {
          id: 'convert_image',
          label: 'Convert Format',
          icon: RefreshCw,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <SegmentedControl
                label="Format"
                value={settings.outputFormat ?? 'png'}
                onChange={(v) => onSettingsChange({ outputFormat: v })}
                options={[{ value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }, { value: 'webp', label: 'WEBP' }, { value: 'avif', label: 'AVIF' }]}
              />
              {['jpg', 'webp', 'avif'].includes(settings.outputFormat ?? '') && (
                <Slider label="Quality" value={settings.imageQuality ?? 80} min={1} max={100} onChange={(v) => onSettingsChange({ imageQuality: v })} formatValue={(v) => v + '%'} />
              )}
              <Toggle label="Preserve transparency" value={settings.preserveTransparency ?? false} onChange={(v) => onSettingsChange({ preserveTransparency: v })} />
              <Select label="Color profile" value={settings.colorProfile ?? 'srgb'} onChange={(v) => onSettingsChange({ colorProfile: v as RightPanelSettings['colorProfile'] })} options={[{ value: 'srgb', label: 'sRGB' }, { value: 'adobe_rgb', label: 'Adobe RGB' }]} />
              <Select label="Bit depth" value={String(settings.bitDepth ?? 8)} onChange={(v) => onSettingsChange({ bitDepth: Number(v) as 8 | 16 })} options={[{ value: '8', label: '8-bit' }, { value: '16', label: '16-bit' }]} />
              <Toggle label="Embed ICC profile" value={settings.embedIcc ?? false} onChange={(v) => onSettingsChange({ embedIcc: v })} />
              <ColorPicker label="Background (transparent→opaque)" value={settings.backgroundColorForOpaque ?? '#FFFFFF'} onChange={(v) => onSettingsChange({ backgroundColorForOpaque: v })} />
            </>
          ),
        },
        {
          id: 'resize_image',
          label: 'Resize Image',
          icon: Maximize2,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <SegmentedControl label="Unit" value={settings.resizeUnit ?? 'px'} onChange={(v) => onSettingsChange({ resizeUnit: v })} options={[{ value: 'px', label: 'px' }, { value: '%', label: '%' }]} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <NumberInput label="Width" value={settings.resizeWidth} placeholder="Auto" onChange={(v) => onSettingsChange({ resizeWidth: v })} />
                <NumberInput label="Height" value={settings.resizeHeight} placeholder="Auto" onChange={(v) => onSettingsChange({ resizeHeight: v })} />
              </div>
              <Toggle label="Maintain aspect ratio" value={settings.maintainAspectRatio ?? true} onChange={(v) => onSettingsChange({ maintainAspectRatio: v })} />
              <Toggle label="Allow upscale" value={settings.allowUpscale ?? false} onChange={(v) => onSettingsChange({ allowUpscale: v })} />
              <Select
                label="Resize mode"
                value={settings.resizeMode ?? 'fit'}
                onChange={(v) => onSettingsChange({ resizeMode: v as RightPanelSettings['resizeMode'] })}
                options={[{ value: 'fit', label: 'Fit inside' }, { value: 'fill', label: 'Fill & crop' }, { value: 'exact', label: 'Exact' }]}
              />
              <Select label="Preset" value={settings.resizePreset ?? ''} onChange={(v) => onSettingsChange({ resizePreset: v })} options={[{ value: '', label: 'Custom' }, { value: '1920x1080', label: '1920×1080' }, { value: '800x600', label: '800×600' }, { value: '1080x1080', label: '1080×1080' }]} />
              <NumberInput label="Longest edge (px)" value={settings.resizeByLongestEdge} placeholder="Optional" onChange={(v) => onSettingsChange({ resizeByLongestEdge: v })} />
              <NumberInput label="DPI (print)" value={settings.resizeDpi} placeholder="72" onChange={(v) => onSettingsChange({ resizeDpi: v })} />
            </>
          ),
        },
        {
          id: 'remove_background',
          label: 'Remove Background',
          icon: Eraser,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => {
            const hasColor = settings.bgReplacementColor != null && settings.bgReplacementColor !== '';
            return (
              <>
                <Toggle
                  label="Replace with color"
                  value={!!hasColor}
                  onChange={(v) => onSettingsChange({ bgReplacementColor: v ? (settings.bgReplacementColor || '#FFFFFF') : undefined })}
                />
                {hasColor && (
                  <ColorPicker label="Color" value={settings.bgReplacementColor ?? '#FFFFFF'} onChange={(v) => onSettingsChange({ bgReplacementColor: v })} />
                )}
                <Slider label="Tolerance" value={settings.bgRemovalTolerance ?? 50} min={0} max={100} onChange={(v) => onSettingsChange({ bgRemovalTolerance: v })} formatValue={(v) => v + '%'} />
                <Slider label="Feather edge" value={settings.bgRemovalFeather ?? 0} min={0} max={20} onChange={(v) => onSettingsChange({ bgRemovalFeather: v })} formatValue={(v) => v + ' px'} />
                <Toggle label="Keep shadow" value={settings.bgRemovalKeepShadow ?? false} onChange={(v) => onSettingsChange({ bgRemovalKeepShadow: v })} />
              </>
            );
          },
        },
        {
          id: 'crop_image',
          label: 'Crop Image',
          icon: Crop,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select label="Aspect ratio" value={settings.cropAspectRatio ?? 'free'} onChange={(v) => onSettingsChange({ cropAspectRatio: v })} options={[{ value: 'free', label: 'Free' }, { value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' }]} />
              <NumberInput label="Width" value={settings.cropWidth} placeholder="px" onChange={(v) => onSettingsChange({ cropWidth: v })} />
              <NumberInput label="Height" value={settings.cropHeight} placeholder="px" onChange={(v) => onSettingsChange({ cropHeight: v })} />
              <Select label="Position" value={settings.cropPosition ?? 'center'} onChange={(v) => onSettingsChange({ cropPosition: v })} options={[{ value: 'center', label: 'Center' }, { value: 'top-left', label: 'Top left' }, { value: 'top-right', label: 'Top right' }, { value: 'bottom-left', label: 'Bottom left' }, { value: 'bottom-right', label: 'Bottom right' }]} />
              <Select label="Units" value={settings.cropUnits ?? 'px'} onChange={(v) => onSettingsChange({ cropUnits: v as RightPanelSettings['cropUnits'] })} options={[{ value: 'px', label: 'px' }, { value: '%', label: '%' }, { value: 'in', label: 'in' }]} />
            </>
          ),
        },
        {
          id: 'flip_rotate_image',
          label: 'Flip / Rotate',
          icon: FlipHorizontal,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <SegmentedControl
                label="Action"
                value={settings.flipRotateAction ?? 'flip_h'}
                onChange={(v) => onSettingsChange({ flipRotateAction: v })}
                options={[
                  { value: 'flip_h', label: 'Flip H' },
                  { value: 'flip_v', label: 'Flip V' },
                  { value: 'rotate_90', label: 'Rotate 90' },
                  { value: 'rotate_180', label: 'Rotate 180' },
                ]}
              />
              <NumberInput label="Custom angle (°)" value={settings.flipRotateAngle} placeholder="e.g. 45" onChange={(v) => onSettingsChange({ flipRotateAngle: v })} />
              <Toggle label="Expand canvas to fit" value={settings.rotateExpandCanvas ?? true} onChange={(v) => onSettingsChange({ rotateExpandCanvas: v })} />
            </>
          ),
        },
        {
          id: 'add_border',
          label: 'Add Border',
          icon: Square,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Slider label="Border width" value={settings.borderWidth ?? 1} min={1} max={50} onChange={(v) => onSettingsChange({ borderWidth: v })} formatValue={(v) => v + ' px'} />
              <ColorPicker label="Color" value={settings.borderColor ?? '#000000'} onChange={(v) => onSettingsChange({ borderColor: v })} />
              <Select label="Style" value={settings.borderStyle ?? 'solid'} onChange={(v) => onSettingsChange({ borderStyle: v as RightPanelSettings['borderStyle'] })} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} />
              <Select label="Position" value={settings.borderPosition ?? 'inner'} onChange={(v) => onSettingsChange({ borderPosition: v as RightPanelSettings['borderPosition'] })} options={[{ value: 'inner', label: 'Inner' }, { value: 'outer', label: 'Outer' }]} />
              <NumberInput label="Rounded corners (px)" value={settings.borderRadius} placeholder="0" onChange={(v) => onSettingsChange({ borderRadius: v })} />
            </>
          ),
        },
        {
          id: 'upscale_image',
          label: 'Upscale Image',
          icon: ZoomIn,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <SegmentedControl label="Scale" value={settings.upscaleScale ?? '2x'} onChange={(v) => onSettingsChange({ upscaleScale: v })} options={[{ value: '2x', label: '2x' }, { value: '4x', label: '4x' }]} />
              <Select label="Model" value={settings.upscaleModel ?? 'fast'} onChange={(v) => onSettingsChange({ upscaleModel: v })} options={[{ value: 'fast', label: 'Fast' }, { value: 'quality', label: 'Quality' }]} />
              <Toggle label="Denoise" value={settings.upscaleDenoise ?? false} onChange={(v) => onSettingsChange({ upscaleDenoise: v })} />
              <Toggle label="Face enhance" value={settings.upscaleFaceEnhance ?? false} onChange={(v) => onSettingsChange({ upscaleFaceEnhance: v })} />
              <Select label="Output format" value={settings.upscaleOutputFormat ?? 'png'} onChange={(v) => onSettingsChange({ upscaleOutputFormat: v as RightPanelSettings['upscaleOutputFormat'] })} options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }]} />
            </>
          ),
        },
        {
          id: 'image_to_pdf',
          label: 'Convert to PDF',
          icon: FilePlus,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select label="Page size" value={settings.imageToPdfPageSize ?? 'a4'} onChange={(v) => onSettingsChange({ imageToPdfPageSize: v as RightPanelSettings['imageToPdfPageSize'] })} options={[{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }, { value: 'legal', label: 'Legal' }]} />
              <SegmentedControl label="Orientation" value={settings.imageToPdfOrientation ?? 'portrait'} onChange={(v) => onSettingsChange({ imageToPdfOrientation: v })} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
              <Select label="Fit mode" value={settings.imageToPdfFitMode ?? 'fit'} onChange={(v) => onSettingsChange({ imageToPdfFitMode: v })} options={[{ value: 'fit', label: 'Fit' }, { value: 'fill', label: 'Fill' }, { value: 'actual', label: 'Actual size' }]} />
              <NumberInput label="Margin" value={settings.imageToPdfMargin} placeholder="0" onChange={(v) => onSettingsChange({ imageToPdfMargin: v })} />
              <Select label="Images per page" value={settings.imagesPerPage ?? '1'} onChange={(v) => onSettingsChange({ imagesPerPage: v as RightPanelSettings['imagesPerPage'] })} options={[{ value: '1', label: '1' }, { value: '2x2', label: '2×2 grid' }, { value: '3x3', label: '3×3 grid' }]} />
              <NumberInput label="DPI" value={settings.imageToPdfDpi} placeholder="150" onChange={(v) => onSettingsChange({ imageToPdfDpi: v })} />
              <Toggle label="Compress images" value={settings.imageToPdfCompress ?? true} onChange={(v) => onSettingsChange({ imageToPdfCompress: v })} />
            </>
          ),
        },
        {
          id: 'watermark_image',
          label: 'Watermark Image',
          icon: Stamp,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Text" value={settings.watermarkText ?? ''} onChange={(v) => onSettingsChange({ watermarkText: v })} />
              <Slider label="Opacity" value={settings.watermarkOpacity ?? 50} min={5} max={100} onChange={(v) => onSettingsChange({ watermarkOpacity: v })} formatValue={(v) => v + '%'} />
              <PositionGrid label="Position" value={settings.watermarkPosition ?? 'MC'} onChange={(v) => onSettingsChange({ watermarkPosition: v })} />
              <Slider label="Rotation" value={settings.watermarkRotation ?? 0} min={-180} max={180} onChange={(v) => onSettingsChange({ watermarkRotation: v })} formatValue={(v) => v + '°'} />
              <Slider label="Font size" value={settings.watermarkFontSize ?? 24} min={10} max={120} onChange={(v) => onSettingsChange({ watermarkFontSize: v })} formatValue={(v) => v + ' px'} />
              <ColorPicker label="Color" value={settings.watermarkColor ?? '#1A1714'} onChange={(v) => onSettingsChange({ watermarkColor: v })} />
              <TextInput label="Font family" value={settings.watermarkFontFamily ?? ''} placeholder="e.g. Arial" onChange={(v) => onSettingsChange({ watermarkFontFamily: v })} />
              <TextInput label="Image watermark URL" value={settings.watermarkImageUrl ?? ''} placeholder="Optional image URL" onChange={(v) => onSettingsChange({ watermarkImageUrl: v })} />
              <Toggle label="Tile / repeat" value={settings.watermarkTile ?? false} onChange={(v) => onSettingsChange({ watermarkTile: v })} />
              <Slider label="Watermark scale (%)" value={settings.watermarkScale ?? 100} min={10} max={200} onChange={(v) => onSettingsChange({ watermarkScale: v })} formatValue={(v) => v + '%'} />
            </>
          ),
        },
      ],
    },
    {
      id: 'sign',
      label: 'Sign & Fill',
      icon: PenLine,
      tools: [
        {
          id: 'esign',
          label: 'E-Sign Document',
          icon: PenLine,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange, onOpenOnboarding }) => {
            let sigPreview: string | null = null;
            try {
              const raw = localStorage.getItem('corner:signature');
              if (raw) {
                const sig = JSON.parse(raw) as { dataUrl?: string };
                sigPreview = sig?.dataUrl ?? null;
              }
            } catch (_) {}
            return (
              <>
                {sigPreview ? (
                  <div style={{ marginBottom: 6 }}>
                    <img src={sigPreview} alt="Signature" style={{ maxWidth: '100%', maxHeight: 40, border: '1px solid var(--border)', borderRadius: 4, objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ marginBottom: 6 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No signature saved</p>
                    <button type="button" onClick={onOpenOnboarding} style={{ marginTop: 4, padding: '4px 8px', fontSize: 11, fontFamily, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--white)', color: 'var(--accent)', cursor: 'pointer' }}>Set up</button>
                  </div>
                )}
                <SegmentedControl label="Placement mode" value={settings.placementMode ?? 'auto'} onChange={(v) => onSettingsChange({ placementMode: v })} options={[{ value: 'auto', label: 'Auto-detect' }, { value: 'manual', label: 'Manual' }]} />
                <Slider label="Signature scale" value={settings.signatureScale ?? 100} min={50} max={200} onChange={(v) => onSettingsChange({ signatureScale: v })} formatValue={(v) => v + '%'} />
                <Toggle label="Add date stamp" value={settings.addDateStamp ?? false} onChange={(v) => onSettingsChange({ addDateStamp: v })} />
                {settings.addDateStamp && (
                  <Select label="Date format" value={settings.dateFormat ?? 'MM/DD/YYYY'} onChange={(v) => onSettingsChange({ dateFormat: v as RightPanelSettings['dateFormat'] })} options={[{ value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} />
                )}
                <Toggle label="Add typed name below signature" value={settings.addTypedName ?? false} onChange={(v) => onSettingsChange({ addTypedName: v })} />
                <Toggle label="Add initials field" value={settings.addInitialsField ?? false} onChange={(v) => onSettingsChange({ addInitialsField: v })} />
              </>
            );
          },
        },
        {
          id: 'request_signatures',
          label: 'Request Signatures',
          icon: Send,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => {
            const signers = settings.signers ?? [{ name: '', email: '' }];
            const setSigners = (s: { name: string; email: string }[]) => onSettingsChange({ signers: s });
            return (
              <>
                <SectionLabel>Signers (max 10)</SectionLabel>
                {signers.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <input value={s.name} placeholder="Name" onChange={(e) => { const n = [...signers]; n[i] = { ...n[i], name: e.target.value }; setSigners(n); }} style={{ flex: 1, padding: '4px 6px', fontSize: 11, border: '1px solid var(--border)', borderRadius: 6 }} />
                    <input value={s.email} placeholder="Email" onChange={(e) => { const n = [...signers]; n[i] = { ...n[i], email: e.target.value }; setSigners(n); }} style={{ flex: 1, padding: '4px 6px', fontSize: 11, border: '1px solid var(--border)', borderRadius: 6 }} />
                    <button type="button" onClick={() => setSigners(signers.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Trash2 size={12} /></button>
                  </div>
                ))}
                {signers.length < 10 && <button type="button" onClick={() => setSigners([...signers, { name: '', email: '' }])} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 6 }}>Add signer</button>}
                <SegmentedControl label="Signing order" value={settings.signingOrder ?? 'sequential'} onChange={(v) => onSettingsChange({ signingOrder: v })} options={[{ value: 'sequential', label: 'Sequential' }, { value: 'parallel', label: 'Parallel' }]} />
                <Toggle label="Deadline" value={settings.requestDeadline ?? false} onChange={(v) => onSettingsChange({ requestDeadline: v })} />
                {settings.requestDeadline && <NumberInput label="Days until expiry" value={settings.requestDeadlineDays ?? 7} onChange={(v) => onSettingsChange({ requestDeadlineDays: v })} />}
                <Toggle label="Auto-remind" value={settings.autoRemind ?? false} onChange={(v) => onSettingsChange({ autoRemind: v })} />
                {settings.autoRemind && <Select label="Reminder" value={settings.reminderFrequency ?? 'daily'} onChange={(v) => onSettingsChange({ reminderFrequency: v })} options={[{ value: 'daily', label: 'Every day' }, { value: 'every_2_days', label: 'Every 2 days' }, { value: 'every_3_days', label: 'Every 3 days' }]} />}
                <TextArea value={settings.messageToSigners ?? ''} placeholder="Please review and sign this document." onChange={(v) => onSettingsChange({ messageToSigners: v })} />
                <Toggle label="Require email verification" value={settings.requireEmailVerification !== false} onChange={(v) => onSettingsChange({ requireEmailVerification: v })} />
                <Toggle label="Require SMS verification" value={settings.requireSmsVerification ?? false} onChange={(v) => onSettingsChange({ requireSmsVerification: v })} />
                <Toggle label="Require access code" value={settings.requireAccessCode ?? false} onChange={(v) => onSettingsChange({ requireAccessCode: v })} />
                {settings.requireAccessCode && <TextInput label="Access code" value={settings.requestAccessCode ?? ''} onChange={(v) => onSettingsChange({ requestAccessCode: v })} />}
                <Toggle label="Allow signer to decline" value={settings.allowSignerDecline ?? false} onChange={(v) => onSettingsChange({ allowSignerDecline: v })} />
                <TextInput label="Redirect URL after signing" value={settings.redirectUrlAfterSigning ?? ''} placeholder="Optional URL" onChange={(v) => onSettingsChange({ redirectUrlAfterSigning: v })} />
              </>
            );
          },
        },
        {
          id: 'place_fields',
          label: 'Place Fields',
          icon: LayoutGrid,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => {
            const fieldTypes = ['Signature', 'Initials', 'Full Name', 'Date Signed', 'Title', 'Company', 'Email', 'Checkbox', 'Radio Group', 'Dropdown', 'Text', 'Attachment', 'Formula'];
            return (
              <>
                <SectionLabel>Field type</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {fieldTypes.map((t) => (
                    <button key={t} type="button" onClick={() => onSettingsChange({ placeFieldsFieldType: t })} style={{ padding: '3px 8px', fontSize: 10, fontFamily, border: '1px solid var(--border)', borderRadius: 9999, background: (settings.placeFieldsFieldType === t) ? 'var(--accent)' : 'var(--white)', color: (settings.placeFieldsFieldType === t) ? 'var(--white)' : 'var(--text-muted)', cursor: 'pointer' }}>{t}</button>
                  ))}
                </div>
                <Toggle label="Auto-detect fields" sublabel="AI scans the doc and places fields automatically" value={settings.autoDetectFields ?? false} onChange={(v) => onSettingsChange({ autoDetectFields: v })} />
              </>
            );
          },
        },
        {
          id: 'bulk_send',
          label: 'Bulk Send',
          icon: Users,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <button type="button" style={{ padding: '6px 10px', fontSize: 11, fontFamily, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--white)', cursor: 'pointer', marginBottom: 4 }}>Upload CSV</button>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>CSV with columns: name, email, and any merge fields</div>
              <Toggle label="Or manual entry" value={settings.bulkSendManualEntry ?? false} onChange={(v) => onSettingsChange({ bulkSendManualEntry: v })} />
              {settings.bulkSendManualEntry && <TextArea value={settings.bulkSendManualRecipients ?? ''} placeholder="name, email — one per line" onChange={(v) => onSettingsChange({ bulkSendManualRecipients: v })} />}
              <Toggle label="Personalization" sublabel="Merge fields from CSV into the document before sending" value={settings.bulkSendPersonalization ?? false} onChange={(v) => onSettingsChange({ bulkSendPersonalization: v })} />
              <Toggle label="Show preview before sending" value={settings.bulkSendShowPreview ?? false} onChange={(v) => onSettingsChange({ bulkSendShowPreview: v })} />
              <TextInput label="CSV name column" value={settings.csvNameColumn ?? 'name'} placeholder="name" onChange={(v) => onSettingsChange({ csvNameColumn: v })} />
              <TextInput label="CSV email column" value={settings.csvEmailColumn ?? 'email'} placeholder="email" onChange={(v) => onSettingsChange({ csvEmailColumn: v })} />
              <Toggle label="Test mode (dry run)" sublabel="No emails sent" value={settings.bulkSendTestMode ?? false} onChange={(v) => onSettingsChange({ bulkSendTestMode: v })} />
              </>
          ),
        },
        {
          id: 'in_person_signing',
          label: 'In-Person Signing',
          icon: Tablet,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Signer name" value={settings.inPersonSignerName ?? ''} placeholder="Who is signing in person?" onChange={(v) => onSettingsChange({ inPersonSignerName: v })} />
              <Toggle label="Lock screen after signing" sublabel="Prevents signer from accessing other files" value={settings.lockScreenAfterSigning ?? false} onChange={(v) => onSettingsChange({ lockScreenAfterSigning: v })} />
              <Toggle label="Collect ID photo" sublabel="Camera prompt before signing" value={settings.collectIdPhoto ?? false} onChange={(v) => onSettingsChange({ collectIdPhoto: v })} />
              <Toggle label="Require witness" value={settings.requireWitness ?? false} onChange={(v) => onSettingsChange({ requireWitness: v })} />
            </>
          ),
        },
        {
          id: 'templates',
          label: 'Templates',
          icon: BookTemplate,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange, onSaveTemplate }) => {
            let list: { id: string; name: string; description?: string }[] = [];
            try {
              const raw = localStorage.getItem('corner:templates');
              if (raw) list = JSON.parse(raw);
            } catch (_) {}
            const deleteTemplate = (id: string) => {
              const next = list.filter((t) => t.id !== id);
              localStorage.setItem('corner:templates', JSON.stringify(next));
              onSettingsChange({ _templatesRefresh: Date.now() });
            };
            return (
              <>
                <TextInput label="Template name" value={settings.templateName ?? ''} placeholder="e.g. Standard NDA, Freelance Contract" onChange={(v) => onSettingsChange({ templateName: v })} />
                <TextInput label="Description" value={settings.templateDescription ?? ''} placeholder="Optional description" onChange={(v) => onSettingsChange({ templateDescription: v })} />
                <button type="button" onClick={() => onSaveTemplate?.()} style={{ width: '100%', padding: '6px 0', fontSize: 12, fontFamily, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--white)', cursor: 'pointer', marginBottom: 8 }}>Save as template</button>
                <SectionLabel>Saved templates</SectionLabel>
                {list.length === 0 ? <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No templates saved</p> : list.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--text-primary)' }}>{t.name}</span>
                    <button type="button" onClick={() => onSettingsChange({ _applyTemplateId: t.id })} style={{ padding: '2px 6px', fontSize: 10, fontFamily, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--white)', cursor: 'pointer' }}>Apply</button>
                    <button type="button" onClick={() => deleteTemplate(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={12} /></button>
                  </div>
                ))}
              </>
            );
          },
        },
        {
          id: 'identity_verification',
          label: 'Identity Verification',
          icon: ShieldCheck,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <MultiSelect label="Verification method" options={[{ value: 'email', label: 'Email link' }, { value: 'sms', label: 'SMS code' }, { value: 'kb', label: 'Knowledge-based' }, { value: 'photo_id', label: 'Photo ID upload' }, { value: 'access_code', label: 'Access code' }]} value={settings.verificationMethods ?? []} onChange={(v) => onSettingsChange({ verificationMethods: v })} />
              {settings.verificationMethods?.includes('access_code') && <TextInput label="Access code" value={settings.verificationAccessCode ?? ''} onChange={(v) => onSettingsChange({ verificationAccessCode: v })} />}
              <SegmentedControl label="Verification level" value={settings.verificationLevel ?? 'standard'} onChange={(v) => onSettingsChange({ verificationLevel: v })} options={[{ value: 'standard', label: 'Standard' }, { value: 'enhanced', label: 'Enhanced' }, { value: 'maximum', label: 'Maximum' }]} />
            </>
          ),
        },
        {
          id: 'audit_trail',
          label: 'Audit Trail',
          icon: ClipboardList,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Toggle label="Include IP addresses" value={settings.auditIncludeIp !== false} onChange={(v) => onSettingsChange({ auditIncludeIp: v })} />
              <Toggle label="Include device info" value={settings.auditIncludeDeviceInfo !== false} onChange={(v) => onSettingsChange({ auditIncludeDeviceInfo: v })} />
              <Toggle label="Include geolocation" value={settings.auditIncludeGeolocation ?? false} onChange={(v) => onSettingsChange({ auditIncludeGeolocation: v })} />
              <Toggle label="Include document hash" sublabel="Cryptographic proof of document integrity" value={settings.auditIncludeDocumentHash ?? false} onChange={(v) => onSettingsChange({ auditIncludeDocumentHash: v })} />
              <Toggle label="Embed in final PDF" sublabel="Appends audit trail as last pages of signed doc" value={settings.auditEmbedInFinalPdf ?? false} onChange={(v) => onSettingsChange({ auditEmbedInFinalPdf: v })} />
            </>
          ),
        },
        {
          id: 'certificate_of_completion',
          label: 'Certificate of Completion',
          icon: Award,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Toggle label="Include all signer details" value={settings.certificateIncludeSignerDetails ?? false} onChange={(v) => onSettingsChange({ certificateIncludeSignerDetails: v })} />
              <Toggle label="Include timestamps" value={settings.certificateIncludeTimestamps ?? false} onChange={(v) => onSettingsChange({ certificateIncludeTimestamps: v })} />
              <Toggle label="Include document fingerprint" value={settings.certificateIncludeFingerprint ?? false} onChange={(v) => onSettingsChange({ certificateIncludeFingerprint: v })} />
              <SegmentedControl label="Style" value={settings.certificateStyle ?? 'minimal'} onChange={(v) => onSettingsChange({ certificateStyle: v })} options={[{ value: 'minimal', label: 'Minimal' }, { value: 'formal', label: 'Formal' }, { value: 'detailed', label: 'Detailed' }]} />
            </>
          ),
        },
        {
          id: 'tamper_detection',
          label: 'Tamper Detection',
          icon: Lock,
          hasSettings: true,
          renderSettings: () => (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Checks whether a signed PDF has been modified since it was signed.</p>
          ),
        },
        {
          id: 'fill_pdf_form',
          label: 'Fill PDF Form',
          icon: ClipboardEdit,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Toggle label="Auto-fill with AI" sublabel="Describe what to fill and AI completes the form" value={settings.fillPdfAutoFillWithAi ?? false} onChange={(v) => onSettingsChange({ fillPdfAutoFillWithAi: v })} />
              {settings.fillPdfAutoFillWithAi && <TextArea value={settings.fillPdfAutoFillInstructions ?? ''} placeholder="e.g. Fill my name as John Smith, date as today, leave signature blank" onChange={(v) => onSettingsChange({ fillPdfAutoFillInstructions: v })} />}
              <Toggle label="Flatten after filling" sublabel="Makes fields non-editable in output" value={settings.fillPdfFlattenAfter ?? false} onChange={(v) => onSettingsChange({ fillPdfFlattenAfter: v })} />
            </>
          ),
        },
        {
          id: 'stamp_document',
          label: 'Stamp Document',
          icon: Stamp,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => {
            const presets = ['APPROVED', 'CONFIDENTIAL', 'DRAFT', 'VOID', 'RECEIVED'];
            return (
              <>
                <TextInput label="Stamp text" value={settings.stampText ?? ''} placeholder="APPROVED" onChange={(v) => onSettingsChange({ stampText: v })} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {presets.map((p) => (
                    <button key={p} type="button" onClick={() => onSettingsChange({ stampText: p })} style={{ padding: '3px 8px', fontSize: 10, fontFamily, border: '1px solid var(--border)', borderRadius: 9999, background: (settings.stampText === p) ? 'var(--accent)' : 'var(--white)', color: (settings.stampText === p) ? 'var(--white)' : 'var(--text-muted)', cursor: 'pointer' }}>{p}</button>
                  ))}
                </div>
                <ColorPicker label="Color" value={settings.stampColor ?? '#8B7355'} onChange={(v) => onSettingsChange({ stampColor: v })} />
                <Slider label="Opacity" value={settings.stampOpacity ?? 80} min={10} max={100} onChange={(v) => onSettingsChange({ stampOpacity: v })} formatValue={(v) => v + '%'} />
                <SectionLabel>Position (3×3 grid)</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 96 }}>
                  {['TL', 'TC', 'TR', 'ML', 'MC', 'MR', 'BL', 'BC', 'BR'].map((pos) => (
                    <button key={pos} type="button" onClick={() => onSettingsChange({ stampPositionGrid: pos })} style={{ width: 24, height: 24, padding: 0, fontSize: 8, fontFamily, border: '1px solid var(--border)', borderRadius: 4, background: (settings.stampPositionGrid === pos) ? 'var(--accent)' : 'var(--white)', color: (settings.stampPositionGrid === pos) ? 'var(--white)' : 'var(--text-muted)', cursor: 'pointer' }}>{pos}</button>
                  ))}
                </div>
                <Slider label="Rotation" value={settings.stampRotation ?? 0} min={-45} max={45} onChange={(v) => onSettingsChange({ stampRotation: v })} formatValue={(v) => v + '°'} />
                <Toggle label="Outline only" sublabel="Hollow stamp instead of filled" value={settings.stampOutlineOnly ?? false} onChange={(v) => onSettingsChange({ stampOutlineOnly: v })} />
              </>
            );
          },
        },
        {
          id: 'decline_void',
          label: 'Decline & Void',
          icon: XCircle,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextArea value={settings.declineVoidReason ?? ''} placeholder="Reason for voiding (sent to all signers)" onChange={(v) => onSettingsChange({ declineVoidReason: v })} />
              <Toggle label="Notify all parties" value={settings.declineVoidNotifyParties !== false} onChange={(v) => onSettingsChange({ declineVoidNotifyParties: v })} />
            </>
          ),
        },
      ],
    },
    {
      id: 'generate',
      label: 'Generate',
      icon: Sparkles,
      tools: [
        {
          id: 'generate_qr',
          label: 'QR Code',
          icon: QrCode,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select label="Content type" value={settings.qrContentType ?? 'url'} onChange={(v) => onSettingsChange({ qrContentType: v })} options={[{ value: 'url', label: 'URL' }, { value: 'text', label: 'Text' }, { value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }, { value: 'wifi', label: 'WiFi' }, { value: 'vcard', label: 'vCard' }]} />
              <Slider label="Size" value={settings.qrSize ?? 256} min={128} max={1024} step={64} onChange={(v) => onSettingsChange({ qrSize: v })} formatValue={(v) => v + ' px'} />
              <ColorPicker label="Foreground" value={settings.qrForeground ?? '#1A1714'} onChange={(v) => onSettingsChange({ qrForeground: v })} />
              <ColorPicker label="Background" value={settings.qrBackground ?? '#FFFFFF'} onChange={(v) => onSettingsChange({ qrBackground: v })} />
              <Toggle label="Rounded corners" value={settings.qrRoundedCorners ?? false} onChange={(v) => onSettingsChange({ qrRoundedCorners: v })} />
              <SegmentedControl label="Error correction" value={settings.qrErrorCorrection ?? 'M'} onChange={(v) => onSettingsChange({ qrErrorCorrection: v })} options={[{ value: 'L', label: 'L' }, { value: 'M', label: 'M' }, { value: 'Q', label: 'Q' }, { value: 'H', label: 'H' }]} />
              <SegmentedControl label="Output format" value={settings.qrOutputFormat ?? 'png'} onChange={(v) => onSettingsChange({ qrOutputFormat: v })} options={[{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }]} />
              <NumberInput label="Margin (quiet zone)" value={settings.qrMargin} placeholder="4" onChange={(v) => onSettingsChange({ qrMargin: v })} />
              <Select label="Encoding" value={settings.qrEncoding ?? 'auto'} onChange={(v) => onSettingsChange({ qrEncoding: v as RightPanelSettings['qrEncoding'] })} options={[{ value: 'auto', label: 'Auto' }, { value: 'numeric', label: 'Numeric' }, { value: 'alphanumeric', label: 'Alphanumeric' }, { value: 'byte', label: 'Byte' }]} />
              <TextInput label="Logo/icon overlay URL" value={settings.qrLogoUrl ?? ''} placeholder="Optional" onChange={(v) => onSettingsChange({ qrLogoUrl: v })} />
              <NumberInput label="Version (1–40)" value={settings.qrVersion} placeholder="Auto" onChange={(v) => onSettingsChange({ qrVersion: v })} />
            </>
          ),
        },
        {
          id: 'barcode',
          label: 'Barcode',
          icon: BarChart2,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select label="Type" value={settings.barcodeType ?? 'Code128'} onChange={(v) => onSettingsChange({ barcodeType: v })} options={[{ value: 'Code128', label: 'Code128' }, { value: 'QR', label: 'QR' }, { value: 'EAN-13', label: 'EAN-13' }, { value: 'UPC-A', label: 'UPC-A' }]} />
              <TextInput label="Content" value={settings.barcodeContent ?? ''} onChange={(v) => onSettingsChange({ barcodeContent: v })} />
              <Slider label="Width" value={settings.barcodeWidth ?? 2} min={1} max={10} onChange={(v) => onSettingsChange({ barcodeWidth: v })} />
              <Slider label="Height" value={settings.barcodeHeight ?? 50} min={20} max={200} onChange={(v) => onSettingsChange({ barcodeHeight: v })} />
              <Toggle label="Show text below" value={settings.barcodeShowText ?? true} onChange={(v) => onSettingsChange({ barcodeShowText: v })} />
              <Select label="Format" value={settings.barcodeFormat ?? 'png'} onChange={(v) => onSettingsChange({ barcodeFormat: v as RightPanelSettings['barcodeFormat'] })} options={[{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }]} />
              <Toggle label="Include checksum" value={settings.barcodeChecksum ?? true} onChange={(v) => onSettingsChange({ barcodeChecksum: v })} />
            </>
          ),
        },
        {
          id: 'invoice_pdf',
          label: 'Invoice PDF',
          icon: Receipt,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select label="Template" value={settings.invoiceTemplate ?? 'simple'} onChange={(v) => onSettingsChange({ invoiceTemplate: v as RightPanelSettings['invoiceTemplate'] })} options={[{ value: 'simple', label: 'Simple' }, { value: 'detailed', label: 'Detailed' }]} />
              <TextInput label="Currency" value={settings.invoiceCurrency ?? 'USD'} placeholder="USD" onChange={(v) => onSettingsChange({ invoiceCurrency: v })} />
              <NumberInput label="Tax rate (%)" value={settings.invoiceTaxRate} placeholder="0" onChange={(v) => onSettingsChange({ invoiceTaxRate: v })} />
              <TextInput label="Logo URL" value={settings.invoiceLogo ?? ''} placeholder="Optional" onChange={(v) => onSettingsChange({ invoiceLogo: v })} />
              <SegmentedControl label="Line items source" value={settings.invoiceItemsSource ?? 'manual'} onChange={(v) => onSettingsChange({ invoiceItemsSource: v as RightPanelSettings['invoiceItemsSource'] })} options={[{ value: 'manual', label: 'Manual' }, { value: 'csv', label: 'CSV' }]} />
            </>
          ),
        },
        {
          id: 'certificate_pdf',
          label: 'Certificate PDF',
          icon: Award,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <Select label="Template" value={settings.certificatePdfTemplate ?? 'minimal'} onChange={(v) => onSettingsChange({ certificatePdfTemplate: v as RightPanelSettings['certificatePdfTemplate'] })} options={[{ value: 'minimal', label: 'Minimal' }, { value: 'formal', label: 'Formal' }]} />
              <TextArea label="Placeholder fields" value={settings.certificatePdfPlaceholders ?? ''} placeholder="name, date, title — one per line" onChange={(v) => onSettingsChange({ certificatePdfPlaceholders: v })} rows={3} />
              <TextInput label="Logo URL" value={settings.certificatePdfLogo ?? ''} placeholder="Optional" onChange={(v) => onSettingsChange({ certificatePdfLogo: v })} />
              <Select label="Border style" value={settings.certificatePdfBorder ?? 'simple'} onChange={(v) => onSettingsChange({ certificatePdfBorder: v })} options={[{ value: 'simple', label: 'Simple' }, { value: 'ornate', label: 'Ornate' }, { value: 'none', label: 'None' }]} />
            </>
          ),
        },
      ],
    },
    {
      id: 'security',
      label: 'Security',
      icon: Lock,
      tools: [
        {
          id: 'password_protect',
          label: 'Password Protect',
          icon: Lock,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Open password" value={settings.openPassword ?? ''} type="password" onChange={(v) => onSettingsChange({ openPassword: v })} />
              <TextInput label="Permissions password" value={settings.permissionsPassword ?? ''} type="password" onChange={(v) => onSettingsChange({ permissionsPassword: v })} />
              <Select label="Encryption level" value={String(settings.encryptionLevel ?? 256)} onChange={(v) => onSettingsChange({ encryptionLevel: Number(v) as 128 | 256 })} options={[{ value: '128', label: '128-bit' }, { value: '256', label: '256-bit' }]} />
              <Toggle label="Allow accessibility" value={settings.allowAccessibility ?? true} onChange={(v) => onSettingsChange({ allowAccessibility: v })} />
              <Toggle label="Allow form fill" value={settings.allowFormFill ?? false} onChange={(v) => onSettingsChange({ allowFormFill: v })} />
              <TextInput label="Password expiry" value={settings.passwordExpiry ?? ''} placeholder="YYYY-MM-DD or blank" onChange={(v) => onSettingsChange({ passwordExpiry: v })} />
              <Toggle label="Restrict printing" value={settings.restrictPrinting ?? false} onChange={(v) => onSettingsChange({ restrictPrinting: v })} />
              <Toggle label="Restrict editing" value={settings.restrictEditing ?? false} onChange={(v) => onSettingsChange({ restrictEditing: v })} />
              <Toggle label="Restrict copying" value={settings.restrictCopying ?? false} onChange={(v) => onSettingsChange({ restrictCopying: v })} />
            </>
          ),
        },
        {
          id: 'remove_password',
          label: 'Remove Password',
          icon: Unlock,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Current password" value={settings.currentPassword ?? ''} type="password" onChange={(v) => onSettingsChange({ currentPassword: v })} />
              <Toggle label="Remove all security" sublabel="Not just open password" value={settings.removeAllSecurity ?? false} onChange={(v) => onSettingsChange({ removeAllSecurity: v })} />
            </>
          ),
        },
        { id: 'redact_content', label: 'Redact Content', icon: EyeOff, hasSettings: false },
        {
          id: 'add_watermark',
          label: 'Add Watermark',
          icon: Droplets,
          hasSettings: true,
          renderSettings: ({ settings, onSettingsChange }) => (
            <>
              <TextInput label="Text" value={settings.watermarkText ?? ''} placeholder="CONFIDENTIAL" onChange={(v) => onSettingsChange({ watermarkText: v })} />
              <PositionGrid label="Position" value={settings.watermarkPosition ?? 'MC'} onChange={(v) => onSettingsChange({ watermarkPosition: v })} />
              <Slider label="Opacity" value={settings.watermarkOpacity ?? 50} min={5} max={100} onChange={(v) => onSettingsChange({ watermarkOpacity: v })} formatValue={(v) => v + '%'} />
              <Slider label="Rotation" value={settings.watermarkRotation ?? 0} min={-180} max={180} onChange={(v) => onSettingsChange({ watermarkRotation: v })} formatValue={(v) => v + '°'} />
              <Slider label="Font size" value={settings.watermarkFontSize ?? 24} min={10} max={120} onChange={(v) => onSettingsChange({ watermarkFontSize: v })} formatValue={(v) => v + ' px'} />
              <ColorPicker label="Color" value={settings.watermarkColor ?? '#1A1714'} onChange={(v) => onSettingsChange({ watermarkColor: v })} />
              <Toggle label="Tile" value={settings.watermarkTile ?? false} onChange={(v) => onSettingsChange({ watermarkTile: v })} />
              <TextInput label="Font family" value={settings.watermarkFontFamily ?? ''} placeholder="e.g. Arial" onChange={(v) => onSettingsChange({ watermarkFontFamily: v })} />
              <TextInput label="Image watermark URL" value={settings.watermarkImageUrl ?? ''} placeholder="Optional" onChange={(v) => onSettingsChange({ watermarkImageUrl: v })} />
              <Slider label="Watermark scale (%)" value={settings.watermarkScale ?? 100} min={10} max={200} onChange={(v) => onSettingsChange({ watermarkScale: v })} formatValue={(v) => v + '%'} />
            </>
          ),
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Tools tab content
// ---------------------------------------------------------------------------

function ToolsTabContent({
  categories,
  expandedToolId,
  setExpandedToolId,
  onToolSelect,
  settings,
  onSettingsChange,
  onOpenOnboarding,
  onSaveTemplate,
}: {
  categories: ReturnType<typeof buildToolsList>;
  expandedToolId: ToolName | null;
  setExpandedToolId: (id: ToolName | null) => void;
  onToolSelect: (tool: ToolName, settings?: Record<string, unknown>) => void;
  settings: RightPanelSettings;
  onSettingsChange: (p: Partial<RightPanelSettings>) => void;
  onOpenOnboarding: () => void;
  onSaveTemplate?: () => void;
}) {
  return (
    <div style={{ padding: 0 }}>
      {categories.map((cat) => (
        <CategorySection key={cat.id} id={cat.id} label={cat.label} icon={cat.icon} defaultOpen={true}>
          {cat.tools.map((tool) => (
            <ToolRow
              key={tool.id}
              tool={tool}
              expanded={expandedToolId === tool.id}
              onToggleExpand={() => setExpandedToolId(expandedToolId === tool.id ? null : tool.id)}
              onToolSelect={onToolSelect}
              settings={settings}
              onSettingsChange={onSettingsChange}
              onOpenOnboarding={onOpenOnboarding}
              onSaveTemplate={onSaveTemplate}
            />
          ))}
        </CategorySection>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview tab
// ---------------------------------------------------------------------------

function PreviewTabContent({
  result,
  onZoomChange,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  settings,
  onSettingsChange,
}: {
  result: ToolResult | null;
  onZoomChange?: (zoom: number) => void;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  settings: RightPanelSettings;
  onSettingsChange: (p: Partial<RightPanelSettings>) => void;
}) {
  const hasResult = !!result;
  const zoomOptions = [50, 75, 100, 150, 200];
  const zoom = settings.zoom ?? 100;
  const isPdf = hasResult && result!.mimeType === 'application/pdf';
  const previewMode = settings.previewMode ?? (isPdf ? 'page' : 'frames');
  return (
    <div style={{ padding: '12px' }}>
      <SectionLabel>View</SectionLabel>
      <SegmentedControl
        label=""
        value={previewMode}
        onChange={(v) => onSettingsChange({ previewMode: v as RightPanelSettings['previewMode'] })}
        options={[
          ...(isPdf
            ? [
                { value: 'page', label: 'Pages' },
                { value: 'text', label: 'Text' },
              ]
            : []),
          { value: 'frames', label: 'All docs' },
        ]}
      />
      <Divider />
      <SectionLabel>Zoom</SectionLabel>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 8 }}>
        {zoomOptions.map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => {
              onZoomChange?.(z);
              onSettingsChange({ zoom: z });
            }}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              fontFamily,
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: zoom === z ? 'var(--accent)' : 'var(--white)',
              color: zoom === z ? 'var(--canvas)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {z}%
          </button>
        ))}
      </div>
      <Toggle
        label="Fit to width"
        value={settings.fitToWidth ?? false}
        onChange={(v) => onSettingsChange({ fitToWidth: v })}
      />
      <Toggle
        label="Show grid"
        value={settings.showGrid ?? false}
        onChange={(v) => onSettingsChange({ showGrid: v })}
      />
      {isPdf && totalPages > 0 && hasResult && (
        <>
          <Divider />
          <SectionLabel>Page</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                fontFamily,
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--white)',
                color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: currentPage <= 1 ? 'default' : 'pointer',
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                fontFamily,
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--white)',
                color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: currentPage >= totalPages ? 'default' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
      <Divider />
      <SectionLabel>Background</SectionLabel>
      <SegmentedControl
        label=""
        value={settings.previewBackground ?? 'paper'}
        onChange={(v) => onSettingsChange({ previewBackground: v as RightPanelSettings['previewBackground'] })}
        options={[
          { value: 'paper', label: 'Paper' },
          { value: 'white', label: 'White' },
          { value: 'gray', label: 'Gray' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// More tab
// ---------------------------------------------------------------------------

function MoreTabContent({
  settings,
  onSettingsChange,
  result,
}: {
  settings: RightPanelSettings;
  onSettingsChange: (p: Partial<RightPanelSettings>) => void;
  result: ToolResult | null;
}) {
  const watermarkEnabled = settings.watermarkEnabled ?? false;
  return (
    <div style={{ padding: '12px' }}>
      <SectionLabel>Export</SectionLabel>
      <Select
        label="Format"
        value={settings.exportFormat ?? 'pdf'}
        onChange={(v) =>
          onSettingsChange({
            exportFormat: v as RightPanelSettings['exportFormat'],
          })
        }
        options={[
          { value: 'pdf', label: 'PDF' },
          { value: 'png', label: 'PNG' },
          { value: 'jpg', label: 'JPG' },
          { value: 'svg', label: 'SVG' },
        ]}
      />
      <Slider
        label="Scale"
        value={settings.exportScale ?? 1}
        min={0.5}
        max={3}
        step={0.5}
        onChange={(v) => onSettingsChange({ exportScale: v })}
        formatValue={(v) => `${v.toFixed(1)}x`}
      />
      <Select
        label="Pages"
        value={settings.exportPagesMode ?? 'all'}
        onChange={(v) =>
          onSettingsChange({
            exportPagesMode: v as RightPanelSettings['exportPagesMode'],
          })
        }
        options={[
          { value: 'all', label: 'All pages' },
          { value: 'current', label: 'Current page' },
          { value: 'range', label: 'Page range' },
        ]}
      />
      {settings.exportPagesMode === 'range' && (
        <TextInput
          label="Page range"
          value={settings.exportPagesRange ?? ''}
          placeholder="e.g. 1–3, 5"
          onChange={(v) => onSettingsChange({ exportPagesRange: v })}
        />
      )}
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          disabled={!result}
          onClick={() => {
            if (!result) return;
            // For now, export triggers a direct download of the current result.
            const a = document.createElement('a');
            a.href = result.downloadUrl;
            a.download = result.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            fontSize: 12,
            fontFamily: 'Geist, sans-serif',
            cursor: result ? 'pointer' : 'default',
            background: result ? 'var(--text-primary)' : 'var(--border)',
            color: result ? 'var(--canvas)' : 'var(--text-muted)',
            transition: 'opacity 150ms ease',
          }}
        >
          Export
        </button>
      </div>
      <Divider />
      <SectionLabel>Watermark</SectionLabel>
      <Toggle label="Enable watermark" sublabel="Applied to all outputs" value={watermarkEnabled} onChange={(v) => onSettingsChange({ watermarkEnabled: v })} />
      {watermarkEnabled && (
        <>
          <TextInput label="Text" value={settings.watermarkText ?? ''} onChange={(v) => onSettingsChange({ watermarkText: v })} />
          <PositionGrid label="Position" value={settings.watermarkPosition ?? 'MC'} onChange={(v) => onSettingsChange({ watermarkPosition: v })} />
          <Slider label="Opacity" value={settings.watermarkOpacity ?? 50} min={5} max={100} onChange={(v) => onSettingsChange({ watermarkOpacity: v })} formatValue={(v) => v + '%'} />
          <Slider label="Rotation" value={settings.watermarkRotation ?? 0} min={-180} max={180} onChange={(v) => onSettingsChange({ watermarkRotation: v })} formatValue={(v) => v + '°'} />
          <Slider label="Font size" value={settings.watermarkFontSize ?? 24} min={10} max={120} onChange={(v) => onSettingsChange({ watermarkFontSize: v })} formatValue={(v) => v + ' px'} />
          <ColorPicker label="Color" value={settings.watermarkColor ?? '#1A1714'} onChange={(v) => onSettingsChange({ watermarkColor: v })} />
          <Toggle label="Tile" value={settings.watermarkTile ?? false} onChange={(v) => onSettingsChange({ watermarkTile: v })} />
        </>
      )}
      <Divider />
      <SectionLabel>Preferences</SectionLabel>
      <Toggle label="Auto-download result" sublabel="Skips the download button" value={settings.autoDownload ?? false} onChange={(v) => onSettingsChange({ autoDownload: v })} />
      <Toggle label="Strip metadata by default" sublabel="For all image exports" value={settings.stripMetadataDefault ?? false} onChange={(v) => onSettingsChange({ stripMetadataDefault: v })} />
      <Select
        label="Default output format (PDF)"
        value={settings.defaultPdfFormat ?? 'pdf'}
        onChange={(v) => onSettingsChange({ defaultPdfFormat: v as RightPanelSettings['defaultPdfFormat'] })}
        options={[{ value: 'pdf', label: 'PDF' }, { value: 'docx', label: 'DOCX' }, { value: 'pptx', label: 'PPTX' }]}
      />
      <Select
        label="Default output format (Images)"
        value={settings.defaultImageFormat ?? 'original'}
        onChange={(v) => onSettingsChange({ defaultImageFormat: v as RightPanelSettings['defaultImageFormat'] })}
        options={[{ value: 'original', label: 'Original' }, { value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }, { value: 'webp', label: 'WEBP' }]}
      />
    </div>
  );
}

// Lazy map: tool id → Lucide icon (for orchestrator loading animation)
let toolIconMap: Map<string, LucideIcon> | null = null;
function getToolIconMap(): Map<string, LucideIcon> {
  if (toolIconMap) return toolIconMap;
  toolIconMap = new Map();
  const list = buildToolsList();
  for (const cat of list) {
    for (const tool of cat.tools) {
      toolIconMap.set(tool.id, tool.icon);
    }
  }
  return toolIconMap;
}

export function getToolIcon(toolName: string): LucideIcon {
  return getToolIconMap().get(toolName) ?? FileText;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RightPanel({
  isOpen,
  result,
  lastTool,
  onToggle,
  onToolSelect,
  onOpenOnboarding,
  onSaveTemplate,
  onZoomChange,
  onPageChange,
  currentPage = 1,
  totalPages = 0,
  settings,
  onSettingsChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<'tools' | 'preview' | 'more'>('tools');
  const [expandedToolId, setExpandedToolId] = useState<ToolName | null>(null);
  const categories = useMemo(() => buildToolsList(onOpenOnboarding), [onOpenOnboarding]);

  // Collapsed: 48px icon rail
  if (!isOpen) {
    const tabIcons: { Icon: LucideIcon; id: 'tools' | 'preview' | 'more'; title: string }[] = [
      { Icon: Wrench, id: 'tools', title: 'Tools' },
      { Icon: Eye, id: 'preview', title: 'Preview' },
      { Icon: MoreHorizontal, id: 'more', title: 'More' },
    ];
    const categoryIcons = [
      { Icon: FileText, title: 'PDF' },
      { Icon: Layout, title: 'Document' },
      { Icon: Image, title: 'Images' },
      { Icon: PenLine, title: 'Sign & Fill' },
      { Icon: QrCode, title: 'Generate' },
      { Icon: Lock, title: 'Security' },
    ];
    return (
      <aside
        className="flex flex-col items-center py-4 shrink-0"
        style={{
          width: 48,
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg)',
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 6,
          }}
          title="Expand panel"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
        {/* Tab icons as tiny hints (Tools / Preview / More) */}
        {tabIcons.map(({ Icon, id, title }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                onToggle();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                padding: 4,
                borderRadius: 8,
              }}
              title={title}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <Icon size={14} strokeWidth={1.5} />
            </button>
          );
        })}
        <div
          style={{
            width: 24,
            borderTop: '1px solid var(--border)',
            margin: '6px 0 2px',
          }}
        />
        {categoryIcons.map(({ Icon, title }) => (
          <button
            key={title}
            type="button"
            onClick={onToggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}
            title={title}
          >
            <Icon size={15} strokeWidth={1.5} />
          </button>
        ))}
      </aside>
    );
  }

  // Open: 260px panel with header (collapse) + tabs
  const tabs: { id: 'tools' | 'preview' | 'more'; icon: LucideIcon; label: string }[] = [
    { id: 'tools', icon: Wrench, label: 'Tools' },
    { id: 'preview', icon: Eye, label: 'Preview' },
    { id: 'more', icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: 260,
        borderLeft: '1px solid var(--border)',
        background: 'var(--white)',
        height: '100%',
      }}
    >
      {/* Header: collapse button (arrow) so panel can be closed */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexShrink: 0,
          height: 40,
          paddingLeft: 12,
          paddingRight: 8,
          borderBottom: '1px solid var(--border)',
          background: 'var(--white)',
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          title="Close panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            background: 'none',
            border: 'none',
            borderRadius: 6,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontFamily,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          width: '100%',
          borderBottom: '1px solid var(--border)',
          fontFamily,
        }}
      >
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '8px 6px',
              fontSize: 11,
              fontFamily,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <Icon size={12} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      <div
        className="right-panel-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {activeTab === 'tools' && (
          <ToolsTabContent
            categories={categories}
            expandedToolId={expandedToolId}
            setExpandedToolId={setExpandedToolId}
            onToolSelect={onToolSelect}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onOpenOnboarding={onOpenOnboarding}
            onSaveTemplate={onSaveTemplate}
          />
        )}
        {activeTab === 'preview' && (
          <PreviewTabContent
            result={result}
            onZoomChange={onZoomChange}
            onPageChange={onPageChange}
            currentPage={currentPage}
            totalPages={totalPages}
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        )}
        {activeTab === 'more' && (
          <MoreTabContent
            settings={settings}
            onSettingsChange={onSettingsChange}
            result={result}
          />
        )}
      </div>
    </aside>
  );
}
