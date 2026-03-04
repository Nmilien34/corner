import { Share2, Download, Settings } from 'lucide-react';

interface Props {
  fileName?: string;
}

export default function Topbar({ fileName }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 shrink-0"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Wordmark */}
      <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>
        Corner
      </span>

      {/* File name */}
      <span
        style={{
          fontSize: '13px',
          color: fileName ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        {fileName || 'untitled'}
      </span>

      {/* Icon actions */}
      <div className="flex items-center gap-1">
        {([Share2, Download, Settings] as const).map((Icon, i) => (
          <button
            key={i}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 32,
              height: 32,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <Icon size={16} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </header>
  );
}
