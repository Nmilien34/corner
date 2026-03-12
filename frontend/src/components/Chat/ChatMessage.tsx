import { Paperclip } from 'lucide-react';

function StreamingCursor() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 2,
        height: '0.85em',
        background: 'var(--accent)',
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        borderRadius: 1,
        animation: 'streaming-cursor-blink 0.9s step-end infinite',
      }}
    />
  );
}
import type { ChatMessage as ChatMessageType } from '../../types';
import FormatBadge from '../ui/FormatBadge';

interface Props {
  message: ChatMessageType;
  compact?: boolean;
}

export default function ChatMessage({ message, compact }: Props) {
  const isCorner = message.role === 'corner';

  if (compact) {
    return (
      <div
        className={`flex ${isCorner ? 'justify-start' : 'justify-end'}`}
        style={{ animation: 'fadeIn 0.2s ease-out forwards' }}
      >
        <div
          className="px-2 py-1 rounded-md max-w-[85%]"
          style={{
            background: isCorner ? 'rgba(0,0,0,0.03)' : 'var(--hover)',
            color: 'var(--text-primary)',
            fontSize: 12,
            lineHeight: 1.35,
            border: '1px solid var(--border)',
            fontFamily: 'var(--chat-font-family)',
          }}
        >
          {message.content}
          {message.streaming && <StreamingCursor />}
          {message.attachmentName && (
            <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 6 }}>
              · {message.attachmentName}
            </span>
          )}
        </div>
      </div>
    );
  }

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
              fontFamily: 'var(--chat-font-family)',
            }}
          >
            {message.content}
            {message.streaming && <StreamingCursor />}
          </div>

          {message.attachmentName && (
            <div
              className="flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)', fontSize: '11px' }}
            >
              <Paperclip size={10} strokeWidth={1.5} />
              <span className="truncate" style={{ maxWidth: 140 }}>
                {message.attachmentName}
              </span>
              <FormatBadge fileName={message.attachmentName} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
