// Level 2's prizes: plush arcade cabinets and plush customers. Same parts as the animals (see
// animals.js); the tier colours the cabinet body or the customer's shirt. Customers walk, and
// each one gets a skin tone and hair colour of its own when it is stocked.
import { FLAT, both, eyes, part } from "./animals.js";

// Yarn colours for people. plushies.js turns each key into a material.
const SKIN = [0xf6d7c3, 0xeac0a0, 0xd5a07a, 0xb07a52, 0x8a5a3c, 0x5c3a26];
const HAIR = [0x1f1a17, 0x3d2817, 0x6b4423, 0x8c3b1f, 0xd9b26f, 0xb5562a];
const GRAY = [0xb9b4ad, 0xe6e2dc, 0x8f8a84];
const palette = (name, list) =>
  Object.fromEntries(list.map((c, i) => [`${name}${i}`, c]));
export const LOOKS = {
  ...palette("skin", SKIN),
  ...palette("hair", HAIR),
  ...palette("gray", GRAY),
};
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const keys = (name, list) => list.map((_, i) => `${name}${i}`);
const dress = (hair) => () => ({
  skin: pick(keys("skin", SKIN)),
  hair: pick(hair === "gray" ? keys("gray", GRAY) : keys("hair", HAIR)),
});

// A grown-up: feet at y = -0.73, top of the head at 0.74.
const grownUp = () => [
  ...both((s) => part("denim", 0.1, 0.1 * s, -0.42, 0, { s: [1, 2.4, 1] })),
  ...both((s) =>
    part("sole", 0.1, 0.1 * s, -0.68, 0.04, { s: [1, 0.55, 1.5] }),
  ),
  part("fur", 0.27, 0, -0.02, 0, { s: [1, 1.2, 0.8] }),
  ...both((s) =>
    part("fur", 0.085, 0.32 * s, -0.02, 0, {
      s: [1, 2.6, 1],
      rot: [0, 0, 0.18 * s],
    }),
  ),
  ...both((s) => part("skin", 0.075, 0.37 * s, -0.26, 0.02)),
  part("skin", 0.24, 0, 0.5, 0, { solid: true }),
  part("pink", 0.03, 0, 0.42, 0.23, { s: FLAT }),
  part("fur", 0.2, 0, -0.52, 0, { visible: false }),
];

