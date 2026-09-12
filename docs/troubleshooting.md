# Explore CNC Plotter - Troubleshooting Guide

## 1. Motors vibrate or hum but do not turn
* **Root Cause 1: Incorrect coil wiring order**.
  - ULN2003 boards expect the motor phases sequentially (IN1, IN2, IN3, IN4).
  - Verify GPIO assignment: X (19, 18, 5, 17) and Y (16, 4, 2, 15).
* **Root Cause 2: Insufficient power supply voltage or current**.
  - The 28BYJ-48 requires clean 5V DC with at least 1.5A to 2A capability. USB ports through cheap cables often drop to 4.2V under load.
* **Root Cause 3: Feedrate too high**.
  - 28BYJ-48 stepper motors have high internal gear ratios and will stall if commanded above ~1200 mm/min. Reduce feedrate to 400–600 mm/min.

---

## 2. ESP32 reboots randomly whenever a motor starts
* **Missing Common Ground**: Ensure the external 5V power supply ground is firmly connected to the ESP32 GND pin.
* **Power Supply Brownout**: Ensure you are NOT powering motors from the ESP32 3.3V or 5V pin.
* **Flyback Spikes**: Add a 100uF - 470uF electrolytic capacitor across the 5V and GND power rails of the ULN2003 boards.

---

## 3. Pen servo doesn't move or twitches
* Verify signal wire is connected to **GPIO 13**.
* Verify servo power is connected to the external **5V rail**, NOT the ESP32 3.3V pin.
* In the app Calibration settings, adjust the **Pen Up** (e.g. 40°) and **Pen Down** (e.g. 90°) angles so the servo does not hit mechanical hard-stops.

---

## 4. Web app cannot connect to ESP32
* Verify your smartphone or PC is connected to the same Wi-Fi network or to the ESP32 AP (`Explore-CNC-XXXX`).
* Check the IP address in the Arduino Serial Monitor (115200 baud).
* In the Explore CNC app, enter the ESP32 IP in **Wi-Fi / Machine Connection** and click **Connect**.
* If running offline or without physical hardware, switch to **Simulation Mode** in the app header to preview and test everything in the browser.
