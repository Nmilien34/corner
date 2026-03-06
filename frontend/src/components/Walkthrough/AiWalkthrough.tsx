import { useEffect, useState, useCallback } from 'react';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import type { WalkthroughStep } from '../../types';

interface Props {
  steps: WalkthroughStep[];
  active: boolean;
  onExit: () => void;
  onStepChange?: (step: WalkthroughStep | null) => void;
}

export default function AiWalkthrough({ steps, active, onExit, onStepChange }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const current = steps[index] ?? null;

  useEffect(() => {
    if (!active || !current) {
      onStepChange?.(null);
      return;
    }
    onStepChange?.(current);
  }, [active, current, onStepChange]);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= steps.length) return;
      setIndex(next);
    },
    [steps.length]
  );

  useEffect(() => {
    if (!active || !playing || steps.length <= 1) return;
    const id = setTimeout(() => {
      const next = index + 1;
      if (next < steps.length) {
        setIndex(next);
      } else {
        setPlaying(false);
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [active, playing, index, steps.length]);

  if (!active || !current) return null;

  const total = steps.length;

  return (
    <div
      className="flex items-center gap-3 rounded-xl shadow-sm"
      style={{
        position: 'absolute',
        bottom: 88,
        right: 32,
        left: 'auto',
        padding: '8px 12px',
        background: 'var(--white)',
        border: '1px solid var(--border)',
        fontFamily: 'Geist, sans-serif',
        fontSize: 11,
        color: 'var(--text-primary)',
        transition: 'transform 150ms ease, opacity 150ms ease',
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: 'var(--accent)',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            marginBottom: 2,
          }}
        >
          Step {index + 1} of {total}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{current.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{current.description}</div>
      </div>
      <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            border: 'none',
            background: 'none',
            color: index === 0 ? 'var(--border)' : 'var(--text-muted)',
            cursor: index === 0 ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms ease, color 150ms ease',
          }}
        >
          <SkipBack size={12} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            border: 'none',
            background: 'var(--text-primary)',
            color: 'var(--canvas)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 150ms ease',
          }}
        >
          {playing ? <Pause size={12} strokeWidth={1.5} /> : <Play size={12} strokeWidth={1.5} />}
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === total - 1}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            border: 'none',
            background: 'none',
            color: index === total - 1 ? 'var(--border)' : 'var(--text-muted)',
            cursor: index === total - 1 ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms ease, color 150ms ease',
          }}
        >
          <SkipForward size={12} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onExit}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            border: 'none',
            background: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

