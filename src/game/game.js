import { heartsEl, overlayEl } from "./dom.js";
import * as CANNON from "cannon-es";
import { CHUTE, CLAW, GRIP, RULES, TIERS } from "./config.js";
import { G_PRIZE, G_STATIC, G_WALL, PRIZE_MASK, world } from "./physics.js";
import { drawMarquee } from "./cabinet.js";
import { claw, hub, prongBodies, prongs } from "./claw.js";
import { plushies, removePlush, restock } from "./plushies.js";
import { fetchWorld, loadScores, makesBoard, makesWorld } from "./scores.js";
import { dragTarget, keys, pressed } from "./input.js";
import {
  bumpScore,
  fmt,
  heartSvg,
  popup,
  renderHud,
  resetScore,
  streakMult,
} from "./hud.js";
import { burst, popupPoint, rain } from "./confetti.js";
import { renderOver, setMode, submitName } from "./overlays.js";
import { collect, flyToBag, renderBag } from "./bag.js";
import { showReel, startReel, stepReel } from "./reel.js";
import { setMusicLevel, sfx } from "./audio.js";
import { settings } from "./settings.js";
import { currentLevel, markCleared, marqueeFor } from "./levels.js";
import {
  cashOutBonus as bonusForLives,
  chuteBusy,
  clearBonus,
  lateDropCounts,
  prizePoints,
  turnPenalty,
} from "./rules.js";

// ---------- game state ----------

export const game = {
  mode: "title",
  modeAt: 0,
  paused: false,
  state: "settle",
  t: 0,
  // Seconds of unpaused play; the late-drop grace window is measured on it.
  clock: 0,
  held: null,
  mg: null,
  score: 0,
  lives: RULES.lives,
  streak: 0,
  turn: null,
  // The last turn that cost a heart, kept for a moment in case its plushie drops in late.
  late: null,
  assisted: false,
  result: null,
  level: 1,
  // The level a clear in this run opened, if any.
  unlocked: null,
  bag: [],
};

export const STATE_SFX = {
  drop: () => sfx.drop(),
  close: () => sfx.clack(),
  lift: () => sfx.lift(),
  release: () => sfx.release(),
};
export function setState(state) {
  if (state !== game.state) STATE_SFX[state]?.();
  game.state = state;
  game.t = 0;
}

export function startGame() {
  // Leaving the end screen without typing a name still keeps the score.
  if (game.result) submitName("PLAYER");
  fetchWorld();
  sfx.coinIn();
  setMusicLevel(1);
  showReel(false);
  overlayEl.hidden = true;
  setMode("play");
  Object.assign(game, {
    score: 0,
    lives: RULES.lives,
    streak: 0,
    held: null,
    mg: null,
    turn: null,
    late: null,
    // Fixed for the whole run: switching aim assist restarts the run.
    assisted: settings.aimAssist,
    // The level this run is played on; its scores go on that level's boards.
    level: currentLevel().id,
    result: null,
    unlocked: null,
    bag: [],
  });
  renderBag();
  resetScore();
  claw.closing = false;
  drawMarquee(marqueeFor(currentLevel()));
  restock();
  setState("home");
  renderHud();
}

export function awardPrize(plush) {
  if (game.mode !== "play") return;
  const perfect =
    plush === game.held && game.mg?.result === "caught" && game.mg.perfect;
  // A plushie that bounced off the chute guard and dropped in after its turn was judged a miss:
  // hand back the heart and the streak, and credit the prize to that turn after all.
  const late = !game.turn && lateDropCounts(game.late, game.clock) && game.late;
  if (late) {
    game.late = null;
    game.lives = Math.min(RULES.lives, game.lives + late.cost);
    game.streak = late.streak;
    flashHearts("heal");
    if (game.state === "grace") setState("aim");
  }
  const turn = game.turn ?? late?.turn;
  const mult = streakMult();
  const pts = prizePoints(plush.tier.points, perfect, mult);
  game.score += pts;
  game.streak++;
  // The first prize of a grab heals half a heart, up to the full five.
  let healed = false;
  if (turn && turn.prizes++ === 0 && game.lives < RULES.lives) {
    game.lives = Math.min(RULES.lives, game.lives + RULES.catchHeal);
    healed = true;
    flashHearts("heal");
  }
  const tags = [
    // Pets go by their names.
    (plush.tier.pet
      ? plush.tier.name
      : `${plush.tier.name} ${plush.animal.name}`
    ).toUpperCase(),
    plush.animal.tag,
    late && "SAVED!",
    perfect && "PERFECT x1.5",
    mult > 1 && `STREAK x${mult}`,
    healed && `+&frac12; ${heartSvg("inline")}`,
  ].filter(Boolean);
  const prize = {
    tier: plush.tier,
    animal: plush.animal,
    fresh: collect(plush),
  };
  if (prize.fresh) tags.push("NEW!");
  game.bag.push(prize);
  flyToBag(plush, prize);
  // Pets aren't in TIERS; they carry their own rank.
  const rank = plush.tier.rank ?? TIERS.indexOf(plush.tier);
  sfx.prize(rank, game.streak - 1);
  if (prize.fresh) sfx.fresh();
  if (healed) sfx.heal();
  popup(`+${fmt(pts)}`, tags.join(" · "), plush.tier.ui ?? plush.tier.css);
  const [px, py] = popupPoint();
  burst(px, py, 10 + rank * 8, 0.8);
  bumpScore();
  renderHud();
}

