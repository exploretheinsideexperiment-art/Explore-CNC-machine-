import React from 'react';
import { MachineTelemetry } from '../types';
import { cncService } from '../cnc/connection';
import {
  CheckCircle2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Code2,
  Compass,
  ArrowUp,
  ArrowDown,
  Activity,
} from 'lucide-react';

interface JobPageProps {
  telemetry: MachineTelemetry;
  onNavigateHome?: () => void;
}

export const JobPage: React.FC<JobPageProps> = ({ telemetry, onNavigateHome }) => {
  const isRunning = telemetry.state === 'RUNNING';
  const isPaused = telemetry.state === 'PAUSED';
  const isComplete = telemetry.state === 'COMPLETE';

  const handleReturnToOrigin = () => {
    cncService.sendGCode('M5');
    cncService.sendGCode('G0 X0 Y0');
  };

  return (
    <div id="job-page" className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span>Active Job Monitor & Execution</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time execution status, line streaming progress, and control
        </p>
      </div>

      {/* Main Status Hero */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold block">
              Active Plot Status
            </span>
            <h3 className="text-2xl font-black text-slate-100 mt-0.5">{telemetry.state}</h3>
          </div>

          <div className="flex items-center gap-3">
            {isRunning && (
              <button
                type="button"
                onClick={() => cncService.pause()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            )}
            {isPaused && (
              <button
                type="button"
                onClick={() => cncService.resume()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
              >
                <Play className="w-4 h-4 fill-white" /> Resume
              </button>
            )}
            <button
              type="button"
              onClick={() => cncService.reset()}
              className="px-4 py-2 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 border border-slate-700 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Square className="w-4 h-4" /> Cancel / Stop
            </button>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Overall Progress</span>
            <span className="font-mono text-cyan-400 font-bold text-sm">{telemetry.progress}%</span>
          </div>
          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, telemetry.progress))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Line {telemetry.currentLine}</span>
            <span>Total {telemetry.totalLines} lines</span>
          </div>
        </div>

        {/* Real-Time Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Position X</span>
            <span className="text-xl font-bold font-mono text-slate-100 mt-1 block">
              {telemetry.x.toFixed(2)} mm
            </span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Position Y</span>
            <span className="text-xl font-bold font-mono text-slate-100 mt-1 block">
              {telemetry.y.toFixed(2)} mm
            </span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Pen Servo</span>
            <span
              className={`text-xl font-bold font-mono mt-1 block ${
                telemetry.pen === 'DOWN' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {telemetry.pen}
            </span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Link Status</span>
            <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
              {telemetry.connected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Job Complete Banner */}
        {isComplete && (
          <div className="p-5 bg-emerald-950/40 border border-emerald-600 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Job Completed Successfully!</h4>
                <p className="text-xs text-slate-400 mt-0.5">The plotter has finished all commands.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReturnToOrigin}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                Return to Origin (0,0)
              </button>
              {onNavigateHome && (
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs transition"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
