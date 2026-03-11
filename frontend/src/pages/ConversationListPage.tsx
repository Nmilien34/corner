import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import FormatBadge from '../components/ui/FormatBadge';
import type { ConversationListItem } from '../types';

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 172800_000) return 'Yesterday';
  return `${Math.floor(diff / 86400_000)}d ago`;
}

function cleanDisplayTitle(fileName: string): string {
  let name = fileName.replace(/^corner_+/i, '').trim();
  const prefixes = [
    'signed_', 'compressed_', 'merged_', 'rotated_', 'watermarked_', 'unlocked_',
    'numbered_', 'nobg_', 'resized_', 'bordered_', 'transformed_', 'stub_',
    'ocr_', 'split_', 'flattened_',
  ];
  for (const p of prefixes) {
    if (name.toLowerCase().startsWith(p)) {
      name = name.slice(p.length);
      break;
    }
  }
  return name.replace(/_/g, ' ').trim() || fileName;
}

const cardStyle = {
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--white)',
  overflow: 'hidden' as const,
  boxShadow: 'var(--shadow-xs)',
};

export type ListFilter = 'recent' | 'starred' | 'trash';

const TITLES: Record<ListFilter, string> = {
  recent: 'Recent',
  starred: 'Starred',
  trash: 'Trash',
};

const EMPTY_MESSAGES: Record<ListFilter, string> = {
  recent: 'No recent conversations. Start a new flow to get started.',
  starred: 'No starred conversations. Star items from your recent list.',
  trash: 'Trash is empty.',
};

interface Props {
  filter: ListFilter;
  conversations: ConversationListItem[];
  onRestore: (conversationId: string) => void;
}

export default function ConversationListPage({ filter, conversations, onRestore }: Props) {
  const navigate = useNavigate();
  const title = TITLES[filter];
  const emptyMessage = EMPTY_MESSAGES[filter];

  const handleRestore = async (id: string) => {
    await onRestore(id);
    navigate('/');
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-auto"
      style={{ background: 'var(--canvas)' }}
    >
      <div
        className="flex-1 flex justify-center overflow-auto"
        style={{ padding: '32px 24px 48px' }}
      >
        <div className="w-full max-w-[560px] flex flex-col">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-lg transition-colors mb-6"
            style={{
              padding: '6px 0',
              border: 'none',
              background: 'none',
              fontSize: 13,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
            New flow
          </button>

          <div style={{ marginBottom: 24 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>

          <div style={cardStyle}>
            {conversations.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                {emptyMessage}
              </div>
            ) : (
              <div>
                {conversations.map((c) => {
                  const displayTitle = cleanDisplayTitle(c.latestResultFileName ?? c.title);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleRestore(c.id)}
                      className="w-full flex items-center gap-3 text-left border-0 border-t border-(--border) first:border-t-0"
                      style={{
                        padding: '14px 16px',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'background 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <FormatBadge fileName={c.latestResultFileName ?? c.title} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate"
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                          }}
                          title={displayTitle}
                        >
                          {displayTitle}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatTimeAgo(c.lastMessageAt)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
