#include "cnc_controller.h"

CNCController::CNCController()
  : state(STATE_IDLE),
    stepsPerMmX(DEFAULT_STEPS_PER_MM_X),
    stepsPerMmY(DEFAULT_STEPS_PER_MM_Y),
    maxX(DEFAULT_MAX_X_MM),
    maxY(DEFAULT_MAX_Y_MM),
    defaultFeedrate(DEFAULT_FEEDRATE),
    returnToOriginOnComplete(true),
    absoluteMode(true),
    currentX(0.0f),
    currentY(0.0f),
    currentFeedrate(DEFAULT_FEEDRATE),
    queueHead(0),
    queueTail(0),
    queueCount(0),
    isMoving(false),
    stepIntervalMicros(2000),
    lastStepMicros(0),
    totalLines(0),
    currentLine(0),
    lastActivityMillis(0) {}

void CNCController::init() {
  stepper.init();
  servo.init();
  pinMode(ESTOP_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, HIGH);
  state = STATE_IDLE;
}

void CNCController::update() {
  checkPhysicalEStop();

  if (state == STATE_EMERGENCY_STOP) {
    stepper.releaseCoils();
    return;
  }

  // Active Bresenham step interpolation
  if (isMoving && state != STATE_PAUSED) {
    unsigned long nowMicros = micros();
    if (nowMicros - lastStepMicros >= stepIntervalMicros) {
      lastStepMicros = nowMicros;
      stepInterpolation();
    }
    return; // Don't fetch new commands while moving
  }

  // Not moving, check if we have queued G-code commands
  if (!isMoving && queueCount > 0 && state != STATE_PAUSED) {
    processNextCommand();
    lastActivityMillis = millis();
  } else if (!isMoving && queueCount == 0 && state == STATE_RUNNING) {
    // All commands finished
    state = STATE_COMPLETE;
    stepper.releaseCoils();

    if (returnToOriginOnComplete) {
      planLinearMove(0.0f, 0.0f, defaultFeedrate, true);
    }
  } else if (!isMoving && state == STATE_IDLE) {
    // Release coils after 3 seconds of inactivity to save power and keep motors cool
    if (millis() - lastActivityMillis > 3000) {
      stepper.releaseCoils();
    }
  }
}

void CNCController::checkPhysicalEStop() {
  if (digitalRead(ESTOP_PIN) == LOW) {
    if (state != STATE_EMERGENCY_STOP) {
      emergencyStop();
    }
  }
}

bool CNCController::enqueueGCode(const String& line) {
  if (queueCount >= COMMAND_QUEUE_SIZE) {
    return false; // Queue full
  }

  String trimmed = line;
  trimmed.trim();
  if (trimmed.length() == 0) return true;

  commandQueue[queueHead] = trimmed;
  queueHead = (queueHead + 1) % COMMAND_QUEUE_SIZE;
  queueCount++;

  if (state == STATE_IDLE || state == STATE_COMPLETE) {
    totalLines = queueCount;
    currentLine = 0;
    state = STATE_RUNNING;
  } else if (state == STATE_RUNNING) {
    totalLines++;
  }

  return true;
}

void CNCController::processNextCommand() {
  if (queueCount == 0) return;

  String line = commandQueue[queueTail];
  queueTail = (queueTail + 1) % COMMAND_QUEUE_SIZE;
  queueCount--;
  currentLine++;

  ParsedGCode cmd = parser.parseLine(line);
  executeParsedCommand(cmd);
}

