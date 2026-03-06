import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { ToolResult, WalkthroughStep } from '../../types';
import ResultCard from './ResultCard';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface Props {
  result: ToolResult;
  onUndo?: () => void;
  walkthroughStep?: WalkthroughStep | null;
  previewMode?: 'page' | 'text' | 'frames';
  zoomPercent?: number;
}

export default function DocumentViewer({
  result,
  onUndo,
  walkthroughStep,
  previewMode = 'page',
  zoomPercent = 100,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [textContent, setTextContent] = useState('');

  const isPdf = result.mimeType === 'application/pdf';
  const isImage = result.mimeType.startsWith('image/');
  const isText = result.mimeType === 'text/plain';

  // Load text content
  useEffect(() => {
    if (!isText && !(isPdf && previewMode === 'text')) return;
    fetch(result.downloadUrl)
      .then((r) => r.text())
      .then(setTextContent)
      .catch(() => setTextContent('(Could not load text)'));
  }, [result.downloadUrl, isText, isPdf, previewMode]);

  // Jump to the page for the current walkthrough step, if any
  useEffect(() => {
    if (!isPdf || !walkthroughStep?.region) return;
    const targetPage = walkthroughStep.region.page;
    if (targetPage && targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
    }
  }, [isPdf, walkthroughStep, totalPages]);

  // Render PDF page to canvas
  useEffect(() => {
    if (!isPdf || !canvasRef.current || previewMode !== 'page') return;
    let cancelled = false;

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(result.downloadUrl).promise;
        if (cancelled) return;
        setTotalPages(pdf.numPages);
        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const containerWidth = canvas.parentElement?.clientWidth ?? 640;
        const baseViewport = page.getViewport({ scale: 1 });
        const baseScale = (containerWidth - 48) / baseViewport.width;
        const factor = Math.max(0.5, Math.min(zoomPercent / 100, 3));
        const viewport = page.getViewport({ scale: baseScale * factor });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page
          .render({ canvasContext: canvas.getContext('2d')!, viewport })
          .promise;
      } catch (e) {
        console.error('[DocumentViewer] PDF render error:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [result.downloadUrl, currentPage, isPdf, previewMode, zoomPercent]);

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full overflow-auto">
      {/* Document sheet — canvas feel: sits on the surface with soft shadow */}
      <div
        className="rounded-lg overflow-hidden w-full shrink-0"
        style={{
          background: 'var(--white)',
          boxShadow: 'var(--canvas-sheet-shadow)',
          border: '1px solid var(--border)',
          maxWidth: 720,
          position: 'relative',
        }}
      >
        {isPdf && previewMode === 'page' && (
          <>
            <canvas ref={canvasRef} className="w-full block" />
            {walkthroughStep?.region && walkthroughStep.region.page === currentPage && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ transition: 'opacity 150ms ease' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${walkthroughStep.region.x}%`,
                    top: `${walkthroughStep.region.y}%`,
                    width: `${walkthroughStep.region.width}%`,
                    height: `${walkthroughStep.region.height}%`,
                    border: '2px solid var(--accent)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.08)',
                    borderRadius: 4,
                    transition: 'all 150ms ease',
                  }}
                />
              </div>
            )}
          </>
        )}

        {isImage && (
          <img
            src={result.downloadUrl}
            alt={result.fileName}
            className="w-full block"
            style={{ maxHeight: 600, objectFit: 'contain' }}
          />
        )}

        {(isText || (isPdf && previewMode === 'text')) && (
          <pre
            className="p-6 overflow-auto"
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '12px',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              maxHeight: 500,
              lineHeight: 1.6,
            }}
          >
            {textContent}
          </pre>
        )}

        {!isPdf && !isImage && !isText && previewMode === 'page' && (
          <div
            className="flex flex-col items-center justify-center py-12 gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <p style={{ fontSize: '13px' }}>{result.fileName}</p>
            <a
              href={result.downloadUrl}
              download
              style={{ color: 'var(--accent)', fontSize: '12px' }}
            >
              Download file
            </a>
          </div>
        )}
      </div>

      {/* Page navigation */}
      {isPdf && totalPages > 1 && previewMode === 'page' && (
        <div className="flex items-center gap-4">
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

      {/* Result action bar */}
      <ResultCard result={result} onUndo={onUndo} />
    </div>
  );
}
