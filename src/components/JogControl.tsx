import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, Crosshair } from 'lucide-react';
import { cncService } from '../cnc/connection';

interface JogControlProps {
  onHomeRequest: () => void;
  onZeroRequest: () => void;
  disabled?: boolean;
}

const STEP_DISTANCES = [0.1, 1.0, 10.0, 50.0];

export const JogControl: React.FC<JogControlProps> = ({
  onHomeRequest,
  onZeroRequest,
  disabled = false,
}) => {
  const [stepDistance, setStepDistance] = useState<number>(10.0);
  const [feedrate, setFeedrate] = useState<number>(600);

  const handleJog = useCallback(
    (dx: number, dy: number) => {
      if (disabled) return;
      cncService.jog(dx, dy, feedrate);
    },
    [disabled, feedrate]
  );

  // Keyboard arrow keys for jogging when focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleJog(0, stepDistance);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleJog(0, -stepDistance);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleJog(-stepDistance, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleJog(stepDistance, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, stepDistance, handleJog]);

  return (
    <div
      id="jog-control-card"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col items-center justify-between"
    >
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span>Manual Jog & D-Pad</span>
        </h3>
        <span className="text-[11px] text-slate-400">Arrows support</span>
      </div>

      {/* Step Distance Selector */}
      <div className="w-full mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-slate-400 mr-1">Step:</span>
        {STEP_DISTANCES.map((step) => (
          <button
            key={step}
            type="button"
            id={`step-btn-${step}`}
            onClick={() => setStepDistance(step)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              stepDistance === step
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {step}mm
          </button>
        ))}
      </div>

      {/* Touch-Friendly D-Pad Layout */}
      <div className="relative my-6 w-48 h-48 flex items-center justify-center">
        {/* Y+ Button */}
        <button
          type="button"
          id="btn-jog-y-plus"
          disabled={disabled}
          onClick={() => handleJog(0, stepDistance)}
          title={`Jog Y +${stepDistance}mm`}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-slate-100 rounded-2xl border border-slate-700 flex flex-col items-center justify-center shadow-md transition disabled:opacity-40"
        >
          <ArrowUp className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-bold mt-0.5">Y+</span>
        </button>

        {/* X- Button */}
        <button
          type="button"
          id="btn-jog-x-minus"
          disabled={disabled}
          onClick={() => handleJog(-stepDistance, 0)}
          title={`Jog X -${stepDistance}mm`}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-slate-100 rounded-2xl border border-slate-700 flex flex-col items-center justify-center shadow-md transition disabled:opacity-40"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-bold mt-0.5">X-</span>
        </button>

        {/* Center HOME Button */}
        <button
          type="button"
          id="btn-jog-center-home"
          disabled={disabled}
          onClick={onHomeRequest}
          title="Home Plotter (G28)"
          className="w-14 h-14 bg-cyan-950 hover:bg-cyan-900 border-2 border-cyan-500 text-cyan-400 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-cyan-950 transition active:scale-95 disabled:opacity-40"
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight mt-0.5">HOME</span>
        </button>

        {/* X+ Button */}
        <button
          type="button"
          id="btn-jog-x-plus"
          disabled={disabled}
          onClick={() => handleJog(stepDistance, 0)}
          title={`Jog X +${stepDistance}mm`}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-slate-100 rounded-2xl border border-slate-700 flex flex-col items-center justify-center shadow-md transition disabled:opacity-40"
        >
          <ArrowRight className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-bold mt-0.5">X+</span>
        </button>

        {/* Y- Button */}
        <button
          type="button"
          id="btn-jog-y-minus"
          disabled={disabled}
          onClick={() => handleJog(0, -stepDistance)}
          title={`Jog Y -${stepDistance}mm`}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-slate-100 rounded-2xl border border-slate-700 flex flex-col items-center justify-center shadow-md transition disabled:opacity-40"
        >
          <ArrowDown className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-bold mt-0.5">Y-</span>
        </button>
      </div>

      {/* Speed & Zero Shortcuts */}
      <div className="w-full flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onZeroRequest}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition"
        >
          Zero Work Pos (G92)
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Speed:</span>
          <select
            value={feedrate}
            onChange={(e) => setFeedrate(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono"
          >
            <option value="300">300 mm/min</option>
            <option value="600">600 mm/min</option>
            <option value="900">900 mm/min</option>
            <option value="1200">1200 mm/min</option>
          </select>
        </div>
      </div>
    </div>
  );
};
