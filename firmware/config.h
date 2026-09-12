/**
 * ============================================================================
 * Explore CNC Plotter - Hardware & Firmware Pin Configuration
 * ============================================================================
 * Designed for ESP32 DevKit V1 / ESP32-WROOM-32
 * Machine: DIY 2D CNC Pen Plotter
 * Motors: Two 5V 28BYJ-48 Stepper Motors with ULN2003 Driver Boards
 * Pen Lifter: Micro Servo (SG90 / MG90S)
 * Power: 5V External Power Supply with Common Ground
 * ============================================================================
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ----------------------------------------------------------------------------
// MOTOR DRIVER TYPE
// ----------------------------------------------------------------------------
#define MOTOR_TYPE_4WIRE_28BYJ48  0   // 4-wire unipolar with ULN2003
#define MOTOR_TYPE_STEP_DIR       1   // 2-wire bipolar (A4988 / DRV8825 / TMC2208)

// Active Motor Type
#define DEFAULT_MOTOR_TYPE        MOTOR_TYPE_4WIRE_28BYJ48

// ----------------------------------------------------------------------------
// GPIO PIN ASSIGNMENTS (ESP32 DevKit V1)
// ----------------------------------------------------------------------------
// X-Axis Stepper Pins (ULN2003 IN1 - IN4)
#define X_IN1           19
#define X_IN2           18
#define X_IN3            5
#define X_IN4           17

// Y-Axis Stepper Pins (ULN2003 IN1 - IN4)
#define Y_IN1           16
#define Y_IN2            4
#define Y_IN3            2
#define Y_IN4           15

// Alternative STEP/DIR pin mapping for A4988 / DRV8825 upgrades
#define X_STEP_PIN      19
#define X_DIR_PIN       18
#define Y_STEP_PIN      16
#define Y_DIR_PIN        4
#define STEPPERS_ENABLE_PIN 17

// Pen Up/Down Micro Servo (SG90 / MG90S)
#define SERVO_PIN       13

// Limit Switches (Active LOW with internal pullups)
#define X_LIMIT_PIN     32
#define Y_LIMIT_PIN     33

// Physical Emergency Stop Button (Active LOW with internal pullup)
#define ESTOP_PIN       34

// Onboard Status LED
#define STATUS_LED_PIN   2

// ----------------------------------------------------------------------------
// DEFAULT MACHINE GEOMETRY & KINEMATICS
// ----------------------------------------------------------------------------
// 28BYJ-48 has 4096 half-steps per revolution (or 2048 full-steps).
// With an 8-tooth GT2 pulley (16mm circumference): ~256 steps/mm.
// With an M8 lead screw (1.25mm pitch): ~3276.8 steps/mm.
// Default calibrated for standard belt drive pulley:
#define DEFAULT_STEPS_PER_MM_X   100.0f
#define DEFAULT_STEPS_PER_MM_Y   100.0f

#define DEFAULT_MAX_X_MM         200.0f  // 200mm working area (A4 width friendly)
#define DEFAULT_MAX_Y_MM         200.0f  // 200mm working area
#define DEFAULT_FEEDRATE         600.0f  // mm/min for 28BYJ-48
#define MAX_FEEDRATE             1200.0f // mm/min maximum safe speed

// Servo Angles (Degrees)
#define DEFAULT_SERVO_PEN_UP     45      // Raised angle
#define DEFAULT_SERVO_PEN_DOWN   90      // Drawing angle on paper
#define SERVO_TRAVEL_TIME_MS     120     // Wait time for servo movement (ms)

// Direction Inversion Flags
#define DEFAULT_INVERT_X         false
#define DEFAULT_INVERT_Y         false

// Homing Speeds
#define HOMING_FEEDRATE          300.0f

// ----------------------------------------------------------------------------
// BUFFER & QUEUE SIZES
// ----------------------------------------------------------------------------
#define COMMAND_QUEUE_SIZE       128     // Ring buffer holding G-code commands
#define MAX_GCODE_LINE_LENGTH    96
#define WS_BROADCAST_INTERVAL_MS 100     // 10 Hz WebSocket telemetry

// ----------------------------------------------------------------------------
// WI-FI CONFIGURATION
// ----------------------------------------------------------------------------
#define AP_SSID_PREFIX           "Explore-CNC-"
#define AP_DEFAULT_PASSWORD      "explore123"
#define AP_DEFAULT_IP            192, 168, 4, 1
#define AP_GATEWAY               192, 168, 4, 1
#define AP_SUBNET                255, 255, 255, 0

#define HTTP_PORT                80
#define WS_PORT                  81

// Machine States
enum MachineState {
  STATE_IDLE,
  STATE_RUNNING,
  STATE_PAUSED,
  STATE_HOMING,
  STATE_ERROR,
  STATE_EMERGENCY_STOP,
  STATE_COMPLETE
};

// Pen State
enum PenState {
  PEN_UP,
  PEN_DOWN
};

#endif // CONFIG_H
