// Animals only change the shape. Solid parts are collision spheres too; the rest is decoration.
export const FLAT = [1, 1, 0.6];
export const part = (mat, r, x, y, z, o = {}) => ({
  mat,
  r,
  x,
  y,
  z,
  s: o.s ?? [1, 1, 1],
  rot: o.rot,
  cone: o.cone ?? false,
  // Boxes are drawn only: the physics stays spheres, so give a boxy kind hidden solid spheres.
  box: o.box ?? false,
  solid: o.solid ?? (mat === "fur" && !o.box),
  visible: o.visible ?? true,
});
export const both = (f) => [f(1), f(-1)];
export const eyes = (x, y, z) =>
  both((s) => part("dark", 0.045, x * s, y, z, { s: FLAT }));
export const ANIMALS = [
  {
    name: "Bear",
    icon: "bear",
    parts: [
      part("fur", 0.42, 0, 0, 0),
      part("fur", 0.32, 0, 0.62, 0),
      ...both((s) => part("fur", 0.12, 0.22 * s, 0.9, 0)),
      ...both((s) => part("fur", 0.15, 0.44 * s, 0.12, 0.06)),
      ...both((s) => part("fur", 0.17, 0.22 * s, -0.38, 0.14)),
      part("cream", 0.13, 0, 0.55, 0.26, { s: FLAT }),
      part("dark", 0.05, 0, 0.6, 0.38, { s: FLAT }),
      ...eyes(0.11, 0.7, 0.28),
      part("cream", 0.26, 0, -0.02, 0.24, { s: FLAT }),
    ],
  },
  {
    name: "Cat",
    icon: "cat",
    parts: [
      part("fur", 0.38, 0, 0, 0),
      part("fur", 0.34, 0, 0.6, 0, { s: [1.12, 1, 1] }),
      ...both((s) =>
        part("fur", 0.13, 0.2 * s, 0.93, 0, {
          cone: true,
          rot: [0, 0, -0.3 * s],
          solid: false,
        }),
      ),
      ...both((s) =>
        part("pink", 0.07, 0.2 * s, 0.9, 0.07, {
          cone: true,
          rot: [0, 0, -0.3 * s],
          s: [1, 1, 0.4],
        }),
      ),
      ...both((s) => part("fur", 0.1, 0.2 * s, 0.88, 0, { visible: false })),
      ...both((s) => part("fur", 0.13, 0.36 * s, 0.1, 0.1)),
      ...both((s) => part("fur", 0.15, 0.2 * s, -0.36, 0.14)),
      part("fur", 0.1, 0.2, -0.25, -0.36),
      part("fur", 0.1, 0.32, -0.05, -0.42),
      part("fur", 0.09, 0.36, 0.18, -0.38),
      ...both((s) => part("cream", 0.1, 0.07 * s, 0.52, 0.27, { s: FLAT })),
      part("pink", 0.045, 0, 0.58, 0.33, { s: FLAT }),
      ...eyes(0.13, 0.68, 0.28),
      part("cream", 0.24, 0, -0.02, 0.22, { s: FLAT }),
    ],
  },
  {
    name: "Dog",
    icon: "dog",
    parts: [
      part("fur", 0.4, 0, 0, 0),
      part("fur", 0.33, 0, 0.62, 0),
      part("fur", 0.17, 0, 0.55, 0.3, { s: [1, 0.85, 1] }),
      part("dark", 0.06, 0, 0.6, 0.46),
      ...both((s) =>
        part("accent", 0.12, 0.31 * s, 0.56, 0, { s: [0.85, 1.9, 1.1] }),
      ),
      ...eyes(0.13, 0.73, 0.27),
      ...both((s) => part("fur", 0.15, 0.42 * s, 0.1, 0.08)),
      ...both((s) => part("fur", 0.17, 0.22 * s, -0.38, 0.14)),
      part("fur", 0.09, 0, -0.15, -0.42, { s: [1, 1, 1.6] }),
      part("cream", 0.25, 0, -0.02, 0.24, { s: FLAT }),
    ],
  },
  {
    name: "Bunny",
    icon: "bunny",
    parts: [
      part("fur", 0.38, 0, 0, 0),
      part("fur", 0.31, 0, 0.58, 0),
      ...both((s) =>
        part("fur", 0.09, 0.12 * s, 0.98, -0.02, {
          s: [1, 3, 0.8],
          solid: false,
        }),
      ),
      ...both((s) =>
        part("pink", 0.05, 0.12 * s, 0.98, 0.04, { s: [1, 3.6, 0.5] }),
      ),
      ...both((s) => part("fur", 0.09, 0.12 * s, 0.86, 0, { visible: false })),
      ...both((s) => part("fur", 0.09, 0.12 * s, 1.08, 0, { visible: false })),
      ...eyes(0.12, 0.66, 0.26),
      part("pink", 0.04, 0, 0.57, 0.3, { s: FLAT }),
      ...both((s) => part("cream", 0.08, 0.07 * s, 0.52, 0.26, { s: FLAT })),
      ...both((s) => part("fur", 0.12, 0.33 * s, 0.08, 0.14)),
      ...both((s) =>
        part("fur", 0.16, 0.2 * s, -0.36, 0.18, { s: [1, 0.8, 1.4] }),
      ),
      part("cream", 0.12, 0, -0.15, -0.38),
      part("cream", 0.24, 0, -0.02, 0.22, { s: FLAT }),
    ],
  },
  {
    name: "Axolotl",
    icon: "axolotl",
    parts: [
      part("fur", 0.32, 0, 0, 0.42, { s: [1.25, 0.9, 1] }),
      part("fur", 0.28, 0, -0.03, 0),
      part("fur", 0.24, 0, -0.04, -0.38),
      part("fur", 0.18, 0, -0.02, -0.7, { s: [0.6, 1.2, 1] }),
      part("fur", 0.12, 0, 0, -0.95, { s: [0.5, 1.2, 1] }),
      ...both((s) => part("fur", 0.09, 0.3 * s, -0.18, 0.18)),
      ...both((s) => part("fur", 0.09, 0.26 * s, -0.18, -0.36)),
      ...[
        [0.2, -0.6],
        [0.05, -1.2],
        [-0.1, -1.9],
      ].flatMap(([y, a]) =>
        both((s) =>
          part("accent", 0.06, 0.43 * s, y + 0.05, 0.38, {
            s: [1, 2.6, 1],
            rot: [0, 0, a * s],
          }),
        ),
      ),
      ...eyes(0.2, 0.1, 0.66),
      part("dark", 0.1, 0, -0.07, 0.72, { s: [1.4, 0.18, 0.3] }),
      ...both((s) => part("pink", 0.05, 0.25 * s, -0.05, 0.64, { s: FLAT })),
    ],
  },
  {
    name: "Frog",
    icon: "frog",
    parts: [
      part("fur", 0.4, 0, 0, 0, { s: [1.2, 0.75, 1] }),
      part("fur", 0.33, 0, 0.38, 0.05, { s: [1.25, 0.8, 1] }),
      ...both((s) => part("fur", 0.13, 0.2 * s, 0.64, 0.12)),
      ...both((s) => part("cream", 0.08, 0.2 * s, 0.67, 0.2, { s: FLAT })),
      ...eyes(0.2, 0.67, 0.26),
      part("dark", 0.1, 0, 0.32, 0.36, { s: [2.4, 0.14, 0.3] }),
      ...both((s) =>
        part("fur", 0.16, 0.4 * s, -0.24, 0.12, { s: [1.4, 0.5, 1.3] }),
      ),
      ...both((s) => part("fur", 0.1, 0.22 * s, -0.24, 0.38)),
      part("cream", 0.3, 0, -0.06, 0.2, { s: [1.1, 0.6, 0.5] }),
    ],
  },
  {
    name: "Penguin",
    icon: "penguin",
    parts: [
      part("fur", 0.4, 0, 0, 0, { s: [1, 1.2, 0.95] }),
      part("fur", 0.3, 0, -0.3, 0, { visible: false }),
      part("fur", 0.3, 0, 0.6, 0),
      part("cream", 0.3, 0, -0.05, 0.2, { s: [1, 1.3, 0.5] }),
      part("cream", 0.2, 0, 0.6, 0.16, { s: [1.2, 1, 0.6] }),
      part("beak", 0.07, 0, 0.55, 0.36, {
        cone: true,
        rot: [Math.PI / 2, 0, 0],
      }),
      ...eyes(0.1, 0.67, 0.27),
      ...both((s) =>
        part("accent", 0.12, 0.42 * s, 0.05, 0, {
          s: [0.5, 1.6, 1],
          rot: [0, 0, 0.3 * s],
        }),
      ),
      ...both((s) =>
        part("beak", 0.1, 0.15 * s, -0.48, 0.18, { s: [1.2, 0.4, 1.4] }),
      ),
    ],
  },
  {
    name: "Pig",
    icon: "pig",
    parts: [
      part("fur", 0.42, 0, 0, 0),
      part("fur", 0.33, 0, 0.6, 0),
      part("fur", 0.13, 0, 0.56, 0.3, { s: [1.3, 1, 0.6] }),
      ...both((s) => part("dark", 0.03, 0.05 * s, 0.56, 0.38, { s: FLAT })),
      ...both((s) =>
        part("accent", 0.1, 0.2 * s, 0.9, 0.06, {
          cone: true,
          rot: [0.6, 0, -0.4 * s],
          solid: false,
        }),
      ),
      ...eyes(0.13, 0.7, 0.28),
      ...[0.18, -0.18].flatMap((z) =>
        both((s) => part("fur", 0.13, 0.24 * s, -0.36, z)),
      ),
      part("accent", 0.07, 0, 0.02, -0.44),
      part("pink", 0.2, 0, -0.02, 0.32, { s: FLAT }),
    ],
  },
  {
    name: "Duck",
    icon: "duck",
    parts: [
      part("fur", 0.4, 0, 0, 0, { s: [1, 0.9, 1.15] }),
      part("fur", 0.3, 0, 0.6, 0.08),
      part("beak", 0.12, 0, 0.55, 0.38, { s: [1.2, 0.4, 1.4] }),
      ...eyes(0.12, 0.68, 0.33),
      ...both((s) =>
        part("accent", 0.17, 0.38 * s, 0.05, -0.02, {
          s: [0.5, 0.9, 1.3],
        }),
      ),
      part("fur", 0.1, 0, 0.15, -0.45, {
        cone: true,
        rot: [-1.2, 0, 0],
        solid: false,
      }),
      ...both((s) =>
        part("beak", 0.1, 0.15 * s, -0.36, 0.22, { s: [1.2, 0.4, 1.4] }),
      ),
    ],
  },
  {
    name: "Fox",
    icon: "fox",
    parts: [
      part("fur", 0.38, 0, 0, 0),
      part("fur", 0.32, 0, 0.6, 0, { s: [1.1, 0.95, 1] }),
      part("fur", 0.14, 0, 0.52, 0.3, { s: [0.9, 0.8, 1.5] }),
      part("dark", 0.045, 0, 0.54, 0.51),
      ...both((s) => part("cream", 0.1, 0.12 * s, 0.5, 0.26, { s: FLAT })),
      ...both((s) =>
        part("fur", 0.14, 0.2 * s, 0.95, 0, {
          cone: true,
          rot: [0, 0, -0.25 * s],
          solid: false,
        }),
      ),
      ...both((s) => part("fur", 0.1, 0.2 * s, 0.9, 0, { visible: false })),
      ...eyes(0.13, 0.68, 0.29),
      ...both((s) => part("fur", 0.13, 0.36 * s, 0.1, 0.1)),
      ...both((s) => part("fur", 0.15, 0.2 * s, -0.36, 0.14)),
      part("fur", 0.2, 0.15, -0.15, -0.5, { s: [1, 1, 1.8] }),
      part("cream", 0.12, 0.2, -0.12, -0.82),
      part("cream", 0.24, 0, -0.02, 0.22, { s: FLAT }),
    ],
  },
];