void CNCController::executeParsedCommand(const ParsedGCode& cmd) {
  switch (cmd.type) {
    case GCODE_G0: // Rapid move
    case GCODE_G1: { // Feedrate move
      float targetX = currentX;
      float targetY = currentY;
      float feed = cmd.hasF ? cmd.f : currentFeedrate;
      if (cmd.hasF) currentFeedrate = cmd.f;

      if (absoluteMode) {
        if (cmd.hasX) targetX = cmd.x;
        if (cmd.hasY) targetY = cmd.y;
      } else {
        if (cmd.hasX) targetX += cmd.x;
        if (cmd.hasY) targetY += cmd.y;
      }

      // Soft Limits Enforced
      if (targetX < 0.0f) targetX = 0.0f;
      if (targetX > maxX) targetX = maxX;
      if (targetY < 0.0f) targetY = 0.0f;
      if (targetY > maxY) targetY = maxY;

      planLinearMove(targetX, targetY, feed, (cmd.type == GCODE_G0));
      break;
    }
    case GCODE_G4: { // Dwell
      unsigned long ms = 100;
      if (cmd.hasP) ms = (unsigned long)cmd.p;
      else if (cmd.hasS) ms = (unsigned long)(cmd.s * 1000.0f);
      delay(ms);
      break;
    }
    case GCODE_G21: // Millimeter mode
      break;
    case GCODE_G28: // Homing
      home();
      break;
    case GCODE_G90: // Absolute
      absoluteMode = true;
      break;
    case GCODE_G91: // Incremental
      absoluteMode = false;
      break;
    case GCODE_G92: // Set current pos as origin
      setOrigin();
      break;
    case GCODE_M3: // Pen Down
      servo.penDown();
      break;
    case GCODE_M5: // Pen Up
      servo.penUp();
      break;
    case GCODE_M112: // Emergency Stop
      emergencyStop();
      break;
    default:
      break;
  }
}

void CNCController::planLinearMove(float targetX, float targetY, float feedrate, bool isRapid) {
  if (feedrate <= 0) feedrate = defaultFeedrate;
  if (feedrate > MAX_FEEDRATE) feedrate = MAX_FEEDRATE;

  long startXSteps = (long)round(currentX * stepsPerMmX);
  long startYSteps = (long)round(currentY * stepsPerMmY);
  long endXSteps   = (long)round(targetX * stepsPerMmX);
  long endYSteps   = (long)round(targetY * stepsPerMmY);

  moveDeltaX = abs(endXSteps - startXSteps);
  moveDeltaY = abs(endYSteps - startYSteps);
  moveDirX   = (endXSteps >= startXSteps) ? 1 : -1;
  moveDirY   = (endYSteps >= startYSteps) ? 1 : -1;

  moveStartXSteps = startXSteps;
  moveStartYSteps = startYSteps;
  moveTargetXSteps = endXSteps;
  moveTargetYSteps = endYSteps;

  long maxSteps = max(moveDeltaX, moveDeltaY);
  if (maxSteps == 0) {
    currentX = targetX;
    currentY = targetY;
    isMoving = false;
    return;
  }

  // Distance in mm
  float dxMm = abs(targetX - currentX);
  float dyMm = abs(targetY - currentY);
  float distMm = sqrt(dxMm * dxMm + dyMm * dyMm);

  if (distMm < 0.001f) {
    currentX = targetX;
    currentY = targetY;
    isMoving = false;
    return;
  }

  // Feedrate is in mm/minute -> duration in seconds
  float speed = isRapid ? MAX_FEEDRATE : feedrate;
  float durationSec = (distMm / speed) * 60.0f;
  unsigned long durationMicros = (unsigned long)(durationSec * 1000000.0f);

  stepIntervalMicros = durationMicros / maxSteps;
  // Lower bound for 28BYJ-48 stepper response: ~1200us per half-step
  if (stepIntervalMicros < 1200) {
    stepIntervalMicros = 1200;
  }

  // Bresenham setup
  if (moveDeltaX >= moveDeltaY) {
    moveOver = 0;
  } else {
    moveOver = 0;
  }

  moveError = 0;
  isMoving = true;
  lastStepMicros = micros();

  currentX = targetX;
  currentY = targetY;
}

