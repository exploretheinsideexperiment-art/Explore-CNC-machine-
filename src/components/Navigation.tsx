import React from 'react';
import {
  LayoutDashboard,
  Type,
  FileText,
  FolderOpen,
  Sliders,
  CheckCircle2,
  Gauge,
  Wifi,
  Settings,
  Compass,
  Cpu,
  FileCode,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'hardware'
  | 'software'
  | 'text-plot'
  | 'pdf-plot'
  | 'files'
  | 'manual'
  | 'jobs'
  | 'calibration'
  | 'wifi';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hardware', label: 'Hardware', icon: Cpu },
    { id: 'software', label: 'Software', icon: FileCode },
    { id: 'text-plot', label: 'Text Plot', icon: Type },
    { id: 'pdf-plot', label: 'PDF Plot', icon: FileText },
    { id: 'files', label: 'File Manager', icon: FolderOpen },
    { id: 'manual', label: 'Manual Control', icon: Sliders },
    { id: 'jobs', label: 'Jobs', icon: CheckCircle2 },
    { id: 'calibration', label: 'Calibration', icon: Gauge },
    { id: 'wifi', label: 'Wi-Fi Setup', icon: Wifi },
  ];

  return (
    <>
      {/* Desktop & Tablet Top/Sub Navigation Bar */}
      <nav
        id="desktop-subnav"
        className="hidden md:flex items-center gap-1.5 px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1.5 py-1.5 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition ${
            currentTab === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('hardware')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition ${
            currentTab === 'hardware' || currentTab === 'software' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Hardware</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('text-plot')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition ${
            currentTab === 'text-plot' || currentTab === 'pdf-plot' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Plot</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('files')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition ${
            currentTab === 'files' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Files</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('manual')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition ${
            currentTab === 'manual' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Jog</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('calibration')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition ${
            currentTab === 'calibration' || currentTab === 'wifi' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Config</span>
        </button>
      </nav>
    </>
  );
};