export function loseLife(cost, why) {
  game.lives = Math.max(0, game.lives - cost);
  game.streak = 0;
  popup(
    `-${cost === 0.5 ? "&frac12;" : cost} ${heartSvg("inline")}`,
    why,
    "#f7a8b8",
  );
  flashHearts("hurt");
  sfx.hurt(cost >= 1);
  renderHud();
}

export function flashHearts(kind) {
  heartsEl.classList.remove("hurt", "heal");
  void heartsEl.offsetWidth;
  heartsEl.classList.add(kind);
}

export const cashOutBonus = () => bonusForLives(game.lives);

export function endTurn() {
  const turn = game.turn;
  game.held = null;
  game.mg = null;
  game.turn = null;
  game.late = null;
  const penalty = turnPenalty(turn);
  if (penalty) {
    game.late = {
      turn,
      cost: penalty.cost,
      streak: game.streak,
      at: game.clock,
    };
    loseLife(penalty.cost, penalty.why);
  }
  if (!plushies.length) return clearMachine();
  // Out of hearts: hold the game over for the grace window in case something still drops in.
  if (game.lives <= 0) return setState("grace");
  setState("aim");
}

export function clearMachine() {
  const bonus = clearBonus(game.lives);
  game.score += bonus;
  setMode("clear");
  setState("idle");
  drawMarquee("CLEARED!");
  popup("CLEARED!", `BONUS +${fmt(bonus)}`, "#ffd75e", true);
  bumpScore();
  const [px, py] = popupPoint();
  burst(px, py, 120, 1.3);
  setTimeout(() => burst(innerWidth * 0.2, innerHeight * 0.6, 80, 1.4), 500);
  setTimeout(() => burst(innerWidth * 0.8, innerHeight * 0.6, 80, 1.4), 900);
  rain(260);
  sfx.cleared();
  const opened = (game.unlocked = markCleared(currentLevel()));
  if (opened)
    setTimeout(
      () => popup(`LEVEL ${opened.id} UNLOCKED!`, opened.name, "#ffd75e", true),
      1800,
    );
  setTimeout(() => gameOver("cleared", bonus), 3600);
}

// How a run ends: "lost" (out of hearts), "cleared" (machine empty) or "quit" (cashed out).
export function gameOver(end, bonus = 0) {
  const cleared = end === "cleared";
  setMode("over");
  if (end === "lost") setState("idle");
  if (end === "quit") {
    // Whatever is in the claw is forfeit; open up and park over the chute.
    game.held = null;
    game.mg = null;
    game.turn = null;
    game.late = null;
    showReel(false);
    setState("home");
    game.score += bonus;
    if (bonus) popup("CASHED OUT", `HEARTS +${fmt(bonus)}`, "#ffd75e", true);
    bumpScore();
  }
  game.result = {
    cleared,
    level: game.level,
    unlocked: cleared ? game.unlocked : null,
    quit: end === "quit",
    bonus,
    assisted: game.assisted,
    score: game.score,
    highscore: makesBoard(game.score) || makesWorld(game.score),
    top: game.score > (loadScores()[0]?.score ?? 0),
    saved: false,
  };
  if (game.result.highscore) rain(cleared ? 160 : 90);
  setMusicLevel(0.4);
  if (!cleared)
    (game.result.highscore
      ? sfx.fanfare
      : end === "quit"
        ? sfx.cashOut
        : sfx.lost)();
  renderOver();
  renderHud();
}

export const horizDist = (b) =>
  Math.hypot(b.position.x - hub.position.x, b.position.z - hub.position.z);
export const isHeld = (plush) =>
  plushies.includes(plush) &&
  plush.body.position.y > 2.6 &&
  horizDist(plush.body) < 1.4;

export function findHeldPlush() {
  let best = null;
  for (const b of plushies) {
    if (isHeld(b) && (!best || b.body.position.y > best.body.position.y))
      best = b;
  }
  return best;
}

// The real cabinet stops the drop when the cable goes slack. Here: the hub lands on a prize,
// a prong hits the floor, or a prong is splayed open by what it landed on.
export function dropBlocked() {
  if (hub.position.y <= CLAW.minY) return true;
  for (const c of world.contacts) {
    const pair = [c.bi, c.bj];
    if (pair.includes(hub)) {
      const other = pair.find((b) => b !== hub);
      if (other.position.y < hub.position.y - 0.1) return true;
    }
    const prong = pair.find((b) => prongBodies.has(b));
    // Only the floor and the chute guard count. Near the glass the open prongs graze the walls,
    // which used to stop the drop at the very top once the last plushies had drifted to the edges.
    const ground = pair.find(
      (b) => b.type === CANNON.Body.STATIC && b.position.y < 1,
    );
    if (prong && ground) return true;
  }
  return prongs.some((p) => p.angle > CLAW.openAngle + 0.25);
}

