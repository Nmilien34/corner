import type React from 'react';
import { Download, RotateCcw, Edit3 } from 'lucide-react';
import type { ToolResult } from '../../types';
import FormatBadge from '../ui/FormatBadge';

interface Props {
  result: ToolResult;
  onUndo?: () => void;
}

function formatBytes(b: number): string {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const strokeBtn: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  borderRadius: 10,
  background: 'none',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-xs)',
  color: 'var(--text-muted)',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: 'Geist, sans-serif',
  transition: 'all 200ms ease-out',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const filledBtn: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  borderRadius: 10,
  background: 'var(--text-primary)',
  border: 'none',
  color: 'var(--white)',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: 'Geist, sans-serif',
  transition: 'all 200ms ease-out',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

export default function ResultCard({ result, onUndo }: Props) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.downloadUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border w-full"
      style={{
        background: 'var(--white)',
        borderColor: 'var(--border)',
        maxWidth: 680,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* File info */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="truncate"
            style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}
          >
            {result.fileName}
          </span>
          <FormatBadge fileName={result.fileName} size="sm" />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          {formatBytes(result.sizeBytes)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onUndo && (
          <button
            onClick={onUndo}
            style={strokeBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
          >
            <RotateCcw size={13} strokeWidth={1.5} /> Undo
          </button>
        )}

        <button
          style={strokeBtn}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
        >
          <Edit3 size={13} strokeWidth={1.5} /> Edit
        </button>

        <button
          onClick={handleDownload}
          style={filledBtn}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Download size={13} strokeWidth={1.5} /> Download
        </button>
      </div>
    </div>
  );
}
