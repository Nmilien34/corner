export type FileFormat =
  | 'PDF' | 'DOCX' | 'DOC' | 'PPTX' | 'PPT'
  | 'XLSX' | 'XLS' | 'CSV' | 'JPG' | 'PNG'
  | 'WEBP' | 'AVIF' | 'GIF' | 'SVG' | 'TXT'
  | 'MD' | 'UNKNOWN'

export type FormatCategory = 'document' | 'image' | 'spreadsheet' | 'presentation' | 'vector' | 'text' | 'unknown'

export interface FileFormatInfo {
  format: FileFormat
  category: FormatCategory
  label: string
  color: string
  textColor: string
  canSign: boolean
  needsConversionToSign: boolean
  canOCR: boolean
  isImage: boolean
  isPDF: boolean
}

const FORMAT_MAP: Record<string, FileFormatInfo> = {
  pdf: {
    format: 'PDF', category: 'document', label: 'PDF',
    color: '#FEE2E2', textColor: '#991B1B',
    canSign: true, needsConversionToSign: false,
    canOCR: true, isImage: false, isPDF: true,
  },
  docx: {
    format: 'DOCX', category: 'document', label: 'Word',
    color: '#DBEAFE', textColor: '#1E40AF',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false,
  },
  doc: {
    format: 'DOC', category: 'document', label: 'Word',
    color: '#DBEAFE', textColor: '#1E40AF',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false,
  },
  pptx: {
    format: 'PPTX', category: 'presentation', label: 'PowerPoint',
    color: '#FFEDD5', textColor: '#9A3412',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false,
  },
  ppt: {
    format: 'PPT', category: 'presentation', label: 'PowerPoint',
    color: '#FFEDD5', textColor: '#9A3412',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false,
  },
  xlsx: {
    format: 'XLSX', category: 'spreadsheet', label: 'Excel',
    color: '#DCFCE7', textColor: '#166534',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false,
  },
  xls: {
    format: 'XLS', category: 'spreadsheet', label: 'Excel',
    color: '#DCFCE7', textColor: '#166534',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false,
  },
  csv: {
    format: 'CSV', category: 'spreadsheet', label: 'CSV',
    color: '#F0FDF4', textColor: '#15803D',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false,
  },
  jpg: {
    format: 'JPG', category: 'image', label: 'JPG',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: true, isImage: true, isPDF: false,
  },
  jpeg: {
    format: 'JPG', category: 'image', label: 'JPG',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: true, isImage: true, isPDF: false,
  },
  png: {
    format: 'PNG', category: 'image', label: 'PNG',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: true, isImage: true, isPDF: false,
  },
  webp: {
    format: 'WEBP', category: 'image', label: 'WEBP',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: true, isPDF: false,
  },
  avif: {
    format: 'AVIF', category: 'image', label: 'AVIF',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: true, isPDF: false,
  },
  gif: {
    format: 'GIF', category: 'image', label: 'GIF',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: true, isPDF: false,
  },
  svg: {
    format: 'SVG', category: 'vector', label: 'SVG',
    color: '#FEF9C3', textColor: '#854D0E',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: true, isPDF: false,
  },
  txt: {
    format: 'TXT', category: 'text', label: 'TXT',
    color: '#F1F5F9', textColor: '#475569',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false,
  },
  md: {
    format: 'MD', category: 'text', label: 'Markdown',
    color: '#F1F5F9', textColor: '#475569',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false,
  },
}

export function getFileFormatInfo(fileName: string): FileFormatInfo {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return FORMAT_MAP[ext] ?? {
    format: 'UNKNOWN', category: 'unknown', label: 'Unknown',
    color: '#F1F5F9', textColor: '#94A3B8',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false,
  }
}

export function getConversionWarning(formatInfo: FileFormatInfo): string | null {
  if (formatInfo.needsConversionToSign) {
    return `${formatInfo.label} files need to be converted to PDF before signing. Convert automatically?`
  }
  if (formatInfo.format === 'SVG') {
    return `SVG files are vector graphics and can't be signed directly. Convert to PDF or PNG first?`
  }
  if (formatInfo.format === 'CSV') {
    return `CSV files are raw data. Convert to a formatted PDF table first?`
  }
  return null
}
