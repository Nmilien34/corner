import { useRef, useState, type KeyboardEvent } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import type { ChatMessage } from '../../types';
import ChatMessageComp from './ChatMessage';

interface Props {
  messages: ChatMessage[];
  currentFile: File | null;
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
  /** When true, input floats up below the drop zone (empty state) */
  floatUp?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function ChatFloat({ messages, currentFile, onSend, disabled, floatUp, onFocus, onBlur }: Props) {
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

  const placeholder = disabled
    ? 'working on it...'
    : currentFile && attachedFiles.length === 0
    ? `${currentFile.name} ready — ask anything...`
    : 'ask anything or drop a file...';

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

      {/* File chips */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1 w-full max-w-xl mb-1 pointer-events-auto">
          {attachedFiles.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-2 py-0.5 rounded"
              style={{
                background: 'var(--hover)',
                border: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <Paperclip size={9} strokeWidth={1.5} />
              <span className="truncate" style={{ maxWidth: 120 }}>{f.name}</span>
              <button
                type="button"
                onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                  lineHeight: 1,
                  fontSize: 13,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar — toolbar feel; stronger shadow when floated */}
      <div
        className="flex items-center gap-1 pointer-events-auto w-full max-w-xl rounded-lg"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          boxShadow: floatUp ? 'var(--shadow-realistic)' : 'var(--shadow-sm)',
          minHeight: 40,
          transition: 'box-shadow 420ms ease',
        }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 flex items-center justify-center transition-colors duration-150"
          style={{
            width: 32,
            height: 32,
            marginLeft: 6,
            borderRadius: 6,
            background: 'transparent',
            color: attachedFiles.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
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
  );
}
