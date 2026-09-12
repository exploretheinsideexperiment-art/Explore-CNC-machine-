# Explore CNC Plotter - Firmware Installation & Setup Guide

## 1. Prerequisites
- **Arduino IDE 2.x** (or PlatformIO)
- **ESP32 Board Package**: Install via Arduino Board Manager:
  `URL: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
- **Board Selection**: `DOIT ESP32 DEVKIT V1` or `ESP32 Dev Module`

## 2. Required Libraries
Install via Arduino Library Manager (`Ctrl + Shift + I` / `Cmd + Shift + I`):
1. **WebSockets by Markus Sattler** (Search for `WebSockets`)
   - Provides low-latency, bidirectional telemetry communication on port 81.
2. Built-in Core Libraries (already included with ESP32 board package):
   - `WiFi.h`
   - `WebServer.h`
   - `Preferences.h`

## 3. Flashing Procedure
1. Connect your ESP32 DevKit to your computer via micro-USB data cable.
2. Open `firmware/explore_cnc.ino` in Arduino IDE.
3. Select Port (e.g. `/dev/ttyUSB0` or `COM3`) and Board: `DOIT ESP32 DEVKIT V1`.
4. Upload Speed: `921600` (or `115200` if upload fails).
5. Press **Upload**. If required by your board, hold the `BOOT` button when uploading begins.
6. Open Serial Monitor at **115200 baud** to see initialization logs.

## 4. First-Time Wi-Fi Onboarding
1. On boot, the ESP32 will broadcast a Wi-Fi Access Point:
   - **SSID**: `Explore-CNC-XXXX` (where XXXX is unique chip ID)
   - **Password**: `explore123`
2. Connect your smartphone or laptop to this Wi-Fi network.
3. Open a browser to `http://192.168.4.1` or launch the **Explore CNC PWA**.
4. Navigate to **Wi-Fi Settings**, select your home 2.4 GHz Wi-Fi network, enter the password, and click **Connect**.
5. The ESP32 will connect to your home Wi-Fi and display its new local IP address (e.g., `192.168.1.145`).
