import { FileText, Minimize2, PenLine, Image } from 'lucide-react';

const HINTS = [
  { label: 'Convert', icon: FileText, prompt: 'Convert this PDF to a Word document' },
  { label: 'Compress', icon: Minimize2, prompt: 'Compress this file' },
  { label: 'Sign', icon: PenLine, prompt: 'Sign this document' },
  { label: 'Remove BG', icon: Image, prompt: 'Remove the background from this image' },
] as const;

interface Props {
  onAction: (prompt: string) => void;
}

export default function EmptyState({ onAction }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center w-full max-w-2xl select-none"
      style={{ minHeight: 280 }}
    >
      {/* Large drop zone — reads as canvas, not chat */}
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-150"
        style={{
          width: '100%',
          minHeight: 240,
          borderColor: 'var(--border)',
          background: 'rgba(255,255,255,0.4)',
        }}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
            Drop files here
          </span>
          <span style={{ fontSize: 12 }}>
            or use the input below to ask for anything
          </span>
        </div>

        {/* Minimal one-line hints — not a menu, just a nudge */}
        <div
          className="flex items-center gap-1 mt-5 flex-wrap justify-center"
          style={{ gap: 6 }}
        >
          {HINTS.map((h) => (
            <button
              key={h.label}
              type="button"
              onClick={() => onAction(h.prompt)}
              className="flex items-center gap-1.5 transition-all duration-150"
              style={{
                padding: '4px 8px',
                fontSize: 11,
                fontFamily: 'Geist, sans-serif',
                color: 'var(--text-muted)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <h.icon size={12} strokeWidth={1.5} />
              {h.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
