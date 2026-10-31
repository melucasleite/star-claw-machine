import * as THREE from "three";
import * as CANNON from "cannon-es";
import { CHUTE, DISH, PETS, TIERS } from "./config.js";
import { LOOKS } from "./arcade.js";
import { currentLevel, familyOn } from "./levels.js";
import { HUSKY } from "./animals.js";
import { TANK } from "./tank.js";
import { scene, std } from "./scene.js";
import { G_PRIZE, PRIZE_MASK, mats, world } from "./physics.js";
import { onTheme, theme } from "./settings.js";

// ---------- plushies ----------

export const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
export const coneGeo = new THREE.ConeGeometry(1, 2, 16);
// Two units across like the sphere, so a part's r * s is its half-size either way.
export const boxGeo = new THREE.BoxGeometry(2, 2, 2);
// Per plush style: 8-bit gets chunky low-poly parts, 4K gets smooth high-poly ones.
const BASE_GEOS = {
  // Voxel critters: every round part becomes a cube, every cone a pyramid.
  pixel: [
    new THREE.BoxGeometry(1.55, 1.55, 1.55),
    new THREE.ConeGeometry(1, 2, 4),
    boxGeo,
  ],
  real: [
    new THREE.SphereGeometry(1, 48, 32),
    new THREE.ConeGeometry(1, 2, 32),
    boxGeo,
  ],
};
const shapeOf = (p) => (p.box ? "b" : p.cone ? "c" : "s");
const baseGeo = (p, style) =>
  (BASE_GEOS[style] ?? [sphereGeo, coneGeo, boxGeo])["scb".indexOf(shapeOf(p))];

// Knitted yarn: a tile of stockinette "V" stitches, drawn once as a colour map (soft shading
// between the stitches) and a bump map (each leg of the V puffs up like a strand of yarn).
export const KNIT = {
  cols: 4,
  rows: 4,
  cell: 32,
  stitchW: 0.06,
  stitchH: 0.05,
};
// `hi` paints the tile at four times the pixels with denser fuzz, for the 4K theme.
export function knitCanvas(bump, hi = false) {
  const k = hi ? 4 : 1;
  const size = KNIT.cols * KNIT.cell;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size * k;
  const c = cv.getContext("2d");
  c.scale(k, k);
  c.fillStyle = bump ? "#000" : "#c6c6c6";
  c.fillRect(0, 0, size, size);
  const leg = (x, y, rot) => {
    const g = c.createRadialGradient(0, 0, 1, 0, 0, 15);
    g.addColorStop(0, bump ? "#fff" : "#ffffff");
    g.addColorStop(0.6, bump ? "#aaa" : "#ececec");
    g.addColorStop(1, bump ? "#000" : "#d2d2d2");
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(0.48, 1);
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, 15, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };
  // Draw a row above and below the tile too, so the stitches wrap without a seam.
  for (let row = -1; row <= KNIT.rows; row++)
    for (let col = 0; col < KNIT.cols; col++) {
      const cx = col * KNIT.cell + KNIT.cell / 2;
      const cy = row * KNIT.cell + KNIT.cell / 2;
      leg(cx - 7, cy, -0.5);
      leg(cx + 7, cy, 0.5);
    }
  // A little fuzz so it reads as yarn, not plastic.
  for (let i = 0; i < 900 * k * k; i++) {
    c.fillStyle = `rgba(${bump ? "0,0,0" : "90,90,90"},${Math.random() * 0.12})`;
    c.fillRect(Math.random() * size, Math.random() * size, 1 / k, 2 / k);
  }
  return cv;
}
function knitTexture(bump, hi) {
  const t = new THREE.CanvasTexture(knitCanvas(bump, hi));
  if (!bump) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = hi ? 8 : 4;
  return t;
}
export const knitMap = knitTexture(false);
export const knitBump = knitTexture(true);
let knitHi = null;
// Physical rather than standard so the velvet and 4K looks can add sheen; the knit look leaves it off.
export const yarn = (color) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 1,
    map: knitMap,
    bumpMap: knitBump,
    bumpScale: 2.2,
  });

