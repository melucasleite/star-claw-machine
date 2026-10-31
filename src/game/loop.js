import { renderFrame } from "./postfx.js";
import { world } from "./physics.js";
import { driveProngs, hub } from "./claw.js";
import { dish, jiggle } from "./plushies.js";
import { wander } from "./walkers.js";
import { tallyScore } from "./hud.js";
import { stepFx } from "./confetti.js";
import { game, tick } from "./game.js";
import { drawScreen } from "./screen.js";
import { setMotor } from "./audio.js";
import { sync } from "./sync.js";

// ---------- loop ----------

const FIXED = 1 / 120;
let acc = 0;
let last = performance.now();
export function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!game.paused) {
    acc += dt;
    while (acc >= FIXED) {
      tick(FIXED);
      wander(FIXED);
      dish();
      driveProngs();
      world.step(FIXED);
      jiggle(FIXED);
      acc -= FIXED;
    }
  }
  sync(now);
  const hv = hub.velocity;
  setMotor(game.paused ? 0 : Math.hypot(hv.x, hv.z) + Math.abs(hv.y) * 0.5);
  drawScreen();
  tallyScore(dt);
  stepFx(dt);
  renderFrame();
  requestAnimationFrame(frame);
}
