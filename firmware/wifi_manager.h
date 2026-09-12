#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <Preferences.h>
#include "config.h"

class WiFiManager {
public:
  WiFiManager();
  void init();
  void update();

  bool isConnected() const;
  bool isApMode() const { return apActive; }
  String getIpAddress() const;
  String getSsid() const { return currentSsid; }
  int getRssi() const;
  String getApSsid() const { return apSsid; }

  // Wi-Fi Configuration
  bool connectToNetwork(const String& ssid, const String& password);
  void startAccessPoint();
  String scanNetworksJson();
  void resetCredentials();

private:
  Preferences preferences;
  String currentSsid;
  String currentPassword;
  String apSsid;
  bool apActive;
  unsigned long lastReconnectAttempt;
  static const unsigned long RECONNECT_INTERVAL_MS = 10000;
};

#endif // WIFI_MANAGER_H