// Every part shares the same stitch size, so each scaled sphere or cone gets UVs that repeat
// the tile by its own size. Geometries are cached per repeat count.
export const knitGeos = {};
export function knitGeo(p) {
  const sx = p.r * p.s[0];
  const sy = p.r * p.s[1];
  const sz = p.r * p.s[2];
  const around = Math.PI * (sx + sz);
  const tall = p.cone || p.box ? 2 * sy : Math.PI * sy;
  const u = Math.max(1, Math.round(around / KNIT.stitchW / KNIT.cols));
  const v = Math.max(1, Math.round(tall / KNIT.stitchH / KNIT.rows));
  const style = theme().plush.style;
  if (style === "pixel") return baseGeo(p, style);
  const key = `${style}:${shapeOf(p)}${u}x${v}`;
  if (knitGeos[key]) return knitGeos[key];
  const geo = baseGeo(p, style).clone();
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  return (knitGeos[key] = geo);
}

// Shared yarn colours, plus the people palette (skin0, hair3, ...) from arcade.js.
const DECO_YARN = {
  cream: 0xfff4e2,
  pink: 0xf7a8b8,
  beak: 0xf2a65a,
  denim: 0x4a6a9a,
  sole: 0x2e2a28,
  ...LOOKS,
};
export const DECO = {
  ...Object.fromEntries(
    Object.entries(DECO_YARN).map(([k, color]) => [k, yarn(color)]),
  ),
  // Button eyes: smooth and a little shiny against the yarn.
  dark: std(0x161616, 0.25),
  // Noses that stay black when a pet's eyes are recoloured.
  nose: std(0x161616, 0.3),
  // Arcade screens glow a little; glass is barely there.
  screen: new THREE.MeshStandardMaterial({
    color: 0x101a33,
    emissive: 0x2f7fd8,
    emissiveIntensity: 0.55,
    roughness: 0.3,
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xd8ecff,
    roughness: 0.05,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  }),
};
// Part materials that are yarn. "skin" and "hair" stand in for a palette key picked per prize.
export const KNITTED = new Set([
  "fur",
  "accent",
  "skin",
  "hair",
  ...Object.keys(DECO_YARN),
]);
for (const t of [...TIERS, ...PETS]) {
  t.mats = {
    // The warm lamp and tone mapping wash pastels out, so the 3D fur gets a little extra saturation.
    fur: yarn(new THREE.Color(t.color).offsetHSL(0, 0.28, 0)),
    accent: yarn(
      t.accent ??
        new THREE.Color(t.color).lerp(new THREE.Color(0x3a2a1a), 0.22),
    ),
  };
  // Pale pets skip the saturation boost (it turns white-pink peach) and get brightened instead.
  if (t.bright) t.mats.fur.color.set(t.color).multiplyScalar(t.bright);
  // Glow in the dark: the body and gills light up (see glowPets for the slow pulse).
  if (t.glow)
    for (const m of [t.mats.fur, t.mats.accent]) {
      m.emissive.set(t.glow);
      m.emissiveIntensity = 0.45;
    }
  // A pet's own belly and eyes (a black cat's eyes would vanish into black yarn).
  if (t.belly) t.mats.cream = yarn(t.belly);
  if (t.white) t.mats.cream.color.setScalar(1.3);
  if (t.eyes) t.mats.dark = std(t.eyes, 0.25);
}
// Only the big parts cast shadows; buttons and trim would just speckle the floor.
const SHADOWED = new Set(["fur", "accent", "skin", "hair", "denim"]);
const partGeo = (p) =>
  KNITTED.has(p.mat) ? knitGeo(p) : baseGeo(p, theme().plush.style);

