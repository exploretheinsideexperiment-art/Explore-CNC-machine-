#include "wifi_manager.h"

WiFiManager::WiFiManager()
  : apActive(false),
    lastReconnectAttempt(0) {}

void WiFiManager::init() {
  preferences.begin("explore_cnc", false);
  currentSsid = preferences.getString("wifi_ssid", "");
  currentPassword = preferences.getString("wifi_pass", "");

  // Generate unique AP SSID based on MAC address
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macSuffix[8];
  snprintf(macSuffix, sizeof(macSuffix), "%02X%02X", mac[4], mac[5]);
  apSsid = String(AP_SSID_PREFIX) + String(macSuffix);

  if (currentSsid.length() > 0) {
    Serial.printf("[WiFi] Found saved network: %s. Connecting...\n", currentSsid.c_str());
    WiFi.mode(WIFI_STA);
    WiFi.begin(currentSsid.c_str(), currentPassword.c_str());

    unsigned long startMs = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startMs < 10000) {
      delay(250);
      Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.printf("[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
      apActive = false;
      return;
    } else {
      Serial.println("[WiFi] Connection failed. Starting fallback AP mode...");
    }
  } else {
    Serial.println("[WiFi] No saved credentials found.");
  }

  startAccessPoint();
}

void WiFiManager::startAccessPoint() {
  WiFi.mode(WIFI_AP_STA);
  IPAddress apIP(AP_DEFAULT_IP);
  IPAddress gateway(AP_GATEWAY);
  IPAddress subnet(AP_SUBNET);

  WiFi.softAPConfig(apIP, gateway, subnet);
  WiFi.softAP(apSsid.c_str(), AP_DEFAULT_PASSWORD);
  apActive = true;

  Serial.printf("[WiFi] Access Point started! SSID: %s | IP: 192.168.4.1\n", apSsid.c_str());
}

void WiFiManager::update() {
  // If we have saved credentials and got disconnected in STA mode, periodically retry
  if (!apActive && currentSsid.length() > 0) {
    if (WiFi.status() != WL_CONNECTED) {
      unsigned long now = millis();
      if (now - lastReconnectAttempt >= RECONNECT_INTERVAL_MS) {
        lastReconnectAttempt = now;
        Serial.println("[WiFi] Disconnected. Attempting reconnect...");
        WiFi.reconnect();
      }
    }
  }
}

bool WiFiManager::isConnected() const {
  return WiFi.status() == WL_CONNECTED;
}

String WiFiManager::getIpAddress() const {
  if (isConnected()) {
    return WiFi.localIP().toString();
  }
  return WiFi.softAPIP().toString();
}

int WiFiManager::getRssi() const {
  if (isConnected()) {
    return WiFi.RSSI();
  }
  return 0;
}

bool WiFiManager::connectToNetwork(const String& ssid, const String& password) {
  currentSsid = ssid;
  currentPassword = password;

  preferences.putString("wifi_ssid", ssid);
  preferences.putString("wifi_pass", password);

  Serial.printf("[WiFi] Connecting to new network: %s...\n", ssid.c_str());
  WiFi.disconnect();
  delay(100);
  WiFi.begin(ssid.c_str(), password.c_str());

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
    delay(200);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    apActive = false;
    return true;
  } else {
    Serial.println("[WiFi] Connection failed. Retaining AP mode.");
    startAccessPoint();
    return false;
  }
}

String WiFiManager::scanNetworksJson() {
  int n = WiFi.scanNetworks();
  String json = "[";
  for (int i = 0; i < n; ++i) {
    if (i > 0) json += ",";
    json += "{\"ssid\":\"" + WiFi.SSID(i) + "\",";
    json += "\"rssi\":" + String(WiFi.RSSI(i)) + ",";
    json += "\"auth\":" + String(WiFi.encryptionType(i) != WIFI_AUTH_OPEN ? "true" : "false") + "}";
  }
  json += "]";
  return json;
}

void WiFiManager::resetCredentials() {
  preferences.clear();
  currentSsid = "";
  currentPassword = "";
  startAccessPoint();
}
