import { Download, RotateCcw, Edit3 } from 'lucide-react';
import { ToolResult } from '../../types';

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
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* File info */}
      <div className="flex flex-col flex-1 min-w-0">
        <span
          className="truncate"
          style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}
        >
          {result.fileName}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          {formatBytes(result.sizeBytes)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
              transition: '150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <RotateCcw size={13} strokeWidth={1.5} /> Undo
          </button>
        )}

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
            transition: '150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <Edit3 size={13} strokeWidth={1.5} /> Edit
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{
            background: 'var(--text-primary)',
            border: 'none',
            color: 'var(--white)',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
            transition: '150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Download size={13} strokeWidth={1.5} /> Download
        </button>
      </div>
    </div>
  );
}
