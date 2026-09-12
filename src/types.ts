export type MachineState =
  | 'IDLE'
  | 'RUNNING'
  | 'PAUSED'
  | 'HOMING'
  | 'ERROR'
  | 'EMERGENCY STOP'
  | 'COMPLETE';

export type PenState = 'UP' | 'DOWN';

export interface MachineTelemetry {
  state: MachineState;
  x: number;
  y: number;
  progress: number;
  currentLine: number;
  totalLines: number;
  pen: PenState;
  queue?: number;
  wifiSsid?: string;
  ip?: string;
  rssi?: number;
  connected: boolean;
  isSimulated?: boolean;
}

export interface CNCConfig {
  stepsPerMmX: number;
  stepsPerMmY: number;
  maxX: number;
  maxY: number;
  feedrate: number;
  penUpAngle: number;
  penDownAngle: number;
  returnOrigin: boolean;
  invertX: boolean;
  invertY: boolean;
  motorType: 'MOTOR_4WIRE_28BYJ48' | 'MOTOR_STEP_DIR';
  acceleration: number;
}

export interface VectorPoint {
  x: number;
  y: number;
}

export interface VectorStroke {
  points: VectorPoint[];
}

export interface GCodeCommand {
  raw: string;
  type: string;
  x?: number;
  y?: number;
  feedrate?: number;
  pen?: PenState;
  isRapid?: boolean;
  isDraw?: boolean;
}

export type PaperSize = 'A4' | 'A5' | 'Letter' | 'Custom';
export type Orientation = 'portrait' | 'landscape';

export interface PaperDimensions {
  width: number;
  height: number;
}

export interface PdfPlotSettings {
  paperSize: PaperSize;
  customWidth: number;
  customHeight: number;
  orientation: Orientation;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  scalePercent: number;
  xOffset: number;
  yOffset: number;
  penSpeed: number;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  selectedPages: 'all' | 'current' | 'custom';
  customPagesString: string;
}

export interface TextPlotSettings {
  text: string;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  startX: number;
  startY: number;
  scale: number;
  penUpAngle: number;
  penDownAngle: number;
  drawingSpeed: number;
  paperSize: PaperSize;
}

export interface JobInfo {
  id: string;
  name: string;
  fileName: string;
  fileSize?: string;
  totalLines: number;
  estimatedTimeSeconds: number;
  gcodeLines: string[];
  createdAt: string;
}

export type MicrocontrollerType = 'arduino' | 'esp32';
export type ArduinoModel = 'uno' | 'nano' | 'mega';
export type Esp32Model = 'devkit_v1' | 'wroom32' | 'nodemcu';
export type StepSequenceMode = 'half_step' | 'full_step';
export type DriveMechanism = 'gt2_belt' | 'lead_screw' | 'custom';

export interface HardwareConfig {
  microcontroller: MicrocontrollerType;
  arduinoModel: ArduinoModel;
  esp32Model: Esp32Model;
  motorType: '28BYJ-48';
  driverBoard: 'ULN2003';
  stepMode: StepSequenceMode;
  stepsPerRev: number;
  driveMechanism: DriveMechanism;
  pulleyPitchMm: number;
  leadScrewPitchMm: number;
  stepsPerMmX: number;
  stepsPerMmY: number;
  xPins: [number, number, number, number];
  yPins: [number, number, number, number];
  penMechanism: 'servo_sg90' | 'stepper_28byj48';
  penServoPin: number;
  penUpAngle: number;
  penDownAngle: number;
  invertX: boolean;
  invertY: boolean;
  maxFeedrateMmMin: number;
  workAreaWidthMm: number;
  workAreaHeightMm: number;
  baudRate: number;
  enableWifi: boolean;
  wifiSsid: string;
  wifiPassword: string;
  webServerPort: number;
  wsServerPort: number;
}

export const DEFAULT_ARDUINO_HARDWARE_CONFIG: HardwareConfig = {
  microcontroller: 'arduino',
  arduinoModel: 'uno',
  esp32Model: 'devkit_v1',
  motorType: '28BYJ-48',
  driverBoard: 'ULN2003',
  stepMode: 'half_step',
  stepsPerRev: 4096,
  driveMechanism: 'gt2_belt',
  pulleyPitchMm: 40, // 20-tooth GT2 (2mm pitch * 20 teeth = 40mm / rev)
  leadScrewPitchMm: 1.25,
  stepsPerMmX: 102.4, // 4096 / 40 = 102.4 steps/mm
  stepsPerMmY: 102.4,
  xPins: [8, 9, 10, 11], // ULN2003 IN1, IN2, IN3, IN4
  yPins: [4, 5, 6, 7],   // ULN2003 IN1, IN2, IN3, IN4
  penMechanism: 'servo_sg90',
  penServoPin: 3,        // Arduino PWM pin ~D3
  penUpAngle: 50,
  penDownAngle: 15,
  invertX: false,
  invertY: false,
  maxFeedrateMmMin: 600,
  workAreaWidthMm: 200,
  workAreaHeightMm: 200,
  baudRate: 115200,
  enableWifi: false,
  wifiSsid: 'ExploreCNC-Network',
  wifiPassword: '',
  webServerPort: 80,
  wsServerPort: 81,
};

export const DEFAULT_ESP32_HARDWARE_CONFIG: HardwareConfig = {
  microcontroller: 'esp32',
  arduinoModel: 'uno',
  esp32Model: 'devkit_v1',
  motorType: '28BYJ-48',
  driverBoard: 'ULN2003',
  stepMode: 'half_step',
  stepsPerRev: 4096,
  driveMechanism: 'gt2_belt',
  pulleyPitchMm: 40,
  leadScrewPitchMm: 1.25,
  stepsPerMmX: 102.4,
  stepsPerMmY: 102.4,
  xPins: [19, 18, 5, 17], // ESP32 GPIOs for X ULN2003 (IN1-IN4)
  yPins: [16, 4, 0, 2],   // ESP32 GPIOs for Y ULN2003 (IN1-IN4)
  penMechanism: 'servo_sg90',
  penServoPin: 13,        // ESP32 GPIO 13 for Pen Servo
  penUpAngle: 50,
  penDownAngle: 15,
  invertX: false,
  invertY: false,
  maxFeedrateMmMin: 800,
  workAreaWidthMm: 200,
  workAreaHeightMm: 200,
  baudRate: 115200,
  enableWifi: true,
  wifiSsid: 'ExploreCNC-Plotter',
  wifiPassword: 'plotterpassword',
  webServerPort: 80,
  wsServerPort: 81,
};
