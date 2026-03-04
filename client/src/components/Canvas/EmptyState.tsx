import { FileText, Minimize2, PenLine, Image } from 'lucide-react';

const CHIPS = [
  { label: 'PDF → Word', icon: FileText, prompt: 'Convert this PDF to a Word document' },
  { label: 'Compress', icon: Minimize2, prompt: 'Compress this file' },
  { label: 'E-Sign', icon: PenLine, prompt: 'Sign this document' },
  { label: 'Remove BG', icon: Image, prompt: 'Remove the background from this image' },
] as const;

interface Props {
  onAction: (prompt: string) => void;
}

export default function EmptyState({ onAction }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 select-none"
      style={{ maxWidth: 480, textAlign: 'center', padding: '0 24px' }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 40,
          height: 40,
          border: '1.5px solid var(--accent)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--accent)' }}>C</span>
      </div>

      <div className="flex flex-col gap-1">
        <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
          Drop a file or describe what you need
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Corner handles PDF, images, signatures, and more.
        </p>
      </div>

      {/* Quick-action chips */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {CHIPS.map((chip, i) => (
          <button
            key={chip.label}
            onClick={() => onAction(chip.prompt)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--white)',
              color: 'var(--text-primary)',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
              animation: `fadeInUp 200ms ease forwards`,
              animationDelay: `${i * 80}ms`,
              opacity: 0,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--white)')}
          >
            <chip.icon size={13} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
            {chip.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        These are just examples — you can ask for anything.
      </p>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
