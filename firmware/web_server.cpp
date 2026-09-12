#include "web_server.h"

CNCWebServer::CNCWebServer(CNCController& _cnc, WiFiManager& _wifi)
  : server(HTTP_PORT),
    webSocket(WS_PORT),
    cnc(_cnc),
    wifi(_wifi),
    lastWsBroadcast(0) {}

void CNCWebServer::init() {
  // CORS Preflight handler
  server.onNotFound([this]() {
    if (server.method() == HTTP_OPTIONS) {
      sendCorsHeaders();
      server.send(204);
    } else {
      handleNotFound();
    }
  });

  // REST API Endpoints
  server.on("/", HTTP_GET, [this]() { handleRoot(); });
  server.on("/api/status", HTTP_GET, [this]() { handleApiStatus(); });
  server.on("/api/config", HTTP_GET, [this]() { handleApiConfigGet(); });
  server.on("/api/config", HTTP_POST, [this]() { handleApiConfigPost(); });
  server.on("/api/connect", HTTP_POST, [this]() { handleApiWifiConnect(); });
  server.on("/api/wifi/scan", HTTP_GET, [this]() { handleApiWifiScan(); });
  server.on("/api/wifi/scan", HTTP_POST, [this]() { handleApiWifiScan(); });
  server.on("/api/home", HTTP_POST, [this]() { handleApiHome(); });
  server.on("/api/zero", HTTP_POST, [this]() { handleApiZero(); });
  server.on("/api/jog", HTTP_POST, [this]() { handleApiJog(); });
  server.on("/api/pen", HTTP_POST, [this]() { handleApiPen(); });
  server.on("/api/start", HTTP_POST, [this]() { handleApiStart(); });
  server.on("/api/pause", HTTP_POST, [this]() { handleApiPause(); });
  server.on("/api/resume", HTTP_POST, [this]() { handleApiResume(); });
  server.on("/api/stop", HTTP_POST, [this]() { handleApiStop(); });
  server.on("/api/reset", HTTP_POST, [this]() { handleApiReset(); });
  server.on("/api/gcode", HTTP_POST, [this]() { handleApiGCode(); });
  server.on("/api/job", HTTP_POST, [this]() { handleApiJobPost(); });
  server.on("/api/job/status", HTTP_GET, [this]() { handleApiJobStatus(); });

  server.begin();
  Serial.printf("[HTTP] Web Server started on port %d\n", HTTP_PORT);

  // WebSocket Server setup
  webSocket.begin();
  webSocket.onEvent([this](uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
    this->onWebSocketEvent(num, type, payload, length);
  });
  Serial.printf("[WebSocket] Server started on port %d\n", WS_PORT);
}

void CNCWebServer::sendCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void CNCWebServer::update() {
  server.handleClient();
  webSocket.loop();

  unsigned long now = millis();
  if (now - lastWsBroadcast >= WS_BROADCAST_INTERVAL_MS) {
    lastWsBroadcast = now;
    broadcastTelemetry();
  }
}

void CNCWebServer::broadcastTelemetry() {
  char buf[256];
  snprintf(buf, sizeof(buf),
    "{\"state\":\"%s\",\"x\":%.2f,\"y\":%.2f,\"progress\":%d,\"currentLine\":%d,\"totalLines\":%d,\"pen\":\"%s\"}",
    cnc.getStateString(),
    cnc.getCurrentX(),
    cnc.getCurrentY(),
    cnc.getProgressPercent(),
    cnc.getCurrentLine(),
    cnc.getTotalLines(),
    cnc.getPenState() == PEN_DOWN ? "DOWN" : "UP"
  );
  webSocket.broadcastTXT(buf);
}

void CNCWebServer::onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_TEXT) {
    String message = String((char*)payload);
    message.trim();

    // Direct G-code line received over WebSocket
    if (message.startsWith("G") || message.startsWith("M")) {
      cnc.enqueueGCode(message);
    } else if (message == "STOP" || message == "ESTOP") {
      cnc.emergencyStop();
    } else if (message == "PAUSE") {
      cnc.pause();
    } else if (message == "RESUME") {
      cnc.resume();
    } else if (message == "HOME") {
      cnc.home();
    }
  }
}

