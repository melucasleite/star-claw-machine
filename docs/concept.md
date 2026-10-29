# Concept

## Pitch

Claw machines feel rigged because they usually are: most cabinets pay out on a timer and use a weak grip the rest of the time. START CLAW makes the grip visible and makes it **skill-based**. You fight for grip strength in a fishing minigame that runs on the claw's own carriage, right above the prize you're aiming at.

## Why the screen sits on the carriage

- **Your eyes are already there.** While you line up a grab, you watch the claw. The game is where you're looking, not on a panel down by your hands.
- **It travels with the claw.** The screen moves over the prize you picked, so the minigame and the grab read as one action.
- **It works as a status light.** Between rounds the screen shows idle animations, the prize tier under the claw, and a "PERFECT!" flash.

## Player flow

1. **Insert credit.** The marquee lights up and the carriage screen shows "CAST!".
2. **Aim (up to 20 s).** Steer the gantry with the joystick. The screen shows the prize tier under the claw, read from a zone map of the prize bed.
3. **Drop.** Press REEL. The claw starts descending and the minigame starts.
4. **Reel (about 6–10 s).** Hold REEL to lift the green catch bar and release to let it fall. Keep the fish inside the bar to fill the progress meter.
5. **Close.** The claw closes when the meter fills (a **Perfect** grip), when the meter runs out (the weakest grip), or when time runs out (grip set by how full the meter is).
6. **Lift and return.** The grip holds at the earned strength all the way to the chute. A Perfect grip gets a small boost at the top so the prize doesn't slip.

## Grip mapping

| Meter at close         | Claw coil duty | Feel                                          |
| ---------------------- | -------------- | --------------------------------------------- |
| 0–29 %                 | 25 %           | Limp, and drops almost anything               |
| 30–69 %                | 25 → 70 %      | Linear ramp                                   |
| 70–99 %                | 70 → 90 %      | Solid grip on most plush                      |
| 100 % (Perfect)        | 100 %          | Full grip, plus a "PERFECT!" flourish         |
| Treasure chest grabbed | +10 %          | Bonus stacks on top of the above, up to 100 % |

The operator sets the exact curve per machine (see `docs/minigame.md`). Because the grip is earned openly, there is no payout timer.

## Visual direction

A cozy farm-game look: a walnut cabinet with teal and mustard trim, a pixel-art marquee and screen, and plush produce, fish, and treasure chests as prizes. See `designs/concept-render.png`.
