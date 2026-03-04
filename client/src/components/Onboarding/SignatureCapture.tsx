import { useRef, useState, useEffect } from 'react';
import { Eraser } from 'lucide-react';
import { SavedSignature } from '../../types';

type Method = 'draw' | 'type' | 'upload';

function DrawPad({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true;
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
    if (!drawing.current) return;
    drawing.current = false;
    lastPos.current = null;
    if (canvasRef.current) onCapture(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    if (!canvasRef.current) return;
    canvasRef.current
      .getContext('2d')!
      .clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onCapture('');
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={400}
        height={90}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        className="w-full rounded-lg block"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          cursor: 'crosshair',
        }}
      />
      <button
        onClick={clear}
        className="absolute top-2 right-2"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
        }}
        title="Clear"
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
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your name"
        className="w-full px-3 py-2 rounded-lg outline-none"
        style={{
          fontFamily: "'Dancing Script', cursive",
          fontSize: '22px',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      />
      <canvas ref={canvasRef} width={400} height={80} style={{ display: 'none' }} />
    </div>
  );
}

interface Props {
  onSave: (sig: SavedSignature) => void;
}

export default function SignatureCapture({ onSave }: Props) {
  const [method, setMethod] = useState<Method>('draw');
  const [sigDataUrl, setSigDataUrl] = useState('');
  const [initDataUrl, setInitDataUrl] = useState('');

  const handleSave = () => {
    if (!sigDataUrl) return;
    onSave({
      dataUrl: sigDataUrl,
      initialsDataUrl: initDataUrl || sigDataUrl,
      method,
      createdAt: Date.now(),
    });
  };

  const tabs: Method[] = ['draw', 'type', 'upload'];

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setMethod(t)}
            className="px-3 py-1.5 rounded-lg capitalize"
            style={{
              background: method === t ? 'var(--text-primary)' : 'none',
              color: method === t ? 'var(--white)' : 'var(--text-muted)',
              border: method === t ? 'none' : '1px solid var(--border)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
              transition: '150ms ease',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Signature */}
      <div className="flex flex-col gap-2">
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Signature</p>
        {method === 'draw' && <DrawPad onCapture={setSigDataUrl} />}
        {method === 'type' && <TypePad onCapture={setSigDataUrl} />}
        {method === 'upload' && (
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
          />
        )}
      </div>

      {/* Initials */}
      <div className="flex flex-col gap-2">
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Initials (optional)</p>
        {method === 'draw' && <DrawPad onCapture={setInitDataUrl} />}
        {method === 'type' && <TypePad onCapture={setInitDataUrl} />}
      </div>

      <button
        onClick={handleSave}
        disabled={!sigDataUrl}
        className="self-end px-5 py-2.5 rounded-lg"
        style={{
          background: sigDataUrl ? 'var(--text-primary)' : 'var(--border)',
          color: sigDataUrl ? 'var(--canvas)' : 'var(--text-muted)',
          border: 'none',
          fontSize: '13px',
          cursor: sigDataUrl ? 'pointer' : 'default',
          fontFamily: 'Geist, sans-serif',
          transition: '150ms ease',
        }}
      >
        Save signature
      </button>
    </div>
  );
}