void CNCWebServer::handleRoot() {
  sendCorsHeaders();
  String html = "<!DOCTYPE html><html><head><title>Explore CNC Plotter</title>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<style>body{background:#0b0f19;color:#e2e8f0;font-family:sans-serif;padding:24px;text-align:center}";
  html += "h1{color:#06b6d4}.card{background:#1e293b;padding:20px;border-radius:12px;max-width:480px;margin:20px auto}";
  html += "a{display:inline-block;margin-top:16px;background:#06b6d4;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold}</style></head>";
  html += "<body><h1>Explore CNC Plotter</h1>";
  html += "<div class='card'><h3>ESP32 Online & Ready</h3>";
  html += "<p>IP Address: <strong>" + wifi.getIpAddress() + "</strong></p>";
  html += "<p>State: <strong>" + String(cnc.getStateString()) + "</strong></p>";
  html += "<p>X: " + String(cnc.getCurrentX(), 2) + " mm | Y: " + String(cnc.getCurrentY(), 2) + " mm</p>";
  html += "<p>Connect using the Explore CNC PWA Dashboard.</p>";
  html += "</div></body></html>";
  server.send(200, "text/html", html);
}

void CNCWebServer::handleApiStatus() {
  sendCorsHeaders();
  char buf[300];
  snprintf(buf, sizeof(buf),
    "{\"state\":\"%s\",\"x\":%.2f,\"y\":%.2f,\"progress\":%d,\"currentLine\":%d,\"totalLines\":%d,\"pen\":\"%s\",\"queue\":%d,\"wifiSsid\":\"%s\",\"ip\":\"%s\",\"rssi\":%d}",
    cnc.getStateString(),
    cnc.getCurrentX(),
    cnc.getCurrentY(),
    cnc.getProgressPercent(),
    cnc.getCurrentLine(),
    cnc.getTotalLines(),
    cnc.getPenState() == PEN_DOWN ? "DOWN" : "UP",
    cnc.getQueueCount(),
    wifi.getSsid().c_str(),
    wifi.getIpAddress().c_str(),
    wifi.getRssi()
  );
  server.send(200, "application/json", buf);
}

void CNCWebServer::handleApiConfigGet() {
  sendCorsHeaders();
  char buf[256];
  snprintf(buf, sizeof(buf),
    "{\"stepsPerMmX\":%.2f,\"stepsPerMmY\":%.2f,\"maxX\":%.2f,\"maxY\":%.2f,\"feedrate\":%.2f,\"penUpAngle\":%d,\"penDownAngle\":%d,\"returnOrigin\":%s}",
    cnc.getStepsPerMmX(),
    cnc.getStepsPerMmY(),
    cnc.getMaxX(),
    cnc.getMaxY(),
    cnc.getDefaultFeedrate(),
    cnc.getServo().getPenUpAngle(),
    cnc.getServo().getPenDownAngle(),
    cnc.getReturnToOriginAfterJob() ? "true" : "false"
  );
  server.send(200, "application/json", buf);
}

void CNCWebServer::handleApiConfigPost() {
  sendCorsHeaders();
  if (server.hasArg("stepsPerMmX")) cnc.setStepsPerMmX(server.arg("stepsPerMmX").toFloat());
  if (server.hasArg("stepsPerMmY")) cnc.setStepsPerMmY(server.arg("stepsPerMmY").toFloat());
  if (server.hasArg("maxX")) cnc.setMaxX(server.arg("maxX").toFloat());
  if (server.hasArg("maxY")) cnc.setMaxY(server.arg("maxY").toFloat());
  if (server.hasArg("feedrate")) cnc.setDefaultFeedrate(server.arg("feedrate").toFloat());
  if (server.hasArg("penUpAngle")) cnc.getServo().setPenUpAngle(server.arg("penUpAngle").toInt());
  if (server.hasArg("penDownAngle")) cnc.getServo().setPenDownAngle(server.arg("penDownAngle").toInt());
  if (server.hasArg("returnOrigin")) cnc.setReturnToOriginAfterJob(server.arg("returnOrigin") == "true");

  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Configuration updated\"}");
}

