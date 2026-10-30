import { screenCanvas } from "./dom.js";
import * as THREE from "three";
import { CHUTE } from "./config.js";
import { M, box, scene, std } from "./scene.js";
import { addStaticBox } from "./physics.js";

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
box(2.2, 2.8, 2.2, M.pit, CHUTE.x, -1.53, CHUTE.z, { cast: false });
box(2.0, 1.3, 0.04, M.mustard, CHUTE.x, -1.9, 4.41);
box(1.8, 1.1, 0.05, M.black, CHUTE.x, -1.9, 4.42);

// Floor with a hole over the chute, plus the acrylic chute guard.
addStaticBox(0, -0.1, -1.1, 4, 0.1, 2.9, M.felt);
addStaticBox(1.1, -0.1, 2.9, 2.9, 0.1, 1.1, M.felt);
addStaticBox(-CHUTE.edge, 0.5, 2.9, 0.05, 0.5, 1.1, M.acrylic);
addStaticBox(-2.9, 0.5, CHUTE.edge, 1.1, 0.5, 0.05, M.acrylic);

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
    box(0.35, 9.8, 0.35, M.walnut, 4.2 * sx, 4.7, 4.2 * sz);
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
export function drawMarquee(text = marqueeText) {
  marqueeText = text;
  const c = marqueeCanvas.getContext("2d");
  c.fillStyle = "#1f6f6b";
  c.fillRect(0, 0, 1024, 176);
  c.strokeStyle = "#d9a521";
  c.lineWidth = 12;
  c.strokeRect(10, 10, 1004, 156);
  c.font = '64px "Press Start 2P", monospace';
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#3a2a1a";
  c.fillText(text, 518, 96);
  c.fillStyle = "#ffd75e";
  c.fillText(text, 512, 90);
  c.font = "56px serif";
  c.fillText("🧸", 80, 92);
  c.fillText("🧸", 944, 92);
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
