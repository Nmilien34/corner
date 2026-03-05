import { Share2, Download, Settings, type LucideIcon } from 'lucide-react';

function IconBtn({ Icon }: { Icon: LucideIcon }) {
  return (
    <button
      className="flex items-center justify-center transition-all duration-200 ease-out"
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  );
}

interface Props {
  fileName?: string;
}

export default function Topbar({ fileName }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 shrink-0"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--canvas)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
        Corner
      </span>

      <span
        style={{
          fontSize: '13px',
          letterSpacing: '-0.006em',
          color: fileName ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        {fileName || 'untitled'}
      </span>

      <div className="flex items-center gap-1">
        <IconBtn Icon={Share2} />
        <IconBtn Icon={Download} />
        <IconBtn Icon={Settings} />
      </div>
    </header>
  );
}
