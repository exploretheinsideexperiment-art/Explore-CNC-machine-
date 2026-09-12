import React, { useState } from 'react';
import { MachineTelemetry, VectorStroke } from '../types';
import { StatusCard } from '../components/StatusCard';
import { JogControl } from '../components/JogControl';
import { ActionButtons } from '../components/ActionButtons';
import { CanvasPreview } from '../preview/CanvasPreview';
import { SafetyModal } from '../components/SafetyModal';
import { textToVectorStrokes } from '../fonts/strokeFont';
import { strokesToGCode } from '../gcode/generator';
import { cncService } from '../cnc/connection';
import { Play, Sparkles, Sliders, Cpu, FileCode, Download, Smartphone } from 'lucide-react';

interface DashboardPageProps {
  telemetry: MachineTelemetry;
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ telemetry, onNavigateTab }) => {
  const [safetyModal, setSafetyModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'HOME' | 'STOP' | 'ESTOP' | 'TEST_SQUARE';
    isDanger: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: 'HOME',
    isDanger: false,
  });

  // Demo preview strokes (Explore CNC logo / text preview)
  const [previewStrokes] = useState<VectorStroke[]>(() => {
    const res = textToVectorStrokes('EXPLORE CNC\nPLOTTER 2D', {
      fontSize: 14,
      startX: 30,
      startY: 40,
      lineSpacing: 1.4,
    });
    return res.strokes;
  });

  const handleRequestSafetyAction = (action: 'HOME' | 'STOP' | 'ESTOP') => {
    if (action === 'ESTOP') {
      setSafetyModal({
        isOpen: true,
        title: 'EMERGENCY STOP (M112)',
        message: 'This will instantly abort all motion, disable stepper coils, and lift the pen. Proceed?',
        action: 'ESTOP',
        isDanger: true,
      });
    } else if (action === 'STOP') {
      setSafetyModal({
        isOpen: true,
        title: 'Stop Current Job?',
        message: 'Are you sure you want to stop the current plot? The toolhead will raise the pen.',
        action: 'STOP',
        isDanger: true,
      });
    } else if (action === 'HOME') {
      setSafetyModal({
        isOpen: true,
        title: 'Home Plotter (G28)',
        message: 'The gantry will move towards the X and Y limit switches. Ensure the working area is clear.',
        action: 'HOME',
        isDanger: false,
      });
    }
  };

  const handleConfirmSafety = () => {
    if (safetyModal.action === 'ESTOP') {
      cncService.emergencyStop();
    } else if (safetyModal.action === 'STOP') {
      cncService.reset();
    } else if (safetyModal.action === 'HOME') {
      cncService.home();
    } else if (safetyModal.action === 'TEST_SQUARE') {
      runTestSquare();
    }
  };

  const runTestSquare = () => {
    const gcode = [
      'G21',
      'G90',
      'M5',
      'G0 X20 Y20',
      'M3',
      'G1 X60 Y20 F600',
      'G1 X60 Y60',
      'G1 X20 Y60',
      'G1 X20 Y20',
      'M5',
      'G0 X0 Y0',
    ];
    cncService.startJob(gcode);
  };

  return (
    <div id="dashboard-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Machine Status Card */}
      <StatusCard telemetry={telemetry} />

      {/* Main Two-Column Grid: 2D Canvas Preview & Physical Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 2D Preview Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Bed & Toolhead Preview</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSafetyModal({
                    isOpen: true,
                    title: 'Plot 40mm Calibration Square?',
                    message: 'This will plot a 40x40mm precision test square starting at (X20, Y20).',
                    action: 'TEST_SQUARE',
                    isDanger: false,
                  })
                }
                className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-700 rounded-lg transition"
              >
                Draw 40mm Test Square
              </button>
            </div>
          </div>

          <div className="h-[420px] w-full">
            <CanvasPreview
              strokes={previewStrokes}
              toolX={telemetry.x}
              toolY={telemetry.y}
              penState={telemetry.pen}
              paperSize="A4"
              cncWidthMm={200}
              cncHeightMm={200}
            />
          </div>
        </div>

        {/* Right: Jog D-Pad & Direct Machine Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <ActionButtons
            telemetry={telemetry}
            onRequestSafetyAction={handleRequestSafetyAction}
          />

          <JogControl
            onHomeRequest={() => handleRequestSafetyAction('HOME')}
            onZeroRequest={() => cncService.zero()}
            disabled={telemetry.state === 'RUNNING'}
          />
        </div>
      </div>

      {/* PWA Quick Install Callout Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Install Explore CNC as Phone App</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                PWA / Offline
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Install on Android, iOS, or PC for full-screen native plotter control without browser bars.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const btn = document.getElementById('btn-install-pwa-header');
            if (btn) {
              btn.click();
            }
          }}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-md"
        >
          <Smartphone className="w-4 h-4" />
          <span>Install PWA / App</span>
        </button>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <div
          id="dash-card-hardware"
          onClick={() => onNavigateTab('hardware')}
          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Hardware Setup</h4>
              <p className="text-xs text-slate-400 mt-0.5">Arduino & ESP32 (28BYJ-48 + ULN2003)</p>
            </div>
          </div>
        </div>

        <div
          id="dash-card-software"
          onClick={() => onNavigateTab('software')}
          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Software Generator</h4>
              <p className="text-xs text-slate-400 mt-0.5">Generate, copy & download firmware</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('text-plot')}
          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
              Aa
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Text to Plotter</h4>
              <p className="text-xs text-slate-400 mt-0.5">Single-stroke vector font generator</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('pdf-plot')}
          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
              PDF
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">PDF to Plotter</h4>
              <p className="text-xs text-slate-400 mt-0.5">Extract text, pages, margins & plot</p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      <SafetyModal
        isOpen={safetyModal.isOpen}
        title={safetyModal.title}
        message={safetyModal.message}
        isDanger={safetyModal.isDanger}
        onConfirm={handleConfirmSafety}
        onCancel={() => setSafetyModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
