// Our fish tank, in plush, for Mikaela's machine (see PETS in config.js): fish, banded fish like
// clownfish, and shrimp. Like the husky they're not in any level's line-up. Body is "fur", fins and
// a shrimp's bands are "accent", and a fish's bands and a shrimp's spots and feelers are "cream",
// so each pet's own colours (`color`, `accent`, `belly`) paint them.
import { both, part } from "./animals.js";

// A fish lying on its side looks fine, so these tumble like the plushies. Forward is +z.
const BODY = [0.231, 0.357, 0.483];
const fish = (bands, width = 0.05) => [
  part("fur", 0.42, 0, 0, 0, { s: [0.55, 0.85, 1.15] }),
  part("fur", 0.3, 0, 0, 0.26, { visible: false }),
  part("fur", 0.3, 0, 0, -0.26, { visible: false }),
  // Bands: thin slices just proud of the body's cross-section where they sit.
  ...bands.map((z) => {
    const k = Math.sqrt(1 - (z / BODY[2]) ** 2) * 1.06;
    return part("cream", 1, 0, 0, z, {
      s: [BODY[0] * k, BODY[1] * k, width],
    });
  }),
  // Tail fan, dorsal fin and side fins.
  part("accent", 0.28, 0, 0, -0.7, {
    cone: true,
    rot: [Math.PI / 2, 0, 0],
    s: [0.2, 1, 1],
  }),
  part("accent", 0.17, 0, 0.36, -0.05, {
    cone: true,
    rot: [-0.45, 0, 0],
    s: [0.2, 1, 1.4],
  }),
  ...both((s) =>
    part("accent", 0.1, 0.21 * s, -0.12, 0.12, {
      s: [0.3, 0.6, 1],
      rot: [0, 0, 0.5 * s],
    }),
  ),
  // Eyes on both sides, with a ring, and a little mouth.
  ...both((s) => part("cream", 0.09, 0.2 * s, 0.1, 0.3, { s: [0.4, 1, 1] })),
  ...both((s) => part("dark", 0.06, 0.22 * s, 0.1, 0.31, { s: [0.4, 1, 1] })),
  part("pink", 0.04, 0, -0.06, 0.48, { s: [1, 0.6, 0.6] }),
];

// A shrimp: a hunched run of shell segments, head forward, a fan tail, long feelers and legs.
// `bands` darkens every other segment (tiger shrimp); `spots` dots the shell white (fire shrimp).
function shrimp({ bands = false, spots = false } = {}) {
  const segs = Array.from({ length: 6 }, (_, i) => ({
    y: 0.22 * Math.sin((Math.PI * i) / 5) - 0.05,
    z: 0.42 - i * 0.17,
    r: 0.2 - i * 0.022,
  }));
  return [
    ...segs.map(({ y, z, r }, i) =>
      part(bands && i % 2 ? "accent" : "fur", r, 0, y, z, {
        s: [0.9, 1, 1.1],
        solid: true,
      }),
    ),
    ...(spots
      ? segs
          .slice(1, 5)
          .flatMap(({ y, z, r }) =>
            both((s) => part("cream", 0.035, r * 0.78 * s, y + r * 0.35, z)),
          )
      : []),
    part("fur", 0.08, 0, 0.12, 0.62, { cone: true, rot: [Math.PI / 2, 0, 0] }),
    part("accent", 1, 0, -0.07, -0.56, {
      box: true,
      s: [0.18, 0.02, 0.1],
    }),
    ...both((s) =>
      part("cream", 1, 0.05 * s, 0.22, 0.95, {
        box: true,
        s: [0.008, 0.008, 0.45],
        rot: [0.3, 0.2 * s, 0],
      }),
    ),
    ...[0.3, 0.15, 0, -0.15].flatMap((z) =>
      both((s) =>
        part("accent", 1, 0.1 * s, -0.17, z, {
          box: true,
          s: [0.01, 0.08, 0.01],
        }),
      ),
    ),
    ...both((s) => part("dark", 0.045, 0.08 * s, 0.24, 0.52)),
  ];
}

