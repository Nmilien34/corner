import { Paperclip } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../types';

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isCorner = message.role === 'corner';

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
    <div className={`flex ${isCorner ? 'justify-start' : 'justify-end'}`}>
      <div
        className="flex flex-col gap-1"
        style={{
          maxWidth: '75%',
          alignItems: isCorner ? 'flex-start' : 'flex-end',
        }}
      >
        <span
          style={{
            color: 'var(--accent)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          {isCorner ? 'CORNER' : 'YOU'}
        </span>

        <div
          className="px-3 py-2"
          style={{
            background: isCorner ? 'transparent' : 'var(--hover)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: 1.5,
            borderRadius: isCorner ? 0 : '10px',
            border: isCorner ? 'none' : '1px solid var(--border)',
            boxShadow: isCorner ? 'var(--shadow-xs)' : 'none',
          }}
        >
          {message.content}
        </div>

        {message.attachmentName && (
          <div
            className="flex items-center gap-1"
            style={{ color: 'var(--text-muted)', fontSize: '11px' }}
          >
            <Paperclip size={10} strokeWidth={1.5} />
            <span
              className="truncate"
              style={{ maxWidth: 160 }}
            >
              {message.attachmentName}
            </span>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
