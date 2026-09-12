import React, { useState, useEffect } from 'react';
import { CNCConfig } from '../types';
import { cncService } from '../cnc/connection';
import {
  Gauge,
  Save,
  CheckCircle2,
  Sliders,
  Wrench,
  RotateCcw,
  ArrowRight,
  Calculator,
} from 'lucide-react';

export const CalibrationPage: React.FC = () => {
  const [config, setConfig] = useState<CNCConfig>({
    stepsPerMmX: 102.4,
    stepsPerMmY: 102.4,
    maxX: 200,
    maxY: 200,
    feedrate: 600,
    penUpAngle: 45,
    penDownAngle: 90,
    returnOrigin: true,
    invertX: false,
    invertY: false,
    motorType: 'MOTOR_4WIRE_28BYJ48',
    acceleration: 400,
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Calibration Wizard State
  const [wizardAxis, setWizardAxis] = useState<'X' | 'Y'>('X');
  const [testDistanceMm, setTestDistanceMm] = useState<number>(10);
  const [measuredDistanceMm, setMeasuredDistanceMm] = useState<string>('10.0');
  const [computedSteps, setComputedSteps] = useState<number | null>(null);

  useEffect(() => {
    cncService.getConfig().then((cfg) => {
      if (cfg) setConfig(cfg);
    });
  }, []);

  const handleSaveConfig = async () => {
    await cncService.saveConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Run Wizard Test Move
  const handleWizardMove = () => {
    if (wizardAxis === 'X') {
      cncService.jog(testDistanceMm, 0, 400);
    } else {
      cncService.jog(0, testDistanceMm, 400);
    }
  };

  // Compute Corrected Steps
  const handleCalculateWizard = () => {
    const measured = parseFloat(measuredDistanceMm);
    if (!measured || measured <= 0) return;

    const currentSteps = wizardAxis === 'X' ? config.stepsPerMmX : config.stepsPerMmY;
    // Formula: New = Current * (Commanded / Measured)
    const corrected = Number((currentSteps * (testDistanceMm / measured)).toFixed(2));
    setComputedSteps(corrected);
  };

  // Apply to Active Config
  const handleApplyWizard = () => {
    if (computedSteps === null) return;
    if (wizardAxis === 'X') {
      setConfig((c) => ({ ...c, stepsPerMmX: computedSteps }));
    } else {
      setConfig((c) => ({ ...c, stepsPerMmY: computedSteps }));
    }
  };

  return (
    <div id="calibration-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <span>CNC Motion & Motor Calibration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure steps-per-mm, limits, pen angles, and run the automated calibration wizard
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveConfig}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Saved to ESP32 Flash!' : 'Save Config to ESP32'}</span>
        </button>
      </div>

      {/* Main Grid: Parameters on Left | Interactive Calibration Wizard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Kinematic & Actuator Parameters */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Axis Kinematics & Limits</span>
          </h3>

          {/* Motor Type */}
          <div className="text-xs">
            <span className="text-slate-400 block mb-1">Stepper Motor Driver Type</span>
            <select
              value={config.motorType}
              onChange={(e) => setConfig({ ...config, motorType: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
            >
              <option value="MOTOR_4WIRE_28BYJ48">28BYJ-48 5V Stepper (ULN2003 Half-Step 8-Sequence)</option>
              <option value="MOTOR_STEP_DIR">Generic STEP/DIR Driver (A4988 / TMC2208)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Steps per mm X */}
            <div>
              <span className="text-slate-400 block mb-1">Steps per mm (X)</span>
              <input
                type="number"
                step="0.1"
                value={config.stepsPerMmX}
                onChange={(e) => setConfig({ ...config, stepsPerMmX: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Steps per mm Y */}
            <div>
              <span className="text-slate-400 block mb-1">Steps per mm (Y)</span>
              <input
                type="number"
                step="0.1"
                value={config.stepsPerMmY}
                onChange={(e) => setConfig({ ...config, stepsPerMmY: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Max X */}
            <div>
              <span className="text-slate-400 block mb-1">Maximum Travel X (mm)</span>
              <input
                type="number"
                value={config.maxX}
                onChange={(e) => setConfig({ ...config, maxX: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Max Y */}
            <div>
              <span className="text-slate-400 block mb-1">Maximum Travel Y (mm)</span>
              <input
                type="number"
                value={config.maxY}
                onChange={(e) => setConfig({ ...config, maxY: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Pen Up Angle */}
            <div>
              <span className="text-slate-400 block mb-1">Pen UP Servo Angle (°)</span>
              <input
                type="number"
                value={config.penUpAngle}
                onChange={(e) => setConfig({ ...config, penUpAngle: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Pen Down Angle */}
            <div>
              <span className="text-slate-400 block mb-1">Pen DOWN Servo Angle (°)</span>
              <input
                type="number"
                value={config.penDownAngle}
                onChange={(e) => setConfig({ ...config, penDownAngle: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Max Feedrate */}
            <div>
              <span className="text-slate-400 block mb-1">Max Feedrate (mm/min)</span>
              <input
                type="number"
                value={config.feedrate}
                onChange={(e) => setConfig({ ...config, feedrate: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Acceleration */}
            <div>
              <span className="text-slate-400 block mb-1">Acceleration (mm/s²)</span>
              <input
                type="number"
                value={config.acceleration}
                onChange={(e) => setConfig({ ...config, acceleration: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Direction Inversion Checkboxes */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.invertX}
                onChange={(e) => setConfig({ ...config, invertX: e.target.checked })}
                className="accent-cyan-400 rounded"
              />
              <span>Invert X Direction</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.invertY}
                onChange={(e) => setConfig({ ...config, invertY: e.target.checked })}
                className="accent-cyan-400 rounded"
              />
              <span>Invert Y Direction</span>
            </label>
          </div>
        </div>

        {/* Right: Step-by-Step Interactive Calibration Wizard */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span>Interactive Calibration Wizard</span>
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setWizardAxis('X');
                    setComputedSteps(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    wizardAxis === 'X' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  X Axis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardAxis('Y');
                    setComputedSteps(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    wizardAxis === 'Y' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Y Axis
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Align a ruler with the {wizardAxis} axis carriage. Command a test move, measure the actual travel on the ruler, and the app will automatically calculate the corrected steps/mm!
            </p>

            {/* Step 1 */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <span>Step 1:</span>
                <span className="text-slate-200">Command Physical Test Move</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Target:</span>
                <button
                  type="button"
                  onClick={() => setTestDistanceMm(10)}
                  className={`px-2.5 py-1 rounded text-xs ${testDistanceMm === 10 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                >
                  10 mm
                </button>
                <button
                  type="button"
                  onClick={() => setTestDistanceMm(20)}
                  className={`px-2.5 py-1 rounded text-xs ${testDistanceMm === 20 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
                >
                  20 mm
                </button>
                <button
                  type="button"
                  onClick={handleWizardMove}
                  className="ml-auto px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-800 rounded-lg font-semibold transition"
                >
                  Move {wizardAxis} +{testDistanceMm}mm
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <span>Step 2:</span>
                <span className="text-slate-200">Measure & Calculate</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Measured (mm):</span>
                <input
                  type="number"
                  step="0.1"
                  value={measuredDistanceMm}
                  onChange={(e) => setMeasuredDistanceMm(e.target.value)}
                  placeholder="e.g. 9.8"
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-center"
                />
                <button
                  type="button"
                  onClick={handleCalculateWizard}
                  className="ml-auto px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition"
                >
                  Compute
                </button>
              </div>
            </div>

            {/* Step 3: Result */}
            {computedSteps !== null && (
              <div className="p-4 bg-purple-950/30 rounded-xl border border-purple-800 space-y-2 text-xs">
                <div className="font-semibold text-purple-300">Calibration Result:</div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-300">
                    Current: <span className="font-mono">{wizardAxis === 'X' ? config.stepsPerMmX : config.stepsPerMmY}</span> → New:{' '}
                    <strong className="font-mono text-purple-300 text-sm">{computedSteps} steps/mm</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyWizard}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition shadow"
                  >
                    Apply to {wizardAxis}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Formula: New Steps/mm = Current Steps/mm × (Commanded Distance / Measured Distance)
          </div>
        </div>
      </div>
    </div>
  );
};
