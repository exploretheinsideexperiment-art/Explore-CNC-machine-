import { MachineTelemetry, CNCConfig, MachineState, PenState } from '../types';
import { safeStorage } from '../utils/storage';

export type TelemetryListener = (telemetry: MachineTelemetry) => void;

class CNCConnectionService {
  private ip: string = safeStorage.getItem('explore_cnc_ip') || '192.168.4.1';
  private ws: WebSocket | null = null;
  private isSimulated: boolean = true;
  private listeners: Set<TelemetryListener> = new Set();
  private pollInterval: any = null;

  // Simulator state
  private simTelemetry: MachineTelemetry = {
    state: 'IDLE',
    x: 0,
    y: 0,
    progress: 0,
    currentLine: 0,
    totalLines: 0,
    pen: 'UP',
    queue: 0,
    wifiSsid: 'Explore-CNC-Sim',
    ip: '192.168.4.1',
    rssi: -45,
    connected: true,
    isSimulated: true,
  };

  private simQueue: string[] = [];
  private simTimer: any = null;

  constructor() {
    // If a saved IP exists or user requests live connection
    const mode = safeStorage.getItem('explore_cnc_mode');
    this.isSimulated = mode !== 'live';
    if (!this.isSimulated) {
      this.connectWebSocket();
    } else {
      this.startSimHeartbeat();
    }
  }

  public setMode(simulated: boolean) {
    this.isSimulated = simulated;
    safeStorage.setItem('explore_cnc_mode', simulated ? 'sim' : 'live');
    if (!simulated) {
      this.connectWebSocket();
    } else {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.startSimHeartbeat();
    }
  }

  public isSimulation(): boolean {
    return this.isSimulated;
  }

  public setIp(newIp: string) {
    this.ip = newIp.trim();
    safeStorage.setItem('explore_cnc_ip', this.ip);
    if (!this.isSimulated) {
      this.connectWebSocket();
    }
  }

