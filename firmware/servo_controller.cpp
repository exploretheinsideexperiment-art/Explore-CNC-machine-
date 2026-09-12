#include "servo_controller.h"

// LEDC PWM Configuration for ESP32
#define SERVO_LEDC_CHANNEL 0
#define SERVO_LEDC_FREQ    50    // 50Hz for standard RC servos
#define SERVO_LEDC_RES     16    // 16-bit resolution (0-65535)

ServoController::ServoController()
  : penUpAngle(DEFAULT_SERVO_PEN_UP),
    penDownAngle(DEFAULT_SERVO_PEN_DOWN),
    currentAngle(DEFAULT_SERVO_PEN_UP),
    currentPenState(PEN_UP) {}

void ServoController::init() {
  // Support both ESP32 Arduino Core 2.x and Core 3.x
  #if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcAttach(SERVO_PIN, SERVO_LEDC_FREQ, SERVO_LEDC_RES);
  #else
    ledcSetup(SERVO_LEDC_CHANNEL, SERVO_LEDC_FREQ, SERVO_LEDC_RES);
    ledcAttachPin(SERVO_PIN, SERVO_LEDC_CHANNEL);
  #endif

  penUp();
}

void ServoController::writePwm(int angle) {
  if (angle < 0) angle = 0;
  if (angle > 180) angle = 180;
  currentAngle = angle;

  // Standard SG90 micro-servo pulse width: ~500us (0 deg) to ~2400us (180 deg)
  // Period is 20,000us (50 Hz). 16-bit max is 65535.
  float pulseUs = 600.0f + ((float)angle / 180.0f) * 1800.0f;
  uint32_t duty = (uint32_t)((pulseUs / 20000.0f) * 65535.0f);

  #if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcWrite(SERVO_PIN, duty);
  #else
    ledcWrite(SERVO_LEDC_CHANNEL, duty);
  #endif
}

void ServoController::penUp() {
  writePwm(penUpAngle);
  currentPenState = PEN_UP;
  delay(SERVO_TRAVEL_TIME_MS);
}

void ServoController::penDown() {
  writePwm(penDownAngle);
  currentPenState = PEN_DOWN;
  delay(SERVO_TRAVEL_TIME_MS);
}

void ServoController::setAngle(int angle) {
  writePwm(angle);
}

void ServoController::setPenUpAngle(int angle) {
  penUpAngle = angle;
  if (currentPenState == PEN_UP) {
    penUp();
  }
}

void ServoController::setPenDownAngle(int angle) {
  penDownAngle = angle;
  if (currentPenState == PEN_DOWN) {
    penDown();
  }
}