// Knit (default), pixel (8-bit: flat, untextured), velvet (carousel: soft sheen) or real (4K yarn).
const YARN_STYLES = {
  knit: { map: "knit", bumpScale: 2.2, roughness: 1, sheen: 0 },
  pixel: { map: null, bumpScale: 0, roughness: 1, sheen: 0, flat: true },
  velvet: {
    map: null,
    bump: "knit",
    bumpScale: 0.5,
    roughness: 0.7,
    sheen: 1,
    sheenRoughness: 0.35,
    sheenColor: 0xffe6f2,
  },
  real: {
    map: "hi",
    bumpScale: 3,
    roughness: 0.95,
    sheen: 0.3,
    sheenRoughness: 0.8,
    sheenColor: 0xffffff,
  },
};
function styleYarn(mat, look) {
  const maps = { knit: [knitMap, knitBump], hi: knitHi };
  const [map, bump] = maps[look.map] ?? [null, null];
  mat.map = map;
  mat.bumpMap = look.bump ? maps[look.bump][1] : bump;
  mat.bumpScale = look.bumpScale;
  mat.roughness = look.roughness;
  mat.sheen = look.sheen;
  mat.sheenRoughness = look.sheenRoughness ?? 1;
  mat.sheenColor.setHex(look.sheenColor ?? 0xffffff);
  mat.flatShading = !!look.flat;
  mat.needsUpdate = true;
}
onTheme((t) => {
  const style = t.plush.style;
  if (style === "real" && !knitHi)
    knitHi = [knitTexture(false, true), knitTexture(true, true)];
  const look = YARN_STYLES[style];
  for (const tier of [...TIERS, ...PETS]) {
    // The warm lamp and tone mapping wash pastels out, so the 3D fur gets a little extra saturation.
    tier.mats.fur.color.set(tier.color);
    if (tier.bright) tier.mats.fur.color.multiplyScalar(tier.bright);
    else tier.mats.fur.color.offsetHSL(0, t.plush.saturation, 0);
    styleYarn(tier.mats.fur, look);
    styleYarn(tier.mats.accent, look);
    if (tier.mats.cream) styleYarn(tier.mats.cream, look);
  }
  for (const k in DECO_YARN) styleYarn(DECO[k], look);
  for (const k of ["dark", "screen", "nose"]) {
    DECO[k].flatShading = !!look.flat;
    DECO[k].needsUpdate = true;
  }
  for (const plush of plushies)
    plush.group.traverse((m) => {
      if (m.userData.part) m.geometry = partGeo(m.userData.part);
    });
});

export const plushies = [];
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Squash-and-stretch spring: impacts flatten it, then it puffs back up slowly, with barely a wobble.
export const SQUISH = { stiffness: 150, damping: 20, kick: 0.75, max: 0.25 };

// `animal` is any level's kind (see levels.js), not only an animal.
export function addPlush(tier, animal, x, y, z) {
  const body = new CANNON.Body({
    mass: 1,
    material: mats.prize,
    collisionFilterGroup: G_PRIZE,
    collisionFilterMask: PRIZE_MASK,
    // Cotton drags: plushies slump and settle instead of rolling around.
    linearDamping: 0.22,
    angularDamping: 0.55,
  });
  const group = new THREE.Group();
  // Per-prize materials, e.g. { skin: "skin2", hair: "hair4" }.
  const look = animal.dress?.() ?? {};
  for (const p of animal.parts) {
    if (p.solid)
      body.addShape(new CANNON.Sphere(p.r), new CANNON.Vec3(p.x, p.y, p.z));
    if (!p.visible) continue;
    const mat = look[p.mat] ?? p.mat;
    const m = new THREE.Mesh(partGeo(p), tier.mats[mat] ?? DECO[mat]);
    m.userData.part = p;
    m.scale.set(p.r * p.s[0], p.r * p.s[1], p.r * p.s[2]);
    m.position.set(p.x, p.y, p.z);
    if (p.rot) m.rotation.set(...p.rot);
    m.castShadow = SHADOWED.has(p.mat);
    m.receiveShadow = true;
    group.add(m);
  }
  body.position.set(x, y, z);
  // Upright kinds are stocked standing, facing any way; the rest land however they tumble.
  if (animal.upright) body.quaternion.setFromEuler(0, Math.random() * 6.28, 0);
  else
    body.quaternion.setFromEuler(
      Math.random() * 6.28,
      Math.random() * 6.28,
      Math.random() * 6.28,
    );
  world.addBody(body);
  // The root carries position and a world-vertical squash; the inner group carries rotation.
  const root = new THREE.Group();
  root.add(group);
  scene.add(root);
  const plush = { body, root, group, tier, animal, ghost: false };
  if (animal.walks) plush.walk = { heading: Math.random() * 6.28, next: 0 };
  plush.squash = { a: 0, v: 0 };
  body.addEventListener("collide", (e) => {
    const hit = Math.abs(e.contact.getImpactVelocityAlongNormal());
    if (hit > 0.4) plush.squash.v += Math.min(hit, 6) * SQUISH.kick;
  });
  plushies.push(plush);
}