  public getIp(): string {
    return this.ip;
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.getLatestTelemetry());
    return () => this.listeners.delete(listener);
  }

  private notify(data: MachineTelemetry) {
    this.listeners.forEach((fn) => fn(data));
  }

  public getLatestTelemetry(): MachineTelemetry {
    return { ...this.simTelemetry };
  }

  // Live WebSocket Connection
  private connectWebSocket() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }

    try {
      const wsUrl = `ws://${this.ip}:81`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.simTelemetry.connected = true;
        this.simTelemetry.isSimulated = false;
        this.simTelemetry.ip = this.ip;
        this.notify(this.simTelemetry);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.simTelemetry = {
            ...this.simTelemetry,
            state: (data.state as MachineState) || this.simTelemetry.state,
            x: data.x ?? this.simTelemetry.x,
            y: data.y ?? this.simTelemetry.y,
            progress: data.progress ?? this.simTelemetry.progress,
            currentLine: data.currentLine ?? this.simTelemetry.currentLine,
            totalLines: data.totalLines ?? this.simTelemetry.totalLines,
            pen: (data.pen as PenState) || this.simTelemetry.pen,
            connected: true,
            isSimulated: false,
          };
          this.notify(this.simTelemetry);
        } catch (err) {}
      };

      this.ws.onclose = () => {
        this.simTelemetry.connected = false;
        this.notify(this.simTelemetry);
      };

      this.ws.onerror = () => {
        this.simTelemetry.connected = false;
        this.notify(this.simTelemetry);
      };
    } catch (e) {
      this.simTelemetry.connected = false;
      this.notify(this.simTelemetry);
    }
  }

  // Simulation Heartbeat
  private startSimHeartbeat() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (this.isSimulated) {
        this.simTelemetry.connected = true;
        this.simTelemetry.isSimulated = true;
        this.notify({ ...this.simTelemetry });
      }
    }, 250);
  }

  // CNC Commands
  public async home(): Promise<void> {
    if (this.isSimulated) {
      this.simTelemetry.state = 'HOMING';
      this.notify({ ...this.simTelemetry });
      await new Promise((r) => setTimeout(r, 600));
      this.simTelemetry.x = 0;
      this.simTelemetry.y = 0;
      this.simTelemetry.pen = 'UP';
      this.simTelemetry.state = 'IDLE';
      this.notify({ ...this.simTelemetry });
      return;
    }

    await fetch(`http://${this.ip}/api/home`, { method: 'POST' }).catch(() => {});
  }

  public async zero(): Promise<void> {
    if (this.isSimulated) {
      this.simTelemetry.x = 0;
      this.simTelemetry.y = 0;
      this.notify({ ...this.simTelemetry });
      return;
    }
    await fetch(`http://${this.ip}/api/zero`, { method: 'POST' }).catch(() => {});
  }

  public async jog(dx: number, dy: number, feedrate = 600): Promise<void> {
    if (this.isSimulated) {
      const maxX = 200;
      const maxY = 200;
      this.simTelemetry.x = Math.max(0, Math.min(maxX, Number((this.simTelemetry.x + dx).toFixed(2))));
      this.simTelemetry.y = Math.max(0, Math.min(maxY, Number((this.simTelemetry.y + dy).toFixed(2))));
      this.notify({ ...this.simTelemetry });
      return;
    }

    const body = new URLSearchParams({
      dx: dx.toString(),
      dy: dy.toString(),
      feedrate: feedrate.toString(),
    });
    await fetch(`http://${this.ip}/api/jog`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).catch(() => {});
  }

  public async setPen(state: PenState): Promise<void> {
    this.simTelemetry.pen = state;
    this.notify({ ...this.simTelemetry });

    if (!this.isSimulated) {
      const body = new URLSearchParams({ state });
      await fetch(`http://${this.ip}/api/pen`, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).catch(() => {});
    }
  }

  public async pause(): Promise<void> {
    this.simTelemetry.state = 'PAUSED';
    this.notify({ ...this.simTelemetry });
    if (!this.isSimulated) {
      await fetch(`http://${this.ip}/api/pause`, { method: 'POST' }).catch(() => {});
    }
  }

  public async resume(): Promise<void> {
    this.simTelemetry.state = 'RUNNING';
    this.notify({ ...this.simTelemetry });
    if (!this.isSimulated) {
      await fetch(`http://${this.ip}/api/resume`, { method: 'POST' }).catch(() => {});
    } else {
      this.stepSimulation();
    }
  }

  public async emergencyStop(): Promise<void> {
    this.simQueue = [];
    if (this.simTimer) clearTimeout(this.simTimer);
    this.simTelemetry.state = 'EMERGENCY STOP';
    this.simTelemetry.pen = 'UP';
    this.simTelemetry.queue = 0;
    this.notify({ ...this.simTelemetry });

    if (!this.isSimulated) {
      await fetch(`http://${this.ip}/api/stop`, { method: 'POST' }).catch(() => {});
    }
  }

  public async reset(): Promise<void> {
    this.simQueue = [];
    if (this.simTimer) clearTimeout(this.simTimer);
    this.simTelemetry.state = 'IDLE';
    this.simTelemetry.progress = 0;
    this.simTelemetry.currentLine = 0;
    this.simTelemetry.totalLines = 0;
    this.simTelemetry.queue = 0;
    this.notify({ ...this.simTelemetry });

    if (!this.isSimulated) {
      await fetch(`http://${this.ip}/api/reset`, { method: 'POST' }).catch(() => {});
    }
  }

  public async sendGCode(code: string): Promise<void> {
    if (this.isSimulated) {
      this.simQueue.push(code);
      if (this.simTelemetry.state !== 'RUNNING') {
        this.simTelemetry.state = 'RUNNING';
        this.simTelemetry.totalLines = this.simQueue.length;
        this.simTelemetry.currentLine = 0;
        this.stepSimulation();
      }
      return;
    }

    const body = new URLSearchParams({ gcode: code });
    await fetch(`http://${this.ip}/api/gcode`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).catch(() => {});
  }

  public async startJob(lines: string[]): Promise<void> {
    if (this.isSimulated) {
      this.simQueue = [...lines];
      this.simTelemetry.totalLines = lines.length;
      this.simTelemetry.currentLine = 0;
      this.simTelemetry.progress = 0;
      this.simTelemetry.state = 'RUNNING';
      this.notify({ ...this.simTelemetry });
      this.stepSimulation();
      return;
    }

    await fetch(`http://${this.ip}/api/job`, {
      method: 'POST',
      body: lines.join('\n'),
      headers: { 'Content-Type': 'text/plain' },
    }).catch(() => {});
  }

  private stepSimulation() {
    if (this.simTelemetry.state !== 'RUNNING') return;
    if (this.simQueue.length === 0) {
      this.simTelemetry.state = 'COMPLETE';
      this.simTelemetry.progress = 100;
      this.simTelemetry.pen = 'UP';
      this.notify({ ...this.simTelemetry });
      return;
    }

    const line = this.simQueue.shift()!;
    this.simTelemetry.currentLine++;
    this.simTelemetry.progress = Math.min(
      100,
      Math.round((this.simTelemetry.currentLine / (this.simTelemetry.totalLines || 1)) * 100)
    );

    // Parse simulated move
    const raw = line.trim().toUpperCase();
    if (raw.includes('M3')) {
      this.simTelemetry.pen = 'DOWN';
    } else if (raw.includes('M5')) {
      this.simTelemetry.pen = 'UP';
    } else {
      const xMatch = raw.match(/X\s*(-?\d+(\.\d+)?)/);
      const yMatch = raw.match(/Y\s*(-?\d+(\.\d+)?)/);
      if (xMatch) this.simTelemetry.x = parseFloat(xMatch[1]);
      if (yMatch) this.simTelemetry.y = parseFloat(yMatch[1]);
    }

    this.notify({ ...this.simTelemetry });

    // Speed of simulation step (faster execution for pleasant user preview)
    this.simTimer = setTimeout(() => this.stepSimulation(), 35);
  }

  // Configuration
  public async getConfig(): Promise<CNCConfig> {
    const fallback: CNCConfig = {
      stepsPerMmX: 100,
      stepsPerMmY: 100,
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
    };

    if (this.isSimulated) {
      const saved = safeStorage.getItem('explore_cnc_config');
      return saved ? JSON.parse(saved) : fallback;
    }

    try {
      const res = await fetch(`http://${this.ip}/api/config`);
      return await res.json();
    } catch (e) {
      return fallback;
    }
  }

  public async saveConfig(cfg: CNCConfig): Promise<void> {
    safeStorage.setItem('explore_cnc_config', JSON.stringify(cfg));
    if (!this.isSimulated) {
      const body = new URLSearchParams({
        stepsPerMmX: cfg.stepsPerMmX.toString(),
        stepsPerMmY: cfg.stepsPerMmY.toString(),
        maxX: cfg.maxX.toString(),
        maxY: cfg.maxY.toString(),
        feedrate: cfg.feedrate.toString(),
        penUpAngle: cfg.penUpAngle.toString(),
        penDownAngle: cfg.penDownAngle.toString(),
        returnOrigin: cfg.returnOrigin ? 'true' : 'false',
      });
      await fetch(`http://${this.ip}/api/config`, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).catch(() => {});
    }
  }
}

export const cncService = new CNCConnectionService();
