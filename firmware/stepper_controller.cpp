#include "stepper_controller.h"

// Half-step lookup table for 28BYJ-48 (8 states)
// High torque, smooth 4-wire sequence
static const uint8_t HALF_STEP_SEQ[8][4] = {
  {1, 0, 0, 0},
  {1, 1, 0, 0},
  {0, 1, 0, 0},
  {0, 1, 1, 0},
  {0, 0, 1, 0},
  {0, 0, 1, 1},
  {0, 0, 0, 1},
  {1, 0, 0, 1}
};

StepperController::StepperController()
  : motorType(DEFAULT_MOTOR_TYPE),
    invertX(DEFAULT_INVERT_X),
    invertY(DEFAULT_INVERT_Y),
    currentXSteps(0),
    currentYSteps(0),
    stepPhaseX(0),
    stepPhaseY(0) {}

void StepperController::init() {
  if (motorType == MOTOR_TYPE_4WIRE_28BYJ48) {
    pinMode(X_IN1, OUTPUT);
    pinMode(X_IN2, OUTPUT);
    pinMode(X_IN3, OUTPUT);
    pinMode(X_IN4, OUTPUT);

    pinMode(Y_IN1, OUTPUT);
    pinMode(Y_IN2, OUTPUT);
    pinMode(Y_IN3, OUTPUT);
    pinMode(Y_IN4, OUTPUT);

    releaseCoils();
  } else {
    // STEP/DIR mode
    pinMode(X_STEP_PIN, OUTPUT);
    pinMode(X_DIR_PIN, OUTPUT);
    pinMode(Y_STEP_PIN, OUTPUT);
    pinMode(Y_DIR_PIN, OUTPUT);
    pinMode(STEPPERS_ENABLE_PIN, OUTPUT);
    digitalWrite(STEPPERS_ENABLE_PIN, LOW); // Active low enable
  }

  // Limit switches
  pinMode(X_LIMIT_PIN, INPUT_PULLUP);
  pinMode(Y_LIMIT_PIN, INPUT_PULLUP);
}

void StepperController::setPositionSteps(long xSteps, long ySteps) {
  currentXSteps = xSteps;
  currentYSteps = ySteps;
}

void StepperController::stepX(int dir) {
  if (dir == 0) return;
  bool forward = (dir > 0);
  if (invertX) forward = !forward;

  if (motorType == MOTOR_TYPE_4WIRE_28BYJ48) {
    if (forward) {
      stepPhaseX = (stepPhaseX + 1) & 7;
    } else {
      stepPhaseX = (stepPhaseX + 7) & 7;
    }
    applyHalfStepX(stepPhaseX);
  } else {
    digitalWrite(X_DIR_PIN, forward ? HIGH : LOW);
    digitalWrite(X_STEP_PIN, HIGH);
    delayMicroseconds(2);
    digitalWrite(X_STEP_PIN, LOW);
  }

  currentXSteps += dir;
}

void StepperController::stepY(int dir) {
  if (dir == 0) return;
  bool forward = (dir > 0);
  if (invertY) forward = !forward;

  if (motorType == MOTOR_TYPE_4WIRE_28BYJ48) {
    if (forward) {
      stepPhaseY = (stepPhaseY + 1) & 7;
    } else {
      stepPhaseY = (stepPhaseY + 7) & 7;
    }
    applyHalfStepY(stepPhaseY);
  } else {
    digitalWrite(Y_DIR_PIN, forward ? HIGH : LOW);
    digitalWrite(Y_STEP_PIN, HIGH);
    delayMicroseconds(2);
    digitalWrite(Y_STEP_PIN, LOW);
  }

  currentYSteps += dir;
}

void StepperController::applyHalfStepX(uint8_t phase) {
  digitalWrite(X_IN1, HALF_STEP_SEQ[phase][0]);
  digitalWrite(X_IN2, HALF_STEP_SEQ[phase][1]);
  digitalWrite(X_IN3, HALF_STEP_SEQ[phase][2]);
  digitalWrite(X_IN4, HALF_STEP_SEQ[phase][3]);
}

void StepperController::applyHalfStepY(uint8_t phase) {
  digitalWrite(Y_IN1, HALF_STEP_SEQ[phase][0]);
  digitalWrite(Y_IN2, HALF_STEP_SEQ[phase][1]);
  digitalWrite(Y_IN3, HALF_STEP_SEQ[phase][2]);
  digitalWrite(Y_IN4, HALF_STEP_SEQ[phase][3]);
}

void StepperController::releaseCoils() {
  if (motorType == MOTOR_TYPE_4WIRE_28BYJ48) {
    digitalWrite(X_IN1, LOW);
    digitalWrite(X_IN2, LOW);
    digitalWrite(X_IN3, LOW);
    digitalWrite(X_IN4, LOW);

    digitalWrite(Y_IN1, LOW);
    digitalWrite(Y_IN2, LOW);
    digitalWrite(Y_IN3, LOW);
    digitalWrite(Y_IN4, LOW);
  } else {
    digitalWrite(STEPPERS_ENABLE_PIN, HIGH); // Disable driver
  }
}

bool StepperController::isXLimitTriggered() const {
  return digitalRead(X_LIMIT_PIN) == LOW;
}

bool StepperController::isYLimitTriggered() const {
  return digitalRead(Y_LIMIT_PIN) == LOW;
}