// Opening the prongs isn't always enough: a plushie wedged between them used to ride along forever,
// trip dropBlocked() on every later drop and turn each grab into a short one. On release, anything
// still in the claw stops colliding with it until it has fallen clear.
export function letGo() {
  for (const b of plushies) {
    if (horizDist(b.body) < 1.5 && b.body.position.y > 1.5) {
      b.body.collisionFilterMask = G_STATIC | G_PRIZE | G_WALL;
      b.ghost = true;
    }
  }
}
export function restoreGhosts() {
  for (const b of plushies) {
    if (
      b.ghost &&
      (b.body.position.y < hub.position.y - 2.4 || horizDist(b.body) > 1.8)
    ) {
      b.body.collisionFilterMask = PRIZE_MASK;
      b.ghost = false;
    }
  }
}

export function steerTo(v, tx, tz, speed, dt) {
  const dx = tx - hub.position.x;
  const dz = tz - hub.position.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.01) return true;
  const s = Math.min(speed, d / dt);
  v.x = (dx / d) * s;
  v.z = (dz / d) * s;
  return false;
}

export function tick(dt) {
  game.t += dt;
  game.clock += dt;
  const v = hub.velocity;
  v.set(0, 0, 0);
  switch (game.state) {
    case "home":
      claw.closing = false;
      if (hub.position.y < CLAW.topY - 0.01)
        v.y = Math.min(CLAW.liftSpeed, (CLAW.topY - hub.position.y) / dt);
      else if (steerTo(v, CHUTE.x, CHUTE.z, CLAW.moveSpeed, dt))
        setState("settle");
      break;
    case "settle":
      claw.closing = false;
      if (game.t > 1.5 && game.mode === "play") setState("aim");
      break;
    case "aim": {
      const ix = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
      const iz = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      const clampAxis = (pos, vel) =>
        Math.max(
          (-CLAW.reach - pos) / dt,
          Math.min((CLAW.reach - pos) / dt, vel),
        );
      if (dragTarget && !ix && !iz) {
        // The claw follows the finger, but at gantry speed so the physics stays sane.
        steerTo(v, dragTarget.x, dragTarget.z, CLAW.moveSpeed * 2, dt);
      } else {
        v.x = clampAxis(hub.position.x, ix * CLAW.moveSpeed);
        v.z = clampAxis(hub.position.z, iz * CLAW.moveSpeed);
      }
      if (pressed.Space) {
        game.late = null;
        game.turn = { kind: "miss", prizes: 0, result: null };
        setState("drop");
      }
      break;
    }
    case "drop":
      v.y = -Math.min(CLAW.dropSpeed, (hub.position.y - CLAW.minY) / dt);
      if (game.t > 0.1 && dropBlocked()) setState("close");
      break;
    case "close":
      claw.closing = true;
      // Hold tight on the way up; the reel meter only takes over once the plushie is at the top.
      claw.torque = GRIP.max;
      if (game.t > CLAW.closeTime) setState("lift");
      break;
    case "lift":
      v.y = Math.min(CLAW.liftSpeed, (CLAW.topY - hub.position.y) / dt);
      if (hub.position.y >= CLAW.topY - 0.01) setState("top");
      break;
    case "top":
      if (game.t > CLAW.topPause) {
        const plush = findHeldPlush();
        if (plush) startReel(plush);
        else {
          // Nothing to carry, so no trip to the chute: open up and aim again from right here.
          sfx.empty();
          claw.closing = false;
          endTurn();
        }
      }
      break;
    case "reel":
      stepReel(dt);
      break;
    case "return":
      if (steerTo(v, CHUTE.x, CHUTE.z, CLAW.moveSpeed * 0.8, dt)) {
        claw.closing = false;
        letGo();
        setState("release");
      }
      break;
    case "release": {
      // Give whatever we let go of time to land before judging the turn. A plushie can bounce off
      // the chute guard or the glass and roll around the hole for a while, so wait until nothing
      // near the chute is moving (or settleMax runs out) rather than a fixed delay.
      const busy = chuteBusy(plushies.map((b) => b.body));
      if (game.t > CLAW.releaseTime && (!busy || game.t > RULES.settleMax))
        endTurn();
      break;
    }
    case "grace":
      if (game.t > RULES.lateGrace) gameOver("lost");
      break;
  }

  restoreGhosts();
  for (const b of [...plushies]) {
    if (b.body.position.y < -1.5) {
      awardPrize(b);
      removePlush(b);
      renderHud();
    }
  }
  for (const k in pressed) delete pressed[k];
}
