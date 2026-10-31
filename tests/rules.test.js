import { test } from "node:test";
import assert from "node:assert/strict";
import { CHUTE, RULES } from "../src/game/config.js";
import {
  cashOutBonus,
  chuteBusy,
  clearBonus,
  cleanName,
  lateDropCounts,
  levelUnlocked,
  makesList,
  musicDrive,
  overHole,
  prizePoints,
  streakMult,
  turnPenalty,
} from "../src/game/rules.js";

const body = (x, y, z, vx = 0, vy = 0, vz = 0) => ({
  position: { x, y, z },
  velocity: { x: vx, y: vy, z: vz },
});

test("streaks climb by half and cap at x3", () => {
  assert.equal(streakMult(0), 1);
  assert.equal(streakMult(1), 1.5);
  assert.equal(streakMult(4), RULES.streakMax);
  assert.equal(streakMult(40), RULES.streakMax);
});

test("prize points apply the perfect bonus and the streak", () => {
  assert.equal(prizePoints(100, false, 1), 100);
  assert.equal(prizePoints(100, true, 1), 150);
  assert.equal(prizePoints(25, true, 1.5), 56);
});

test("hearts pay out per half heart, and clearing pays per heart", () => {
  assert.equal(cashOutBonus(5), 10 * RULES.cashOutPerHalf);
  assert.equal(cashOutBonus(2.5), 5 * RULES.cashOutPerHalf);
  assert.equal(clearBonus(3), RULES.clearBonus + 3 * RULES.heartBonus);
});

test("a turn costs nothing once it wins a prize", () => {
  assert.equal(turnPenalty(null), null);
  assert.equal(
    turnPenalty({ kind: "reel", prizes: 1, result: "slipped" }),
    null,
  );
});

test("a turn that won nothing costs by how it failed", () => {
  assert.equal(turnPenalty({ kind: "miss", prizes: 0 }).cost, RULES.missCost);
  assert.equal(
    turnPenalty({ kind: "reel", prizes: 0, result: "escaped" }).cost,
    RULES.failCost,
  );
  assert.equal(
    turnPenalty({ kind: "reel", prizes: 0, result: "caught" }).cost,
    RULES.dropCost,
  );
});

test("the chute is busy while a plushie rolls near the hole", () => {
  // Bounced off the guard, rolling on the felt next to the hole: the turn must wait.
  const rolling = body(-1.4, 0.4, 2.2, -0.8, 0, 0.3);
  assert.equal(chuteBusy([rolling]), true);
});

test("the chute is busy while anything sits over the hole", () => {
  const dropping = body(CHUTE.x, 0.2, CHUTE.z);
  assert.equal(overHole(dropping.position), true);
  assert.equal(chuteBusy([dropping]), true);
});

test("the chute is quiet once everything near it has settled", () => {
  const resting = body(-1.4, 0.4, 2.2, 0.05, 0, 0.02);
  // Moving fast, but at the far corner of the machine: not the chute's business.
  const farAway = body(2.7, 0.4, -2.7, 3, 0, 3);
  assert.equal(chuteBusy([resting, farAway]), false);
});

test("a plushie resting on top of the chute guard does not hold the turn", () => {
  const onGuard = body(-CHUTE.edge, 1.4, 2.4);
  assert.equal(chuteBusy([onGuard]), false);
});

test("a late drop only counts within the grace window", () => {
  const late = { at: 10, cost: 0.5 };
  assert.equal(lateDropCounts(null, 10), false);
  assert.equal(lateDropCounts(late, 10 + RULES.lateGrace - 0.1), true);
  assert.equal(lateDropCounts(late, 10 + RULES.lateGrace + 0.1), false);
});

test("names are cleaned for the boards", () => {
  assert.equal(cleanName("  ada <3 lovelace!!  "), "ADA 3 LOVE");
  assert.equal(cleanName("<script>"), "SCRIPT");
  for (const typed of ["mikaela", "MIKAELA", "Mikaela", "mIkAeLa", " Mikaéla "])
    assert.equal(cleanName(typed), "MIKAELA");
});

test("a score makes a list when there is room or it beats the last", () => {
  const list = [{ score: 300 }, { score: 200 }];
  assert.equal(makesList(list, 3, 10), true);
  assert.equal(makesList(list, 2, 150), false);
  assert.equal(makesList(list, 2, 250), true);
  assert.equal(makesList([], 5, 0), false);
});

test("the music starts relaxed with a full machine", () => {
  const d = musicDrive(15, 15);
  assert.equal(d.intensity, 0);
  assert.equal(d.tempo, 1);
  assert.equal(d.busyHats || d.pushKick || d.doubleLead, false);
});

test("the music gets faster and fuller as plushies run out", () => {
  const half = musicDrive(8, 15);
  const last = musicDrive(1, 15);
  assert.ok(half.tempo > 1 && last.tempo > half.tempo);
  assert.equal(half.busyHats, true);
  assert.equal(half.doubleLead, false);
  assert.equal(last.pushKick && last.doubleLead, true);
  assert.ok(last.tempo <= 1.3);
});

test("music drive never leaves 0..1, even with odd counts", () => {
  assert.equal(musicDrive(20, 15).intensity, 0);
  assert.equal(musicDrive(-3, 15).intensity, 1);
  assert.equal(musicDrive(0, 0).intensity, 0);
});

test("a level opens once the one before it is cleared, and placeholders never do", () => {
  const levels = [{ id: 1 }, { id: 2 }, { id: 3, soon: true }];
  assert.equal(levelUnlocked(levels, new Set(), 1), true);
  assert.equal(levelUnlocked(levels, new Set(), 2), false);
  assert.equal(levelUnlocked(levels, new Set([1]), 2), true);
  assert.equal(levelUnlocked(levels, new Set([1, 2]), 3), false);
  assert.equal(levelUnlocked(levels, new Set([1]), 9), false);
});
