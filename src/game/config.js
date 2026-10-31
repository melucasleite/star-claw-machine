// ---------- tuning ----------

// Interior is x,z in [-4, 4], floor top at y = 0. The chute is the -x/+z corner.
export const CHUTE = { x: -2.9, z: 2.9, edge: 1.8 };
export const CLAW = {
  topY: 7.4,
  minY: 1.5,
  // Open prongs reach 1.2 from the hub, so at the edge they poke a little past the glass; the
  // walls don't collide with them (see G_WALL), so that no longer stops the drop.
  reach: 3.25,
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
// The floor is gently dished like a real cabinet's: anything resting this close to the glass
// slides back toward the middle at `speed`, so nothing stays pinned out of the claw's reach.
export const DISH = { edge: 3.2, speed: 0.25, maxY: 1, still: 0.5 };

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

// Our family, for Mikaela's machine: with "OUR FAMILY" on in settings (on once she beats the game,
// or with the FAMILY cheat), level 1 is stocked with nothing but our pets (Ray Ray, Jo Jo and Tom
// Tom the cats, Mojo the husky, Loly and Axis the axolotls) and our fish tank. Each
// stands in for one of the usual
// plushies (`as`) and plays exactly like it, same points and same reel, so the machine is worth
// the same. Their own colours: `belly` and `eyes` override the usual cream and button eyes, `white`
// brightens the belly past the grey the knit texture lays over it, `bright` does the same for the
// fur, `accent` sets the trim (an axolotl's gills), `glow` makes it glow in the dark, and `ui` is a
// colour light enough for text on the dark screens.
export const PETS = [
  { name: "Ray Ray", as: "Mint", animal: "Cat", color: 0xe58a3a },
  {
    name: "Tom Tom",
    as: "Sky",
    animal: "Cat",
    color: 0x2a262e,
    belly: 0x3d3843,
    eyes: 0xd8e04a,
    ui: "#c9c4d4",
  },
  { name: "Jo Jo", as: "Lilac", animal: "Cat", color: 0x8d939b },
  {
    name: "Mojo",
    as: "Mint",
    animal: "Husky",
    color: 0xd9813a,
    belly: 0xffffff,
    white: true,
    eyes: 0x7cc4ff,
  },
  {
    name: "Loly",
    as: "Sky",
    animal: "Axolotl",
    color: 0xf4c6de,
    bright: 1.2,
    accent: 0xff6fae,
  },
  {
    name: "Axis",
    as: "Peach",
    animal: "Axolotl",
    color: 0xf7eef2,
    bright: 1.2,
    accent: 0xff8fc0,
    glow: 0xffc4dc,
  },
  // The fish tank fills the rest of the machine.
  {
    name: "Pom Pom",
    as: "Cherry",
    animal: "Shrimp",
    color: 0xd61f2c,
    belly: 0xffffff,
    white: true,
  },
  {
    name: "Moo Moo",
    as: "Lilac",
    animal: "Gladiator Clown",
    color: 0xff7417,
    accent: 0xe8650f,
    belly: 0xffffff,
    white: true,
  },
  {
    name: "Mia",
    as: "Lilac",
    animal: "Gladiator Clown",
    color: 0xff7f24,
    accent: 0xe8650f,
    belly: 0xffffff,
    white: true,
  },
  {
    name: "Go Go",
    as: "Peach",
    animal: "Fish",
    color: 0xffd21f,
    accent: 0xf2b705,
  },
  {
    name: "Mr Tiger",
    as: "Sky",
    animal: "Tiger Shrimp",
    color: 0xe9a35f,
    accent: 0x4a2a1a,
  },
  ...[
    ["Sky", 0x1f1d22, 0xffffff],
    ["Mint", 0x1f1d22, 0xffffff],
  ].map(([as, color, bands]) => ({
    name: "Fish",
    as,
    animal: "Banded Fish",
    color,
    accent: color === 0x1f1d22 ? 0x2c2a30 : 0xd9d6d0,
    belly: bands,
    white: bands === 0xffffff,
    bright: color === 0xf4f2ee ? 1.15 : undefined,
    eyes: color === 0x1f1d22 ? 0xf2f0e6 : undefined,
    ui: "#e8e6e1",
  })),
  ...[0, 1].map(() => ({
    name: "Fish",
    as: "Mint",
    animal: "Koi Angel",
    color: 0xf6f3ee,
    bright: 1.15,
    accent: 0xf3efe8,
    belly: 0xff7a1f,
    ui: "#ffb27a",
  })),
];
for (const t of PETS) {
  const like = TIERS.find((tier) => tier.name === t.as);
  Object.assign(t, {
    pet: true,
    points: like.points,
    behaviors: like.behaviors,
    difficulty: like.difficulty,
    barHeight: like.barHeight,
    rank: TIERS.indexOf(like),
    css: `#${t.color.toString(16).padStart(6, "0")}`,
  });
}
