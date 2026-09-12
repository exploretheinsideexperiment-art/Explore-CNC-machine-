/**
 * ============================================================================
 * Explore CNC Plotter - Master ESP32 Firmware
 * ============================================================================
 * Hardware: ESP32 DevKit V1
 * Motors: Two 5V 28BYJ-48 Steppers (ULN2003)
 * Pen Lift: SG90 / MG90S Micro Servo
 * Power: 5V External Supply with Common Ground
 * Communication: Wi-Fi (AP & Station) + REST API + WebSocket
 * ============================================================================
 */

#include <Arduino.h>
#include "config.h"
#include "cnc_controller.h"
#include "wifi_manager.h"
#include "web_server.h"

// Core System Objects
CNCController cnc;
WiFiManager wifiManager;
CNCWebServer webServer(cnc, wifiManager);

void printBanner() {
  Serial.println("\n=======================================================");
  Serial.println("           EXPLORE CNC PLOTTER - ESP32 FIRMWARE        ");
  Serial.println("=======================================================");
  Serial.println("Hardware: ESP32 DevKit V1 / 28BYJ-48 Steppers + SG90   ");
  Serial.println("Motion:   Non-blocking 2D Bresenham Line Interpolator  ");
  Serial.println("Server:   HTTP Port 80, WebSocket Port 81             ");
  Serial.println("=======================================================\n");
}

void handleSerialCommands() {
  if (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) return;

    Serial.printf("[Serial In] %s\n", line.c_str());

    if (line == "$H" || line == "HOME") {
      cnc.home();
      Serial.println("OK: Homing complete");
    } else if (line == "$Z" || line == "ZERO") {
      cnc.setOrigin();
      Serial.println("OK: Origin zeroed");
    } else if (line == "$X" || line == "STOP" || line == "ESTOP") {
      cnc.emergencyStop();
      Serial.println("OK: Emergency Stop!");
    } else if (line == "$R" || line == "RESET") {
      cnc.reset();
      Serial.println("OK: Reset to IDLE");
    } else if (line == "?") {
      Serial.printf("<State:%s|WPos:%.2f,%.2f|Pen:%s|Buf:%d>\n",
        cnc.getStateString(),
        cnc.getCurrentX(),
        cnc.getCurrentY(),
        cnc.getPenState() == PEN_DOWN ? "DOWN" : "UP",
        cnc.getQueueCount()
      );
    } else {
      bool ok = cnc.enqueueGCode(line);
      Serial.println(ok ? "OK" : "ERROR: Queue full");
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  printBanner();

  // 1. Initialize Motion & Actuator Hardware
  Serial.println("[Init] Initializing CNC Steppers & Servo...");
  cnc.init();

  // 2. Initialize Wi-Fi (Connects to saved Station or boots AP mode)
  Serial.println("[Init] Initializing Wi-Fi Manager...");
  wifiManager.init();

  // 3. Start Web API & WebSocket Server
  Serial.println("[Init] Starting HTTP & WebSocket servers...");
  webServer.init();

  Serial.println("\n[Status] System Ready!");
  Serial.printf("[Status] Access Point: %s (IP: 192.168.4.1)\n", wifiManager.getApSsid().c_str());
  if (wifiManager.isConnected()) {
    Serial.printf("[Status] Connected to Station IP: %s\n", wifiManager.getIpAddress().c_str());
  }
}

void loop() {
  // Non-blocking motion controller step execution
  cnc.update();

  // HTTP & WebSocket client handling
  webServer.update();

  // Wi-Fi connection monitoring & auto-reconnect
  wifiManager.update();

  // USB Serial G-code debug terminal
  handleSerialCommands();
}
