import React, { useState, useMemo } from 'react';
import { textToVectorStrokes } from '../fonts/strokeFont';
import { strokesToGCode } from '../gcode/generator';
import { CanvasPreview } from '../preview/CanvasPreview';
import { MachineTelemetry, PaperSize } from '../types';
import { cncService } from '../cnc/connection';
import { SafetyModal } from '../components/SafetyModal';
import {
  Type,
  Play,
  Download,
  Copy,
  Sliders,
  Settings2,
  Clock,
  Code2,
  AlertCircle,
  FileCode,
} from 'lucide-react';

interface TextPlotPageProps {
  telemetry: MachineTelemetry;
  onJobStarted?: () => void;
}

export const TextPlotPage: React.FC<TextPlotPageProps> = ({ telemetry, onJobStarted }) => {
  const [text, setText] = useState<string>(
    'Hello Vipul\nWelcome to Explore CNC\nESP32 WiFi CNC Plotter'
  );

  // Settings
  const [fontSize, setFontSize] = useState<number>(8); // mm
  const [lineSpacing, setLineSpacing] = useState<number>(1.4);
  const [letterSpacing, setLetterSpacing] = useState<number>(1.0);
  const [startX, setStartX] = useState<number>(20);
  const [startY, setStartY] = useState<number>(30);
  const [scale, setScale] = useState<number>(1.0);
  const [drawingSpeed, setDrawingSpeed] = useState<number>(600); // mm/min
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [showRapidMoves, setShowRapidMoves] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // Generate Vector Strokes & Bounding Box
  const vectorResult = useMemo(() => {
    return textToVectorStrokes(text, {
      fontSize,
      startX,
      startY,
      lineSpacing,
      letterSpacing,
      scale,
    });
  }, [text, fontSize, startX, startY, lineSpacing, letterSpacing, scale]);

  // Generate G-code
  const gcodeResult = useMemo(() => {
    return strokesToGCode(vectorResult.strokes, {
      feedrate: drawingSpeed,
      rapidFeedrate: 1200,
      penUpCommand: 'M5',
      penDownCommand: 'M3',
      returnToOrigin: true,
      maxX: 200,
      maxY: 200,
    });
  }, [vectorResult, drawingSpeed]);

  const handleStartPlot = () => {
    cncService.startJob(gcodeResult.lines);
    if (onJobStarted) onJobStarted();
  };

  const handleDownloadGCode = () => {
    const blob = new Blob([gcodeResult.gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `explore_cnc_text_${Date.now()}.gcode`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyGCode = () => {
    navigator.clipboard.writeText(gcodeResult.gcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="text-plot-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Type className="w-5 h-5 text-cyan-400" />
            <span>Text to Pen Plotter</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Single-stroke Hershey vector engine converting characters directly into G-code toolpaths
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadGCode}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save .gcode</span>
          </button>
          <button
            type="button"
            onClick={handleCopyGCode}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy G-Code'}</span>
          </button>
          <button
            type="button"
            id="btn-plot-text-main"
            onClick={() => setIsConfirmOpen(true)}
            disabled={vectorResult.strokeCount === 0 || telemetry.state === 'RUNNING'}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition active:scale-95 disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>PLOT TEXT</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Settings & Text Input | Right 2D Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Text Input & Parameter Controls */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Text Input Area */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-2">
            <label htmlFor="text-plot-textarea" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Text to Draw</span>
              <span className="text-[11px] text-slate-500">{text.length} chars</span>
            </label>
            <textarea
              id="text-plot-textarea"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-sans focus:outline-none focus:border-cyan-500 transition resize-y"
            />
          </div>

          {/* Typography & Layout Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Typography & Layout</span>
              </h3>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs font-medium"
              >
                <option value="A4">A4 (210 x 297mm)</option>
                <option value="A5">A5 (148 x 210mm)</option>
                <option value="Letter">Letter (216 x 279mm)</option>
                <option value="Custom">Custom (200 x 200mm)</option>
              </select>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Font Size */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Font Size</span>
                  <span className="font-mono text-cyan-400">{fontSize} mm</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="25"
                  step="0.5"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Scale */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Scale Multiplier</span>
                  <span className="font-mono text-cyan-400">{scale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Line Spacing */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Line Spacing</span>
                  <span className="font-mono text-cyan-400">{lineSpacing.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Letter Spacing */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Letter Spacing</span>
                  <span className="font-mono text-cyan-400">{letterSpacing.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Start X */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Start X</span>
                  <span className="font-mono text-cyan-400">{startX} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="160"
                  step="1"
                  value={startX}
                  onChange={(e) => setStartX(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Start Y */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Start Y</span>
                  <span className="font-mono text-cyan-400">{startY} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="160"
                  step="1"
                  value={startY}
                  onChange={(e) => setStartY(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Drawing Speed */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Drawing Speed (Feedrate)</span>
                <span className="font-mono text-cyan-400">{drawingSpeed} mm/min</span>
              </div>
              <input
                type="range"
                min="200"
                max="1200"
                step="50"
                value={drawingSpeed}
                onChange={(e) => setDrawingSpeed(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Job Telemetry Metrics */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Est. Time</span>
              <span className="text-base font-mono font-bold text-slate-100 flex items-center justify-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {Math.floor(gcodeResult.estimatedTimeSeconds / 60)}m {gcodeResult.estimatedTimeSeconds % 60}s
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">G-Code</span>
              <span className="text-base font-mono font-bold text-slate-100 flex items-center justify-center gap-1 mt-1">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                {gcodeResult.totalLines} lines
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Draw Dist</span>
              <span className="text-base font-mono font-bold text-slate-100 flex items-center justify-center gap-1 mt-1">
                <FileCode className="w-3.5 h-3.5 text-purple-400" />
                {gcodeResult.drawDistanceMm} mm
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 2D Interactive Preview */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">
              Interactive 2D Stroke Preview ({vectorResult.strokeCount} strokes, {vectorResult.totalPoints} points)
            </h3>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showRapidMoves}
                onChange={(e) => setShowRapidMoves(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>Show travel (pen up)</span>
            </label>
          </div>

          <div className="h-[480px] w-full">
            <CanvasPreview
              strokes={vectorResult.strokes}
              paperSize={paperSize}
              cncWidthMm={200}
              cncHeightMm={200}
              toolX={telemetry.x}
              toolY={telemetry.y}
              penState={telemetry.pen}
              showRapidMoves={showRapidMoves}
            />
          </div>

          {gcodeResult.outOfBoundsCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Warning: {gcodeResult.outOfBoundsCount} coordinates exceed the 200x200mm CNC machine limits. Decrease font size or adjust Start X/Y.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      <SafetyModal
        isOpen={isConfirmOpen}
        title="Start Plotting Text?"
        message={`This will send ${gcodeResult.totalLines} G-code commands to Explore CNC. Estimated drawing time: ${Math.floor(
          gcodeResult.estimatedTimeSeconds / 60
        )}m ${gcodeResult.estimatedTimeSeconds % 60}s. Ensure pen and paper are loaded.`}
        confirmLabel="Start Plot"
        onConfirm={handleStartPlot}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
