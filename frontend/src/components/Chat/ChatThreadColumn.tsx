import { useRef, useState, useEffect, type KeyboardEvent } from 'react';
import {
  Paperclip,
  ArrowUp,
  Trash2,
  MessageSquare,
  Download,
  X,
  ChevronDown,
  ChevronRight,
  Square,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType, ToolResult } from '../../types';
import FormatBadge from '../ui/FormatBadge';
import { getFileFormatInfo, getConversionWarning } from '../../lib/fileFormat';
import FollowUpActions from './FollowUpActions';

const STUDY_TOOLS = new Set(['summarize_document', 'generate_study_questions', 'extract_key_terms']);

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResultCardInline({ result }: { result: ToolResult }) {
  return (
    <a
      href={result.downloadUrl}
      download={result.fileName}
      className="flex items-center gap-2 flex-wrap"
      style={{
        marginTop: 8,
        padding: 10,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        textDecoration: 'none',
        color: 'var(--text-primary)',
        fontFamily: 'Geist, sans-serif',
      }}
    >
      <FormatBadge fileName={result.fileName} size="sm" />
      <span className="truncate flex-1 min-w-0" style={{ fontSize: 12 }}>
        {result.fileName}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {formatSize(result.sizeBytes)}
      </span>
      <Download size={14} strokeWidth={1.5} style={{ color: 'var(--accent)', flexShrink: 0 }} />
    </a>
  );
}

function StudyExportButton({
  message,
  onOpenExport,
}: {
  message: ChatMessageType;
  onOpenExport: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpenExport}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 10px',
        fontSize: 12,
        fontFamily: 'Geist, sans-serif',
        color: 'var(--accent)',
        background: 'var(--hover)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      Export
      <ChevronDown size={14} strokeWidth={2} style={{ transform: 'rotate(-90deg)' }} />
    </button>
  );
}

