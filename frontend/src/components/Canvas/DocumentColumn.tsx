import { useState, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import DocumentViewer from './DocumentViewer';
import type { ToolResult } from '../../types';

function fileTypeLabel(mimeType: string, fileName: string): string {
  if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) return 'PDF';
  if (mimeType.startsWith('image/')) return 'Image';
  if (/\.(docx?|doc)$/i.test(fileName)) return 'Word';
  if (/\.(xlsx?|xls|csv)$/i.test(fileName)) return 'Excel';
  if (/\.(pptx?|ppt)$/i.test(fileName)) return 'PowerPoint';
  return 'File';
}

interface Props {
  /** When set, show this result (after processing) */
  result: ToolResult | null;
  /** When set and no result, show this file (object URL for preview) */
  filePreviewUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  totalPages?: number;
  onFocus: () => void;
  previewMode?: 'page' | 'text' | 'frames';
  zoomPercent?: number;
}

export default function DocumentColumn({
  result,
  filePreviewUrl,
  fileName,
  mimeType,
  sizeBytes,
  totalPages: totalPagesProp,
  onFocus,
  previewMode = 'page',
  zoomPercent = 100,
}: Props) {
  const [totalPagesFromViewer, setTotalPagesFromViewer] = useState<number | null>(null);
  const displayResult: ToolResult | null = result ?? (filePreviewUrl
    ? {
        fileId: 'preview',
        downloadUrl: filePreviewUrl,
        fileName,
        mimeType,
        sizeBytes,
      }
    : null);

  const totalPages = totalPagesProp ?? totalPagesFromViewer;

  useEffect(() => {
    if (!result && !filePreviewUrl) setTotalPagesFromViewer(null);
  }, [result?.fileId, filePreviewUrl]);

  const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const typeLabel = fileTypeLabel(mimeType, fileName);

  return (
    <div
      className="flex flex-col h-full min-w-0"
      style={{
        minWidth: 400,
        width: '58%',
        borderRight: '1px solid var(--border)',
        background: 'var(--canvas)',
      }}
    >
      {/* Toolbar: 40px, filename, type badge, page count, Focus */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-3"
        style={{
          height: 40,
          borderBottom: '1px solid var(--border)',
          background: 'var(--white)',
          fontFamily: 'Geist, sans-serif',
        }}
      >
        <span
          className="truncate flex-1 min-w-0"
          style={{ fontSize: 12, color: 'var(--text-primary)' }}
          title={fileName}
        >
          {fileName}
        </span>
        <span
          style={{
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--hover)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {typeLabel}
        </span>
        {isPdf && totalPages != null && totalPages > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {totalPages} {totalPages === 1 ? 'page' : 'pages'}
          </span>
        )}
        <button
          type="button"
          onClick={onFocus}
          className="flex items-center gap-1.5 shrink-0"
          style={{
            padding: '4px 8px',
            fontSize: 12,
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Maximize2 size={14} strokeWidth={1.5} />
          Focus
        </button>
      </div>

      {/* Document view — own scroll */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {displayResult ? (
          <DocumentViewer
            result={displayResult}
            previewMode={previewMode}
            zoomPercent={zoomPercent}
            onTotalPages={isPdf ? setTotalPagesFromViewer : undefined}
          />
        ) : (
          <div
            className="flex items-center justify-center h-full"
            style={{ color: 'var(--text-muted)', fontSize: 13 }}
          >
            No document loaded
          </div>
        )}
      </div>
    </div>
  );
}
