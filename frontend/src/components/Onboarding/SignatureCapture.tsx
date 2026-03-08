import { useRef, useState, useEffect } from 'react';
import { Eraser } from 'lucide-react';
import type { SavedSignature } from '../../types';

type Method = 'draw' | 'type' | 'upload';

function DrawPad({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [isActive, setIsActive] = useState(false);

  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    setIsActive(true);
    lastPos.current = getPos(e, e.currentTarget);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1A1714';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    if (drawing.current) {
      drawing.current = false;
      lastPos.current = null;
      setIsActive(false);
      if (canvasRef.current) onCapture(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    if (!canvasRef.current) return;
    canvasRef.current
      .getContext('2d')!
      .clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onCapture('');
  };

  return (
    <div
      style={{
        border: '1.5px solid var(--border)',
        borderRadius: 10,
        background: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        transition: '150ms ease',
        outline: isActive ? '2px solid var(--accent)' : undefined,
        outlineOffset: 2,
      }}
    >
      <canvas
        ref={canvasRef}
        width={400}
        height={90}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        className="w-full block"
        style={{
          background: 'transparent',
          cursor: 'crosshair',
          borderRadius: 10,
        }}
      />
      <button
        type="button"
        onClick={clear}
        title="Clear"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: 4,
          borderRadius: 4,
          transition: '150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
        }}
      >
        <Eraser size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function TypePad({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const [text, setText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (text) {
      ctx.font = `32px 'Dancing Script', cursive`;
      ctx.fillStyle = '#1A1714';
      ctx.fillText(text, 12, 56);
      onCapture(canvas.toDataURL('image/png'));
    } else {
      onCapture('');
    }
  }, [text, onCapture]);

  return (
    <div className="flex flex-col gap-2">
      <div
        style={{
          border: '1.5px solid var(--border)',
          borderRadius: 10,
          background: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          transition: '150ms ease',
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your name"
          className="w-full px-3 py-2 outline-none"
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: '22px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            borderRadius: 10,
          }}
        />
      </div>
      <canvas ref={canvasRef} width={400} height={80} style={{ display: 'none' }} />
    </div>
  );
}

interface Props {
  onNext: (sig: SavedSignature) => void;
}

export default function SignatureCapture({ onNext }: Props) {
  const [method, setMethod] = useState<Method>('draw');
  const [sigDataUrl, setSigDataUrl] = useState('');
  const [initDataUrl, setInitDataUrl] = useState('');

  const handleNext = () => {
    if (!sigDataUrl) return;
    onNext({
      dataUrl: sigDataUrl,
      initialsDataUrl: initDataUrl || sigDataUrl,
      method,
      createdAt: Date.now(),
    });
  };

  const hasSignature = !!sigDataUrl;

  return (
    <div className="flex flex-col">
      {/* Tab switcher — segmented control */}
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--border)',
          borderRadius: 10,
          padding: 3,
          gap: 2,
        }}
      >
        {(['Draw', 'Type', 'Upload'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMethod(tab.toLowerCase() as Method)}
            style={{
              padding: '6px 18px',
              borderRadius: 8,
              border: 'none',
              fontSize: '13px',
              fontWeight: method === tab.toLowerCase() ? 600 : 400,
              fontFamily: 'Geist, sans-serif',
              background: method === tab.toLowerCase() ? 'var(--text-primary)' : 'transparent',
              color: method === tab.toLowerCase() ? 'var(--white)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: '150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Signature — 20px gap from tabs */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Signature</p>
        {method === 'draw' && <DrawPad onCapture={setSigDataUrl} />}
        {method === 'type' && <TypePad onCapture={setSigDataUrl} />}
        {method === 'upload' && (
          <div
            style={{
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              background: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              transition: '150ms ease',
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = (ev) => setSigDataUrl(ev.target?.result as string);
                reader.readAsDataURL(f);
              }}
              style={{
                padding: 12,
                fontSize: 13,
                color: 'var(--text-muted)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      {/* Initials — 24px gap from signature canvas */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Initials (optional)</p>
        {method === 'draw' && <DrawPad onCapture={setInitDataUrl} />}
        {method === 'type' && <TypePad onCapture={setInitDataUrl} />}
      </div>

      {/* Next button row — 24px gap from initials canvas */}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={handleNext}
          disabled={!hasSignature}
          style={{
            padding: '10px 28px',
            borderRadius: 8,
            border: 'none',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Geist, sans-serif',
            background: hasSignature ? 'var(--text-primary)' : 'var(--border)',
            color: hasSignature ? 'var(--white)' : 'var(--text-muted)',
            cursor: hasSignature ? 'pointer' : 'not-allowed',
            transition: '150ms ease',
            marginLeft: 'auto',
            display: 'block',
          }}
          onMouseEnter={(e) => {
            if (hasSignature) e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