void CNCController::stepInterpolation() {
  long curX = stepper.getXSteps();
  long curY = stepper.getYSteps();

  if (curX == moveTargetXSteps && curY == moveTargetYSteps) {
    isMoving = false;
    return;
  }

  if (moveDeltaX >= moveDeltaY) {
    // X is primary driving axis
    if (curX != moveTargetXSteps) {
      stepper.stepX(moveDirX);
      moveError += moveDeltaY;
      if (moveError >= moveDeltaX) {
        stepper.stepY(moveDirY);
        moveError -= moveDeltaX;
      }
    }
  } else {
    // Y is primary driving axis
    if (curY != moveTargetYSteps) {
      stepper.stepY(moveDirY);
      moveError += moveDeltaX;
      if (moveError >= moveDeltaY) {
        stepper.stepX(moveDirX);
        moveError -= moveDeltaY;
      }
    }
  }

  if (stepper.getXSteps() == moveTargetXSteps && stepper.getYSteps() == moveTargetYSteps) {
    isMoving = false;
  }
}

void CNCController::clearQueue() {
  queueHead = 0;
  queueTail = 0;
  queueCount = 0;
}

void CNCController::emergencyStop() {
  clearQueue();
  isMoving = false;
  state = STATE_EMERGENCY_STOP;
  servo.penUp();
  stepper.releaseCoils();
}

void CNCController::pause() {
  if (state == STATE_RUNNING) {
    state = STATE_PAUSED;
  }
}

void CNCController::resume() {
  if (state == STATE_PAUSED) {
    state = STATE_RUNNING;
  }
}

void CNCController::reset() {
  clearQueue();
  isMoving = false;
  state = STATE_IDLE;
  currentLine = 0;
  totalLines = 0;
  stepper.releaseCoils();
}

void CNCController::home() {
  state = STATE_HOMING;
  servo.penUp();

  // If physical limit switches are wired:
  // Move X toward 0 until triggered or until max bounds reached
  long maxStepsX = (long)(maxX * stepsPerMmX * 1.2f);
  for (long i = 0; i < maxStepsX; i++) {
    if (stepper.isXLimitTriggered()) break;
    stepper.stepX(-1);
    delayMicroseconds(2000);
  }

  long maxStepsY = (long)(maxY * stepsPerMmY * 1.2f);
  for (long i = 0; i < maxStepsY; i++) {
    if (stepper.isYLimitTriggered()) break;
    stepper.stepY(-1);
    delayMicroseconds(2000);
  }

  stepper.setPositionSteps(0, 0);
  currentX = 0.0f;
  currentY = 0.0f;
  state = STATE_IDLE;
  stepper.releaseCoils();
}

void CNCController::setOrigin() {
  stepper.setPositionSteps(0, 0);
  currentX = 0.0f;
  currentY = 0.0f;
}

void CNCController::jog(float dxMm, float dyMm, float feedrate) {
  if (state == STATE_EMERGENCY_STOP) return;
  float newX = currentX + dxMm;
  float newY = currentY + dyMm;

  if (newX < 0.0f) newX = 0.0f;
  if (newX > maxX) newX = maxX;
  if (newY < 0.0f) newY = 0.0f;
  if (newY > maxY) newY = maxY;

  planLinearMove(newX, newY, (feedrate > 0 ? feedrate : defaultFeedrate), false);
}

void CNCController::setPen(PenState pState) {
  if (pState == PEN_UP) {
    servo.penUp();
  } else {
    servo.penDown();
  }
}

float CNCController::getCurrentX() const {
  return (float)stepper.getXSteps() / stepsPerMmX;
}

float CNCController::getCurrentY() const {
  return (float)stepper.getYSteps() / stepsPerMmY;
}

const char* CNCController::getStateString() const {
  switch (state) {
    case STATE_IDLE:           return "IDLE";
    case STATE_RUNNING:        return "RUNNING";
    case STATE_PAUSED:         return "PAUSED";
    case STATE_HOMING:         return "HOMING";
    case STATE_ERROR:          return "ERROR";
    case STATE_EMERGENCY_STOP: return "EMERGENCY STOP";
    case STATE_COMPLETE:       return "COMPLETE";
    default:                   return "UNKNOWN";
  }
}

int CNCController::getProgressPercent() const {
  if (totalLines <= 0) return 0;
  int pct = (int)((float)currentLine / (float)totalLines * 100.0f);
  if (pct > 100) pct = 100;
  return pct;
}