export const ARCADE = [
  {
    name: "Cabinet",
    icon: "cabinet",
    upright: true,
    parts: [
      part("fur", 1, 0, 0, 0, { box: true, s: [0.36, 0.62, 0.3] }),
      part("cream", 1, 0, 0.52, 0.3, { box: true, s: [0.3, 0.07, 0.025] }),
      part("screen", 1, 0, 0.24, 0.3, { box: true, s: [0.27, 0.17, 0.02] }),
      part("accent", 1, 0, -0.02, 0.4, {
        box: true,
        s: [0.34, 0.04, 0.12],
        rot: [0.35, 0, 0],
      }),
      part("dark", 0.055, -0.13, 0.05, 0.42),
      part("pink", 0.04, 0.07, 0.04, 0.43, { s: [1, 0.6, 1] }),
      part("beak", 0.04, 0.17, 0.04, 0.42, { s: [1, 0.6, 1] }),
      part("accent", 1, 0, -0.36, 0.31, { box: true, s: [0.12, 0.1, 0.015] }),
      part("fur", 0.33, 0, -0.3, 0, { visible: false }),
      part("fur", 0.33, 0, 0.28, 0, { visible: false }),
    ],
  },
  {
    name: "Pinball",
    icon: "pinball",
    upright: true,
    parts: [
      part("fur", 1, 0, 0.02, 0, {
        box: true,
        s: [0.32, 0.1, 0.55],
        rot: [0.1, 0, 0],
      }),
      part("screen", 1, 0, 0.12, 0, {
        box: true,
        s: [0.28, 0.01, 0.5],
        rot: [0.1, 0, 0],
      }),
      part("pink", 0.06, -0.1, 0.17, -0.15),
      part("beak", 0.06, 0.1, 0.18, -0.25),
      part("cream", 0.06, 0.02, 0.15, 0.02),
      part("fur", 1, 0, 0.42, -0.5, { box: true, s: [0.32, 0.24, 0.07] }),
      part("screen", 1, 0, 0.44, -0.42, { box: true, s: [0.26, 0.18, 0.01] }),
      ...[0.47, -0.47].flatMap((z) =>
        both((s) =>
          part("sole", 1, 0.27 * s, -0.3, z, {
            box: true,
            s: [0.035, 0.24, 0.035],
          }),
        ),
      ),
      part("fur", 0.3, 0, -0.22, 0.27, { visible: false }),
      part("fur", 0.3, 0, -0.22, -0.27, { visible: false }),
      part("fur", 0.22, 0, 0.4, -0.48, { visible: false }),
    ],
  },
  {
    // A claw machine in the claw machine.
    name: "Claw",
    icon: "claw",
    upright: true,
    parts: [
      part("fur", 1, 0, -0.36, 0, { box: true, s: [0.36, 0.24, 0.36] }),
      part("glass", 1, 0, 0.16, 0, { box: true, s: [0.34, 0.28, 0.34] }),
      part("fur", 1, 0, 0.52, 0, { box: true, s: [0.37, 0.08, 0.37] }),
      part("cream", 1, 0, 0.52, 0.375, { box: true, s: [0.3, 0.05, 0.01] }),
      ...[0.34, -0.34].flatMap((z) =>
        both((s) =>
          part("accent", 1, 0.34 * s, 0.16, z, {
            box: true,
            s: [0.03, 0.28, 0.03],
          }),
        ),
      ),
      part("pink", 0.1, 0.12, -0.03, 0.08),
      part("beak", 0.09, -0.12, -0.04, -0.06),
      part("cream", 0.08, -0.05, -0.05, 0.15),
      part("dark", 1, 0, 0.41, 0, { box: true, s: [0.008, 0.04, 0.008] }),
      part("dark", 0.04, 0, 0.36, 0),
      part("dark", 1, -0.22, -0.3, 0.365, {
        box: true,
        s: [0.08, 0.06, 0.01],
      }),
      part("fur", 0.36, 0, -0.25, 0, { visible: false }),
      part("fur", 0.34, 0, 0.25, 0, { visible: false }),
    ],
  },
  {
    name: "Kid",
    icon: "kid",
    upright: true,
    walks: true,
    dress: dress("young"),
    parts: [
      ...both((s) =>
        part("denim", 0.09, 0.09 * s, -0.38, 0, { s: [1, 1.8, 1] }),
      ),
      ...both((s) =>
        part("sole", 0.09, 0.09 * s, -0.56, 0.04, { s: [1, 0.55, 1.5] }),
      ),
      part("fur", 0.23, 0, -0.05, 0, { s: [1, 1.1, 0.85] }),
      ...both((s) =>
        part("fur", 0.075, 0.27 * s, -0.05, 0, {
          s: [1, 2.2, 1],
          rot: [0, 0, 0.18 * s],
        }),
      ),
      ...both((s) => part("skin", 0.065, 0.31 * s, -0.24, 0.02)),
      part("accent", 1, 0, -0.02, -0.22, { box: true, s: [0.16, 0.18, 0.08] }),
      part("skin", 0.25, 0, 0.42, 0, { solid: true }),
      part("hair", 0.26, 0, 0.52, -0.05, { s: [1.05, 0.75, 1] }),
      part("hair", 0.1, 0, 0.6, 0.17, { s: [2.2, 0.6, 0.8] }),
      ...eyes(0.085, 0.45, 0.23),
      part("pink", 0.025, 0, 0.35, 0.235, { s: FLAT }),
      part("fur", 0.17, 0, -0.42, 0, { visible: false }),
    ],
  },
  {
    name: "Teen",
    icon: "teen",
    upright: true,
    walks: true,
    dress: dress("young"),
    parts: [
      ...grownUp(),
      part("hair", 0.25, 0, 0.58, -0.05, { s: [1.04, 0.78, 1.02] }),
      part("hair", 0.09, 0, 0.68, 0.16, { s: [2.4, 0.6, 0.8] }),
      part("hair", 0.1, 0, 0.42, -0.3, { s: [0.9, 1.8, 0.9] }),
      part("pink", 0.045, 0, 0.58, -0.27),
      ...eyes(0.08, 0.53, 0.22),
      // Headphones: a thin disc around the head shows only as the band, plus two cups.
      part("dark", 0.29, 0, 0.5, 0, { s: [1, 1, 0.14] }),
      ...both((s) => part("dark", 0.08, 0.27 * s, 0.5, 0, { s: [0.6, 1, 1] })),
    ],
  },
  {
    name: "Grandpa",
    icon: "grandpa",
    upright: true,
    walks: true,
    dress: dress("gray"),
    parts: [
      ...grownUp(),
      ...both((s) =>
        part("hair", 0.1, 0.21 * s, 0.5, -0.06, { s: [0.8, 1, 1.2] }),
      ),
      part("hair", 0.2, 0, 0.47, -0.15, { s: [1, 0.6, 0.6] }),
      part("hair", 0.07, 0, 0.43, 0.22, { s: [2, 0.6, 0.7] }),
      ...eyes(0.085, 0.53, 0.22),
      ...both((s) =>
        part("glass", 0.065, 0.085 * s, 0.53, 0.235, { s: [1, 1, 0.3] }),
      ),
      part("dark", 1, 0, 0.54, 0.24, { box: true, s: [0.03, 0.008, 0.008] }),
      part("accent", 0.05, 0, 0.27, 0.2, { s: [1.6, 0.8, 0.6] }),
      part("sole", 1, 0.44, -0.38, 0.1, { box: true, s: [0.02, 0.32, 0.02] }),
    ],
  },
];
