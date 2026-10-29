# Concept

## Pitch

Claw machines feel rigged because they usually are: most cabinets pay out on a timer and use a weak grip the rest of the time. START CLAW makes the grip visible and makes it **skill-based**. You fight for grip strength in a fishing minigame that runs on the claw's own carriage, right above the prize you're aiming at.

## Why the screen sits on the carriage

- **Your eyes are already there.** While you line up a grab, you watch the claw. The game is where you're looking, not on a panel down by your hands.
- **It travels with the claw.** The screen moves over the prize you picked, so the minigame and the grab read as one action.
- **It works as a status light.** Between rounds the screen shows idle animations, the prize tier under the claw, and a "PERFECT!" flash.

## Player flow

1. **Insert credit.** The marquee lights up and the carriage screen shows "ALIGN".
2. **Aim.** Steer the gantry with the joystick (arrow keys in the prototype). A ring on the prize bed shows where the claw will land.
3. **Drop and grab.** Press REEL (Space). The claw drops until it hits something, closes, and lifts. Whether it picks anything up is down to the physics: where you aimed, how the bear is lying, and the claw's opening grip.
4. **Reel (up to 10 s).** If a teddy bear comes up with the claw, the minigame starts on the carriage screen. The bear moves up and down the track. Hold REEL to lift the green bar and release it to let the bar fall, keeping the bear inside the bar.
5. **The meter is the grip.** The meter drives the claw's grip strength **live**. If the meter drops, the prongs loosen and the bear can slip out while you're still playing.
6. **Outcome.**
   - **Meter full:** full grip, and the claw carries the bear to the chute.
   - **Meter empty:** the claw goes limp and the bear drops.
   - **Time runs out:** the claw carries the bear home at whatever grip the meter left, so it may still slip on the way.

## Grip mapping

`torque = 1.5 + 26.5 × meter` in prototype units. The bear weighs 20 N and each prong is about 1.4 units long. At the starting meter (35 %), the grip holds a well-centred bear but not one hanging by a paw. On the cabinet, this value is the claw coil's PWM duty cycle. Because the grip is earned openly, there is no payout timer.

## Visual direction

A cozy farm-game look: a walnut cabinet with teal and mustard trim, a pixel-art marquee and screen, and plush produce, fish, and treasure chests as prizes. See `designs/concept-render.png`.
