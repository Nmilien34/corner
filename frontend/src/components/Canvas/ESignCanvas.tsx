import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Check, X } from 'lucide-react';
import { SignatureField, SavedSignature } from '../../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface Props {
  pdfUrl: string;
  detectedFields: SignatureField[];
  onConfirm: (placedFields: SignatureField[]) => void;
  onCancel: () => void;
}

export default function ESignCanvas({
  pdfUrl,
  detectedFields,
  onConfirm,
  onCancel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [fields, setFields] = useState<SignatureField[]>(
    detectedFields.map((f) => ({ ...f, placed: true }))
  );
  const [signature, setSignature] = useState<SavedSignature | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dragIdx = useRef<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Load saved signature from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('corner:signature');
    if (raw) {
      try {
        setSignature(JSON.parse(raw) as SavedSignature);
      } catch (_) {}
    }
  }, []);

  // Render PDF page
  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        if (cancelled) return;
        setTotalPages(pdf.numPages);
        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const containerWidth = (canvas.parentElement?.clientWidth ?? 680) - 48;
        const base = page.getViewport({ scale: 1 });
        const scale = containerWidth / base.width;
        const vp = page.getViewport({ scale });

        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
      } catch (e) {
        console.error('[ESignCanvas]', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, currentPage]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.preventDefault();
      const rect = overlayRef.current!.getBoundingClientRect();
      const field = fields[idx];
      dragOffset.current = {
        x: e.clientX - rect.left - (field.x / 100) * rect.width,
        y: e.clientY - rect.top - (field.y / 100) * rect.height,
      };
      dragIdx.current = idx;
    },
    [fields]
  );

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragIdx.current === null || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(90, ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100)
    );
    const y = Math.max(
      0,
      Math.min(90, ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100)
    );
    setFields((prev) => {
      const next = [...prev];
      next[dragIdx.current!] = { ...next[dragIdx.current!], x, y };
      return next;
    });
  }, []);

  const onMouseUp = useCallback(() => {
    dragIdx.current = null;
  }, []);

  const toggleField = useCallback((idx: number) => {
    if (dragIdx.current !== null) return; // ignore click after drag
    setFields((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], placed: !next[idx].placed };
      return next;
    });
  }, []);

  const currentPageFields = fields.filter((f) => f.page === currentPage);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--white)' }}
      >
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Place signatures
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Drag to reposition. Click to toggle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            <X size={13} strokeWidth={1.5} /> Cancel
          </button>
          <button
            onClick={() => onConfirm(fields)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--white)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            <Check size={13} strokeWidth={1.5} /> Apply signatures
          </button>
        </div>
      </div>

      {/* Canvas + overlays */}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <div className="relative inline-block">
          <canvas ref={canvasRef} className="block" />

          {/* Overlay div for field handles */}
          <div
            ref={overlayRef}
            className="absolute inset-0"
            style={{ userSelect: 'none' }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {currentPageFields.map((field, i) => {
              const globalIdx = fields.indexOf(field);
              return (
                <div
                  key={i}
                  onMouseDown={(e) => onMouseDown(e, globalIdx)}
                  onClick={() => toggleField(globalIdx)}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                    height: `${field.height}%`,
                    border: `2px dashed ${field.placed ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 4,
                    cursor: 'move',
                    background: field.placed
                      ? 'rgba(139, 115, 85, 0.05)'
                      : 'rgba(228, 221, 212, 0.3)',
                    overflow: 'hidden',
                    transition: 'border-color 150ms ease',
                  }}
                >
                  {field.placed && signature ? (
                    <img
                      src={
                        field.label.toLowerCase().includes('initial')
                          ? signature.initialsDataUrl
                          : signature.dataUrl
                      }
                      alt="signature"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '10px',
                        pointerEvents: 'none',
                      }}
                    >
                      {field.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-center gap-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              background: 'none',
              border: 'none',
              cursor: currentPage === 1 ? 'default' : 'pointer',
              color: currentPage === 1 ? 'var(--border)' : 'var(--text-muted)',
              fontSize: '12px',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              background: 'none',
              border: 'none',
              cursor: currentPage === totalPages ? 'default' : 'pointer',
              color: currentPage === totalPages ? 'var(--border)' : 'var(--text-muted)',
              fontSize: '12px',
              fontFamily: 'Geist, sans-serif',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
