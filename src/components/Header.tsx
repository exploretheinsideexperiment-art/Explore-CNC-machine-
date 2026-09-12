import React from 'react';
import { Wifi, Cpu, AlertCircle, Compass, Radio } from 'lucide-react';
import { MachineTelemetry } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { cncService } from '../cnc/connection';

interface HeaderProps {
  telemetry: MachineTelemetry;
  onOpenWifiModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ telemetry, onOpenWifiModal }) => {
  const isSim = telemetry.isSimulated ?? false;

  const toggleSimMode = () => {
    cncService.setMode(!isSim);
  };

  const getMachineBadge = () => {
    switch (telemetry.state) {
      case 'IDLE':
        return <span className="text-emerald-400 font-medium">Ready</span>;
      case 'RUNNING':
        return <span className="text-cyan-400 font-medium animate-pulse">Running ({telemetry.progress}%)</span>;
      case 'PAUSED':
        return <span className="text-amber-400 font-medium">Paused</span>;
      case 'HOMING':
        return <span className="text-blue-400 font-medium animate-pulse">Homing</span>;
      case 'EMERGENCY STOP':
        return <span className="text-rose-400 font-bold">EMERGENCY STOP</span>;
      case 'COMPLETE':
        return <span className="text-purple-400 font-medium">Job Complete</span>;
      default:
        return <span className="text-slate-400 font-medium">{telemetry.state}</span>;
    }
  };

  return (
    <header
      id="app-header"
      className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30"
    >
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center">
          <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Explore CNC</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono uppercase">
              Plotter
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">ESP32 2D Pen Plotter Controller</p>
        </div>
      </div>

      {/* Telemetry Status Indicators */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        {/* Simulation / Live Mode Toggle */}
        <button
          type="button"
          onClick={toggleSimMode}
          title="Click to toggle between Virtual Simulator and Live ESP32 Hardware"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
            isSim
              ? 'bg-purple-950/60 border-purple-800/80 text-purple-300 hover:bg-purple-900/60'
              : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
          }`}
        >
          {isSim ? (
            <>
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Simulator Mode</span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>ESP32 Live</span>
            </>
          )}
        </button>

        {/* Wi-Fi Status */}
        <button
          type="button"
          onClick={onOpenWifiModal}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg border border-slate-700/80 text-slate-300 text-[11px] transition"
        >
          <Wifi className={`w-3.5 h-3.5 ${telemetry.connected ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span>
            Wi-Fi: <strong className={telemetry.connected ? 'text-emerald-400' : 'text-rose-400'}>{telemetry.connected ? 'Connected' : 'Disconnected'}</strong>
          </span>
        </button>

        {/* Machine Status */}
        <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/80 text-slate-300 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Machine: {getMachineBadge()}</span>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton />
      </div>
    </header>
  );
};
