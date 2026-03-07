import { useRef, useState, type KeyboardEvent } from 'react';
import { Paperclip, ArrowUp, FileText, Image, File, FileSpreadsheet, Presentation, X } from 'lucide-react';
import type { ChatMessage } from '../../types';
import ChatMessageComp from './ChatMessage';

function getFileIcon(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type || '';
  // PDF
  if (name.endsWith('.pdf') || type.includes('pdf')) return FileText;
  // Word
  if (/\.(docx?|doc)$/.test(name) || type.includes('word') || type.includes('document')) return FileText;
  // Excel / spreadsheet
  if (/\.(xlsx?|xls|csv)$/.test(name) || type.includes('sheet') || type.includes('excel') || type.includes('spreadsheet')) return FileSpreadsheet;
  // PowerPoint / presentation
  if (/\.(pptx?|ppt)$/.test(name) || type.includes('presentation') || type.includes('powerpoint')) return Presentation;
  // Images
  if (/\.(png|jpe?g|gif|webp|heic|bmp|svg)$/.test(name) || type.startsWith('image/')) return Image;
  return File;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
                  paddingLeft: 12,
                  paddingRight: 6,
                  background: 'var(--hover)',
                  border: '1px solid var(--border)',
                  maxWidth: 200,
                }}
              >
                {(() => {
                  const Icon = getFileIcon(currentFile);
                  return <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--accent)', flexShrink: 0 }} />;
                })()}
                <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentFile.name}
                </span>
                {onClearCurrentFile && (
                  <button
                    type="button"
                    onClick={onClearCurrentFile}
                    className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors duration-150 hover:bg-[var(--border)]"
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
                  paddingLeft: 12,
                  paddingRight: 6,
                  background: 'var(--hover)',
                  border: '1px solid var(--border)',
                  maxWidth: 200,
                }}
              >
                {(() => {
                  const Icon = getFileIcon(f);
                  return <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--accent)', flexShrink: 0 }} />;
                })()}
                <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors duration-150 hover:bg-[var(--border)]"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Remove file"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
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
