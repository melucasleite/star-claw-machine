import { GRIP, MG, gripAt } from "./config.js";
import { claw } from "./claw.js";
import { keys } from "./input.js";
import { game, isHeld, setState } from "./game.js";
import { setMusicLevel, sfx } from "./audio.js";

// Keep the reel up a beat after it ends so the result registers, then tuck it away.
export let reelHide = 0;
export function showReel(on) {
  clearTimeout(reelHide);
  if (on) document.body.classList.add("reeling");
  else
    reelHide = setTimeout(() => document.body.classList.remove("reeling"), 700);
}

export function startReel(plush) {
  showReel(true);
  sfx.reelStart();
  setMusicLevel(0.45);
  const t = plush.tier;
  game.held = plush;
  game.turn.kind = "reel";
  game.mg = {
    tier: t,
    animal: plush.animal,
    barPos: 0,
    barVel: 0,
    fishPos: t.barHeight / 2,
    fishVel: 0,
    fishTarget: 0.5,
    behavior: t.behaviors[0],
    progress: MG.startProgress,
    t: 0,
    perfect: true,
    result: null,
  };
  setState("reel");
}

export function endReel(result) {
  if (result === "caught") sfx.caught(game.mg.perfect);
  else if (result === "escaped") sfx.escaped();
  else sfx.slipped();
  setMusicLevel(1);
  showReel(false);
  game.mg.result = result;
  game.turn.result = result;
  if (result === "caught") claw.torque = GRIP.max;
  if (result === "escaped") claw.closing = false;
  setState("return");
}

export function stepFish(mg, dt) {
  const d = mg.tier.difficulty / 100;
  const list = mg.tier.behaviors;
  if (list.length > 1 && Math.random() < dt * 0.5) {
    mg.behavior = list[Math.floor(Math.random() * list.length)];
  }
  const r = Math.random();
  switch (mg.behavior) {
    case "smooth":
      mg.fishTarget = 0.5 + 0.35 * Math.sin(mg.t * (0.8 + d));
      break;
    case "mixed":
      if (r < dt * (1 + 2 * d)) mg.fishTarget = Math.random();
      break;
    case "dart":
      if (r < dt * (1.5 + 3 * d)) mg.fishTarget = Math.random();
      break;
    case "sinker":
      mg.fishTarget = Math.max(0, mg.fishTarget - dt * 0.3);
      if (r < dt * 1.5) mg.fishTarget = Math.min(1, mg.fishPos + 0.3);
      break;
    case "floater":
      mg.fishTarget = Math.min(1, mg.fishTarget + dt * 0.3);
      if (r < dt * 1.5) mg.fishTarget = Math.max(0, mg.fishPos - 0.3);
      break;
  }
  const speed =
    (mg.behavior === "dart" ? 6 + 6 * d : 2.5 + 3 * d) * MG.bearSpeed;
  mg.fishVel += (mg.fishTarget - mg.fishPos) * speed * dt * 6;
  mg.fishVel *= Math.pow(0.02, dt);
  mg.fishPos = Math.min(1, Math.max(0, mg.fishPos + mg.fishVel * dt));
}

export function stepReel(dt) {
  const mg = game.mg;
  mg.t += dt;
  mg.barVel += (keys.Space ? MG.lift : -MG.gravity) * dt;
  mg.barPos += mg.barVel * dt;
  const top = 1 - mg.tier.barHeight;
  if (mg.barPos < 0) {
    mg.barPos = 0;
    mg.barVel = -mg.barVel * MG.bounce;
  } else if (mg.barPos > top) {
    mg.barPos = top;
    mg.barVel = 0;
  }
  stepFish(mg, dt);
  const inBar =
    mg.fishPos >= mg.barPos && mg.fishPos <= mg.barPos + mg.tier.barHeight;
  mg.progress += (inBar ? MG.fillRate : -MG.drainRate) * dt;
  if (!inBar) mg.perfect = false;
  mg.progress = Math.min(1, Math.max(0, mg.progress));
  // Ping in, buzz out, and a ratchet that clicks up as the grip builds.
  if (mg.wasInBar !== undefined && inBar !== mg.wasInBar)
    inBar ? sfx.inBar() : sfx.outBar();
  mg.wasInBar = inBar;
  const notch = Math.floor(mg.progress * 16);
  if (mg.notch !== undefined && notch > mg.notch) sfx.ratchet(mg.progress);
  else if (mg.notch !== undefined && notch < mg.notch) sfx.slack(mg.progress);
  mg.notch = notch;
  claw.torque = gripAt(mg.progress);

  if (!isHeld(game.held)) endReel("slipped");
  else if (mg.progress >= 1) endReel("caught");
  else if (mg.progress <= 0) endReel("escaped");
  else if (mg.t >= MG.timeLimit) endReel("timeout");
}
