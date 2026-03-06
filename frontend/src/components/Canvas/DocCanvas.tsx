import { useRef, useState, useCallback, useEffect } from 'react';
import DocumentFrame, { type FrameNode } from './DocumentFrame';

const FRAME_WIDTH = 220;
const FRAME_HEIGHT = 280;
const GAP = 24;
const PADDING = 48;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_SENSITIVITY = 0.001;

interface Props {
  nodes: FrameNode[];
  selectedId: string | null;
  onSelectFrame: (id: string) => void;
}

export default function DocCanvas({ nodes, selectedId, onSelectFrame }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Grid layout: 3 columns, wrap
  const cols = 3;
  const rows = Math.ceil(nodes.length / cols);
  const contentWidth = cols * FRAME_WIDTH + (cols - 1) * GAP + PADDING * 2;
  const contentHeight = rows * FRAME_HEIGHT + (rows - 1) * GAP + PADDING * 2;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan.x, pan.y]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: panStart.current.panX + e.clientX - panStart.current.x,
        y: panStart.current.panY + e.clientY - panStart.current.y,
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg"
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
        background: 'var(--canvas)',
        backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: contentWidth,
          height: contentHeight,
          marginLeft: -contentWidth / 2 + pan.x,
          marginTop: -contentHeight / 2 + pan.y,
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${FRAME_WIDTH}px)`,
          gap: GAP,
          padding: PADDING,
          alignContent: 'start',
        }}
      >
        {nodes.map((node) => (
          <DocumentFrame
            key={node.id}
            node={node}
            selected={selectedId === node.id}
            onClick={() => onSelectFrame(node.id)}
          />
        ))}
      </div>
    </div>
  );
}
