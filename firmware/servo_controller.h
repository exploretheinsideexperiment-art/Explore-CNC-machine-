#ifndef SERVO_CONTROLLER_H
#define SERVO_CONTROLLER_H

#include <Arduino.h>
#include "config.h"

class ServoController {
public:
  ServoController();
  void init();
  
  void penUp();
  void penDown();
  void setAngle(int angle);

  PenState getPenState() const { return currentPenState; }
  int getPenUpAngle() const { return penUpAngle; }
  int getPenDownAngle() const { return penDownAngle; }

  void setPenUpAngle(int angle);
  void setPenDownAngle(int angle);

private:
  int penUpAngle;
  int penDownAngle;
  int currentAngle;
  PenState currentPenState;

  void writePwm(int angle);
};

#endif // SERVO_CONTROLLER_H
