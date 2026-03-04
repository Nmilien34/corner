import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolResult } from '../../types';

interface Props {
  isOpen: boolean;
  result: ToolResult | null;
  onToggle: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        style={{
          fontSize: '10px',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function RightPanel({ isOpen, result, onToggle }: Props) {
  if (!isOpen) {
    return (
      <aside
        className="flex flex-col items-center py-4 shrink-0"
        style={{ width: 48, borderLeft: '1px solid var(--border)', background: 'var(--bg)' }}
      >
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
      </aside>
    );
  }

  const isPdf = result?.mimeType === 'application/pdf';
  const isImage = result?.mimeType?.startsWith('image/');
  const formatLabel = result?.mimeType?.split('/')[1]?.toUpperCase() ?? '—';

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{ width: 240, borderLeft: '1px solid var(--border)', background: 'var(--bg)' }}
    >
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
          Properties
        </span>
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {result ? (
          <>
            <Prop label="File name" value={result.fileName} />
            <Prop label="Format" value={formatLabel} />
            <Prop label="Size" value={formatBytes(result.sizeBytes)} />
            {isPdf && <Prop label="Type" value="PDF Document" />}
            {isImage && <Prop label="Type" value="Image" />}
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            Load a file to see properties.
          </p>
        )}
      </div>
    </aside>
  );
}
