import { screenCanvas } from "./dom.js";
import * as THREE from "three";
import { CHUTE } from "./config.js";
import { M, box, scene, std } from "./scene.js";
import { addStaticBox } from "./physics.js";
import { onTheme, theme } from "./settings.js";
import { game } from "./game.js";
import {
  arcadeCarpet,
  candy,
  floorboards,
  harlequin,
  leaves,
  wedges,
  woodGrain,
  wool,
} from "./textures.js";

// ---------- cabinet ----------

export const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  std(0x5a3a22, 0.9),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -3.6;
ground.receiveShadow = true;
scene.add(ground);
export const rug = new THREE.Mesh(
  new THREE.CircleGeometry(9, 48),
  std(0x8c3b2e, 1),
);
rug.rotation.x = -Math.PI / 2;
rug.position.set(0, -3.59, 3);
rug.receiveShadow = true;
scene.add(rug);

box(8.8, 3.4, 8.8, M.walnut, 0, -1.9, 0);
box(8.9, 0.25, 8.9, M.teal, 0, -0.32, 0);
export const pit = box(2.2, 2.8, 2.2, M.pit, CHUTE.x, -1.53, CHUTE.z, {
  cast: false,
});
box(2.0, 1.3, 0.04, M.mustard, CHUTE.x, -1.9, 4.41);
box(1.8, 1.1, 0.05, M.black, CHUTE.x, -1.9, 4.42);

// Floor with a hole over the chute, plus the acrylic chute guard.
// Everything the aim-assist laser can land on besides the plushies.
export const floorMeshes = [
  pit,
  addStaticBox(0, -0.1, -1.1, 4, 0.1, 2.9, M.felt),
  addStaticBox(1.1, -0.1, 2.9, 2.9, 0.1, 1.1, M.felt),
  addStaticBox(-CHUTE.edge, 0.5, 2.9, 0.05, 0.5, 1.1, M.acrylic),
  addStaticBox(-2.9, 0.5, CHUTE.edge, 1.1, 0.5, 0.05, M.acrylic),
];

// Walls: wood at the back and left, glass on the two sides facing the camera.
addStaticBox(-4.1, 4.65, 0, 0.1, 4.75, 4.2, M.walnut);
addStaticBox(0, 4.65, -4.1, 4.2, 4.75, 0.1, M.walnut);
addStaticBox(4.1, 4.65, 0, 0.1, 4.75, 4.2);
addStaticBox(0, 4.65, 4.1, 4.2, 4.75, 0.1);
export const glassX = new THREE.Mesh(new THREE.PlaneGeometry(8, 9.4), M.glass);
glassX.rotation.y = Math.PI / 2;
glassX.position.set(4.0, 4.7, 0);
export const glassZ = new THREE.Mesh(new THREE.PlaneGeometry(8, 9.4), M.glass);
glassZ.position.set(0, 4.7, 4.0);
scene.add(glassX, glassZ);
box(8.0, 0.3, 0.05, M.teal, 0, 3.0, -3.98);
box(0.05, 0.3, 8.0, M.teal, -3.98, 3.0, 0);

for (const sx of [-1, 1]) {
  for (const sz of [-1, 1]) {
    // Skip the post nearest the camera; it would split the playfield in half.
    if (sx > 0 && sz > 0) continue;
    box(0.35, 9.8, 0.35, M.post, 4.2 * sx, 4.7, 4.2 * sz);
  }
  box(8.75, 0.25, 0.3, M.teal, 0, 9.5, 4.2 * sx);
  box(0.3, 0.25, 8.75, M.teal, 4.2 * sx, 9.5, 0);
}

