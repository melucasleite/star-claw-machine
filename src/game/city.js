// Level 3's prizes: the city around the arcade, in plush. Buildings (the arcade itself, a tower,
// a café), traffic (a taxi and a bus that drive about) and a pigeon that hops. The tier colours
// the building, the car body or the bird. Same parts as the animals (see animals.js).
import { both, eyes, part } from "./animals.js";

// Four wheels under a vehicle `len` long (z) and `w` wide (x), sitting on y = `y`.
const wheels = (w, len, y, r) =>
  [len, -len].flatMap((z) =>
    both((s) => part("dark", r, w * s, y, z, { s: [0.6, 1, 1] })),
  );
const lights = (w, z, y, mat) =>
  both((s) => part(mat, 0.04, w * s, y, z, { s: [1, 1, 0.5] }));

export const CITY = [
  {
    // The arcade from level 2, now just one building on the block.
    name: "Arcade",
    icon: "hall",
    upright: true,
    parts: [
      part("fur", 1, 0, -0.1, 0, { box: true, s: [0.4, 0.5, 0.36] }),
      part("accent", 1, 0, 0.42, 0, { box: true, s: [0.44, 0.05, 0.4] }),
      part("screen", 1, 0, 0.24, 0.37, { box: true, s: [0.34, 0.1, 0.03] }),
      part("dark", 1, 0, -0.42, 0.37, { box: true, s: [0.11, 0.18, 0.02] }),
      ...both((s) =>
        part("cream", 1, 0.24 * s, -0.08, 0.37, {
          box: true,
          s: [0.08, 0.09, 0.02],
        }),
      ),
      part("fur", 0.36, 0, -0.3, 0, { visible: false }),
      part("fur", 0.34, 0, 0.15, 0, { visible: false }),
    ],
  },
  {
    name: "Tower",
    icon: "tower",
    upright: true,
    parts: [
      part("fur", 1, 0, 0, 0, { box: true, s: [0.3, 0.75, 0.3] }),
      ...[-0.5, -0.25, 0, 0.25, 0.5].flatMap((y) =>
        both((s) =>
          part("cream", 1, 0.12 * s, y, 0.31, {
            box: true,
            s: [0.06, 0.07, 0.02],
          }),
        ),
      ),
      part("accent", 1, 0, 0.8, 0, { box: true, s: [0.24, 0.06, 0.24] }),
      part("dark", 1, 0, 1.0, 0, { box: true, s: [0.015, 0.18, 0.015] }),
      part("pink", 0.045, 0, 1.19, 0),
      part("fur", 0.3, 0, -0.45, 0, { visible: false }),
      part("fur", 0.3, 0, 0.05, 0, { visible: false }),
      part("fur", 0.28, 0, 0.5, 0, { visible: false }),
    ],
  },
  {
    // A corner café with a striped awning.
    name: "Cafe",
    icon: "cafe",
    upright: true,
    parts: [
      part("fur", 1, 0, -0.18, 0, { box: true, s: [0.4, 0.42, 0.34] }),
      ...[-0.32, -0.16, 0, 0.16, 0.32].map((x, i) =>
        part(i % 2 ? "accent" : "cream", 1, x, 0.1, 0.42, {
          box: true,
          s: [0.08, 0.02, 0.12],
          rot: [0.5, 0, 0],
        }),
      ),
      part("glass", 1, -0.08, -0.16, 0.35, {
        box: true,
        s: [0.22, 0.14, 0.02],
      }),
      part("dark", 1, 0.27, -0.44, 0.35, { box: true, s: [0.07, 0.16, 0.02] }),
      part("cream", 1, 0, 0.33, 0.1, { box: true, s: [0.3, 0.08, 0.03] }),
      // A coffee cup on the sign.
      part("cream", 0.07, 0.22, 0.47, 0.1, { s: [1, 1.2, 1] }),
      part("fur", 0.34, 0, -0.3, 0, { visible: false }),
      part("fur", 0.3, 0, 0.08, 0, { visible: false }),
    ],
  },
  {
    // Drives about the block. Forward is +z.
    name: "Taxi",
    icon: "taxi",
    upright: true,
    walks: { speed: 0.35, straight: true },
    parts: [
      part("fur", 1, 0, -0.3, 0, { box: true, s: [0.32, 0.13, 0.55] }),
      part("accent", 1, 0, -0.3, 0, { box: true, s: [0.326, 0.025, 0.5] }),
      part("fur", 1, 0, -0.05, -0.05, { box: true, s: [0.28, 0.12, 0.3] }),
      part("screen", 1, 0, -0.04, 0.26, { box: true, s: [0.25, 0.07, 0.01] }),
      ...both((s) =>
        part("screen", 1, 0.285 * s, -0.04, -0.05, {
          box: true,
          s: [0.01, 0.07, 0.22],
        }),
      ),
      part("beak", 1, 0, 0.1, -0.05, { box: true, s: [0.1, 0.05, 0.05] }),
      ...wheels(0.3, 0.33, -0.45, 0.1),
      ...lights(0.2, 0.56, -0.3, "cream"),
      ...lights(0.2, -0.56, -0.3, "pink"),
      part("fur", 0.26, 0, -0.3, 0.28, { visible: false }),
      part("fur", 0.26, 0, -0.3, -0.28, { visible: false }),
    ],
  },
  {
    name: "Bus",
    icon: "bus",
    upright: true,
    walks: { speed: 0.25, straight: true },
    parts: [
      part("fur", 1, 0, -0.15, 0, { box: true, s: [0.32, 0.3, 0.7] }),
      part("screen", 1, 0, 0, -0.02, { box: true, s: [0.325, 0.08, 0.6] }),
      part("screen", 1, 0, 0, 0.705, { box: true, s: [0.28, 0.1, 0.01] }),
      part("accent", 1, 0, 0.17, 0, { box: true, s: [0.3, 0.03, 0.66] }),
      part("dark", 1, 0.325, -0.22, 0.45, { box: true, s: [0.01, 0.16, 0.08] }),
      part("cream", 1, 0, 0.11, 0.71, { box: true, s: [0.2, 0.035, 0.01] }),
      ...wheels(0.3, 0.45, -0.48, 0.11),
      ...lights(0.22, 0.71, -0.33, "cream"),
      part("fur", 0.3, 0, -0.28, 0.38, { visible: false }),
      part("fur", 0.3, 0, -0.28, -0.38, { visible: false }),
      part("fur", 0.3, 0, -0.2, 0, { visible: false }),
    ],
  },
  {
    // Hops about pecking at crumbs.
    name: "Pigeon",
    icon: "pigeon",
    upright: true,
    walks: { speed: 0.22, hop: 2.2, wanderMin: 0.8, wanderMax: 2 },
    parts: [
      part("fur", 0.3, 0, 0, 0, { s: [0.85, 0.8, 1.2] }),
      part("fur", 0.17, 0, 0.3, 0.28),
      part("accent", 0.17, 0, 0.17, 0.2, {
        s: [1, 0.7, 0.8],
        solid: false,
      }),
      part("beak", 0.04, 0, 0.27, 0.46, {
        cone: true,
        rot: [Math.PI / 2, 0, 0],
      }),
      ...eyes(0.09, 0.34, 0.4),
      ...both((s) =>
        part("accent", 0.2, 0.24 * s, 0.02, -0.02, { s: [0.25, 0.6, 1] }),
      ),
      part("accent", 1, 0, 0.05, -0.42, {
        box: true,
        s: [0.14, 0.02, 0.16],
        rot: [0.3, 0, 0],
      }),
      ...both((s) =>
        part("beak", 0.04, 0.08 * s, -0.27, 0.06, { s: [1.2, 0.5, 1.6] }),
      ),
    ],
  },
];
