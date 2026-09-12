import React, { useState, useMemo, useRef } from 'react';
import {
  extractTextFromPdf,
  convertPdfTextToGCode,
  ExtractedPdfPage,
  PAPER_SIZES,
} from '../pdf/pdfProcessor';
import { CanvasPreview } from '../preview/CanvasPreview';
import { MachineTelemetry, PdfPlotSettings, PaperSize } from '../types';
import { cncService } from '../cnc/connection';
import { SafetyModal } from '../components/SafetyModal';
import {
  FileUp,
  FileText,
  Play,
  Sliders,
  Clock,
  Code2,
  AlertCircle,
  CheckCircle,
  ScanText,
  RotateCw,
  Download,
} from 'lucide-react';

interface PdfPlotPageProps {
  telemetry: MachineTelemetry;
  onJobStarted?: () => void;
}

export const PdfPlotPage: React.FC<PdfPlotPageProps> = ({ telemetry, onJobStarted }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string>('');
  const [pages, setPages] = useState<ExtractedPdfPage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [settings, setSettings] = useState<PdfPlotSettings>({
    paperSize: 'A4',
    customWidth: 200,
    customHeight: 200,
    orientation: 'portrait',
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    scalePercent: 100,
    xOffset: 0,
    yOffset: 0,
    penSpeed: 600,
    fontSize: 6.5,
    lineSpacing: 1.4,
    letterSpacing: 1.0,
    selectedPages: 'current',
    customPagesString: '1',
  });

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // Handle PDF File Upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid .pdf document');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await extractTextFromPdf(file);
      setFileName(result.fileName);
      setPages(result.pages);
      setActivePageIndex(0);
    } catch (err: any) {
      setErrorMsg('Failed to process PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Convert PDF to G-Code & Vectors
  const { vectorResult, gcodeResult, text } = useMemo(() => {
    if (pages.length === 0) {
      return {
        vectorResult: { strokes: [], bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }, totalPoints: 0, strokeCount: 0 },
        gcodeResult: { gcode: '', lines: [], totalLines: 0, estimatedTimeSeconds: 0, outOfBoundsCount: 0, totalDistanceMm: 0, drawDistanceMm: 0, rapidDistanceMm: 0 },
        text: '',
      };
    }

    // Use current page if "current" selected
    const targetPages = settings.selectedPages === 'current' ? [pages[activePageIndex] || pages[0]] : pages;

    return convertPdfTextToGCode(targetPages, settings);
  }, [pages, settings, activePageIndex]);

  const handleStartPlot = () => {
    cncService.startJob(gcodeResult.lines);
    if (onJobStarted) onJobStarted();
  };

  const handleDownloadGCode = () => {
    const blob = new Blob([gcodeResult.gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.pdf$/i, '')}_plot.gcode`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="pdf-plot-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>PDF to Pen Plotter</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Extract document text, calculate margins, scale to paper, and plot with clean single-stroke vectors
          </p>
        </div>

        {pages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadGCode}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export G-Code</span>
            </button>
            <button
              type="button"
              id="btn-plot-pdf-main"
              onClick={() => setIsConfirmOpen(true)}
              disabled={gcodeResult.totalLines === 0 || telemetry.state === 'RUNNING'}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/20 transition active:scale-95 disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>START PLOTTING</span>
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone if no PDF loaded */}
      {pages.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-400 bg-slate-900/60 hover:bg-slate-900 rounded-3xl p-12 text-center cursor-pointer transition flex flex-col items-center justify-center gap-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <FileUp className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              {loading ? 'Processing PDF with Text & OCR Engine...' : 'Upload PDF from Mobile or Desktop'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Drag and drop any PDF document, or tap to choose from device. Preserves layout, line breaks, and page flow.
            </p>
          </div>
          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-950/40 px-4 py-2 rounded-xl border border-rose-800">
              {errorMsg}
            </div>
          )}
        </div>
      ) : (
        /* PDF Control & Settings + 2D Preview Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Document Info & Layout Settings */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Document Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{fileName}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{pages.length} Pages</span>
                    <span>•</span>
                    {pages[activePageIndex]?.isScannedOrImage ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ScanText className="w-3 h-3" /> OCR Processed
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Selectable Vector Text
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPages([])}
                className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition"
              >
                Change PDF
              </button>
            </div>

            {/* Page Selector */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200">Select Page to Plot</h3>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                    disabled={activePageIndex === 0}
                    className="px-2 py-1 bg-slate-800 text-slate-300 rounded disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="px-2 text-slate-200 font-mono">
                    {activePageIndex + 1} / {pages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePageIndex((p) => Math.min(pages.length - 1, p + 1))}
                    disabled={activePageIndex === pages.length - 1}
                    className="px-2 py-1 bg-slate-800 text-slate-300 rounded disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Page Selection Mode */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['current', 'all', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, selectedPages: mode }))}
                    className={`py-1.5 rounded-lg font-medium capitalize transition ${
                      settings.selectedPages === mode
                        ? 'bg-indigo-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {mode === 'current' ? 'Page ' + (activePageIndex + 1) : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Size, Orientation & Margins */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Paper, Margins & Scale</span>
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={settings.paperSize}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, paperSize: e.target.value as PaperSize }))
                    }
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs font-medium"
                  >
                    <option value="A4">A4 (210 x 297mm)</option>
                    <option value="A5">A5 (148 x 210mm)</option>
                    <option value="Letter">Letter</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        orientation: s.orientation === 'portrait' ? 'landscape' : 'portrait',
                      }))
                    }
                    title="Toggle Orientation"
                    className="p-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-750"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Margins */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Top (mm)</span>
                  <input
                    type="number"
                    value={settings.marginTop}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, marginTop: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Bottom</span>
                  <input
                    type="number"
                    value={settings.marginBottom}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, marginBottom: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Left (mm)</span>
                  <input
                    type="number"
                    value={settings.marginLeft}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, marginLeft: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Right</span>
                  <input
                    type="number"
                    value={settings.marginRight}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, marginRight: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                  />
                </div>
              </div>

              {/* Scaling & Pen Speed */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Scale</span>
                    <span className="font-mono text-indigo-400">{settings.scalePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="150"
                    step="5"
                    value={settings.scalePercent}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, scalePercent: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-indigo-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Pen Speed</span>
                    <span className="font-mono text-indigo-400">{settings.penSpeed} mm/min</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="1200"
                    step="50"
                    value={settings.penSpeed}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, penSpeed: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Est. Time</span>
                <span className="text-base font-mono font-bold text-slate-100 flex items-center justify-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {Math.floor(gcodeResult.estimatedTimeSeconds / 60)}m {gcodeResult.estimatedTimeSeconds % 60}s
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">G-Code</span>
                <span className="text-base font-mono font-bold text-slate-100 flex items-center justify-center gap-1 mt-1">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  {gcodeResult.totalLines} lines
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Strokes</span>
                <span className="text-base font-mono font-bold text-slate-100 flex items-center justify-center gap-1 mt-1">
                  {vectorResult.strokeCount}
                </span>
              </div>
            </div>
          </div>

          {/* Right: 2D Interactive Preview */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-slate-300">
              Page {activePageIndex + 1} Toolpath Preview
            </h3>
            <div className="h-[480px] w-full">
              <CanvasPreview
                strokes={vectorResult.strokes}
                paperSize={settings.paperSize}
                cncWidthMm={200}
                cncHeightMm={200}
                toolX={telemetry.x}
                toolY={telemetry.y}
                penState={telemetry.pen}
              />
            </div>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal */}
      <SafetyModal
        isOpen={isConfirmOpen}
        title="Start Plotting PDF Page?"
        message={`This will send ${gcodeResult.totalLines} commands to the plotter. Estimated plotting duration: ${Math.floor(
          gcodeResult.estimatedTimeSeconds / 60
        )}m ${gcodeResult.estimatedTimeSeconds % 60}s. Ensure your pen and paper are secured.`}
        confirmLabel="Start Plot"
        onConfirm={handleStartPlot}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
