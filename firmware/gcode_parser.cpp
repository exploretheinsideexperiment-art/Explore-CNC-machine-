#include "gcode_parser.h"

GCodeParser::GCodeParser() {}

ParsedGCode GCodeParser::parseLine(const String& rawLine) {
  ParsedGCode result;
  result.type = GCODE_NONE;
  result.hasX = false;
  result.hasY = false;
  result.hasZ = false;
  result.hasF = false;
  result.hasS = false;
  result.hasP = false;
  result.x = 0;
  result.y = 0;
  result.z = 0;
  result.f = 0;
  result.s = 0;
  result.p = 0;

  // Trim and ignore comments (; or ( ... ))
  String clean = rawLine;
  int commentIdx = clean.indexOf(';');
  if (commentIdx >= 0) {
    clean = clean.substring(0, commentIdx);
  }
  int parenIdx = clean.indexOf('(');
  if (parenIdx >= 0) {
    clean = clean.substring(0, parenIdx);
  }
  clean.trim();
  clean.toUpperCase();

  if (clean.length() == 0) {
    return result;
  }

  strncpy(result.raw, clean.c_str(), sizeof(result.raw) - 1);
  result.raw[sizeof(result.raw) - 1] = '\0';

  // Parse words
  int len = clean.length();
  int i = 0;

  while (i < len) {
    char letter = clean.charAt(i);

    if (letter == ' ' || letter == '\t') {
      i++;
      continue;
    }

    // Read numerical value following letter
    int numStart = i + 1;
    while (numStart < len && (clean.charAt(numStart) == ' ' || clean.charAt(numStart) == '\t')) {
      numStart++;
    }

    int numEnd = numStart;
    while (numEnd < len && (isDigit(clean.charAt(numEnd)) || clean.charAt(numEnd) == '.' || clean.charAt(numEnd) == '-')) {
      numEnd++;
    }

    float value = 0;
    if (numEnd > numStart) {
      value = clean.substring(numStart, numEnd).toFloat();
    }

    switch (letter) {
      case 'G': {
        int gCodeNum = (int)value;
        if (gCodeNum == 0) result.type = GCODE_G0;
        else if (gCodeNum == 1) result.type = GCODE_G1;
        else if (gCodeNum == 4) result.type = GCODE_G4;
        else if (gCodeNum == 21) result.type = GCODE_G21;
        else if (gCodeNum == 28) result.type = GCODE_G28;
        else if (gCodeNum == 90) result.type = GCODE_G90;
        else if (gCodeNum == 91) result.type = GCODE_G91;
        else if (gCodeNum == 92) result.type = GCODE_G92;
        else result.type = GCODE_UNKNOWN;
        break;
      }
      case 'M': {
        int mCodeNum = (int)value;
        if (mCodeNum == 3 || mCodeNum == 300) result.type = GCODE_M3;
        else if (mCodeNum == 5 || mCodeNum == 500) result.type = GCODE_M5;
        else if (mCodeNum == 112) result.type = GCODE_M112;
        else result.type = GCODE_UNKNOWN;
        break;
      }
      case 'X':
        result.hasX = true;
        result.x = value;
        break;
      case 'Y':
        result.hasY = true;
        result.y = value;
        break;
      case 'Z':
        result.hasZ = true;
        result.z = value;
        // Z<0 can also indicate pen down, Z>=0 pen up in some slicers
        if (result.type == GCODE_NONE) {
          result.type = (value < 0.0f) ? GCODE_M3 : GCODE_M5;
        }
        break;
      case 'F':
        result.hasF = true;
        result.f = value;
        break;
      case 'S':
        result.hasS = true;
        result.s = value;
        break;
      case 'P':
        result.hasP = true;
        result.p = value;
        break;
      default:
        break;
    }

    i = (numEnd > i) ? numEnd : i + 1;
  }

  // If command was just coordinates without G0/G1 explicitly stated on each line
  if (result.type == GCODE_NONE && (result.hasX || result.hasY)) {
    result.type = GCODE_G1;
  }

  return result;
}
