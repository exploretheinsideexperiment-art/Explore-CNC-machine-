import React from 'react';
import { Home, RotateCcw, Pause, Play, Square, AlertOctagon, ArrowUp, ArrowDown } from 'lucide-react';
import { MachineTelemetry } from '../types';
import { cncService } from '../cnc/connection';

interface ActionButtonsProps {
  telemetry: MachineTelemetry;
  onRequestSafetyAction: (action: 'HOME' | 'STOP' | 'ESTOP') => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  telemetry,
  onRequestSafetyAction,
}) => {
  const isRunning = telemetry.state === 'RUNNING';
  const isPaused = telemetry.state === 'PAUSED';
  const isPenDown = telemetry.pen === 'DOWN';

  return (
    <div
      id="action-buttons-card"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200">Machine Control & Actuators</h3>
        <span className="text-[11px] text-slate-400">Direct Actions</span>
      </div>

      {/* Emergency Stop - Full Width, High Prominence */}
      <button
        type="button"
        id="btn-emergency-stop"
        onClick={() => onRequestSafetyAction('ESTOP')}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 active:scale-[0.98] text-white font-extrabold text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-lg shadow-rose-950/60 border border-red-500/40 transition"
      >
        <AlertOctagon className="w-5 h-5 fill-white text-rose-700" />
        <span>EMERGENCY STOP (M112)</span>
      </button>

      {/* Primary Motion Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* HOME */}
        <button
          type="button"
          id="btn-action-home"
          onClick={() => onRequestSafetyAction('HOME')}
          disabled={isRunning}
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 font-medium text-xs transition disabled:opacity-40"
        >
          <Home className="w-4 h-4 text-cyan-400" />
          <span>HOME (G28)</span>
        </button>

        {/* ZERO */}
        <button
          type="button"
          id="btn-action-zero"
          onClick={() => cncService.zero()}
          disabled={isRunning}
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 font-medium text-xs transition disabled:opacity-40"
        >
          <RotateCcw className="w-4 h-4 text-indigo-400" />
          <span>ZERO (G92)</span>
        </button>

        {/* PAUSE / RESUME */}
        {isPaused ? (
          <button
            type="button"
            id="btn-action-resume"
            onClick={() => cncService.resume()}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME</span>
          </button>
        ) : (
          <button
            type="button"
            id="btn-action-pause"
            onClick={() => cncService.pause()}
            disabled={!isRunning}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md transition disabled:opacity-40"
          >
            <Pause className="w-4 h-4" />
            <span>PAUSE</span>
          </button>
        )}

        {/* STOP */}
        <button
          type="button"
          id="btn-action-stop"
          onClick={() => onRequestSafetyAction('STOP')}
          disabled={!isRunning && !isPaused}
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-200 hover:text-rose-300 border border-slate-700/80 hover:border-rose-700/60 font-medium text-xs transition disabled:opacity-40"
        >
          <Square className="w-4 h-4 text-rose-400" />
          <span>STOP JOB</span>
        </button>
      </div>

      {/* Pen Lifter Controls */}
      <div className="pt-3 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Pen Servo Actuator (GPIO 13)
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            id="btn-pen-up"
            onClick={() => cncService.setPen('UP')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
              !isPenDown
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
            <span>PEN UP (M5)</span>
          </button>

          <button
            type="button"
            id="btn-pen-down"
            onClick={() => cncService.setPen('DOWN')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
              isPenDown
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
            <span>PEN DOWN (M3)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
