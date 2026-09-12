#ifndef GCODE_PARSER_H
#define GCODE_PARSER_H

#include <Arduino.h>

enum GCodeType {
  GCODE_NONE,
  GCODE_G0,      // Rapid linear move
  GCODE_G1,      // Coordinated linear move
  GCODE_G4,      // Dwell (P ms or S sec)
  GCODE_G21,     // Metric (mm)
  GCODE_G28,     // Homing
  GCODE_G90,     // Absolute positioning
  GCODE_G91,     // Relative positioning
  GCODE_G92,     // Set origin
  GCODE_M3,      // Pen Down
  GCODE_M5,      // Pen Up
  GCODE_M112,    // Emergency Stop
  GCODE_UNKNOWN
};

struct ParsedGCode {
  GCodeType type;
  bool hasX;
  bool hasY;
  bool hasZ;
  bool hasF;
  bool hasS;
  bool hasP;

  float x;
  float y;
  float z;
  float f;       // Feedrate (mm/min)
  float s;       // Servo angle / spindle
  float p;       // Dwell time
  char raw[64];
};

class GCodeParser {
public:
  GCodeParser();
  ParsedGCode parseLine(const String& line);
};

#endif // GCODE_PARSER_H
