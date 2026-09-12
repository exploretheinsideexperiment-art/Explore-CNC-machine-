# Explore CNC Plotter - Hardware Wiring & Pinout Guide

## 1. System Overview & Safety Warnings
> [!CAUTION]
> **NEVER power the stepper motors or servo directly from the ESP32 3.3V or 5V/VIN pin.**
> 28BYJ-48 stepper motors and SG90 servos draw 400mA–1.5A peaks, which will cause brownouts, ESP32 reset loops, and can permanently fry the ESP32 voltage regulator.
> Always use an external regulated **5V 2A-3A DC power supply**.

> [!IMPORTANT]
> **Common Ground Rule**: You **MUST connect the GND of the external 5V power supply to the GND of the ESP32**. Without a common ground reference, step signals will float and causes erratic motor jitter.

---

## 2. Text Schematic Wiring Diagram

```text
========================================================================================
                               EXPLORE CNC PLOTTER WIRING DIAGRAM
========================================================================================

                 +-----------------------------+
                 |  EXTERNAL 5V POWER SUPPLY   |
                 |  (5V DC, 2A - 3A Regulated) |
                 +--------------+--------------+
                                |
             +5V RAIL           | GND RAIL (COMMON GND)
        +-----------------------+-----------------------+
        |                       |                       |
        |                       |                       |
+-------v-------+       +-------v-------+       +-------v-------+       +---------------+
|  ULN2003 (X)  |       |  ULN2003 (Y)  |       |  SG90 SERVO   |       | ESP32 DevKit  |
|  DRIVER BOARD |       |  DRIVER BOARD |       | (PEN LIFTER)  |       |  (MICRO-USB   |
|               |       |               |       |               |       |  OR 5V IN)    |
| VCC: 5V       |       | VCC: 5V       |       | RED: 5V       |       |               |
| GND: GND -----+-------+ GND: GND -----+-------+ BROWN: GND ---+-------+ GND (Pin 14)  |
|               |       |               |       | ORANGE: SIG <-+-------+ GPIO 13       |
| IN1 <---------+-------+---------------+-------+---------------+-------+ GPIO 19       |
| IN2 <---------+-------+---------------+-------+---------------+-------+ GPIO 18       |
| IN3 <---------+-------+---------------+-------+---------------+-------+ GPIO 5        |
| IN4 <---------+-------+---------------+-------+---------------+-------+ GPIO 17       |
|               |       | IN1 <---------+-------+---------------+-------+ GPIO 16       |
|               |       | IN2 <---------+-------+---------------+-------+ GPIO 4        |
|               |       | IN3 <---------+-------+---------------+-------+ GPIO 2        |
|               |       | IN4 <---------+-------+---------------+-------+ GPIO 15       |
+-------+-------+       +-------+-------+       +---------------+       +---------------+
        |                       |                                               |
  5-pin JST               5-pin JST                                    +--------+--------+
        |                       |                                      |                 |
+-------v-------+       +-------v-------+                              v                 v
| 28BYJ-48 (X)  |       | 28BYJ-48 (Y)  |                        [X-Limit Sw]      [Y-Limit Sw]
| STEPPER MOTOR |       | STEPPER MOTOR |                         (GPIO 32)         (GPIO 33)
+---------------+       +---------------+                          to GND            to GND
========================================================================================
```

---

## 3. GPIO Pin Mapping Table

| Device | Component Pin | ESP32 DevKit V1 GPIO | Electrical Notes |
| :--- | :--- | :--- | :--- |
| **X-Axis Stepper** | ULN2003 IN1 | **GPIO 19** | Standard digital output |
| **X-Axis Stepper** | ULN2003 IN2 | **GPIO 18** | Standard digital output |
| **X-Axis Stepper** | ULN2003 IN3 | **GPIO 5** | Standard digital output |
| **X-Axis Stepper** | ULN2003 IN4 | **GPIO 17** | Standard digital output |
| **Y-Axis Stepper** | ULN2003 IN1 | **GPIO 16** | Standard digital output |
| **Y-Axis Stepper** | ULN2003 IN2 | **GPIO 4** | Standard digital output |
| **Y-Axis Stepper** | ULN2003 IN3 | **GPIO 2** | Shared with onboard blue LED |
| **Y-Axis Stepper** | ULN2003 IN4 | **GPIO 15** | Standard digital output |
| **Pen Servo** | PWM Signal (Orange/Yellow) | **GPIO 13** | 50Hz LEDC PWM Hardware Timer |
| **X Limit Switch** | Signal to COM, NO to GND | **GPIO 32** | Internal Pullup Enabled |
| **Y Limit Switch** | Signal to COM, NO to GND | **GPIO 33** | Internal Pullup Enabled |
| **Emergency Stop** | Push Button (NC or NO) | **GPIO 34** | Input-only pin with external 10k pullup |

---

## 4. Motor Phase Wiring (28BYJ-48 to ULN2003)
The 28BYJ-48 motor comes with a standard 5-pin female connector that plugs directly into the ULN2003 board:
1. Blue: Coil 1 (IN1)
2. Pink: Coil 2 (IN2)
3. Yellow: Coil 3 (IN3)
4. Orange: Coil 4 (IN4)
5. Red: Common +5V power rail
