# Explore CNC Plotter

A complete, production-quality DIY 2D CNC Pen Plotter system for the **ESP32 DevKit V1**, featuring:
- **High-Performance ESP32 Firmware** with non-blocking Bresenham motion interpolation for 5V 28BYJ-48 stepper motors (ULN2003) and SG90 servo pen lifter.
- **REST API & Real-Time WebSocket Telemetry** on ports 80 and 81.
- **Progressive Web App (PWA)** installable on Android, iOS, and Desktop with offline app shell.
- **Single-Stroke Vector Font Engine** converting arbitrary text into clean pen-plotter line paths and G-code.
- **Client-Side PDF Processing Pipeline** with vector text extraction, layout scaling, and page preview.
- **Interactive 2D Canvas & SVG Toolhead Simulation** with paper boundaries and pen-up/down visualization.
- **Step-by-Step Calibration Wizard** for automated steps-per-mm calibration.
- **Comprehensive Hardware Documentation & Wiring Schematics**.

---

## Hardware Bill of Materials (BOM)
1. **ESP32 DevKit V1** (30-pin or 38-pin ESP-WROOM-32)
2. **2x 28BYJ-48 5V Stepper Motors** + **2x ULN2003 Driver Boards**
3. **1x SG90 or MG90S 9g Micro Servo** (Pen lifter mechanism)
4. **1x 5V 2A-3A DC External Power Supply** (or 5V USB breakout)
5. **2x Micro Switch Limit Switches** (optional for hardware homing)
6. GT2 Timing Belt (2m) & 2x GT2 16T/20T Pulleys (or M8 threaded rod gantry)

---

## Directory Structure
```
explore-cnc/
├── firmware/
│   ├── explore_cnc.ino         # Master Arduino sketch
│   ├── config.h                # Pin definitions and kinematics
│   ├── cnc_controller.h/.cpp   # State machine, Bresenham planner, G-code execution
│   ├── stepper_controller.h/.cpp # Non-blocking ULN2003 half-stepping & STEP/DIR
│   ├── servo_controller.h/.cpp # Native ESP32 LEDC PWM servo controller
│   ├── gcode_parser.h/.cpp     # G-code parser (G0/G1/G4/G21/G90/M3/M5/M112)
│   ├── wifi_manager.h/.cpp     # AP & Station Wi-Fi manager with NVS flash persistence
│   └── web_server.h/.cpp       # REST API & WebSocket server
├── docs/
│   ├── wiring.md               # Schematic ASCII diagrams and pinouts
│   ├── installation.md         # Arduino IDE setup and flashing
│   ├── calibration.md          # Math and step-by-step calibration
│   ├── gcode.md                # G-code syntax reference
│   └── troubleshooting.md      # Common failure points and solutions
└── src/                        # Responsive PWA React + Vite Dashboard
```

---

## Quick Start
1. Flash the firmware from `firmware/explore_cnc.ino` onto your ESP32 DevKit.
2. Wire motors and servo according to `docs/wiring.md`. Connect external 5V and common GND.
3. Power on: The ESP32 broadcasts `Explore-CNC-XXXX` (pass: `explore123`).
4. Launch the web app dashboard, connect, and start plotting!
