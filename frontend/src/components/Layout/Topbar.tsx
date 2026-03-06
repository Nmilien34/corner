import { Share2, Download, PanelLeft, type LucideIcon } from 'lucide-react';

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
  /** When true, show a button to open the left panel (e.g. when panel is collapsed) */
  showOpenLeftPanel?: boolean;
  onOpenLeftPanel?: () => void;
}

export default function Topbar({ fileName, showOpenLeftPanel, onOpenLeftPanel }: Props) {
  return (
    <header
      className="flex items-center justify-between pr-4 shrink-0"
      style={{
        height: 40,
        minHeight: 40,
        background: 'var(--canvas)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{ marginLeft: 5 }}
      >
        {showOpenLeftPanel && onOpenLeftPanel && (
          <button
            type="button"
            onClick={onOpenLeftPanel}
            aria-label="Open sidebar"
            className="flex items-center justify-center transition-all duration-200 ease-out"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <PanelLeft size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {fileName ? (
        <span
          className="truncate max-w-[40%]"
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {fileName}
        </span>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }} />
      )}

      <div className="flex items-center gap-0">
        <IconBtn Icon={Share2} />
        <IconBtn Icon={Download} />
      </div>
    </header>
  );
}
