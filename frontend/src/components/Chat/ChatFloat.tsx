import { useRef, useState, useEffect, type KeyboardEvent } from 'react';
import { Paperclip, ArrowUp, X } from 'lucide-react';
import type { ChatMessage } from '../../types';
import ChatMessageComp from './ChatMessage';
import FormatBadge from '../ui/FormatBadge';
import { getFileFormatInfo, getConversionWarning } from '../../lib/fileFormat';

interface Props {
  messages: ChatMessage[];
  currentFile: File | null;
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
  /** When true, input floats up below the drop zone (empty state) */
  floatUp?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Called when user removes the dropped file from the chip (optional) */
  onClearCurrentFile?: () => void;
}

export default function ChatFloat({ messages, currentFile, onSend, disabled, floatUp, onFocus, onBlur, onClearCurrentFile }: Props) {
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [conversionWarning, setConversionWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const file = currentFile ?? attachedFiles[0] ?? null;
    if (file) {
      setConversionWarning(getConversionWarning(getFileFormatInfo(file.name)));
    } else {
      setConversionWarning(null);
    }
  }, [currentFile?.name, attachedFiles.length]);

  const recentMessages = messages.slice(-3);
  const canSend = !!(text.trim() || attachedFiles.length > 0 || currentFile) && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim(), attachedFiles);
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
    : currentFile && attachedFiles.length === 0
    ? `${currentFile.name} ready — ask anything...`
    : 'ask anything or drop a file...';

  const hasFiles = attachedFiles.length > 0 || !!currentFile;

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
            {currentFile && (
              <div
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
                <FormatBadge fileName={currentFile.name} size="sm" />
                <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentFile.name}
                </span>
                {onClearCurrentFile && (
                  <button
                    type="button"
                    onClick={onClearCurrentFile}
                    className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors duration-150 hover:bg-(--border)"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Remove file"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
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
                      const file = currentFile ?? attachedFiles[0];
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
            color: attachedFiles.length > 0 || currentFile ? 'var(--accent)' : 'var(--text-muted)',
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
            fontFamily: 'Geist, sans-serif',
            fontSize: 13,
            color: 'var(--text-primary)',
            minHeight: 24,
            maxHeight: 100,
            lineHeight: 1.3,
            border: 'none',
            caretColor: 'var(--accent)',
          }}
        />
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
        </div>
      </div>
    </div>
  );
}