// Not in the machine's usual line-up: our husky, who only turns up on Mikaela's machine (see PETS
// in config.js). Upright ears, a white mask, muzzle, chest and socks, and a curled tail.
export const HUSKY = {
  name: "Husky",
  icon: "fox",
  parts: [
    part("fur", 0.4, 0, 0, 0),
    part("cream", 0.31, 0, -0.04, 0.16, { s: [1, 1.05, 0.8] }),
    part("fur", 0.33, 0, 0.62, 0),
    part("cream", 0.27, 0, 0.53, 0.14, { s: [1.05, 0.85, 0.75] }),
    part("cream", 0.16, 0, 0.53, 0.3, { s: [1, 0.8, 1.15] }),
    part("nose", 0.06, 0, 0.58, 0.47),
    ...both((s) => part("cream", 0.045, 0.12 * s, 0.85, 0.27, { s: FLAT })),
    ...eyes(0.13, 0.73, 0.28),
    ...both((s) =>
      part("fur", 0.13, 0.2 * s, 0.95, 0, {
        cone: true,
        rot: [0, 0, -0.25 * s],
        solid: false,
      }),
    ),
    ...both((s) =>
      part("pink", 0.07, 0.2 * s, 0.92, 0.07, {
        cone: true,
        rot: [0, 0, -0.25 * s],
        s: [1, 1, 0.4],
      }),
    ),
    ...both((s) => part("fur", 0.1, 0.2 * s, 0.9, 0, { visible: false })),
    ...both((s) => part("fur", 0.15, 0.42 * s, 0.1, 0.08)),
    ...both((s) => part("cream", 0.17, 0.22 * s, -0.38, 0.14)),
    part("fur", 0.12, 0.08, 0.02, -0.42),
    part("fur", 0.11, 0.14, 0.2, -0.47),
    part("cream", 0.1, 0.12, 0.35, -0.42),
  ],
};
