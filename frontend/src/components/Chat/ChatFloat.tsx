import { useRef, useState, useEffect, type KeyboardEvent } from 'react';
import { Paperclip, ArrowUp, X, Square } from 'lucide-react';
import type { ChatMessage } from '../../types';
import ChatMessageComp from './ChatMessage';
import FormatBadge from '../ui/FormatBadge';
import { getFileFormatInfo, getConversionWarning } from '../../lib/fileFormat';

function ThinkingDotsInline() {
  return (
    <div
      className="flex items-center justify-center gap-1.5 w-full max-w-lg pointer-events-auto mb-2"
      style={{
        padding: '8px 10px',
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        color: 'var(--text-muted)',
        fontFamily: 'var(--chat-font-family)',
        fontSize: 12,
      }}
      aria-label="Corner is thinking"
    >
      <span style={{ marginRight: 6 }}>Corner is thinking</span>
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
  messages: ChatMessage[];
  /** Prefer currentFiles; currentFile is supported for backward compatibility */
  currentFiles?: File[];
  currentFile?: File | null;
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
  /** When set and disabled (processing), show a red stop button that calls this to cancel */
  onStop?: () => void;
  /** When true, input floats up below the drop zone (empty state) */
  floatUp?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Called when user clears the dropped file(s) (optional) */
  onClearCurrentFiles?: () => void;
  onClearCurrentFile?: () => void;
}

export default function ChatFloat({ messages, currentFiles: currentFilesProp, currentFile: currentFileProp, onSend, disabled, onStop, floatUp, onFocus, onBlur, onClearCurrentFiles, onClearCurrentFile }: Props) {
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [conversionWarning, setConversionWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentFiles = currentFilesProp ?? (currentFileProp ? [currentFileProp] : []);
  const onClear = onClearCurrentFiles ?? onClearCurrentFile;
  const hasCurrentFiles = currentFiles.length > 0;
  const firstFile = currentFiles[0] ?? attachedFiles[0] ?? null;
  /** Single-file alias for backward compatibility (some callers/code paths may reference currentFile) */
  const currentFile = firstFile ?? currentFileProp ?? null;

  useEffect(() => {
    if (firstFile) {
      setConversionWarning(getConversionWarning(getFileFormatInfo(firstFile.name)));
    } else {
      setConversionWarning(null);
    }
  }, [firstFile?.name, attachedFiles.length, currentFiles.length]);

  const recentMessages = messages.slice(-3);
  const canSend = !!(text.trim() || attachedFiles.length > 0 || hasCurrentFiles) && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const files = attachedFiles.length > 0 ? attachedFiles : currentFiles;
    onSend(text.trim(), files);
    setText('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) setAttachedFiles((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const placeholder = disabled
    ? 'working on it...'
    : hasCurrentFiles && attachedFiles.length === 0
    ? (currentFiles.length === 1 ? `${currentFiles[0].name} ready — ask anything...` : `${currentFiles.length} files ready — ask anything...`)
    : 'ask anything or drop a file...';

  const hasFiles = attachedFiles.length > 0 || hasCurrentFiles;

  return (
    <div
      className="absolute left-0 right-0 flex flex-col items-center pointer-events-none"
      style={{
        zIndex: 10,
        padding: '12px 16px 20px',
        bottom: floatUp ? '22%' : 0,
        transition: 'bottom 420ms ease',
      }}
    >
      {/* Slim message strip — canvas-style: last 3 only */}
      {recentMessages.length > 0 && (
        <div className="flex flex-col gap-1.5 w-full max-w-lg pointer-events-auto mb-2">
          {recentMessages.map((msg) => (
            <ChatMessageComp key={msg.id} message={msg} compact />
          ))}
        </div>
      )}

      {/* When processing (orchestrator planning), show a clear thinking indicator */}
      {disabled && <ThinkingDotsInline />}

      {/* Claude-style expandable input card — chips inside, expand upward when files added */}
      <div
        className="w-full max-w-xl pointer-events-auto flex flex-col overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: floatUp ? 'var(--shadow-realistic)' : 'var(--shadow-sm)',
          transition: 'box-shadow 420ms ease, border-radius 280ms ease',
        }}
      >
        {/* File chips row — inside card, aligned with input row */}
        {hasFiles && (
          <div
            className="flex flex-wrap items-center gap-2 w-full"
            style={{
              padding: '10px 12px 12px',
              borderBottom: '1px solid var(--border)',
              fontFamily: 'Geist, sans-serif',
              animation: 'chatFloatExpand 220ms ease-out',
            }}
          >
            {currentFiles.map((file, i) => (
              <div
                key={`current-${i}-${file.name}`}
                className="flex items-center gap-2 shrink-0 rounded-full transition-colors duration-150"
                style={{
                  height: 32,
                  paddingLeft: 8,
                  paddingRight: 6,
                  background: 'var(--hover)',
                  border: '1px solid var(--border)',
                  maxWidth: 220,
                }}
              >
                <FormatBadge fileName={file.name} size="sm" />
                <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </span>
                {onClear && currentFiles.length === 1 && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors duration-150 hover:bg-(--border)"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Remove file"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
            {currentFiles.length > 1 && onClear && (
              <button
                type="button"
                onClick={onClear}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Clear all
              </button>
            )}
            {attachedFiles.map((f, i) => (
              <div
                key={`attached-${i}-${f.name}`}
                className="flex items-center gap-2 shrink-0 rounded-full transition-colors duration-150"
                style={{
                  height: 32,
                  paddingLeft: 8,
                  paddingRight: 6,
                  background: 'var(--hover)',
                  border: '1px solid var(--border)',
                  maxWidth: 220,
                }}
              >
                <FormatBadge fileName={f.name} size="sm" />
                <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors duration-150 hover:bg-(--border)"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Remove file"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            {conversionWarning && (
              <div
                className="w-full"
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
                      const file = firstFile;
                      if (file) onSend(`Convert ${file.name} to PDF`, []);
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
            {/* Study + citation quick actions */}
            <div className="flex flex-wrap items-center gap-2 w-full" style={{ marginTop: 8 }}>
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
                  className="shrink-0"
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
          </div>
        )}

        {/* Input row — same horizontal padding as chips for alignment */}
        <div
          className="flex items-center gap-1 flex-1 w-full"
          style={{
            minHeight: 44,
            padding: hasFiles ? '10px 12px 12px' : '8px 12px',
            transition: 'padding 220ms ease',
          }}
        >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 flex items-center justify-center transition-colors duration-150"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'transparent',
            color: attachedFiles.length > 0 || hasCurrentFiles ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title="Attach file"
        >
          <Paperclip size={14} strokeWidth={1.5} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.docx,.doc,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.svg,.gif"
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none py-2 px-2"
          style={{
            fontFamily: 'var(--chat-font-family)',
            fontSize: 13,
            color: 'var(--text-primary)',
            minHeight: 24,
            maxHeight: 100,
            lineHeight: 1.3,
            border: 'none',
            caretColor: 'var(--accent)',
          }}
        />
        {disabled && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 flex items-center justify-center transition-opacity duration-150"
            style={{
              width: 32,
              height: 32,
              marginRight: 6,
              borderRadius: 6,
              background: '#dc2626',
              color: 'var(--white)',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            aria-label="Stop"
            title="Stop"
          >
            <Square size={14} fill="currentColor" stroke="none" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 flex items-center justify-center transition-opacity duration-150"
            style={{
              width: 32,
              height: 32,
              marginRight: 6,
              borderRadius: 6,
              background: canSend ? 'var(--accent)' : 'transparent',
              color: canSend ? 'var(--white)' : 'var(--text-muted)',
              cursor: canSend ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => { canSend && (e.currentTarget.style.opacity = '0.88'); }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <ArrowUp size={14} strokeWidth={2} />
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
