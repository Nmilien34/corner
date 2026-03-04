import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VersionNode } from '../../types';

interface Props {
  versions: VersionNode[];
  onVersionRestore: (v: VersionNode) => void;
}

function formatRelative(ts: Date): string {
  const diff = Date.now() - ts.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export default function LeftPanel({ versions, onVersionRestore }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside
        className="flex flex-col items-center py-4 shrink-0"
        style={{ width: 48, borderRight: '1px solid var(--border)', background: 'var(--bg)' }}
      >
        <button
          onClick={() => setCollapsed(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: 220,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          History
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Version history list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {versions.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '4px 4px' }}>
            No history yet. Upload a file to get started.
          </p>
        )}
        {versions.map((v) => (
          <button
            key={v.id}
            onClick={() => onVersionRestore(v)}
            className="flex items-start gap-2 text-left w-full rounded-lg px-2 py-1.5 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <span
              className="shrink-0 rounded-full mt-1"
              style={{
                width: 7,
                height: 7,
                background: v.isCurrent ? 'var(--accent)' : 'var(--border)',
                display: 'inline-block',
                border: v.isCurrent ? '1.5px solid var(--accent)' : '1px solid var(--text-muted)',
              }}
            />
            <div className="flex flex-col min-w-0">
              <span
                className="truncate"
                style={{
                  fontSize: v.isCurrent ? '12px' : '11px',
                  color: v.isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: v.isCurrent ? 500 : 400,
                }}
              >
                {v.label}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {formatRelative(v.timestamp)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
