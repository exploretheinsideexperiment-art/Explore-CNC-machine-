#ifndef STEPPER_CONTROLLER_H
#define STEPPER_CONTROLLER_H

#include <Arduino.h>
#include "config.h"

class StepperController {
public:
  StepperController();
  void init();
  
  // Set current position in steps
  void setPositionSteps(long xSteps, long ySteps);
  long getXSteps() const { return currentXSteps; }
  long getYSteps() const { return currentYSteps; }

  // Step a single axis by +1 or -1 step
  void stepX(int dir);
  void stepY(int dir);

  // Turn off all coils to prevent motor overheating
  void releaseCoils();

  // Configure parameters
  void setInvertX(bool invert) { invertX = invert; }
  void setInvertY(bool invert) { invertY = invert; }
  void setMotorType(int type) { motorType = type; }

  // Check physical limit switches
  bool isXLimitTriggered() const;
  bool isYLimitTriggered() const;

private:
  int motorType;
  bool invertX;
  bool invertY;

  long currentXSteps;
  long currentYSteps;

  uint8_t stepPhaseX;
  uint8_t stepPhaseY;

  void applyHalfStepX(uint8_t phase);
  void applyHalfStepY(uint8_t phase);
};

#endif // STEPPER_CONTROLLER_H
