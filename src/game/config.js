// ---------- tuning ----------

// Interior is x,z in [-4, 4], floor top at y = 0. The chute is the -x/+z corner.
export const CHUTE = { x: -2.9, z: 2.9, edge: 1.8 };
export const CLAW = {
  topY: 7.4,
  minY: 1.5,
  reach: 3.1,
  moveSpeed: 3.2,
  dropSpeed: 3.8,
  liftSpeed: 2.6,
  openAngle: 0.6,
  closedAngle: -0.22,
  openTorque: 14,
  kp: 120,
  kd: 6,
  closeTime: 1.1,
  topPause: 0.5,
  releaseTime: 1.4,
};
// Prong torque. The reel meter (0..1) maps onto this range while the plushie is in the air.
export const GRIP = { min: 18, max: 38 };
export const gripAt = (p) => GRIP.min + (GRIP.max - GRIP.min) * p;

export const MG = {
  gravity: 1.4,
  lift: 2.4,
  bounce: 0.35,
  fillRate: 0.15,
  drainRate: 0.04,
  startProgress: 0.4,
  timeLimit: 20,
  // Scales how fast the plushie moves; below 1 makes every plushie lazier.
  bearSpeed: 0.45,
};

export const RULES = {
  lives: 5,
  missCost: 0.5,
  failCost: 1,
  dropCost: 0.5,
  perfectBonus: 0.5,
  streakStep: 0.5,
  streakMax: 3,
  clearBonus: 500,
  heartBonus: 100,
  catchHeal: 0.5,
  cashOutPerHalf: 25,
  // The turn is judged once nothing near the chute moves faster than this (or after settleMax s).
  settleSpeed: 0.35,
  settleMax: 6,
  // A plushie that still drops in this long after a turn was penalised refunds the heart.
  lateGrace: 2.5,
};

// Colour is the tier: it sets the reel difficulty and the points. `count` is how many get stocked.
export const TIERS = [
  {
    name: "Mint",
    color: 0xa8e6cf,
    points: 10,
    behaviors: ["smooth"],
    difficulty: 15,
    barHeight: 0.55,
    count: 5,
  },
  {
    name: "Sky",
    color: 0xa7c7e7,
    points: 25,
    behaviors: ["smooth", "mixed"],
    difficulty: 25,
    barHeight: 0.52,
    count: 4,
  },
  {
    name: "Lilac",
    color: 0xc9b6e4,
    points: 50,
    behaviors: ["mixed"],
    difficulty: 35,
    barHeight: 0.5,
    count: 3,
  },
  {
    name: "Peach",
    color: 0xffc59e,
    points: 100,
    behaviors: ["mixed", "floater"],
    difficulty: 45,
    barHeight: 0.47,
    count: 2,
  },
  {
    name: "Cherry",
    color: 0xf07470,
    points: 250,
    behaviors: ["mixed", "dart"],
    difficulty: 60,
    barHeight: 0.44,
    count: 1,
  },
];
for (const t of TIERS) t.css = `#${t.color.toString(16).padStart(6, "0")}`;
