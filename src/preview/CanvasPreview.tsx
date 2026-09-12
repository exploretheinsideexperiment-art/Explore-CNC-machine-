import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VectorStroke, PaperSize } from '../types';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { PAPER_SIZES } from '../pdf/pdfProcessor';

interface CanvasPreviewProps {
  strokes?: VectorStroke[];
  paperSize?: PaperSize;
  cncWidthMm?: number;
  cncHeightMm?: number;
  toolX?: number;
  toolY?: number;
  penState?: 'UP' | 'DOWN';
  showRapidMoves?: boolean;
  className?: string;
  onPointSelect?: (x: number, y: number) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  strokes = [],
  paperSize = 'A4',
  cncWidthMm = 200,
  cncHeightMm = 200,
  toolX = 0,
  toolY = 0,
  penState = 'UP',
  showRapidMoves = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const paperDim = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;

  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    
    // Guard against unmeasured, collapsed, or zero-sized container
    if (clientWidth < 40 || clientHeight < 40) {
      return;
    }

    const margin = 32;
    const availW = Math.max(20, clientWidth - margin * 2);
    const availH = Math.max(20, clientHeight - margin * 2);

    const targetW = Math.max(10, cncWidthMm, paperDim.width);
    const targetH = Math.max(10, cncHeightMm, paperDim.height);

    const scaleX = availW / targetW;
    const scaleY = availH / targetH;
    const fitScale = Math.max(0.1, Math.min(scaleX, scaleY, 2.5));

    setZoom(fitScale);
    setPan({
      x: (clientWidth - targetW * fitScale) / 2,
      y: (clientHeight - targetH * fitScale) / 2,
    });
  }, [cncWidthMm, cncHeightMm, paperDim]);

  // Responsive observation with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    fitToScreen();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        fitToScreen();
      });
      ro.observe(container);
    }

    return () => {
      if (ro) {
        ro.disconnect();
      }
    };
  }, [fitToScreen]);

  // Redraw Canvas safely
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enforce strictly positive safe zoom factor
    const safeZoom = Math.max(0.05, Number.isFinite(zoom) && zoom > 0 ? zoom : 1.0);

    // Handle high DPI display
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(10, Math.floor(rect.width));
    const h = Math.max(10, Math.floor(rect.height));

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // Apply pan & zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(safeZoom, safeZoom);

    // 1. Draw Paper Boundary
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, paperDim.width, paperDim.height);
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = Math.max(0.2, 1 / safeZoom);
    ctx.strokeRect(0, 0, paperDim.width, paperDim.height);

    // Subtle paper grid lines (every 10mm and 50mm)
    ctx.strokeStyle = 'rgba(55, 65, 81, 0.4)';
    ctx.lineWidth = Math.max(0.1, 0.5 / safeZoom);
    for (let x = 10; x < paperDim.width; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, paperDim.height);
      ctx.stroke();
    }
    for (let y = 10; y < paperDim.height; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(paperDim.width, y);
      ctx.stroke();
    }

    // 2. Draw CNC Working Area Boundary
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; // Cyan dashed border
    ctx.lineWidth = Math.max(0.4, 1.5 / safeZoom);
    const dash = Math.max(1, 4 / safeZoom);
    ctx.setLineDash([dash, dash]);
    ctx.strokeRect(0, 0, cncWidthMm, cncHeightMm);
    ctx.setLineDash([]);

    // 3. Draw Rapid (Pen-Up) Travel Paths if enabled
    if (showRapidMoves && strokes.length > 0) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'; // Faint slate dashed
      ctx.lineWidth = Math.max(0.2, 1 / safeZoom);
      const travelDash1 = Math.max(1, 2 / safeZoom);
      const travelDash2 = Math.max(1, 3 / safeZoom);
      ctx.setLineDash([travelDash1, travelDash2]);
      ctx.beginPath();
      let lastX = 0;
      let lastY = 0;
      ctx.moveTo(0, 0);

      for (const stroke of strokes) {
        if (!stroke.points || stroke.points.length === 0) continue;
        const start = stroke.points[0];
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(start.x, start.y);
        const end = stroke.points[stroke.points.length - 1];
        lastX = end.x;
        lastY = end.y;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw Pen-Down Plotted Strokes
    ctx.strokeStyle = '#22d3ee'; // Vivid cyan pen ink
    ctx.lineWidth = Math.max(0.4, 1.5 / safeZoom);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    // 5. Origin Marker (0,0) with guaranteed positive radius
    ctx.fillStyle = '#ef4444'; // Red dot
    ctx.beginPath();
    const originRadius = Math.max(0.5, 3 / safeZoom);
    ctx.arc(0, 0, originRadius, 0, Math.PI * 2);
    ctx.fill();

    // 6. Current Toolhead Carriage & Pen
    const isPenDown = penState === 'DOWN';

    // Toolhead crosshairs
    ctx.strokeStyle = isPenDown ? '#10b981' : '#f59e0b';
    ctx.lineWidth = Math.max(0.2, 1 / safeZoom);
    const crossArm = Math.max(1, 6 / safeZoom);
    ctx.beginPath();
    ctx.moveTo(toolX - crossArm, toolY);
    ctx.lineTo(toolX + crossArm, toolY);
    ctx.moveTo(toolX, toolY - crossArm);
    ctx.lineTo(toolX, toolY + crossArm);
    ctx.stroke();

    // Toolhead outer halo ring with guaranteed positive radius
    ctx.strokeStyle = isPenDown ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = Math.max(0.3, 2 / safeZoom);
    ctx.beginPath();
    const haloRadius = Math.max(1, 8 / safeZoom);
    ctx.arc(toolX, toolY, haloRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Toolhead pen point with guaranteed positive radius
    ctx.fillStyle = isPenDown ? '#10b981' : '#f59e0b';
    ctx.beginPath();
    const penPointRadius = Math.max(0.5, 3 / safeZoom);
    ctx.arc(toolX, toolY, penPointRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }, [strokes, paperDim, cncWidthMm, cncHeightMm, toolX, toolY, penState, zoom, pan, showRapidMoves]);

  // Mouse wheel zoom with clamp
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(0.2, Math.min(prev * zoomFactor, 10)));
  };

  // Drag pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch pan & pinch
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      id="cnc-canvas-preview-container"
      className={`relative w-full h-full min-h-[360px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col ${className}`}
    >
      {/* Floating Toolbar Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-slate-700/80 shadow-lg">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z * 1.25, 8))}
          title="Zoom In"
          aria-label="Zoom In"
          className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.2))}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={fitToScreen}
          title="Fit to Screen"
          aria-label="Fit to Screen"
          className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 30, y: 30 });
          }}
          title="Reset View"
          aria-label="Reset View"
          className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend & Coordinate Overlay */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-[11px] text-slate-300">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-cyan-400 inline-block rounded"></span>
          <span>Pen Plot Path</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block"></span>
          <span>Travel (Pen UP)</span>
        </div>
        <div className="h-3 w-px bg-slate-700 mx-0.5" />
        <div className="font-mono text-cyan-400">
          X: {toolX.toFixed(1)} mm | Y: {toolY.toFixed(1)} mm
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            penState === 'DOWN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {penState}
        </span>
      </div>

      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        id="cnc-preview-canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1"
      />
    </div>
  );
};
