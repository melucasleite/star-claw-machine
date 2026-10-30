# Hardware (draft)

## Carriage box

The box rides the X/Y gantry and holds the drop winch and the minigame screen. CAD for the claw and the winch is in `cad/claw/`.

- **Outer size:** 140 W × 120 H × 110 D mm, in 6 mm birch ply with a walnut veneer and a 3D-printed bezel
- **Screen:** 1.9" ST7789 IPS, 170 × 320, mounted portrait, behind a 2 mm acrylic window
- **Drop winch:** N20 6 V 100 rpm gearmotor with a Hall encoder, a 12 mm spool in a 683ZZ bearing, 1.2 m braided cable, and a KW12-3 roller switch that opens when the cable goes slack
- **Claw:** three printed prongs driven by an MG996R standard servo through a crank and pushrod
- **Lighting:** 6× WS2812 LEDs around the bezel for idle, Perfect, and chest effects
- **Weight budget:** about 450 g including the claw

See `designs/carriage-box.svg` for dimensioned front and side views.

## Electronics

```
 cabinet ESP32-S3 (main)                carriage ESP32-C3
 ├─ joystick, REEL button     ──UART──▶ ├─ ST7789 display (SPI)
 ├─ X/Y stepper drivers        (drag    ├─ WS2812 ring
 ├─ coin acceptor              chain)   ├─ drop motor driver (DRV8833) + encoder A/B
 └─ marquee LEDs                        ├─ slack switch (KW12-3)
                                        ├─ claw servo signal (50 Hz PWM)
                                        ├─ INA219 on the servo supply (current = grip)
                                        └─ XL4015 buck, 24 V to 6 V (servo, N20)
```

The minigame runs on the **carriage MCU**, which also drives the claw servo. It closes the servo past contact and trims the command until the INA219 reads the target current, so grip follows the meter. That keeps the grip loop local and puts only four wires in the drag chain: 24 V, GND, TX, and RX. The main MCU sends `DROP`, button state at 200 Hz, and the zone tier. The carriage replies with `GRIP <percent>` and `DONE`.

The ESP32-C3 has no hardware pulse counter, so the encoder is read on GPIO interrupts. That is about 7,000 edges a second at full speed, with 4,200 counts per spool turn.

## Draft BOM

| Part                      | Qty | ~USD |
| ------------------------- | --- | ---- |
| ESP32-S3 DevKit           | 1   | 9    |
| ESP32-C3 Super Mini       | 1   | 4    |
| 1.9" ST7789 170×320       | 1   | 7    |
| N20 6 V 100 rpm + encoder | 1   | 8    |
| DRV8833 driver            | 1   | 2    |
| MG996R servo (4-pack)     | 1   | 20   |
| INA219 current sensor     | 1   | 2    |
| XL4015 5 A buck           | 1   | 6    |
| KW12-3 roller switch      | 1   | 1    |
| 683ZZ bearing             | 1   | 1    |
| WS2812 strip (6 LEDs)     | 1   | 2    |
| Drag chain 10×15, 1 m     | 1   | 8    |
| Sanwa-style 60 mm button  | 1   | 6    |
