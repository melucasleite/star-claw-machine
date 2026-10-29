# Hardware (draft)

## Carriage box

The box rides the X/Y gantry and holds the claw drop motor, the cable spool, and the minigame screen.

- **Outer size:** 140 W × 120 H × 110 D mm, in 6 mm birch ply with a walnut veneer and a 3D-printed bezel
- **Screen:** 1.9" ST7789 IPS, 170 × 320, mounted portrait, behind a 2 mm acrylic window
- **Drop motor:** N20 gearmotor with a 12 mm spool and 1.2 m braided cable
- **Lighting:** 6× WS2812 LEDs around the bezel for idle, Perfect, and chest effects
- **Weight budget:** about 450 g including the claw

See `designs/carriage-box.svg` for dimensioned front and side views.

## Electronics

```
 cabinet ESP32-S3 (main)                carriage ESP32-C3
 ├─ joystick, REEL button     ──UART──▶ ├─ ST7789 display (SPI)
 ├─ X/Y stepper drivers        (drag    ├─ WS2812 ring
 ├─ coin acceptor              chain)   ├─ drop motor driver (DRV8833)
 └─ marquee LEDs                        └─ claw coil MOSFET (PWM = grip)
```

The minigame runs on the **carriage MCU**, which also drives the claw coil. That keeps the PWM duty local and puts only four wires in the drag chain: 24 V, GND, TX, and RX. The main MCU sends `DROP`, button state at 200 Hz, and the zone tier. The carriage replies with `GRIP <duty>` and `DONE`.

## Draft BOM

| Part                     | Qty | ~USD |
| ------------------------ | --- | ---- |
| ESP32-S3 DevKit          | 1   | 9    |
| ESP32-C3 Super Mini      | 1   | 4    |
| 1.9" ST7789 170×320      | 1   | 7    |
| N20 gearmotor 100 rpm    | 1   | 5    |
| DRV8833 driver           | 1   | 2    |
| 24 V claw coil + claw    | 1   | 18   |
| IRLZ44N MOSFET + flyback | 1   | 2    |
| WS2812 strip (6 LEDs)    | 1   | 2    |
| Drag chain 10×15, 1 m    | 1   | 8    |
| Sanwa-style 60 mm button | 1   | 6    |
