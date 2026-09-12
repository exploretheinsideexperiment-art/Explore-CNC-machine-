# Explore CNC Plotter - Supported G-Code Commands

The Explore CNC firmware executes standard CNC and 2D pen plotter G-code dialects.

| Command | Description | Syntax & Parameters | Example |
| :--- | :--- | :--- | :--- |
| **G0** | Rapid linear traverse (pen up travel) | `G0 X<mm> Y<mm>` | `G0 X15.0 Y20.0` |
| **G1** | Coordinated linear draw move with feedrate | `G1 X<mm> Y<mm> F<feedrate>` | `G1 X45.2 Y10.8 F500` |
| **G4** | Dwell / Wait | `G4 P<ms>` or `G4 S<sec>` | `G4 P150` |
| **G21** | Set units to millimeters | `G21` | `G21` |
| **G28** | Home axes towards limit switches | `G28` | `G28` |
| **G90** | Absolute distance mode | `G90` | `G90` |
| **G91** | Incremental / relative distance mode | `G91` | `G91` |
| **G92** | Set current position as coordinate origin | `G92 X0 Y0` | `G92 X0 Y0` |
| **M3** | Pen Down (lowers servo to drawing angle) | `M3` or `M300 S<angle>` | `M3` |
| **M5** | Pen Up (raises servo to travel angle) | `M5` or `M500` | `M5` |
| **M112** | Emergency Stop (clears queue & disables coils) | `M112` | `M112` |
| **M114** | Report current coordinate position | `M114` | `M114` |

---

## Sample G-Code Program (Draws a 20mm Square)
```gcode
; Explore CNC 20mm Test Square
G21         ; Millimeter units
G90         ; Absolute positioning
M5          ; Ensure pen is UP
G0 X10 Y10  ; Move to bottom-left corner
M3          ; Pen DOWN
G1 X30 Y10 F500 ; Draw bottom edge
G1 X30 Y30      ; Draw right edge
G1 X10 Y30      ; Draw top edge
G1 X10 Y10      ; Draw left edge
M5          ; Pen UP
G0 X0 Y0    ; Return to origin
```
