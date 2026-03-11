export type FileFormat =
  | 'PDF' | 'DOCX' | 'DOC' | 'PPTX' | 'PPT'
  | 'XLSX' | 'XLS' | 'CSV' | 'JPG' | 'PNG'
  | 'WEBP' | 'AVIF' | 'GIF' | 'SVG' | 'TXT'
  | 'MD' | 'MP3' | 'MP4' | 'M4A' | 'WAV'
  | 'WEBM' | 'OGG' | 'FLAC' | 'AAC' | 'MOV'
  | 'UNKNOWN'

export type FormatCategory = 'document' | 'image' | 'spreadsheet' | 'presentation' | 'vector' | 'text' | 'audio' | 'unknown'

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
  isAudio: boolean
}

const FORMAT_MAP: Record<string, FileFormatInfo> = {
  pdf: {
    format: 'PDF', category: 'document', label: 'PDF',
    color: '#FEE2E2', textColor: '#991B1B',
    canSign: true, needsConversionToSign: false,
    canOCR: true, isImage: false, isPDF: true, isAudio: false,
  },
  docx: {
    format: 'DOCX', category: 'document', label: 'Word',
    color: '#DBEAFE', textColor: '#1E40AF',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  doc: {
    format: 'DOC', category: 'document', label: 'Word',
    color: '#DBEAFE', textColor: '#1E40AF',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  pptx: {
    format: 'PPTX', category: 'presentation', label: 'PowerPoint',
    color: '#FFEDD5', textColor: '#9A3412',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  ppt: {
    format: 'PPT', category: 'presentation', label: 'PowerPoint',
    color: '#FFEDD5', textColor: '#9A3412',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  xlsx: {
    format: 'XLSX', category: 'spreadsheet', label: 'Excel',
    color: '#DCFCE7', textColor: '#166534',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  xls: {
    format: 'XLS', category: 'spreadsheet', label: 'Excel',
    color: '#DCFCE7', textColor: '#166534',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  csv: {
    format: 'CSV', category: 'spreadsheet', label: 'CSV',
    color: '#F0FDF4', textColor: '#15803D',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  jpg: {
    format: 'JPG', category: 'image', label: 'JPG',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: true, isImage: true, isPDF: false, isAudio: false,
  },
  jpeg: {
    format: 'JPG', category: 'image', label: 'JPG',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: true, isImage: true, isPDF: false, isAudio: false,
  },
  png: {
    format: 'PNG', category: 'image', label: 'PNG',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: true, isImage: true, isPDF: false, isAudio: false,
  },
  webp: {
    format: 'WEBP', category: 'image', label: 'WEBP',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: true, isPDF: false, isAudio: false,
  },
  avif: {
    format: 'AVIF', category: 'image', label: 'AVIF',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: true,
    canOCR: false, isImage: true, isPDF: false, isAudio: false,
  },
  gif: {
    format: 'GIF', category: 'image', label: 'GIF',
    color: '#FDF4FF', textColor: '#7E22CE',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: true, isPDF: false, isAudio: false,
  },
  svg: {
    format: 'SVG', category: 'vector', label: 'SVG',
    color: '#FEF9C3', textColor: '#854D0E',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: true, isPDF: false, isAudio: false,
  },
  txt: {
    format: 'TXT', category: 'text', label: 'TXT',
    color: '#F1F5F9', textColor: '#475569',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  md: {
    format: 'MD', category: 'text', label: 'Markdown',
    color: '#F1F5F9', textColor: '#475569',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
  },
  mp3: {
    format: 'MP3', category: 'audio', label: 'MP3',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
  mp4: {
    format: 'MP4', category: 'audio', label: 'MP4',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
  m4a: {
    format: 'M4A', category: 'audio', label: 'M4A',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
  wav: {
    format: 'WAV', category: 'audio', label: 'WAV',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
  webm: {
    format: 'WEBM', category: 'audio', label: 'WEBM',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
  ogg: {
    format: 'OGG', category: 'audio', label: 'OGG',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
  flac: {
    format: 'FLAC', category: 'audio', label: 'FLAC',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
  aac: {
    format: 'AAC', category: 'audio', label: 'AAC',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
  mov: {
    format: 'MOV', category: 'audio', label: 'MOV',
    color: '#EDE9FE', textColor: '#5B21B6',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: true,
  },
}

export function getFileFormatInfo(fileName: string): FileFormatInfo {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return FORMAT_MAP[ext] ?? {
    format: 'UNKNOWN', category: 'unknown', label: 'Unknown',
    color: '#F1F5F9', textColor: '#94A3B8',
    canSign: false, needsConversionToSign: false,
    canOCR: false, isImage: false, isPDF: false, isAudio: false,
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