void CNCWebServer::handleApiWifiConnect() {
  sendCorsHeaders();
  String ssid = server.arg("ssid");
  String pass = server.arg("password");

  if (ssid.length() == 0) {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"SSID required\"}");
    return;
  }

  server.send(200, "application/json", "{\"status\":\"connecting\",\"message\":\"Attempting connection...\"}");
  wifi.connectToNetwork(ssid, pass);
}

void CNCWebServer::handleApiWifiScan() {
  sendCorsHeaders();
  String json = wifi.scanNetworksJson();
  server.send(200, "application/json", json);
}

void CNCWebServer::handleApiHome() {
  sendCorsHeaders();
  cnc.home();
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Homing complete\"}");
}

void CNCWebServer::handleApiZero() {
  sendCorsHeaders();
  cnc.setOrigin();
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Origin zeroed\"}");
}

void CNCWebServer::handleApiJog() {
  sendCorsHeaders();
  float dx = server.hasArg("dx") ? server.arg("dx").toFloat() : 0.0f;
  float dy = server.hasArg("dy") ? server.arg("dy").toFloat() : 0.0f;
  float feed = server.hasArg("feedrate") ? server.arg("feedrate").toFloat() : 0.0f;

  cnc.jog(dx, dy, feed);
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Jog command executed\"}");
}

void CNCWebServer::handleApiPen() {
  sendCorsHeaders();
  String state = server.arg("state");
  state.toUpperCase();
  if (state == "DOWN") {
    cnc.setPen(PEN_DOWN);
  } else {
    cnc.setPen(PEN_UP);
  }
  server.send(200, "application/json", "{\"status\":\"ok\",\"pen\":\"" + state + "\"}");
}

void CNCWebServer::handleApiStart() {
  sendCorsHeaders();
  cnc.resume();
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Started\"}");
}

void CNCWebServer::handleApiPause() {
  sendCorsHeaders();
  cnc.pause();
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Paused\"}");
}

void CNCWebServer::handleApiResume() {
  sendCorsHeaders();
  cnc.resume();
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Resumed\"}");
}

void CNCWebServer::handleApiStop() {
  sendCorsHeaders();
  cnc.emergencyStop();
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Emergency stop triggered\"}");
}

void CNCWebServer::handleApiReset() {
  sendCorsHeaders();
  cnc.reset();
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Machine reset to IDLE\"}");
}

void CNCWebServer::handleApiGCode() {
  sendCorsHeaders();
  String code = server.arg("gcode");
  if (code.length() == 0 && server.hasArg("plain")) {
    code = server.arg("plain");
  }

  if (code.length() == 0) {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"No G-code provided\"}");
    return;
  }

  bool success = cnc.enqueueGCode(code);
  if (success) {
    server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Command enqueued\"}");
  } else {
    server.send(503, "application/json", "{\"status\":\"error\",\"message\":\"Command queue full\"}");
  }
}

void CNCWebServer::handleApiJobPost() {
  sendCorsHeaders();
  String body = server.arg("plain");
  if (body.length() == 0) {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Empty job body\"}");
    return;
  }

  int linesEnqueued = 0;
  int startIdx = 0;
  int len = body.length();

  while (startIdx < len) {
    int newlineIdx = body.indexOf('\n', startIdx);
    if (newlineIdx == -1) newlineIdx = len;

    String line = body.substring(startIdx, newlineIdx);
    line.trim();
    if (line.length() > 0) {
      if (cnc.enqueueGCode(line)) {
        linesEnqueued++;
      }
    }
    startIdx = newlineIdx + 1;
  }

  char res[128];
  snprintf(res, sizeof(res), "{\"status\":\"ok\",\"enqueued\":%d}", linesEnqueued);
  server.send(200, "application/json", res);
}

void CNCWebServer::handleApiJobStatus() {
  handleApiStatus();
}

void CNCWebServer::handleNotFound() {
  sendCorsHeaders();
  server.send(404, "application/json", "{\"status\":\"error\",\"message\":\"Not found\"}");
}
