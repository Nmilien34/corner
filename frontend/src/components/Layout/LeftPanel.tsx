import {
  Clock,
  Star,
  Trash2,
  RotateCcw,
  GitBranch,
  Settings,
  LogIn,
  LogOut,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import FormatBadge from '../ui/FormatBadge';

export interface VersionNode {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'word' | 'other';
  operation: string;
  timestamp: Date;
  isActive: boolean;
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  plan: 'free' | 'pro';
}

export interface Props {
  isOpen: boolean;
  history: VersionNode[];
  user: User | null;
  activeNodeId: string | null;
  onRestoreVersion: (id: string) => void;
  onClearHistory: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onNavSelect: (item: 'recent' | 'starred' | 'trash') => void;
  activeNav: 'recent' | 'starred' | 'trash';
  onToggle?: () => void;
}

const NAV_ITEMS: { id: 'recent' | 'starred' | 'trash'; label: string; Icon: LucideIcon }[] = [
  { id: 'recent', label: 'Recent', Icon: Clock },
  { id: 'starred', label: 'Starred', Icon: Star },
  { id: 'trash', label: 'Trash', Icon: Trash2 },
];

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 172800_000) return 'Yesterday';
  return `${Math.floor(diff / 86400_000)}d ago`;
}

function getDateLabel(date: Date): string {
  const d = new Date();
  const t = date;
  if (t.toDateString() === d.toDateString()) return 'Today';
  d.setDate(d.getDate() - 1);
  if (t.toDateString() === d.toDateString()) return 'Yesterday';
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Clean backend filenames (e.g. corner_signed_Report.pdf) to a short display title (e.g. Report.pdf). */
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

/** When operation is missing or "Processed", infer a label from filename for older history entries. */
function displayOperation(node: { fileName: string; operation: string }): string {
  if (node.operation && node.operation !== 'Processed') return node.operation;
  const lower = node.fileName.toLowerCase();
  if (lower.includes('signed_') || lower.includes('_signed')) return 'Signed';
  if (lower.includes('compressed')) return 'Compressed';
  if (lower.includes('merged')) return 'Merged';
  if (lower.includes('rotated')) return 'Rotated';
  if (lower.includes('watermarked')) return 'Watermarked';
  if (lower.includes('unlocked') || lower.includes('password')) return 'Password removed';
  if (lower.includes('numbered')) return 'Page numbers';
  if (lower.includes('nobg')) return 'Background removed';
  if (lower.includes('ocr')) return 'OCR';
  if (lower.includes('split')) return 'Split';
  if (/word|docx?/i.test(node.fileName) && /pdf/i.test(node.fileName)) return 'PDF ↔ Word';
  if (/excel|xlsx?/i.test(node.fileName) && /pdf/i.test(node.fileName)) return 'PDF ↔ Excel';
  if (/pptx?/i.test(node.fileName) && /pdf/i.test(node.fileName)) return 'PDF ↔ PowerPoint';
  return 'Processed';
}


export default function LeftPanel({
  isOpen,
  history,
  user,
  activeNodeId,
  onRestoreVersion,
  onClearHistory,
  onSignIn,
  onSignOut,
  onOpenSettings,
  onNavSelect,
  activeNav,
  onToggle,
}: Props) {

  if (!isOpen) {
    return (
      <aside
        style={{
          width: 0,
          overflow: 'hidden',
          borderRight: '1px solid var(--border)',
          background: 'var(--bg)',
          flexShrink: 0,
          transition: 'width 150ms ease',
        }}
      />
    );
  }

  // Group history by date for separators
  const groups: { label: string; nodes: VersionNode[] }[] = [];
  let currentLabel = '';
  let currentGroup: VersionNode[] = [];
  const sorted = [...history].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  sorted.forEach((node) => {
    const label = getDateLabel(node.timestamp);
    if (label !== currentLabel) {
      if (currentGroup.length) groups.push({ label: currentLabel, nodes: currentGroup });
      currentLabel = label;
      currentGroup = [node];
    } else {
      currentGroup.push(node);
    }
  });
  if (currentGroup.length) groups.push({ label: currentLabel, nodes: currentGroup });

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: 220,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
        overflow: 'hidden',
        transition: 'width 150ms ease',
        fontFamily: 'var(--font-geist), Geist, sans-serif',
      }}
    >
      {/* Zone 1 — Top: App identity + nav */}
      <div className="shrink-0" style={{ minHeight: 48 }}>
        <div
          className="flex items-center justify-between"
          style={{ height: 48, paddingLeft: 16, paddingRight: 12 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/CornerLogo.svg"
              alt="Corner"
              style={{ height: 24, width: 'auto', display: 'block', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#8B7355',
              }}
            >
              Corner
            </span>
          </div>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms ease, color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavSelect(id)}
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 16,
              paddingRight: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: 'none',
              background: activeNav === id ? 'rgba(0,0,0,0.06)' : 'transparent',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'inherit',
              fontFamily: 'inherit',
              fontSize: 13,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (activeNav !== id) e.currentTarget.style.background = 'var(--hover)';
            }}
            onMouseLeave={(e) => {
              if (activeNav !== id) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-primary)', flex: 1, textAlign: 'left' }}>{label}</span>
          </button>
        ))}
        <div style={{ height: 1, background: 'var(--border)', marginTop: 4 }} />
      </div>

      {/* Zone 2 — Middle: History feed */}
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ overflow: 'hidden' }}
      >
        <div
          className="flex items-center justify-between shrink-0"
          style={{ paddingLeft: 16, paddingTop: 12, paddingRight: 8, paddingBottom: 8 }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            HISTORY
          </span>
          <button
            type="button"
            onClick={onClearHistory}
            title="Clear history"
            aria-label="Clear history"
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto right-panel-scroll"
          style={{ minHeight: 0 }}
        >
          {history.length === 0 && (
            <div
              className="flex flex-col items-center justify-center"
              style={{
                padding: 24,
                minHeight: 160,
                textAlign: 'center',
              }}
            >
              <GitBranch
                size={28}
                strokeWidth={1}
                style={{ color: 'var(--text-muted)', marginBottom: 12 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>
                No history yet
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Upload a file to get started
              </span>
            </div>
          )}
          {groups.map(({ label: dateLabel, nodes }) => (
            <div key={dateLabel}>
              <div
                className="flex items-center gap-2"
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 8,
                  paddingBottom: 4,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'var(--border)',
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {dateLabel}
                </span>
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'var(--border)',
                  }}
                />
              </div>
              {nodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onRestoreVersion(node.id)}
                  style={{
                    width: '100%',
                    minHeight: 48,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    border: 'none',
                    borderLeft: node.id === activeNodeId ? '2px solid var(--accent)' : '2px solid transparent',
                    background: node.id === activeNodeId ? 'rgba(139,115,85,0.06)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'background 150ms ease, border-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      node.id === activeNodeId ? 'rgba(139,115,85,0.06)' : 'transparent';
                  }}
                >
                  <FormatBadge fileName={node.fileName} size="sm" />
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 min-w-0">
                      <span
                        className="truncate"
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          flex: 1,
                          minWidth: 0,
                        }}
                        title={cleanDisplayTitle(node.fileName)}
                      >
                        {cleanDisplayTitle(node.fileName)}
                      </span>
                      <span
                        className="shrink-0"
                        style={{ fontSize: 10, color: 'var(--text-muted)' }}
                      >
                        {formatTimeAgo(node.timestamp)}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {displayOperation(node)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Zone 3 — Bottom: User account */}
      <div
        className="shrink-0 flex items-center"
        style={{
          height: 64,
          paddingLeft: 16,
          paddingRight: 16,
          borderTop: '1px solid var(--border)',
          gap: 10,
        }}
      >
        {user ? (
          <>
            <button
              type="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--accent)',
                cursor: 'pointer',
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--white)',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                {user.name}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 4,
                  alignSelf: 'flex-start',
                  marginTop: 2,
                  background: user.plan === 'pro' ? 'var(--accent)' : 'var(--border)',
                  color: user.plan === 'pro' ? 'var(--white)' : 'var(--text-muted)',
                }}
              >
                {user.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <Settings size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSignIn}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--hover)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>G</span>
            </button>
            <div
              className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer"
              onClick={onSignIn}
              onKeyDown={(e) => e.key === 'Enter' && onSignIn()}
              role="button"
              tabIndex={0}
            >
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Sign in to save
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <Settings size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={onSignIn}
              aria-label="Sign in"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <LogIn size={14} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
