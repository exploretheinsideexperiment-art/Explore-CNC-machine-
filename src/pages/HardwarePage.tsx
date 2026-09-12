import React, { useState } from 'react';
import {
  HardwareConfig,
  MicrocontrollerType,
  ArduinoModel,
  Esp32Model,
  DEFAULT_ARDUINO_HARDWARE_CONFIG,
  DEFAULT_ESP32_HARDWARE_CONFIG,
} from '../types';
import {
  Cpu,
  Zap,
  Settings2,
  Sliders,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { safeStorage } from '../utils/storage';

interface HardwarePageProps {
  hardwareConfig: HardwareConfig;
  onUpdateHardwareConfig: (newConfig: HardwareConfig) => void;
  onNavigateToSoftware: () => void;
}

export const HardwarePage: React.FC<HardwarePageProps> = ({
  hardwareConfig,
  onUpdateHardwareConfig,
  onNavigateToSoftware,
}) => {
  const [activeTab, setActiveTab] = useState<'board' | 'pins' | 'kinematics' | 'wiring'>('board');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const isArduino = hardwareConfig.microcontroller === 'arduino';
  const isEsp32 = hardwareConfig.microcontroller === 'esp32';

  const handleSelectMicrocontroller = (type: MicrocontrollerType) => {
    if (type === 'arduino') {
      onUpdateHardwareConfig({
        ...DEFAULT_ARDUINO_HARDWARE_CONFIG,
        // preserve custom mechanical steps if desired
        driveMechanism: hardwareConfig.driveMechanism,
        pulleyPitchMm: hardwareConfig.pulleyPitchMm,
        workAreaWidthMm: hardwareConfig.workAreaWidthMm,
        workAreaHeightMm: hardwareConfig.workAreaHeightMm,
      });
    } else {
      onUpdateHardwareConfig({
        ...DEFAULT_ESP32_HARDWARE_CONFIG,
        driveMechanism: hardwareConfig.driveMechanism,
        pulleyPitchMm: hardwareConfig.pulleyPitchMm,
        workAreaWidthMm: hardwareConfig.workAreaWidthMm,
        workAreaHeightMm: hardwareConfig.workAreaHeightMm,
      });
    }
    showToast();
  };

  const handleResetDefaults = () => {
    if (isArduino) {
      onUpdateHardwareConfig({ ...DEFAULT_ARDUINO_HARDWARE_CONFIG });
    } else {
      onUpdateHardwareConfig({ ...DEFAULT_ESP32_HARDWARE_CONFIG });
    }
    showToast();
  };

  const showToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const updatePin = (
    axis: 'x' | 'y',
    pinIndex: number,
    value: number
  ) => {
    if (axis === 'x') {
      const newPins = [...hardwareConfig.xPins] as [number, number, number, number];
      newPins[pinIndex] = value;
      onUpdateHardwareConfig({ ...hardwareConfig, xPins: newPins });
    } else {
      const newPins = [...hardwareConfig.yPins] as [number, number, number, number];
      newPins[pinIndex] = value;
      onUpdateHardwareConfig({ ...hardwareConfig, yPins: newPins });
    }
  };

  const updateStepMode = (mode: 'half_step' | 'full_step') => {
    const stepsRev = mode === 'half_step' ? 4096 : 2048;
    const stepsMm = stepsRev / hardwareConfig.pulleyPitchMm;
    onUpdateHardwareConfig({
      ...hardwareConfig,
      stepMode: mode,
      stepsPerRev: stepsRev,
      stepsPerMmX: Number(stepsMm.toFixed(2)),
      stepsPerMmY: Number(stepsMm.toFixed(2)),
    });
  };

  const updateDriveMechanism = (mech: 'gt2_belt' | 'lead_screw' | 'custom') => {
    let pitch = 40;
    if (mech === 'gt2_belt') pitch = 40; // 20-tooth GT2 = 20 * 2mm = 40mm/rev
    if (mech === 'lead_screw') pitch = 1.25; // Standard M8 threaded rod = 1.25mm / rev

    const stepsMm = hardwareConfig.stepsPerRev / pitch;
    onUpdateHardwareConfig({
      ...hardwareConfig,
      driveMechanism: mech,
      pulleyPitchMm: pitch,
      stepsPerMmX: Number(stepsMm.toFixed(2)),
      stepsPerMmY: Number(stepsMm.toFixed(2)),
    });
  };

  return (
    <div id="hardware-config-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Hardware Architecture & Stepper Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Microcontroller & Motor Configuration
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Configure your microcontroller and driver parameters for your{' '}
            <span className="text-cyan-300 font-semibold">28BYJ-48 Stepper Motors</span> with{' '}
            <span className="text-cyan-300 font-semibold">ULN2003 Driver Boards</span>. The corresponding firmware will be generated automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 text-xs font-medium border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            id="proceed-to-software-btn"
            onClick={onNavigateToSoftware}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            <span>Generate Firmware Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dedicated Module Specification Card */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-100">28BYJ-48 + ULN2003 Driver System</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                5V Unipolar
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              5-Wire 4-Phase Stepper Motor with 1:64 reduction gear train, driven via Darlington transistor array. Provides exceptional positional accuracy and smooth low-vibration vector drawing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 self-stretch md:self-auto justify-around">
          <div>
            <span className="text-slate-500 block text-[10px]">REDUCTION</span>
            <span className="text-slate-200 font-bold">1:64</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div>
            <span className="text-slate-500 block text-[10px]">STEP ANGLE</span>
            <span className="text-slate-200 font-bold">5.625°/64</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div>
            <span className="text-slate-500 block text-[10px]">RESOLUTION</span>
            <span className="text-cyan-400 font-bold">
              {hardwareConfig.stepMode === 'half_step' ? '4096' : '2048'} Steps/Rev
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'board'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Microcontroller Selection</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pins')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'pins'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ULN2003 Pin Mapping</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kinematics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'kinematics'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Motion & Steps/mm</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wiring')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'wiring'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Wiring & Schematics</span>
        </button>
      </div>

      {/* SECTION 1: MICROCONTROLLER SELECTION */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Arduino Card */}
            <div
              onClick={() => handleSelectMicrocontroller('arduino')}
              className={`relative rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${
                isArduino
                  ? 'bg-slate-900/90 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-2 ring-cyan-500/30'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isArduino ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">Arduino Platform</h3>
                      <span className="text-xs text-slate-400">Uno / Nano / Mega (ATmega328P / 2560)</span>
                    </div>
                  </div>
                  {isArduino && (
                    <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Standard DIY microcontroller. Direct USB Serial connection at 115200 baud with built-in hardware timers. Perfect for budget pen plotters with robust 5V logic for driving ULN2003 inputs directly without level shifting.
                </p>

                <div className="space-y-2 mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Model:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['uno', 'nano', 'mega'] as ArduinoModel[]).map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateHardwareConfig({
                            ...hardwareConfig,
                            microcontroller: 'arduino',
                            arduinoModel: model,
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          hardwareConfig.arduinoModel === model && isArduino
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {model.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Connection:</span>
                    <span className="text-slate-200 font-mono">USB Serial (115200 baud)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Logic Level:</span>
                    <span className="text-emerald-400 font-mono">5V Native TTL</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Default Pins:</span>
                    <span className="text-cyan-300 font-mono">X: D8-D11 | Y: D4-D7 | Pen: D3</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Software generator output:</span>
                <span className="font-mono text-cyan-400">ExploreCNC_Plotter_Arduino.ino</span>
              </div>
            </div>

            {/* ESP32 Card */}
            <div
              onClick={() => handleSelectMicrocontroller('esp32')}
              className={`relative rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${
                isEsp32
                  ? 'bg-slate-900/90 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-2 ring-cyan-500/30'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isEsp32 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">ESP32 Dual-Core Platform</h3>
                      <span className="text-xs text-slate-400">ESP32 DevKit V1 / WROOM-32 / NodeMCU</span>
                    </div>
                  </div>
                  {isEsp32 && (
                    <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Dual-core 240MHz high-speed processor with built-in Wi-Fi & Bluetooth. Supports both USB Serial streaming and wireless control via Standalone Access Point / WebSockets, syncing with this web application in real time.
                </p>

                <div className="space-y-2 mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Model:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['devkit_v1', 'wroom32', 'nodemcu'] as Esp32Model[]).map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateHardwareConfig({
                            ...hardwareConfig,
                            microcontroller: 'esp32',
                            esp32Model: model,
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          hardwareConfig.esp32Model === model && isEsp32
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {model === 'devkit_v1' ? 'DevKit V1' : model === 'wroom32' ? 'WROOM-32' : 'NodeMCU-32'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Wireless:</span>
                    <span className="text-cyan-400 font-mono">Wi-Fi AP & WebSockets (Port 81)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Logic Level:</span>
                    <span className="text-amber-400 font-mono">3.3V (ULN2003 compatible)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Default Pins:</span>
                    <span className="text-cyan-300 font-mono">X: 19,18,5,17 | Y: 16,4,0,2 | Pen: 13</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Software generator output:</span>
                <span className="font-mono text-cyan-400">ExploreCNC_Plotter_ESP32.ino</span>
              </div>
            </div>
          </div>

          {/* Quick Wireless Config for ESP32 */}
          {isEsp32 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">ESP32 Wi-Fi Network Credentials</h3>
              </div>
              <p className="text-xs text-slate-400">
                The generated firmware will create a standalone Access Point with these parameters so you can connect your phone or laptop directly to plot wirelessly without an external router.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Access Point SSID
                  </label>
                  <input
                    type="text"
                    value={hardwareConfig.wifiSsid}
                    onChange={(e) => onUpdateHardwareConfig({ ...hardwareConfig, wifiSsid: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={hardwareConfig.wifiPassword}
                    placeholder="plotter123 (min 8 chars)"
                    onChange={(e) => onUpdateHardwareConfig({ ...hardwareConfig, wifiPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: ULN2003 PIN MAPPING */}
      {activeTab === 'pins' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-slate-100">
                  {isArduino ? 'Arduino' : 'ESP32'} Pin Assignment for ULN2003 Drivers
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                Target: {isArduino ? `Arduino ${hardwareConfig.arduinoModel.toUpperCase()}` : 'ESP32 DevKit'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              Each ULN2003 board has four input control pins (<code className="text-cyan-300 font-mono">IN1, IN2, IN3, IN4</code>) connecting to your microcontroller digital GPIOs. You can customize them below or use the battle-tested defaults.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* X-Axis ULN2003 */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
                    <span className="font-bold text-slate-200 text-sm">X-Axis Stepper Driver (ULN2003)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Motor 1</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={`x-pin-${idx}`}>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        IN{idx + 1} Pin
                      </label>
                      <input
                        type="number"
                        value={hardwareConfig.xPins[idx]}
                        onChange={(e) => updatePin('x', idx, parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 text-center"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>Invert X Direction:</span>
                  <button
                    type="button"
                    onClick={() => onUpdateHardwareConfig({ ...hardwareConfig, invertX: !hardwareConfig.invertX })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      hardwareConfig.invertX
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {hardwareConfig.invertX ? 'Inverted (Reverse)' : 'Normal'}
                  </button>
                </div>
              </div>

              {/* Y-Axis ULN2003 */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />
                    <span className="font-bold text-slate-200 text-sm">Y-Axis Stepper Driver (ULN2003)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Motor 2</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={`y-pin-${idx}`}>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        IN{idx + 1} Pin
                      </label>
                      <input
                        type="number"
                        value={hardwareConfig.yPins[idx]}
                        onChange={(e) => updatePin('y', idx, parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-400 text-center"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>Invert Y Direction:</span>
                  <button
                    type="button"
                    onClick={() => onUpdateHardwareConfig({ ...hardwareConfig, invertY: !hardwareConfig.invertY })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      hardwareConfig.invertY
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {hardwareConfig.invertY ? 'Inverted (Reverse)' : 'Normal'}
                  </button>
                </div>
              </div>
            </div>

            {/* Pen Lift Servo Configuration */}
            <div className="mt-6 bg-slate-950/80 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                  <span className="font-bold text-slate-200 text-sm">Pen Lift Mechanism (SG90 Servo)</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">PWM Servo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Servo Signal Pin (PWM)
                  </label>
                  <input
                    type="number"
                    value={hardwareConfig.penServoPin}
                    onChange={(e) => onUpdateHardwareConfig({ ...hardwareConfig, penServoPin: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-400 text-center"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {isArduino ? 'Standard: Pin ~3 (PWM)' : 'Standard: GPIO 13 (PWM)'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Pen UP Angle (Degrees)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={hardwareConfig.penUpAngle}
                    onChange={(e) => onUpdateHardwareConfig({ ...hardwareConfig, penUpAngle: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-400 text-center"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Pen raised (travel move)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Pen DOWN Angle (Degrees)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={hardwareConfig.penDownAngle}
                    onChange={(e) => onUpdateHardwareConfig({ ...hardwareConfig, penDownAngle: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-400 text-center"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Pen contacting paper</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: KINEMATICS & STEPS/MM */}
      {activeTab === 'kinematics' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-cyan-400" />
                <span>28BYJ-48 Stepper Kinematics & Resolution</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                The 28BYJ-48 stepper motor has a 5.625° stride with a 1:64 internal planetary gearbox. Configure the stepping sequence and mechanical drive pitch below.
              </p>
            </div>

            {/* Stepping Mode Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Stepping Sequence Mode (ULN2003 Darlington Array)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => updateStepMode('half_step')}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    hardwareConfig.stepMode === 'half_step'
                      ? 'bg-cyan-500/10 border-cyan-400 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200 text-sm">8-Step Half-Stepping (Recommended)</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">4096 Steps/Rev</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Sequences 8 discrete magnetic phases. Produces double the angular resolution, virtually eliminates gear backlash jitter, and runs whisper-quiet.
                  </p>
                </div>

                <div
                  onClick={() => updateStepMode('full_step')}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    hardwareConfig.stepMode === 'full_step'
                      ? 'bg-cyan-500/10 border-cyan-400 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200 text-sm">4-Step Full-Stepping</span>
                    <span className="text-xs font-mono text-slate-400 font-bold">2048 Steps/Rev</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Simpler 4-phase sequence. Slightly faster top speed on lower-powered microcontrollers, with standard resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Drive Mechanism */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Mechanical Drive Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'gt2_belt', label: 'GT2 Timing Belt (20T)', desc: '40 mm / revolution (2mm pitch × 20 teeth)' },
                  { id: 'lead_screw', label: 'M8 Threaded Lead Screw', desc: '1.25 mm / revolution (Standard M8 metric)' },
                  { id: 'custom', label: 'Custom Mechanism', desc: 'Specify custom mm per motor revolution' },
                ].map((mech) => (
                  <button
                    key={mech.id}
                    type="button"
                    onClick={() => updateDriveMechanism(mech.id as any)}
                    className={`p-3 rounded-xl border text-left transition ${
                      hardwareConfig.driveMechanism === mech.id
                        ? 'bg-cyan-500/10 border-cyan-400 text-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-200">{mech.label}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{mech.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Steps/mm */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Steps Per Millimeter (X-Axis)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={hardwareConfig.stepsPerMmX}
                    onChange={(e) => onUpdateHardwareConfig({ ...hardwareConfig, stepsPerMmX: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-xs text-slate-400 font-mono">steps/mm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Steps Per Millimeter (Y-Axis)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={hardwareConfig.stepsPerMmY}
                    onChange={(e) => onUpdateHardwareConfig({ ...hardwareConfig, stepsPerMmY: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-xs text-slate-400 font-mono">steps/mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: WIRING & SCHEMATICS */}
      {activeTab === 'wiring' && (
        <div className="space-y-6">
          {/* Critical Power Supply Warning */}
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-200 text-sm">
                CRITICAL: External 5V Power Supply Required for ULN2003 Boards
              </h4>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                Do <strong>NOT</strong> attempt to power the two 28BYJ-48 stepper motors from the Arduino 5V pin or ESP32 3.3V pin. A USB port provides only ~500mA, whereas two active 28BYJ-48 motors draw up to 600mA–800mA. Doing so causes brownouts and resets the MCU. Connect an external <strong>5V 2A–3A DC adapter</strong> to the ULN2003 boards and share a common GND with the microcontroller.
              </p>
            </div>
          </div>

          {/* Interactive Wiring Schematic Diagram */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Complete Hardware Interconnect Diagram</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Microcontroller Block */}
              <div className="bg-slate-950 rounded-xl p-4 border border-cyan-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Controller</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
                      {isArduino ? 'Arduino' : 'ESP32'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100 mb-2">
                    {isArduino ? `Arduino ${hardwareConfig.arduinoModel.toUpperCase()}` : 'ESP32 DevKit V1'}
                  </h4>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="p-1.5 rounded bg-slate-900 flex justify-between">
                      <span className="text-slate-400">X IN1..4:</span>
                      <span className="text-cyan-300 font-bold">{hardwareConfig.xPins.join(', ')}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 flex justify-between">
                      <span className="text-slate-400">Y IN1..4:</span>
                      <span className="text-indigo-300 font-bold">{hardwareConfig.yPins.join(', ')}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 flex justify-between">
                      <span className="text-slate-400">Pen Servo:</span>
                      <span className="text-emerald-400 font-bold">Pin {hardwareConfig.penServoPin}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 flex justify-between">
                      <span className="text-slate-400">Common GND:</span>
                      <span className="text-slate-200">Shared with PSU</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual ULN2003 Drivers */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Driver Boards</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    2× ULN2003
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-200 block">X-Axis Board</span>
                  <p className="text-slate-400 text-[11px]">
                    IN1 &rarr; Pin {hardwareConfig.xPins[0]} | IN2 &rarr; Pin {hardwareConfig.xPins[1]}<br />
                    IN3 &rarr; Pin {hardwareConfig.xPins[2]} | IN4 &rarr; Pin {hardwareConfig.xPins[3]}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-200 block">Y-Axis Board</span>
                  <p className="text-slate-400 text-[11px]">
                    IN1 &rarr; Pin {hardwareConfig.yPins[0]} | IN2 &rarr; Pin {hardwareConfig.yPins[1]}<br />
                    IN3 &rarr; Pin {hardwareConfig.yPins[2]} | IN4 &rarr; Pin {hardwareConfig.yPins[3]}
                  </p>
                </div>

                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  Power: Connect <strong>+5V</strong> & <strong>GND</strong> to External 5V Power Supply.
                </div>
              </div>

              {/* 28BYJ-48 Stepper Motors 5-Wire Connector */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Motor Cables</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    28BYJ-48
                  </span>
                </div>

                <h5 className="text-xs font-bold text-slate-200">5-Pin JST Connector Wiring</h5>
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-slate-300">Wire 1 (Blue): Phase A</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                    <span className="text-slate-300">Wire 2 (Pink): Phase B</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                    <span className="text-slate-300">Wire 3 (Yellow): Phase C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-slate-300">Wire 4 (Orange): Phase D</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-slate-300 font-bold">Wire 5 (Red): +5V Common</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                  Plugs directly into the 5-pin female socket on the ULN2003 board with keyed polarity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Navigation Action */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400">
          Selected: <span className="font-bold text-cyan-300">{isArduino ? 'Arduino' : 'ESP32'}</span> with 28BYJ-48 & ULN2003
        </div>

        <button
          type="button"
          onClick={onNavigateToSoftware}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition cursor-pointer"
        >
          <span>View Generated Firmware Code</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
