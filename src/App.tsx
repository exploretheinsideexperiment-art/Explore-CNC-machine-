import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Navigation, TabType } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { TextPlotPage } from './pages/TextPlotPage';
import { PdfPlotPage } from './pages/PdfPlotPage';
import { FileManagerPage } from './pages/FileManagerPage';
import { CalibrationPage } from './pages/CalibrationPage';
import { WifiSettingsPage } from './pages/WifiSettingsPage';
import { JobPage } from './pages/JobPage';
import { HardwarePage } from './pages/HardwarePage';
import { SoftwarePage } from './pages/SoftwarePage';
import { JogControl } from './components/JogControl';
import { ActionButtons } from './components/ActionButtons';
import { StatusCard } from './components/StatusCard';
import { CanvasPreview } from './preview/CanvasPreview';
import {
  MachineTelemetry,
  HardwareConfig,
  DEFAULT_ARDUINO_HARDWARE_CONFIG,
} from './types';
import { cncService } from './cnc/connection';
import { SafetyModal } from './components/SafetyModal';
import { safeStorage } from './utils/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [telemetry, setTelemetry] = useState<MachineTelemetry>(() => cncService.getLatestTelemetry());
  const [isWifiModalOpen, setIsWifiModalOpen] = useState<boolean>(false);

  // Persistent Hardware configuration for Arduino/ESP32 + 28BYJ-48 + ULN2003
  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig>(() => {
    try {
      const saved = safeStorage.getItem('explore_cnc_hw_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_ARDUINO_HARDWARE_CONFIG;
  });

  const handleUpdateHardwareConfig = (newConfig: HardwareConfig) => {
    setHardwareConfig(newConfig);
    try {
      safeStorage.setItem('explore_cnc_hw_config', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  // Safety modal for manual tab
  const [safetyModal, setSafetyModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'HOME' | 'STOP' | 'ESTOP';
    isDanger: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: 'HOME',
    isDanger: false,
  });

  useEffect(() => {
    const unsubscribe = cncService.subscribe((data) => {
      setTelemetry(data);
    });
    return () => unsubscribe();
  }, []);

  const handleRequestSafetyAction = (action: 'HOME' | 'STOP' | 'ESTOP') => {
    if (action === 'ESTOP') {
      setSafetyModal({
        isOpen: true,
        title: 'EMERGENCY STOP (M112)',
        message: 'This will immediately abort all motion and raise the pen. Proceed?',
        action: 'ESTOP',
        isDanger: true,
      });
    } else if (action === 'STOP') {
      setSafetyModal({
        isOpen: true,
        title: 'Stop Motion / Clear Queue?',
        message: 'Are you sure you want to stop current moves?',
        action: 'STOP',
        isDanger: true,
      });
    } else if (action === 'HOME') {
      setSafetyModal({
        isOpen: true,
        title: 'Home Plotter (G28)',
        message: 'The gantry will move towards the homing switches. Ensure area is clear.',
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Header */}
      <Header
        telemetry={telemetry}
        onOpenWifiModal={() => setCurrentTab('wifi')}
      />

      {/* Main Tab Bar & Mobile Bottom Bar */}
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Active Tab View Content */}
      <main className="flex-1 overflow-x-hidden">
        {currentTab === 'dashboard' && (
          <DashboardPage
            telemetry={telemetry}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'hardware' && (
          <HardwarePage
            hardwareConfig={hardwareConfig}
            onUpdateHardwareConfig={handleUpdateHardwareConfig}
            onNavigateToSoftware={() => setCurrentTab('software')}
          />
        )}

        {currentTab === 'software' && (
          <SoftwarePage
            hardwareConfig={hardwareConfig}
            onUpdateHardwareConfig={handleUpdateHardwareConfig}
            onNavigateToHardware={() => setCurrentTab('hardware')}
          />
        )}

        {currentTab === 'text-plot' && (
          <TextPlotPage
            telemetry={telemetry}
            onJobStarted={() => setCurrentTab('jobs')}
          />
        )}

        {currentTab === 'pdf-plot' && (
          <PdfPlotPage
            telemetry={telemetry}
            onJobStarted={() => setCurrentTab('jobs')}
          />
        )}

        {currentTab === 'files' && (
          <FileManagerPage onJobStarted={() => setCurrentTab('jobs')} />
        )}

        {currentTab === 'manual' && (
          <div id="manual-control-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
            <StatusCard telemetry={telemetry} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 h-[420px]">
                <CanvasPreview
                  toolX={telemetry.x}
                  toolY={telemetry.y}
                  penState={telemetry.pen}
                  paperSize="A4"
                  cncWidthMm={200}
                  cncHeightMm={200}
                />
              </div>
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
            <SafetyModal
              isOpen={safetyModal.isOpen}
              title={safetyModal.title}
              message={safetyModal.message}
              isDanger={safetyModal.isDanger}
              onConfirm={handleConfirmSafety}
              onCancel={() => setSafetyModal((prev) => ({ ...prev, isOpen: false }))}
            />
          </div>
        )}

        {currentTab === 'jobs' && (
          <JobPage
            telemetry={telemetry}
            onNavigateHome={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'calibration' && <CalibrationPage />}

        {currentTab === 'wifi' && <WifiSettingsPage telemetry={telemetry} />}
      </main>
    </div>
  );
}
