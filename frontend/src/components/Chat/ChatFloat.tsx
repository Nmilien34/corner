import { useRef, useState, KeyboardEvent } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import type { ChatMessage } from '../../types';
import ChatMessageComp from './ChatMessage';

interface Props {
  messages: ChatMessage[];
  currentFile: File | null;
  onSend: (text: string, file?: File) => void;
  disabled?: boolean;
}

export default function ChatFloat({ messages, currentFile, onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const recentMessages = messages.slice(-6);
  const canSend = !!(text.trim() || attachedFile || currentFile) && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim(), attachedFile ?? undefined);
    setText('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
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
    ta.style.height = '44px';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
  };

  const placeholder = disabled
    ? 'working on it...'
    : attachedFile
    ? `${attachedFile.name} — what should I do?`
    : currentFile
    ? `${currentFile.name} ready — ask anything...`
    : 'ask anything or drop a file...';

  return (
    <div
      className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 px-8 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {/* Recent messages */}
      {recentMessages.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-xl pointer-events-auto">
          {recentMessages.map((msg) => (
            <ChatMessageComp key={msg.id} message={msg} />
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-2 w-full max-w-xl rounded-xl px-3 py-2 pointer-events-auto"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {/* File attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 flex items-center justify-center rounded-lg mb-1"
          style={{
            width: 32,
            height: 32,
            background: 'none',
            border: 'none',
            color: attachedFile ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
          title="Attach file"
        >
          <Paperclip size={15} strokeWidth={1.5} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.doc,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.svg,.gif"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none"
          style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: '13px',
            color: 'var(--text-primary)',
            height: '44px',
            maxHeight: '120px',
            lineHeight: 1.6,
            paddingTop: '10px',
            border: 'none',
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 flex items-center justify-center rounded-lg mb-1"
          style={{
            width: 32,
            height: 32,
            background: canSend ? 'var(--text-primary)' : 'var(--border)',
            border: 'none',
            color: canSend ? 'var(--white)' : 'var(--text-muted)',
            cursor: canSend ? 'pointer' : 'default',
            transition: '150ms ease',
          }}
        >
          <ArrowUp size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
