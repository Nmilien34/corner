import { useRef, useState, useEffect, type KeyboardEvent } from 'react';
import {
  Paperclip,
  ArrowUp,
  Trash2,
  MessageSquare,
  Download,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType, ToolResult } from '../../types';
import FormatBadge from '../ui/FormatBadge';
import { getFileFormatInfo, getConversionWarning } from '../../lib/fileFormat';

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
  currentFile: File | null;
  onClearCurrentFile?: () => void;
}

export default function ChatThreadColumn({
  messages,
  isProcessing,
  onSend,
  onClearThread,
  disabled,
  currentFile,
  onClearCurrentFile,
}: Props) {
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isProcessing]);

  const [conversionWarning, setConversionWarning] = useState<string | null>(null);

  useEffect(() => {
    const file = currentFile ?? attachedFiles[0] ?? null;
    if (file) {
      setConversionWarning(getConversionWarning(getFileFormatInfo(file.name)));
    } else {
      setConversionWarning(null);
    }
  }, [currentFile?.name, attachedFiles.length]);

  const canSend = !!(text.trim() || attachedFiles.length > 0 || currentFile) && !disabled;
  const handleSend = () => {
    if (!canSend) return;
    const files = attachedFiles.length > 0 ? attachedFiles : currentFile ? [currentFile] : [];
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
      className="flex flex-col h-full min-w-0"
      style={{
        minWidth: 300,
        width: '42%',
        background: 'var(--white)',
        fontFamily: 'Geist, sans-serif',
      }}
    >
      {/* Thread header */}
      <div
        className="shrink-0 flex items-center justify-between px-4"
        style={{
          height: 40,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conversation</span>
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
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3"
        style={{ padding: 16 }}
      >
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

        {messages.map((msg) => {
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
                      padding: '8px 12px',
                      background: 'var(--text-primary)',
                      color: 'var(--white)',
                      borderRadius: '12px 12px 2px 12px',
                      fontSize: 13,
                    }}
                  >
                    {msg.content?.trim() || (msg.attachmentName ? `Sent ${msg.attachmentName}` : '')}
                  </div>
                </div>
              </div>
            );
          }

          // corner (AI)
          return (
            <div key={msg.id} className="flex justify-start">
              <div
                style={{
                  maxWidth: '90%',
                  padding: '10px 14px',
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px 12px 12px 2px',
                  fontSize: 13,
                  lineHeight: 1.6,
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
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.result && <ResultCardInline result={msg.result} />}
              </div>
            </div>
          );
        })}

        {isProcessing && <ThinkingDots />}
        <div ref={endRef} />
      </div>

      {/* Input — pinned bottom; focus = accent border */}
      <div
        className="shrink-0 flex flex-col gap-1 chat-thread-input-wrap"
        style={{
          margin: '0 12px 12px',
          padding: '8px 10px',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          transition: 'border-color 150ms ease',
        }}
      >
        {currentFile && onClearCurrentFile && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 rounded-md flex-1 min-w-0"
                style={{
                  padding: '4px 6px 4px 6px',
                  background: 'var(--hover)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  maxWidth: '100%',
                }}
              >
                <FormatBadge fileName={currentFile.name} size="sm" />
                <span className="truncate">{currentFile.name}</span>
                <button
                  type="button"
                  onClick={onClearCurrentFile}
                  aria-label="Remove document"
                  style={{
                    padding: 2,
                    marginLeft: 2,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
            {conversionWarning && (
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
                      onSend(`Convert ${currentFile.name} to PDF`, []);
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
          placeholder="ask anything about this document..."
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none min-h-0"
          style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: 13,
            color: 'var(--text-primary)',
            border: 'none',
            caretColor: 'var(--accent)',
          }}
        />
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
        </div>
      </div>
    </div>
  );
}
