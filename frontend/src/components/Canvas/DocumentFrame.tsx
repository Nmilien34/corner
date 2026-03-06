import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface FrameNode {
  id: string;
  label: string;
  downloadUrl?: string;
}

interface Props {
  node: FrameNode;
  selected: boolean;
  onClick: () => void;
}

function isPdfUrl(url: string) {
  return url.toLowerCase().endsWith('.pdf');
}
function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(url);
}

export default function DocumentFrame({ node, selected, onClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelledRef = useRef(false);
  const { label, downloadUrl } = node;

  useEffect(() => {
    if (!downloadUrl || !isPdfUrl(downloadUrl) || !canvasRef.current) return;
    cancelledRef.current = false;
    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(downloadUrl).promise;
        if (cancelledRef.current) return;
        const page = await pdf.getPage(1);
        if (cancelledRef.current) return;
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = canvasRef.current;
        if (!canvas || cancelledRef.current) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
      } catch {
        // ignore
      }
    })();
    return () => { cancelledRef.current = true; };
  }, [downloadUrl]);

  const showPdfThumb = downloadUrl && isPdfUrl(downloadUrl);
  const showImage = downloadUrl && isImageUrl(downloadUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col shrink-0 rounded-lg overflow-hidden text-left transition-all duration-150 ease-out"
      style={{
        width: 220,
        height: 280,
        padding: 0,
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        background: 'var(--white)',
        boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'var(--text-muted)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }
      }}
    >
      {/* Thumbnail area */}
      <div
        className="flex items-center justify-center w-full overflow-hidden"
        style={{ height: 220, background: 'var(--hover)' }}
      >
        {showPdfThumb && (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            style={{ display: 'block' }}
          />
        )}
        {showImage && downloadUrl && (
          <img
            src={downloadUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        {!showPdfThumb && !showImage && (
          <FileText size={48} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      {/* Label */}
      <div
        className="truncate px-3 py-2"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-primary)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {label}
      </div>
    </button>
  );
}