function ExportModal({
  message,
  resolvedText,
  onClose,
}: {
  message: ChatMessageType;
  resolvedText?: string;
  onClose: () => void;
}) {
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);
  const text = (resolvedText ?? message.result?.textContent ?? message.content ?? '').trim();

  const handlePlainText = () => {
    if (message.result?.downloadUrl) {
      const a = document.createElement('a');
      a.href = message.result.downloadUrl;
      a.download = message.result.fileName ?? 'export.txt';
      a.rel = 'noopener noreferrer';
      a.click();
    }
    onClose();
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!text) return;
    setExporting(format);
    try {
      const res = await fetch('/api/export-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          format,
          fileName: message.result?.fileName?.replace(/\.[^.]+$/, '') ?? 'export',
        }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const name = match?.[1] ?? `export.${format === 'pdf' ? 'pdf' : 'docx'}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          minWidth: 280,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="export-modal-title" style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
          How would you like to export?
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {message.result?.downloadUrl && (
            <button
              type="button"
              onClick={handlePlainText}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                textAlign: 'left',
                background: 'var(--hover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'Geist, sans-serif',
              }}
            >
              Plain text
            </button>
          )}
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={!text || exporting !== null}
            style={{
              padding: '10px 14px',
              fontSize: 13,
              textAlign: 'left',
              background: 'var(--hover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: text && !exporting ? 'pointer' : 'not-allowed',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
          </button>
          <button
            type="button"
            onClick={() => handleExport('docx')}
            disabled={!text || exporting !== null}
            style={{
              padding: '10px 14px',
              fontSize: 13,
              textAlign: 'left',
              background: 'var(--hover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: text && !exporting ? 'pointer' : 'not-allowed',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            {exporting === 'docx' ? 'Exporting…' : 'Word'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1" style={{ padding: '10px 14px' }}>
      <span
        className="rounded-full animate-thinking-dot"
        style={{ width: 4, height: 4, background: 'var(--accent)' }}
      />
      <span
        className="rounded-full animate-thinking-dot"
        style={{ width: 4, height: 4, background: 'var(--accent)', animationDelay: '0.15s' }}
      />
      <span
        className="rounded-full animate-thinking-dot"
        style={{ width: 4, height: 4, background: 'var(--accent)', animationDelay: '0.3s' }}
      />
    </div>
  );
}

interface Props {
  messages: ChatMessageType[];
  isProcessing: boolean;
  onSend: (text: string, files: File[]) => void;
  onClearThread: () => void;
  disabled?: boolean;
  /** When set and disabled (processing), show a red stop button that calls this to cancel */
  onStop?: () => void;
  /** Optional: planner "understanding" shown in a collapsible disclosure */
  planUnderstanding?: string | null;
  currentFiles: File[];
  onClearCurrentFiles?: () => void;
  /** When provided, renders a collapse button in the header */
  onCollapse?: () => void;
}

export default function ChatThreadColumn({
  messages,
  isProcessing,
  onSend,
  onClearThread,
  disabled,
  onStop,
  planUnderstanding,
  currentFiles,
  onClearCurrentFiles,
  onCollapse,
}: Props) {
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [exportModalMessage, setExportModalMessage] = useState<ChatMessageType | null>(null);
  const [exportModalResolvedText, setExportModalResolvedText] = useState<string | undefined>(undefined);
  const [fetchedStudyContent, setFetchedStudyContent] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchedStudyIdsRef = useRef<Set<string>>(new Set());
  // Fallback: fetch study-tool result from downloadUrl when textContent is missing
  useEffect(() => {
    messages.forEach((msg) => {
      if (
        msg.role !== 'corner' ||
        !msg.result ||
        (!STUDY_TOOLS.has(msg.toolName ?? '') && !STUDY_TOOLS.has(msg.result.studyTool ?? '')) ||
        (msg.result.textContent ?? msg.content)?.trim() ||
        !msg.result.downloadUrl ||
        fetchedStudyIdsRef.current.has(msg.id)
      )
        return;
      fetchedStudyIdsRef.current.add(msg.id);
      fetch(msg.result.downloadUrl)
        .then((r) => r.text())
        .then((t) => setFetchedStudyContent((prev) => ({ ...prev, [msg.id]: t })))
        .catch(() => {});
    });
  }, [messages]);

  const hasCurrentFiles = currentFiles.length > 0;
  const firstFile = currentFiles[0] ?? attachedFiles[0] ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isProcessing]);

  const [conversionWarning, setConversionWarning] = useState<string | null>(null);

  useEffect(() => {
    if (firstFile) {
      setConversionWarning(getConversionWarning(getFileFormatInfo(firstFile.name)));
    } else {
      setConversionWarning(null);
    }
  }, [firstFile?.name, attachedFiles.length, currentFiles.length]);

  const canSend = !!(text.trim() || attachedFiles.length > 0 || hasCurrentFiles) && !disabled;
  const handleSend = () => {
    if (!canSend) return;
    const files = attachedFiles.length > 0 ? attachedFiles : currentFiles;
    onSend(text.trim(), files);
    setText('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: '36%',
        minWidth: 300,
        maxWidth: 480,
        flexShrink: 0,
        background: 'var(--white)',
        fontFamily: 'Geist, sans-serif',
        borderLeft: '1px solid var(--border)',
      }}
    >
      {/* Thread header — two icon buttons, no label */}
      <div
        className="shrink-0 flex items-center justify-between px-2"
        style={{
          height: 40,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            title="Collapse chat"
            style={{
              padding: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Collapse chat panel"
          >
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        ) : <div />}
        <button
          type="button"
          onClick={onClearThread}
          style={{
            padding: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          aria-label="Clear thread"
        >
          <Trash2 size={12} strokeWidth={1.5} />
        </button>
      </div>

      {/* Message list — scrollable */}
      <div
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2"
        style={{ padding: 12 }}
      >
        {planUnderstanding && (
          <details
            style={{
              alignSelf: 'flex-start',
              maxWidth: '90%',
              padding: '8px 10px',
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'var(--chat-font-family)',
            }}
          >
            <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Analysis</summary>
            <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {planUnderstanding}
            </div>
          </details>
        )}

        {messages.length === 0 && !isProcessing && (
          <div
            className="flex flex-col items-center justify-center flex-1 gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <MessageSquare size={24} strokeWidth={1} />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>No messages yet</span>
            <span style={{ fontSize: 11 }}>Ask anything about this document</span>
          </div>
        )}

        {(() => {
          const lastResultMsg = [...messages].reverse().find(
            (m) => m.role === 'corner' && (m.result || m.toolName)
          );
          const lastResultMsgId = lastResultMsg?.id;

          return messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div
                key={msg.id}
                className="text-center"
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  padding: '4px 0',
                }}
              >
                {msg.content}
              </div>
            );
          }

          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div style={{ maxWidth: '85%' }}>
                  {msg.attachmentName && (
                    <div
                      className="flex items-center gap-2 mb-1 rounded-md"
                      style={{
                        padding: '4px 8px',
                        background: 'var(--hover)',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <FormatBadge fileName={msg.attachmentName} size="sm" />
                      <span className="truncate">{msg.attachmentName}</span>
                    </div>
                  )}
                  <div
                    style={{
                      padding: '6px 10px',
                      background: 'var(--text-primary)',
                      color: 'var(--white)',
                      borderRadius: '10px 10px 2px 10px',
                      fontSize: 12,
                      fontFamily: 'var(--chat-font-family)',
                    }}
                  >
                    {msg.content?.trim() || (msg.attachmentName ? `Sent ${msg.attachmentName}` : '')}
                  </div>
                </div>
              </div>
            );
          }

          // corner (AI)
          const isStudyTool = msg.result && (STUDY_TOOLS.has(msg.toolName ?? '') || STUDY_TOOLS.has(msg.result.studyTool ?? ''));
          const studyBodyContent = msg.result?.textContent ?? msg.content ?? fetchedStudyContent[msg.id];
          const hasStudyContent = (studyBodyContent ?? '').trim().length > 0;
          return (
            <div key={msg.id} className="flex justify-start">
              <div
                style={{
                  maxWidth: '92%',
                  padding: '8px 10px',
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px 10px 10px 2px',
                  fontSize: 12,
                  lineHeight: 1.5,
                  fontFamily: 'var(--chat-font-family)',
                }}
              >
                <div className="chat-thread-markdown">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: '0 0 0.5em' }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ margin: '0.25em 0', paddingLeft: '1.25em' }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: '0.25em 0', paddingLeft: '1.25em' }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: '0.2em' }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                      h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0.5em 0 0.25em' }}>{children}</h3>,
                    }}
                  >
                    {isStudyTool ? (hasStudyContent ? studyBodyContent : 'Loading…') : msg.content}
                  </ReactMarkdown>
                </div>
                {isStudyTool ? (
                  <div style={{ marginTop: 8 }}>
                    <StudyExportButton
                      message={msg}
                      onOpenExport={() => {
                        setExportModalMessage(msg);
                        setExportModalResolvedText(msg.result?.textContent ?? msg.content ?? fetchedStudyContent[msg.id]);
                      }}
                    />
                  </div>
                ) : msg.result ? (
                  <ResultCardInline result={msg.result} />
                ) : null}
                {msg.id === lastResultMsgId && msg.toolName && (
                  <FollowUpActions
                    toolName={msg.toolName}
                    onSend={(m) => onSend(m, currentFiles.length > 0 ? currentFiles : attachedFiles)}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
          );
        });
        })()}

        {isProcessing && <ThinkingDots />}
        <div ref={endRef} />
      </div>

      {/* Input — pinned bottom; focus = accent border */}
      <div
        className="shrink-0 flex flex-col gap-1 chat-thread-input-wrap"
        style={{
          margin: '0 8px 8px',
          padding: '6px 8px',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          transition: 'border-color 150ms ease',
        }}
      >
        {hasCurrentFiles && onClearCurrentFiles && (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {currentFiles.map((file, i) => (
                <div
                  key={`current-${i}-${file.name}`}
                  className="flex items-center gap-1.5 rounded-md min-w-0"
                  style={{
                    padding: '4px 6px',
                    background: 'var(--hover)',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    maxWidth: '100%',
                  }}
                >
                  <FormatBadge fileName={file.name} size="sm" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
              <button
                type="button"
                onClick={onClearCurrentFiles}
                aria-label="Remove documents"
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Clear all
              </button>
            </div>
            {conversionWarning && firstFile && (
              <div
                style={{
                  padding: '8px 10px',
                  background: '#FFFBEB',
                  border: '1px solid #FCD34D',
                  borderRadius: 6,
                  fontSize: 11,
                  color: '#92400E',
                  fontFamily: 'Geist, sans-serif',
                }}
              >
                {conversionWarning}
                <div className="flex gap-2" style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onSend(`Convert ${firstFile.name} to PDF`, []);
                      setConversionWarning(null);
                    }}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid #92400E',
                      background: 'none',
                      color: '#92400E',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    Convert automatically
                  </button>
                  <button
                    type="button"
                    onClick={() => setConversionWarning(null)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      background: 'none',
                      color: '#92400E',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {(hasCurrentFiles || attachedFiles.length > 0) && (
          <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 6 }}>
            {[
              { label: 'Summarize', msg: 'Summarize this document' },
              { label: 'Study questions', msg: 'Generate study questions from this document' },
              { label: 'Key terms', msg: 'Extract key terms and definitions' },
              { label: 'Get citation', msg: 'Get citation for this document' },
            ].map(({ label, msg }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const files = attachedFiles.length > 0 ? attachedFiles : currentFiles;
                  onSend(msg, files);
                }}
                disabled={disabled}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: disabled ? 'default' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1" style={{ height: 44 }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          aria-label="Attach file"
        >
          <Paperclip size={14} strokeWidth={1.5} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.doc,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.svg,.gif"
          onChange={(e) => {
            if (e.target.files) setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
          }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="type a command..."
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none min-h-0"
          style={{
            fontFamily: 'var(--chat-font-family)',
            fontSize: 13,
            color: 'var(--text-primary)',
            border: 'none',
            caretColor: 'var(--accent)',
          }}
        />
        {disabled && onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop"
            title="Stop"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#dc2626',
              color: 'var(--white)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <Square size={14} fill="currentColor" stroke="none" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: canSend ? 'var(--accent)' : 'transparent',
              color: canSend ? 'var(--white)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 6,
              cursor: canSend ? 'pointer' : 'default',
            }}
          >
            <ArrowUp size={14} strokeWidth={2} />
          </button>
        )}
        </div>
      </div>
      {exportModalMessage && (
        <ExportModal
          message={exportModalMessage}
          resolvedText={exportModalResolvedText}
          onClose={() => {
            setExportModalMessage(null);
            setExportModalResolvedText(undefined);
          }}
        />
      )}
    </div>
  );
}