// Glow-in-the-dark pets breathe light, slowly.
const GLOWING = PETS.filter((t) => t.glow);
export function glowPets(now) {
  for (const t of GLOWING)
    for (const m of [t.mats.fur, t.mats.accent])
      m.emissiveIntensity = 0.35 + 0.25 * Math.sin(now / 900);
}

export function jiggle(dt) {
  for (const { squash: q } of plushies) {
    q.v += (-SQUISH.stiffness * q.a - SQUISH.damping * q.v) * dt;
    q.a = Math.max(-SQUISH.max, Math.min(SQUISH.max, q.a + q.v * dt));
  }
}

// The dished floor: a prize lying against the glass slides back in, slowly.
export function dish() {
  for (const { body: b, ghost } of plushies) {
    if (ghost || b.position.y > DISH.maxY) continue;
    const v = b.velocity;
    if (Math.hypot(v.x, v.y, v.z) > DISH.still) continue;
    for (const axis of ["x", "z"]) {
      const p = b.position[axis];
      // Set outright, like the walkers: floor friction would eat a gentler push.
      if (Math.abs(p) > DISH.edge && -Math.sign(p) * v[axis] < DISH.speed)
        v[axis] = -Math.sign(p) * DISH.speed;
    }
  }
}

export function removePlush(plush) {
  world.removeBody(plush.body);
  scene.remove(plush.root);
  plushies.splice(plushies.indexOf(plush), 1);
}

export function restock() {
  while (plushies.length) removePlush(plushies[0]);
  const level = currentLevel();
  let stock = TIERS.flatMap((t) => Array(t.count).fill(t));
  // Mikaela's machine: with OUR FAMILY on, level 1 holds our pets and fish instead.
  const pets = familyOn() && level.id === 1 ? PETS : [];
  for (const pet of pets)
    stock.splice(
      stock.findIndex((t) => t.name === pet.as),
      1,
    );
  stock = [...stock, ...pets];
  const cells = [];
  for (const cx of [-2.7, -0.9, 0.9, 2.7]) {
    for (const cz of [-2.7, -0.9, 0.9, 2.7]) {
      if (cx < -CHUTE.edge && cz > CHUTE.edge) continue;
      cells.push([cx, cz]);
    }
  }
  // Deal the level's kinds from a shuffled bag so every kind shows up before any repeats.
  const kinds = level.kinds;
  const bag = [];
  const nextAnimal = () => {
    if (!bag.length) bag.push(...[...kinds].sort(() => Math.random() - 0.5));
    return bag.pop();
  };
  // Stack the stock in layers so a full machine reads as a pile, not a grid.
  const j = () => (Math.random() - 0.5) * 0.6;
  stock.sort(() => Math.random() - 0.5);
  stock.forEach((tier, i) => {
    const layer = Math.floor(i / cells.length);
    if (i % cells.length === 0) cells.sort(() => Math.random() - 0.5);
    const [cx, cz] = cells[i % cells.length];
    addPlush(
      tier,
      tier.pet
        ? [...kinds, HUSKY, ...TANK].find((k) => k.name === tier.animal)
        : nextAnimal(),
      cx + j(),
      1.0 + layer * 1.5 + Math.random() * 0.5,
      cz + j(),
    );
  });
}