// A gladiator's helmet, Roman style: a steel dome over the head, cheek guards and a red crest.
const helmet = () => [
  part("helmet", 0.2, 0, 0.26, 0.24, { s: [1.25, 0.72, 1.1] }),
  ...both((s) =>
    part("helmet", 1, 0.2 * s, 0.16, 0.3, {
      box: true,
      s: [0.014, 0.08, 0.06],
    }),
  ),
  part("helmet", 1, 0, 0.2, 0.46, { box: true, s: [0.16, 0.02, 0.03] }),
  ...[
    [0.43, 0.36],
    [0.48, 0.24],
    [0.48, 0.12],
    [0.44, 0.0],
    [0.38, -0.1],
  ].map(([y, z]) => part("plume", 0.07, 0, y, z, { s: [0.55, 1, 1] })),
];

export const TANK = [
  { name: "Fish", icon: "fish", parts: fish([]) },
  { name: "Banded Fish", icon: "clownfish", parts: fish([0.26, -0.05, -0.34]) },
  // Our clownfish are gladiators: the morph that's mostly white, orange showing through in patches,
  // and here in their helmets.
  {
    name: "Gladiator Clown",
    icon: "gladiator",
    tag: "GLADIATOR &#9876;",
    parts: [
      ...fish([0.26, -0.06, -0.34], 0.11),
      ...both((s) =>
        part("cream", 0.2, 0.13 * s, -0.12, 0.06, { s: [0.6, 0.7, 1.4] }),
      ),
      ...both((s) =>
        part("cream", 0.16, 0.13 * s, 0.13, -0.22, { s: [0.55, 0.8, 1.2] }),
      ),
      ...helmet(),
    ],
  },
  // Angel koi: a tall, flat angelfish with long sail fins and streamers, in koi colours (white,
  // with orange patches from `belly`, an orange cap and a few black spots).
  {
    name: "Koi Angel",
    icon: "angel",
    tag: "KOI ANGEL",
    parts: [
      part("fur", 0.38, 0, 0, 0, { s: [0.35, 1, 0.9] }),
      part("fur", 0.22, 0, 0.25, -0.05, { visible: false }),
      part("fur", 0.22, 0, -0.25, -0.05, { visible: false }),
      part("accent", 0.16, 0, 0.55, -0.14, {
        cone: true,
        rot: [-0.5, 0, 0],
        s: [0.15, 1.8, 1],
      }),
      part("accent", 0.16, 0, -0.55, -0.14, {
        cone: true,
        rot: [Math.PI + 0.5, 0, 0],
        s: [0.15, 1.8, 1],
      }),
      part("accent", 0.2, 0, 0, -0.48, {
        cone: true,
        rot: [Math.PI / 2, 0, 0],
        s: [0.15, 1, 1],
      }),
      ...both((s) =>
        part("accent", 1, 0.05 * s, -0.5, 0.12, {
          box: true,
          s: [0.01, 0.26, 0.01],
          rot: [0.35, 0, 0],
        }),
      ),
      // Koi patches and the cap.
      ...both((s) =>
        part("cream", 0.16, 0.08 * s, 0.14, 0.02, { s: [0.45, 0.85, 1.1] }),
      ),
      ...both((s) =>
        part("cream", 0.12, 0.08 * s, -0.2, -0.2, { s: [0.45, 0.9, 1] }),
      ),
      part("cream", 0.12, 0, 0.24, 0.2, { s: [0.55, 0.6, 0.8] }),
      ...[
        [0.11, -0.05, -0.12],
        [-0.11, 0.18, -0.24],
        [0.11, 0.3, -0.02],
      ].map(([x, y, z]) => part("nose", 0.035, x, y, z, { s: [0.5, 1, 1] })),
      ...both((s) =>
        part("dark", 0.05, 0.12 * s, 0.1, 0.24, { s: [0.5, 1, 1] }),
      ),
    ],
  },
  { name: "Shrimp", icon: "shrimp", parts: shrimp({ spots: true }) },
  { name: "Tiger Shrimp", icon: "shrimp", parts: shrimp({ bands: true }) },
];
