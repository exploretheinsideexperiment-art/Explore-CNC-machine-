#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include <Arduino.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include "config.h"
#include "cnc_controller.h"
#include "wifi_manager.h"

class CNCWebServer {
public:
  CNCWebServer(CNCController& cnc, WiFiManager& wifi);
  void init();
  void update();

private:
  WebServer server;
  WebSocketsServer webSocket;
  CNCController& cnc;
  WiFiManager& wifi;

  unsigned long lastWsBroadcast;

  // Endpoint Handlers
  void handleRoot();
  void handleApiStatus();
  void handleApiConfigGet();
  void handleApiConfigPost();
  void handleApiWifiConnect();
  void handleApiWifiScan();
  void handleApiHome();
  void handleApiZero();
  void handleApiJog();
  void handleApiPen();
  void handleApiStart();
  void handleApiPause();
  void handleApiResume();
  void handleApiStop();
  void handleApiReset();
  void handleApiGCode();
  void handleApiJobPost();
  void handleApiJobStatus();
  void handleNotFound();

  // Helper
  void sendCorsHeaders();
  void broadcastTelemetry();
  void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length);
};

#endif // WEB_SERVER_H
