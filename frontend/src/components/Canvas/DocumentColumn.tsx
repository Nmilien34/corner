import { useState, useEffect } from 'react';
import { Maximize2, ChevronLeft, ChevronRight, Music, FileText, PanelRightOpen, PanelRightClose } from 'lucide-react';
import DocumentViewer from './DocumentViewer';
import type { ToolResult } from '../../types';
import FormatBadge from '../ui/FormatBadge';
import { getFileFormatInfo } from '../../lib/fileFormat';

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
  chatCollapsed?: boolean;
  onToggleChat?: () => void;
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
  chatCollapsed,
  onToggleChat,
}: Props) {
  const [totalPagesFromViewer, setTotalPagesFromViewer] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Reset page when document changes
  useEffect(() => {
    setCurrentPage(1);
  }, [displayResult?.fileId, filePreviewUrl]);

  const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const formatInfo = getFileFormatInfo(fileName);
  const isAudio = formatInfo.isAudio || mimeType.startsWith('audio/') || mimeType.startsWith('video/');

  if (isAudio) {
    const transcription = result?.transcriptionResult;
    const audioSrc = result ? `/api/file/${result.fileId}` : filePreviewUrl;
    return (
      <div
        className="flex flex-col h-full min-w-0"
        style={{
          flex: 1,
          minWidth: 400,
          borderRight: '1px solid var(--border)',
          background: 'var(--canvas)',
        }}
      >
        {/* Toolbar */}
        <div
          className="shrink-0 flex items-center gap-2 px-3"
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
          <FormatBadge fileName={fileName} />
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
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Maximize2 size={14} strokeWidth={1.5} />
            Focus
          </button>
          {onToggleChat && (
            <button
              type="button"
              onClick={onToggleChat}
              title={chatCollapsed ? 'Show chat' : 'Hide chat'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                borderRadius: 6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {chatCollapsed ? <PanelRightOpen size={14} strokeWidth={1.5} /> : <PanelRightClose size={14} strokeWidth={1.5} />}
            </button>
          )}
        </div>

        {/* Audio content */}
        <div className="flex-1 min-h-0 overflow-auto p-4 flex flex-col gap-4">
          {/* Identity card */}
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Music size={20} color="#5B21B6" strokeWidth={1.5} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  className="truncate"
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Geist, sans-serif' }}
                  title={fileName}
                >
                  {fileName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif', marginTop: 2 }}>
                  {formatInfo.label} · {sizeBytes > 0 ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '—'}
                  {transcription && ` · ${transcription.durationLabel}`}
                </div>
              </div>
            </div>
            {audioSrc && (
              <audio
                controls
                src={audioSrc}
                style={{ width: '100%', height: 36, borderRadius: 6 }}
              />
            )}
          </div>

          {/* Transcript panel */}
          {transcription ? (
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                flex: 1,
                minHeight: 200,
              }}
            >
              <div
                className="flex items-center gap-2 px-4"
                style={{
                  height: 40,
                  borderBottom: '1px solid var(--border)',
                  flexShrink: 0,
                }}
              >
                <FileText size={14} color="var(--text-muted)" strokeWidth={1.5} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Geist, sans-serif' }}>
                  Transcript
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif', marginLeft: 'auto' }}>
                  {transcription.wordCount.toLocaleString()} words · {transcription.durationLabel}
                </span>
              </div>
              <div
                className="flex-1 overflow-auto p-4"
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: 'var(--text-primary)',
                  fontFamily: 'Geist, sans-serif',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {result?.formattedTranscript ?? transcription.transcript}
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-3"
              style={{
                flex: 1,
                minHeight: 160,
                color: 'var(--text-muted)',
                fontFamily: 'Geist, sans-serif',
              }}
            >
              <FileText size={28} strokeWidth={1.25} />
              <span style={{ fontSize: 13 }}>Ask Corner to transcribe this file</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full min-w-0"
      style={{
        flex: 1,
        minWidth: 400,
        borderRight: '1px solid var(--border)',
        background: 'var(--canvas)',
      }}
    >
      {/* Toolbar: 40px, filename, type badge, page count, Focus, Chat toggle */}
      <div
        className="shrink-0 flex items-center gap-2 px-3"
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
        <FormatBadge fileName={fileName} />
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
        {onToggleChat && (
          <button
            type="button"
            onClick={onToggleChat}
            title={chatCollapsed ? 'Show chat' : 'Hide chat'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              borderRadius: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {chatCollapsed ? <PanelRightOpen size={14} strokeWidth={1.5} /> : <PanelRightClose size={14} strokeWidth={1.5} />}
          </button>
        )}
      </div>

      {/* Document view — own scroll */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {displayResult ? (
          <DocumentViewer
            result={displayResult}
            page={currentPage}
            onPageChange={setCurrentPage}
            previewMode={previewMode}
            zoomPercent={zoomPercent}
            onTotalPages={isPdf ? setTotalPagesFromViewer : undefined}
            hidePageNav
            hideResultCard
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

      {/* Bottom page navigation bar for PDFs */}
      {isPdf && totalPages != null && totalPages > 1 && (
        <div
          style={{
            height: 40,
            borderTop: '1px solid var(--border)',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* Previous button */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--white)',
              color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: 'Geist, sans-serif',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              transition: '150ms ease',
            }}
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
            Prev
          </button>

          {/* Page indicator */}
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: 'Geist, sans-serif',
              minWidth: 60,
              textAlign: 'center',
            }}
          >
            {currentPage} of {totalPages}
          </span>

          {/* Next button */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--white)',
              color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: 'Geist, sans-serif',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              transition: '150ms ease',
            }}
          >
            Next
            <ChevronRight size={13} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
