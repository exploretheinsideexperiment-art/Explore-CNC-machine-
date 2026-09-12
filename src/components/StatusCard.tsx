import React from 'react';
import { MachineTelemetry } from '../types';
import { Crosshair, ArrowUpDown, Activity, CheckCircle2 } from 'lucide-react';

interface StatusCardProps {
  telemetry: MachineTelemetry;
}

export const StatusCard: React.FC<StatusCardProps> = ({ telemetry }) => {
  const isPenDown = telemetry.pen === 'DOWN';

  return (
    <div
      id="machine-status-card"
      className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
    >
      {/* Subtle top glow accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

      {/* Grid of Telemetry Readings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* X Position */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>X Position</span>
            <span className="text-[10px] font-mono text-cyan-400">AXIS</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-slate-100 flex items-baseline gap-1">
            <span>{telemetry.x.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-sans">mm</span>
          </div>
        </div>

        {/* Y Position */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Y Position</span>
            <span className="text-[10px] font-mono text-cyan-400">AXIS</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-slate-100 flex items-baseline gap-1">
            <span>{telemetry.y.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-sans">mm</span>
          </div>
        </div>

        {/* Pen Status */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pen Status</span>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isPenDown ? 'bg-emerald-400 shadow-md shadow-emerald-500/50' : 'bg-amber-400 shadow-md shadow-amber-500/50'
              }`}
            />
            <span className={`text-lg sm:text-xl font-bold ${isPenDown ? 'text-emerald-400' : 'text-amber-400'}`}>
              {telemetry.pen}
            </span>
          </div>
        </div>

        {/* Machine Status */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Machine State</span>
            <Activity className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-sm sm:text-base font-semibold text-slate-200 mt-1 truncate">
            {telemetry.state}
          </div>
        </div>
      </div>

      {/* Job Progress Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Job Progress</span>
          </span>
          <span className="font-mono text-cyan-400 font-semibold">
            {telemetry.progress}%{' '}
            <span className="text-slate-500 text-[11px]">
              ({telemetry.currentLine} / {telemetry.totalLines} lines)
            </span>
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, telemetry.progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
