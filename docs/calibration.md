# Explore CNC Plotter - Calibration & Steps-Per-MM Calculation

## 1. Steps per Millimeter Formula

The 28BYJ-48 stepper motor has a built-in internal reduction gear train (approx. 64:1 reduction).
In half-step mode (recommended for smooth motion), it requires **4096 half-steps per 360-degree output shaft revolution**.

### Pulley & GT2 Timing Belt (Most Common):
If using a GT2 timing belt (2mm pitch per tooth) with a pulley of $N$ teeth:
$$\text{Circumference (mm)} = N \times 2\text{ mm}$$
$$\text{Steps per mm} = \frac{4096}{\text{Circumference (mm)}} = \frac{4096}{N \times 2}$$

Examples:
- **16-tooth GT2 pulley** (32mm circumference): $\frac{4096}{32} = \mathbf{128.0\text{ steps/mm}}$
- **20-tooth GT2 pulley** (40mm circumference): $\frac{4096}{40} = \mathbf{102.4\text{ steps/mm}}$

### Threaded Rod / Lead Screw:
If using a standard M8 threaded rod (1.25mm pitch per revolution):
$$\text{Steps per mm} = \frac{4096}{1.25} = \mathbf{3276.8\text{ steps/mm}}$$
If using an 8mm lead screw with 4 starts (8mm lead per revolution):
$$\text{Steps per mm} = \frac{4096}{8.0} = \mathbf{512.0\text{ steps/mm}}$$

---

## 2. Interactive Calibration Wizard Procedure
If you don't know the exact gear ratio or pulley size, use the built-in wizard in the Explore CNC web app:

1. Place a ruler next to the X or Y axis.
2. Mark the starting position with the pen.
3. Click **Move 10 mm**.
4. Measure the actual physical distance moved on the ruler with calipers or a fine ruler (e.g. 9.4 mm).
5. Enter the measured distance in the wizard.
6. The app computes:
   $$\text{New Steps/mm} = \text{Current Steps/mm} \times \left(\frac{\text{Commanded Distance}}{\text{Measured Distance}}\right)$$
7. Click **Apply Calibration** to save the value permanently to the ESP32 NVS storage.