// Marquee stands at the back so it never hides the playfield.
export const marqueeCanvas = document.createElement("canvas");
marqueeCanvas.width = 1024;
marqueeCanvas.height = 176;
export const marqueeTex = new THREE.CanvasTexture(marqueeCanvas);
marqueeTex.colorSpace = THREE.SRGBColorSpace;
export let marqueeText = "STAR CLAW";
// A level's stage (see stages.js) can swap the marquee style and light the rail bulbs.
export const stageDecor = { marquee: null, bulbs: null };
export function drawMarquee(text = marqueeText) {
  marqueeText = text;
  paintMarquee(text);
}
let marqueeShown = "";
function paintMarquee(text) {
  marqueeShown = text;
  const m = { ...theme().marquee, ...stageDecor.marquee };
  const c = marqueeCanvas.getContext("2d");
  c.fillStyle = m.background;
  c.fillRect(0, 0, 1024, 176);
  c.strokeStyle = m.border;
  c.lineWidth = 12;
  c.strokeRect(10, 10, 1004, 156);
  c.textAlign = "center";
  c.textBaseline = "middle";
  // Fit between the emoji: shrink a long name, and past a point break it onto two lines.
  const fontAt = (px) => `${m.weight ?? 400} ${px}px ${m.font ?? theme().font}`;
  const fit = (lines, cap) => {
    c.font = fontAt(100);
    const widest = Math.max(...lines.map((l) => c.measureText(l).width));
    return Math.min(cap, (100 * 780) / widest);
  };
  let lines = [text];
  let size = fit(lines, m.size);
  const words = text.split(" ");
  if (size < m.size * 0.75 && words.length > 1) {
    const cut = Math.ceil(words.length / 2) - (words.length > 2 ? 1 : 0);
    lines = [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
    size = fit(lines, Math.min(m.size, 62));
  }
  c.font = fontAt(size);
  const rows = lines.map((l, i) => [
    l,
    90 + (i - (lines.length - 1) / 2) * size * 1.15,
  ]);
  c.fillStyle = m.shadow;
  for (const [l, y] of rows) c.fillText(l, 518, y + 6);
  // The 4K marquee is a neon sign: the glow comes from a blurred shadow.
  c.shadowColor = m.glow ?? "transparent";
  c.shadowBlur = m.glow ? 24 : 0;
  c.fillStyle = m.text;
  for (const [l, y] of rows) c.fillText(l, 512, y);
  c.shadowBlur = 0;
  c.font = "56px serif";
  c.fillText(m.emoji, 80, 92);
  c.fillText(m.emoji, 944, 92);
  marqueeTex.needsUpdate = true;
}
drawMarquee();
box(8.8, 1.8, 0.3, M.walnut, 0, 10.6, -4.2);
export const marquee = new THREE.Mesh(
  new THREE.PlaneGeometry(8.2, 1.41),
  new THREE.MeshBasicMaterial({ map: marqueeTex, toneMapped: false }),
);
marquee.position.set(0, 10.6, -4.04);
scene.add(marquee);

// Control panel with a joystick and the REEL button.
box(7.2, 0.6, 1.4, M.walnut, 0.6, -0.5, 5.1);
box(7.0, 0.06, 1.25, M.teal, 0.6, -0.17, 5.1);
export const stick = new THREE.Group();
stick.position.set(-0.6, -0.13, 5.1);
export const stickRod = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.05, 0.55),
  M.black,
);
stickRod.position.y = 0.27;
export const stickBall = new THREE.Mesh(
  new THREE.SphereGeometry(0.15, 16, 12),
  M.red,
);
stickBall.position.y = 0.55;
stick.add(stickRod, stickBall);
stick.traverse((o) => (o.castShadow = true));
scene.add(stick);
export const reelRing = new THREE.Mesh(
  new THREE.CylinderGeometry(0.46, 0.46, 0.08, 24),
  M.brass,
);
reelRing.position.set(1.8, -0.12, 5.1);
export const reelButton = new THREE.Mesh(
  new THREE.CylinderGeometry(0.38, 0.38, 0.2, 24),
  M.mustard,
);
reelButton.position.set(1.8, -0.02, 5.1);
reelButton.castShadow = true;
scene.add(reelRing, reelButton);

// Gantry, carriage box and its screen.
for (const sx of [-1, 1]) box(0.12, 0.12, 8.0, M.brass, 3.95 * sx, 9.25, 0);
export const bridge = box(8.0, 0.14, 0.18, M.brass, 0, 9.25, 0);
export const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
screenTex.magFilter = THREE.NearestFilter;
export const carriage = new THREE.Group();
export const carriageBox = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.3, 1.0),
  M.walnut,
);
carriageBox.castShadow = true;
export const bezel = new THREE.Mesh(
  new THREE.PlaneGeometry(0.66, 1.12),
  M.mustard,
);
bezel.position.z = 0.505;
export const screenFace = new THREE.Mesh(
  new THREE.PlaneGeometry(0.52, 0.98),
  new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }),
);
screenFace.position.z = 0.51;
carriage.add(carriageBox, bezel, screenFace);
scene.add(carriage);
export const cable = new THREE.Mesh(
  new THREE.CylinderGeometry(0.03, 0.03, 1),
  M.black,
);
scene.add(cable);

// ---------- theme ----------

