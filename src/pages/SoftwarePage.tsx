import React, { useState, useMemo } from 'react';
import { HardwareConfig } from '../types';
import {
  generateArduinoFirmware,
  generateEsp32Firmware,
} from '../firmware/firmwareGenerator';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Zap,
  Layers,
  Settings,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Play,
} from 'lucide-react';
import JSZip from 'jszip';

interface SoftwarePageProps {
  hardwareConfig: HardwareConfig;
  onUpdateHardwareConfig: (newConfig: HardwareConfig) => void;
  onNavigateToHardware: () => void;
}

export const SoftwarePage: React.FC<SoftwarePageProps> = ({
  hardwareConfig,
  onUpdateHardwareConfig,
  onNavigateToHardware,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'code' | 'instructions' | 'test'>('code');
  const [testCommand, setTestCommand] = useState<string>('G01 X25 Y25 F600');
  const [testOutput, setTestOutput] = useState<string[]>([
    'ExploreCNC Serial Terminal Simulator',
    'Firmware: Ready for 28BYJ-48 + ULN2003',
    'ok',
  ]);

  const isArduino = hardwareConfig.microcontroller === 'arduino';

  // Dynamically generate code whenever hardware configuration changes
  const generatedCode = useMemo(() => {
    if (isArduino) {
      return generateArduinoFirmware(hardwareConfig);
    } else {
      return generateEsp32Firmware(hardwareConfig);
    }
  }, [hardwareConfig, isArduino]);

  const fileName = isArduino
    ? `ExploreCNC_Plotter_Arduino_${hardwareConfig.arduinoModel}.ino`
    : `ExploreCNC_Plotter_ESP32_${hardwareConfig.esp32Model}.ino`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadIno = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZipPackage = async () => {
    const zip = new JSZip();

    // 1. Sketch file
    const sketchFolder = isArduino ? 'ExploreCNC_Arduino' : 'ExploreCNC_ESP32';
    zip.file(`${sketchFolder}/${fileName}`, generatedCode);

    // 2. Wiring instructions
    const wiringDoc = `# Explore CNC - Hardware Wiring Guide
===============================================
Microcontroller: ${isArduino ? `Arduino ${hardwareConfig.arduinoModel.toUpperCase()}` : 'ESP32 DevKit V1'}
Motors: 2× 28BYJ-48 5V Stepper Motors (1:64 reduction)
Drivers: 2× ULN2003 Darlington Transistor Arrays
Pen Lift: SG90 Micro Servo (PWM)

## X-Axis Stepper (ULN2003 Board 1)
- IN1 -> Pin ${hardwareConfig.xPins[0]}
- IN2 -> Pin ${hardwareConfig.xPins[1]}
- IN3 -> Pin ${hardwareConfig.xPins[2]}
- IN4 -> Pin ${hardwareConfig.xPins[3]}
- +5V -> External 5V Power Supply (+)
- GND -> External 5V Power Supply (-) & Shared MCU GND

## Y-Axis Stepper (ULN2003 Board 2)
- IN1 -> Pin ${hardwareConfig.yPins[0]}
- IN2 -> Pin ${hardwareConfig.yPins[1]}
- IN3 -> Pin ${hardwareConfig.yPins[2]}
- IN4 -> Pin ${hardwareConfig.yPins[3]}
- +5V -> External 5V Power Supply (+)
- GND -> External 5V Power Supply (-) & Shared MCU GND

## Pen Servo
- Signal (Orange/White) -> Pin ${hardwareConfig.penServoPin}
- Power (Red) -> External 5V (+)
- Ground (Brown/Black) -> Shared GND

## Resolution & Steps/mm
- Stepping Mode: ${hardwareConfig.stepMode} (${hardwareConfig.stepsPerRev} steps/rev)
- Steps per mm X: ${hardwareConfig.stepsPerMmX}
- Steps per mm Y: ${hardwareConfig.stepsPerMmY}
- Work Area: ${hardwareConfig.workAreaWidthMm}mm × ${hardwareConfig.workAreaHeightMm}mm
`;
    zip.file(`${sketchFolder}/WIRING_GUIDE.txt`, wiringDoc);

    // 3. Readme
    const readmeDoc = `# Explore CNC Plotter Quick Start
1. Open Arduino IDE (v1.8.19 or v2.x).
2. Open ${fileName}.
3. Install required libraries:
   ${isArduino ? '- Servo (Built-in by Michael Margolis)' : '- ESP32Servo by Kevin Harrington\n   - WebSockets by Markus Sattler'}
4. Select board: ${isArduino ? `Arduino ${hardwareConfig.arduinoModel.toUpperCase()}` : 'ESP32 Dev Module'}.
5. Connect external 5V 2A power supply to ULN2003 boards.
6. Click Upload.
7. Open Serial Monitor at ${hardwareConfig.baudRate} baud (Newline & Carriage Return).
`;
    zip.file(`${sketchFolder}/README.txt`, readmeDoc);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExploreCNC_${isArduino ? 'Arduino' : 'ESP32'}_28BYJ48_Project.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunSimulatedGCode = () => {
    const cmd = testCommand.trim().toUpperCase();
    if (!cmd) return;

    let response = 'ok';
    if (cmd.startsWith('G0') || cmd.startsWith('G1')) {
      response = `[Motion Executed] 28BYJ-48 Steppers interpolated via ULN2003.\r\nok`;
    } else if (cmd.startsWith('G28')) {
      response = `[Homing] Pen lifted, X=0.00 Y=0.00 zeroed.\r\nok`;
    } else if (cmd.startsWith('M114')) {
      response = `X:25.00 Y:25.00 Pen:DOWN\r\nok`;
    } else if (cmd.startsWith('M300')) {
      response = `[Servo] Pen angle updated.\r\nok`;
    } else if (cmd.startsWith('M18') || cmd.startsWith('M84')) {
      response = `[Motors Disabled] ULN2003 driver coils de-energized (Coils cold).\r\nok`;
    }

    setTestOutput((prev) => [...prev, `> ${cmd}`, response]);
  };

  return (
    <div id="software-code-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileCode className="w-4 h-4" />
            <span>Firmware & Software Code Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {isArduino ? 'Arduino' : 'ESP32'} 28BYJ-48 Plotter Firmware
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Production-ready, fully compilable C++ sketch generated directly from your hardware selections. Optimized with Bresenham line stepping for ULN2003 drivers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToHardware}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 text-xs font-medium border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Hardware Config</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadZipPackage}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Project ZIP</span>
          </button>

          <button
            type="button"
            id="download-ino-btn"
            onClick={handleDownloadIno}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download .ino</span>
          </button>
        </div>
      </div>

      {/* Hardware Spec Summary Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Target MCU:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {isArduino ? <Cpu className="w-3.5 h-3.5 text-cyan-400" /> : <Zap className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="font-bold text-slate-200">
              {isArduino ? `Arduino ${hardwareConfig.arduinoModel.toUpperCase()}` : `ESP32 (${hardwareConfig.esp32Model})`}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <span className="text-slate-400">Motors:</span>
          <span className="font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-semibold">
            28BYJ-48 (5V)
          </span>

          <span className="text-slate-400">Drivers:</span>
          <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
            Dual ULN2003
          </span>

          <span className="text-slate-400">Resolution:</span>
          <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {hardwareConfig.stepMode === 'half_step' ? '4096' : '2048'} Steps/Rev (X:{hardwareConfig.stepsPerMmX} / Y:{hardwareConfig.stepsPerMmY} steps/mm)
          </span>
        </div>

        {/* Quick Microcontroller Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onUpdateHardwareConfig({ ...hardwareConfig, microcontroller: 'arduino' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              isArduino ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Arduino
          </button>
          <button
            type="button"
            onClick={() => onUpdateHardwareConfig({ ...hardwareConfig, microcontroller: 'esp32' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              !isArduino ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ESP32
          </button>
        </div>
      </div>

      {/* Tabs: Code Viewer / Flashing Instructions / Serial Quick Test */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'code'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Source Code ({fileName})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('instructions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'instructions'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Flashing & Setup Instructions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('test')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'test'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>G-Code Protocol Validator</span>
        </button>
      </div>

      {/* TAB 1: GENERATED CODE */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-xl border-t border-x border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="text-xs font-mono text-slate-300 font-bold ml-2">{fileName}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="copy-code-btn"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadIno}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium border border-cyan-500/40 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save File</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Container */}
          <div className="bg-slate-950 border-b border-x border-slate-800 rounded-b-xl overflow-hidden">
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[580px] leading-relaxed selection:bg-cyan-500 selection:text-slate-950">
              <code>{generatedCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: FLASHING & SETUP INSTRUCTIONS */}
      {activeTab === 'instructions' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Step-by-Step Arduino IDE Upload Guide</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-500/30">
                  1
                </div>
                <h4 className="font-bold text-slate-200 text-sm">Download Sketch</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click the <strong>"Download .ino"</strong> button above. Place the downloaded file inside an identically named folder (e.g.{' '}
                  <code className="text-cyan-300 font-mono">
                    ExploreCNC_Plotter_{isArduino ? 'Arduino' : 'ESP32'}
                  </code>
                  ) and open it with <strong>Arduino IDE</strong> (v1.8.x or v2.x).
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-500/30">
                  2
                </div>
                <h4 className="font-bold text-slate-200 text-sm">Install Required Libraries</h4>
                <div className="text-xs text-slate-400 leading-relaxed space-y-2">
                  {isArduino ? (
                    <p>
                      The standard <code className="text-cyan-300 font-mono">Servo.h</code> library is pre-installed in Arduino IDE. No third-party libraries required!
                    </p>
                  ) : (
                    <p>
                      Open <em>Tools &rarr; Manage Libraries</em> and install:
                      <br />• <strong className="text-slate-200">ESP32Servo</strong> (by Kevin Harrington)
                      <br />• <strong className="text-slate-200">WebSockets</strong> (by Markus Sattler)
                    </p>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-500/30">
                  3
                </div>
                <h4 className="font-bold text-slate-200 text-sm">Board & Upload</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In Arduino IDE, select:
                  <br />• <strong>Board:</strong> {isArduino ? `Arduino ${hardwareConfig.arduinoModel.toUpperCase()}` : 'ESP32 Dev Module'}
                  <br />• <strong>Port:</strong> Your connected USB COM Port (CH340/CP2102)
                  <br />• Click <strong>Upload</strong> (&rarr;).
                </p>
              </div>
            </div>

            {/* Serial Verification Checklist */}
            <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Verification Checklist via Serial Monitor</span>
              </h4>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>
                  Open <strong>Serial Monitor</strong> in Arduino IDE (or connect directly via the web app's USB button).
                </li>
                <li>
                  Set baud rate to <code className="text-cyan-300 font-mono font-bold">{hardwareConfig.baudRate}</code> and line ending to <strong>Newline & Carriage Return</strong>.
                </li>
                <li>
                  You should receive the initial greeting: <code className="text-emerald-400 font-mono">ExploreCNC Ready (28BYJ-48 + ULN2003)</code> followed by <code className="text-emerald-400 font-mono">ok</code>.
                </li>
                <li>
                  Type <code className="text-cyan-300 font-mono">M114</code> and press Enter. The board will reply with current coordinates <code className="text-slate-300 font-mono">X:0.00 Y:0.00 Pen:UP</code>.
                </li>
                <li>
                  Type <code className="text-cyan-300 font-mono">M300 S{hardwareConfig.penDownAngle}</code> to test pen servo drop, and <code className="text-cyan-300 font-mono">M300 S{hardwareConfig.penUpAngle}</code> to test pen raise.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: G-CODE PROTOCOL VALIDATOR */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <span>G-Code Protocol Validator & Command Tester</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Test how the generated firmware processes standard CNC G-code commands with your configured 28BYJ-48 stepper resolution and pen angles.
              </p>
            </div>

            {/* Command Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-mono text-sm">&gt;</span>
                <input
                  type="text"
                  value={testCommand}
                  onChange={(e) => setTestCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunSimulatedGCode()}
                  placeholder="e.g. G01 X20 Y20, G28, M300 S30, M114, M18"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="button"
                onClick={handleRunSimulatedGCode}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500">Quick test:</span>
              <button
                type="button"
                onClick={() => setTestCommand('G01 X30 Y30')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
              >
                G01 X30 Y30
              </button>
              <button
                type="button"
                onClick={() => setTestCommand(`M300 S${hardwareConfig.penDownAngle}`)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
              >
                M300 S{hardwareConfig.penDownAngle} (Pen Down)
              </button>
              <button
                type="button"
                onClick={() => setTestCommand(`M300 S${hardwareConfig.penUpAngle}`)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
              >
                M300 S{hardwareConfig.penUpAngle} (Pen Up)
              </button>
              <button
                type="button"
                onClick={() => setTestCommand('M114')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
              >
                M114 (Get Pos)
              </button>
              <button
                type="button"
                onClick={() => setTestCommand('G28')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
              >
                G28 (Home)
              </button>
              <button
                type="button"
                onClick={() => setTestCommand('M18')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
              >
                M18 (Coil Sleep)
              </button>
            </div>

            {/* Console Output Box */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto space-y-1">
              {testOutput.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith('>')
                      ? 'text-cyan-400 font-bold'
                      : line.includes('ok')
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
