#ifndef CNC_CONTROLLER_H
#define CNC_CONTROLLER_H

#include <Arduino.h>
#include "config.h"
#include "stepper_controller.h"
#include "servo_controller.h"
#include "gcode_parser.h"

struct MoveCommand {
  long targetXSteps;
  long targetYSteps;
  unsigned long stepIntervalMicros;
  bool isRapid;
  bool isPenAction;
  PenState targetPenState;
  int rawLineNumber;
};

class CNCController {
public:
  CNCController();
  void init();
  void update(); // Main non-blocking loop

  // Control Actions
  bool enqueueGCode(const String& line);
  void clearQueue();
  void emergencyStop();
  void pause();
  void resume();
  void reset();
  void home();
  void setOrigin();
  void jog(float dxMm, float dyMm, float feedrate = 0);
  void setPen(PenState state);

  // Calibration and Settings
  void setStepsPerMmX(float s) { stepsPerMmX = s; }
  void setStepsPerMmY(float s) { stepsPerMmY = s; }
  void setMaxX(float m) { maxX = m; }
  void setMaxY(float m) { maxY = m; }
  void setDefaultFeedrate(float f) { defaultFeedrate = f; }
  void setReturnToOriginAfterJob(bool enable) { returnToOriginOnComplete = enable; }

  float getStepsPerMmX() const { return stepsPerMmX; }
  float getStepsPerMmY() const { return stepsPerMmY; }
  float getMaxX() const { return maxX; }
  float getMaxY() const { return maxY; }
  float getDefaultFeedrate() const { return defaultFeedrate; }
  bool getReturnToOriginAfterJob() const { return returnToOriginOnComplete; }

  // Telemetry Getters
  MachineState getState() const { return state; }
  const char* getStateString() const;
  float getCurrentX() const;
  float getCurrentY() const;
  PenState getPenState() const { return servo.getPenState(); }
  int getQueueCount() const { return queueCount; }
  int getCurrentLine() const { return currentLine; }
  int getTotalLines() const { return totalLines; }
  int getProgressPercent() const;

  StepperController& getStepper() { return stepper; }
  ServoController& getServo() { return servo; }

private:
  MachineState state;
  StepperController stepper;
  ServoController servo;
  GCodeParser parser;

  float stepsPerMmX;
  float stepsPerMmY;
  float maxX;
  float maxY;
  float defaultFeedrate;
  bool returnToOriginOnComplete;
  bool absoluteMode;

  float currentX;
  float currentY;
  float currentFeedrate;

  // Command Ring Buffer
  String commandQueue[COMMAND_QUEUE_SIZE];
  int queueHead;
  int queueTail;
  int queueCount;

  // Active Interpolated Move (Bresenham)
  bool isMoving;
  long moveStartXSteps;
  long moveStartYSteps;
  long moveTargetXSteps;
  long moveTargetYSteps;
  long moveDeltaX;
  long moveDeltaY;
  int moveDirX;
  int moveDirY;
  long moveOver;
  long moveError;
  unsigned long stepIntervalMicros;
  unsigned long lastStepMicros;

  // Job Progress Tracking
  int totalLines;
  int currentLine;
  unsigned long lastActivityMillis;

  void processNextCommand();
  void executeParsedCommand(const ParsedGCode& cmd);
  void planLinearMove(float targetX, float targetY, float feedrate, bool isRapid);
  void stepInterpolation();
  void checkPhysicalEStop();
};

#endif // CNC_CONTROLLER_H