// Carousel bulbs: a string of lights along the four top rails and the marquee, twinkling in turn.
const BULB_COLORS = {
  carousel: [0xfff2c4, 0xffb3d9],
  retro: [0xf83800, 0xf8b800, 0x00a800, 0x3cbcfc],
  halloween: [0xff7a1a, 0xff9a3c, 0x9b4dff],
};
const bulbSpots = [];
for (let t = -4; t <= 4.01; t += 0.5) {
  bulbSpots.push(
    [t, 9.68, -4.2],
    [t, 9.68, 4.2],
    [-4.2, 9.68, t],
    [4.2, 9.68, t],
  );
  bulbSpots.push([t, 11.58, -4.2]);
}
export const bulbs = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.09, 10, 8),
  new THREE.MeshBasicMaterial({ toneMapped: false }),
  bulbSpots.length,
);
const dummy = new THREE.Object3D();
bulbSpots.forEach(([x, y, z], i) => {
  dummy.position.set(x, y, z);
  dummy.updateMatrix();
  bulbs.setMatrixAt(i, dummy.matrix);
  bulbs.setColorAt(i, new THREE.Color(0xffffff));
});
bulbs.visible = false;
scene.add(bulbs);
const bulbColor = new THREE.Color();
export function animateDecor(now) {
  const id = theme().id;
  // 8-bit title screen: the marquee blinks INSERT COIN, like every cabinet in every arcade.
  if (id === "retro" && game.mode === "title") {
    const text = Math.floor(now / 700) % 2 ? "INSERT COIN" : marqueeText;
    if (text !== marqueeShown) paintMarquee(text);
  } else if (marqueeShown !== marqueeText) paintMarquee(marqueeText);
  if (!bulbs.visible) return;
  const colors = stageDecor.bulbs ?? BULB_COLORS[id];
  for (let i = 0; i < bulbSpots.length; i++) {
    let lit;
    if (id === "retro" || stageDecor.bulbs) {
      // Chase lights: one bulb in four, racing along the rails.
      const k = Math.floor(i / 5) + Math.floor(now / 90);
      bulbColor.setHex(colors[Math.floor(i / 5) % colors.length]);
      lit = k % 4 === 0 ? 1 : 0.2;
    } else if (id === "halloween") {
      // Candles: each bulb flickers on its own, never quite steady.
      bulbColor.setHex(colors[i % colors.length]);
      lit =
        0.55 +
        0.3 * Math.sin(now / 90 + i * 7.3) * Math.sin(now / 230 + i * 2.1) +
        0.15 * Math.sin(now / 37 + i);
    } else {
      // Carousel: two colours swapping, every third bulb dimmed.
      const phase = Math.floor(now / 450) % 2;
      bulbColor.setHex(colors[(i + phase) % 2]);
      lit = (i + phase) % 3 ? 1 : 0.45;
    }
    bulbs.setColorAt(i, bulbColor.multiplyScalar(lit));
  }
  bulbs.instanceColor.needsUpdate = true;
}

// Runs after scene.js has reset the shared materials, so maps set here stick.
onTheme((t) => {
  const s = t.scene;
  const decor = s.decor;
  ground.material.color.setHex(s.ground);
  ground.material.map =
    decor === "real"
      ? floorboards()
      : decor === "halloween"
        ? leaves()
        : t.id === "retro"
          ? arcadeCarpet()
          : decor === "carousel"
            ? harlequin()
            : null;
  if (ground.material.map) ground.material.color.setHex(0xffffff);
  rug.material.color.setHex(s.rug);
  rug.material.map =
    decor === "carousel"
      ? wedges("#f7a8c8", "#fff0f6")
      : decor === "real"
        ? wool()
        : null;
  if (decor === "carousel") rug.material.color.setHex(0xffffff);
  for (const m of [ground.material, rug.material]) {
    m.flatShading = !!s.flat;
    m.needsUpdate = true;
  }
  if (decor === "real")
    for (const m of [M.walnut, M.post, M.walnutDark]) {
      m.map = woodGrain();
      m.needsUpdate = true;
    }
  if (decor === "carousel") {
    M.post.map = candy("#fff6fb", "#ff7eb6");
    M.post.needsUpdate = true;
  }
  bulbs.visible =
    decor === "carousel" || decor === "halloween" || t.id === "retro";
  drawMarquee();
  // Theme fonts load on demand; redraw once this one is in.
  document.fonts
    .load(`64px ${t.marquee.font ?? t.font}`)
    .then(() => drawMarquee());
});
