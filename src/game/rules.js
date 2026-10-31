// Pure scoring and turn rules: no DOM, no three.js, no physics world. Unit-tested in tests/.
import { CHUTE, RULES } from "./config.js";

export const streakMult = (streak) =>
  Math.min(RULES.streakMax, 1 + RULES.streakStep * streak);

export const prizePoints = (points, perfect, mult) =>
  Math.round(points * (perfect ? 1 + RULES.perfectBonus : 1) * mult);

// Cashing out pays for the hearts you didn't spend.
export const cashOutBonus = (lives) =>
  Math.round(lives / 0.5) * RULES.cashOutPerHalf;

export const clearBonus = (lives) =>
  RULES.clearBonus + RULES.heartBonus * lives;

// What a turn that won nothing costs, or null when it won something.
export function turnPenalty(turn) {
  if (!turn || turn.prizes > 0) return null;
  if (turn.kind === "miss")
    return { cost: RULES.missCost, why: "MISSED THE GRAB" };
  if (turn.result === "escaped")
    return { cost: RULES.failCost, why: "IT GOT AWAY" };
  return { cost: RULES.dropCost, why: "DROPPED IT" };
}

// A plushie counts as "still in play" at the chute while it moves anywhere near the hole, or sits
// right over it. Bodies are plain { position, velocity } so this works on cannon bodies and in tests.
const NEAR = CHUTE.edge + 1.2;
export const overHole = (p) =>
  p.x < -CHUTE.edge && p.z > CHUTE.edge && p.y < 1.2;
export function chuteBusy(bodies) {
  return bodies.some(({ position: p, velocity: v }) => {
    if (overHole(p)) return true;
    const near = p.x < -CHUTE.edge + NEAR && p.z > CHUTE.edge - NEAR;
    return near && Math.hypot(v.x, v.y, v.z) > RULES.settleSpeed;
  });
}

// A penalised turn can still be rescued by a plushie that drops in a moment later.
export const lateDropCounts = (late, clock) =>
  !!late && clock - late.at <= RULES.lateGrace;

// Any casing, and accents fold to the plain letter (é -> E) rather than vanishing.
export const cleanName = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ._!?-]/g, "")
    .trim()
    .slice(0, 10);

// Does `score` make a sorted (best first) list capped at `size`?
export const makesList = (list, size, score) =>
  score > 0 && (list.length < size || score > list[list.length - 1].score);

// How hard the music pushes as the machine empties: 0 with a full machine, 1 on the last plushie.
// It speeds up by as much as 30% and stacks layers at set points.
export function musicDrive(left, total) {
  const i = total > 0 ? Math.min(1, Math.max(0, 1 - left / total)) : 0;
  return {
    intensity: i,
    tempo: 1 + 0.3 * i,
    busyHats: i >= 0.35,
    pushKick: i >= 0.6,
    doubleLead: i >= 0.8,
  };
}

// A level opens once the one before it has been cleared in a single run. Levels marked `soon`
// are only placeholders and never open. `cleared` is a Set of level ids.
export function levelUnlocked(levels, cleared, id) {
  const i = levels.findIndex((l) => l.id === id);
  if (i < 0 || levels[i].soon) return false;
  return i === 0 || cleared.has(levels[i - 1].id);
}
