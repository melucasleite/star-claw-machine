import * as CANNON from "cannon-es";
import { CHUTE } from "./config.js";
import { plushies } from "./plushies.js";
import { game, horizDist } from "./game.js";

// ---------- walkers ----------

// Kinds with `walks` (the arcade's customers) shuffle around the floor, very slowly, and get back
// on their feet when knocked over. They stop while the claw is closing on them or carrying them.
export const WALK = {
  speed: 0.2,
  // Seconds between changes of mind.
  wanderMin: 2,
  wanderMax: 5,
  turnRate: 2,
  uprightRate: 4,
  // Turn back before the glass and keep this far from the chute guard.
  wall: 3.1,
  chuteMargin: 1.1,
  // Higher than this off the floor means on a pile or in the claw: no walking.
  maxY: 1.2,
  // While the claw grabs, anyone this close to it stands still.
  clawClear: 1.4,
};
const GRABBING = new Set(["close", "lift", "top", "reel", "return", "release"]);
const UP = new CANNON.Vec3(0, 1, 0);
const FWD = new CANNON.Vec3(0, 0, 1);
const up = new CANNON.Vec3();
const fwd = new CANNON.Vec3();

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function chooseHeading(w, p) {
  const nearChute =
    p.x < -CHUTE.edge + WALK.chuteMargin && p.z > CHUTE.edge - WALK.chuteMargin;
  if (nearChute || Math.abs(p.x) > WALK.wall || Math.abs(p.z) > WALK.wall)
    // Head back toward the middle (+z faces the player, so heading 0 walks toward +z).
    w.heading = Math.atan2(-p.x, -p.z) + (Math.random() - 0.5) * 0.8;
  else if (game.clock >= w.next) w.heading += (Math.random() - 0.5) * 2.5;
  else return;
  w.next =
    game.clock +
    WALK.wanderMin +
    Math.random() * (WALK.wanderMax - WALK.wanderMin);
}

export function wander(dt) {
  for (const plush of plushies) {
    const w = plush.walk;
    const b = plush.body;
    if (!w || plush.ghost || b.position.y > WALK.maxY) continue;
    if (GRABBING.has(game.state) && horizDist(b) < WALK.clawClear) continue;
    // Stand back up: spin about (up x Y), which swings the body's up toward the sky.
    b.quaternion.vmult(UP, up);
    const k = WALK.uprightRate;
    b.angularVelocity.x = -up.z * k;
    b.angularVelocity.z = up.x * k;
    // Flat on its back the cross product vanishes, so give it a nudge to roll over.
    if (up.y < -0.9) b.angularVelocity.x = k;
    if (up.y < 0.85) continue;
    chooseHeading(w, b.position);
    b.quaternion.vmult(FWD, fwd);
    const facing = Math.atan2(fwd.x, fwd.z);
    b.angularVelocity.y = wrap(w.heading - facing) * WALK.turnRate;
    // Set outright: floor friction would eat a gentler push every step.
    b.velocity.x = Math.sin(w.heading) * WALK.speed;
    b.velocity.z = Math.cos(w.heading) * WALK.speed;
    // A little bob with each step.
    w.step = (w.step ?? 0) + dt * 5;
    if (w.step > 1) {
      w.step -= 1;
      plush.squash.v += 0.35;
    }
  }
}
