import * as THREE from "three";
import { CAM_TARGET, camera, scene } from "./scene.js";
import { onTheme } from "./settings.js";
import { cobweb } from "./textures.js";

// ---------- Halloween props ----------

// The Halloween theme sets a little scene round the machine: jack-o'-lanterns on the floor (and
// one on the marquee), a skeleton sitting against the cabinet with a pumpkin on its lap, a cobweb
// in the back corner, and a full moon in the corner of the view with bats flapping across it.
const props = new THREE.Group();
props.visible = false;
scene.add(props);

const FLOOR = -3.6;
const sphere = new THREE.SphereGeometry(1, 24, 16);
const skin = new THREE.MeshStandardMaterial({
  color: 0xff7a1a,
  roughness: 0.55,
});
const stemMat = new THREE.MeshStandardMaterial({
  color: 0x4a5a1a,
  roughness: 0.8,
});
const glow = new THREE.MeshBasicMaterial({
  color: 0xffc23a,
  toneMapped: false,
  side: THREE.DoubleSide,
});
const bone = new THREE.MeshStandardMaterial({
  color: 0xeae0c8,
  roughness: 0.6,
});
const socket = new THREE.MeshBasicMaterial({ color: 0x120a10 });

const shape = (points) =>
  new THREE.ShapeGeometry(
    new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y))),
  );
// Carved face, in units of the pumpkin's radius: triangle eyes and a zig-zag grin.
const EYE = shape([
  [-0.14, -0.08],
  [0.14, -0.08],
  [0, 0.16],
]);
const GRIN = shape([
  [-0.42, 0.04],
  [-0.24, -0.04],
  [-0.14, 0.06],
  [0, -0.04],
  [0.14, 0.06],
  [0.24, -0.04],
  [0.42, 0.04],
  [0.26, -0.22],
  [0, -0.28],
  [-0.26, -0.22],
]);

// A jack-o'-lantern of radius r sitting on y = 0, carved face toward +z.
function pumpkin(r) {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const lobe = new THREE.Mesh(sphere, skin);
    lobe.scale.set(0.42 * r, 0.75 * r, 0.6 * r);
    lobe.position.set(Math.sin(a) * 0.45 * r, 0.75 * r, Math.cos(a) * 0.45 * r);
    lobe.rotation.y = a;
    lobe.castShadow = lobe.receiveShadow = true;
    g.add(lobe);
  }
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06 * r, 0.1 * r, 0.35 * r, 8),
    stemMat,
  );
  stem.position.set(0.04 * r, 1.55 * r, 0);
  stem.rotation.z = -0.25;
  g.add(stem);
  const face = new THREE.Group();
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(EYE, glow);
    eye.position.set(0.3 * s, 0.25, 0);
    face.add(eye);
  }
  face.add(new THREE.Mesh(GRIN, glow));
  face.scale.setScalar(r);
  face.position.set(0, 0.8 * r, 1.03 * r);
  g.add(face);
  return g;
}

// A bone from a to b, with a knob at each end.
function boneBetween(g, a, b, r) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), bone);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    B.clone().sub(A).normalize(),
  );
  g.add(m);
  for (const p of [A, B]) {
    const knob = new THREE.Mesh(sphere, bone);
    knob.scale.setScalar(r * 1.6);
    knob.position.copy(p);
    g.add(knob);
  }
}

// Sitting on the floor, back to -z, legs stretched out toward +z.
function skeleton() {
  const g = new THREE.Group();
  const add = (m, pos, scale) => {
    m.position.set(...pos);
    if (scale) m.scale.set(...scale);
    g.add(m);
    return m;
  };
  add(new THREE.Mesh(sphere, bone), [0, 0.3, 0], [0.34, 0.18, 0.24]);
  for (let i = 0; i < 6; i++)
    add(
      new THREE.Mesh(sphere, bone),
      [0, 0.5 + i * 0.16, -0.05 - i * 0.03],
      [0.08, 0.07, 0.08],
    );
  // Ribs: open arcs, the gap at the back where the spine is.
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.TorusGeometry(
      0.3 - i * 0.03,
      0.03,
      6,
      20,
      Math.PI * 1.3,
    );
    geo.rotateZ(-0.15 * Math.PI);
    geo.rotateX(Math.PI / 2);
    add(new THREE.Mesh(geo, bone), [0, 0.78 + i * 0.13, -0.08 - i * 0.03]);
  }
  boneBetween(g, [-0.36, 1.26, -0.2], [0.36, 1.26, -0.2], 0.035);
  // Arms down at the sides, hands on the floor.
  for (const s of [-1, 1]) {
    boneBetween(g, [0.38 * s, 1.24, -0.2], [0.48 * s, 0.75, -0.05], 0.045);
    boneBetween(g, [0.48 * s, 0.75, -0.05], [0.55 * s, 0.1, 0.2], 0.04);
    // Legs out in front, feet up.
    boneBetween(g, [0.16 * s, 0.25, 0.05], [0.2 * s, 0.2, 0.8], 0.055);
    boneBetween(g, [0.2 * s, 0.2, 0.8], [0.22 * s, 0.1, 1.5], 0.045);
    add(
      new THREE.Mesh(sphere, bone),
      [0.22 * s, 0.2, 1.58],
      [0.08, 0.14, 0.05],
    );
  }
  // The skull, tipped to one side.
  const head = new THREE.Group();
  head.position.set(0, 1.62, -0.22);
  head.rotation.set(0.15, 0, 0.22);
  const skull = new THREE.Mesh(sphere, bone);
  skull.scale.set(0.3, 0.32, 0.32);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.22), bone);
  jaw.position.set(0, -0.26, 0.07);
  head.add(skull, jaw);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(sphere, socket);
    eye.scale.setScalar(0.075);
    eye.position.set(0.11 * s, 0.03, 0.26);
    head.add(eye);
  }
  const nose = new THREE.Mesh(sphere, socket);
  nose.scale.set(0.035, 0.05, 0.03);
  nose.position.set(0, -0.08, 0.29);
  head.add(nose);
  g.add(head);
  // A pumpkin on its lap.
  const lap = pumpkin(0.22);
  lap.position.set(0, 0.27, 0.42);
  g.add(lap);
  g.traverse((o) => (o.castShadow = o.receiveShadow = !!o.isMesh));
  return g;
}

// Faces turn toward the camera, which looks in from the +x, +z corner.
const FACING = Math.PI / 4;
for (const [r, x, z, turn] of [
  [0.9, 6.4, 3.0, 0],
  [0.55, 6.1, 5.2, 0.3],
  [0.7, -1.6, 7.3, -0.2],
  [0.45, 0.8, 7.6, 0.4],
]) {
  const p = pumpkin(r);
  p.position.set(x, FLOOR, z);
  p.rotation.y = FACING + turn;
  props.add(p);
}
const topper = pumpkin(0.35);
topper.position.set(3.7, 11.5, -4.2);
topper.rotation.y = FACING;
props.add(topper);
const bones = skeleton();
bones.position.set(5.0, FLOOR, 0.6);
bones.rotation.y = Math.PI / 2;
props.add(bones);
// Candlelight from the big pumpkin onto the floor and the cabinet.
const candle = new THREE.PointLight(0xff8a2a, 10, 9, 2);
candle.position.set(6.2, -2.2, 3.4);
props.add(candle);

// A cobweb stretched across the back corner, under the top rails.
const web = new THREE.Mesh(
  new THREE.PlaneGeometry(2.8, 1.4),
  new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0.8,
  }),
);
web.position.set(-3.0, 8.55, -3.0);
web.rotation.y = FACING;
props.add(web);

// The moon and its bats live in camera space, so they stay in the top-right of any screen.
function canvasMap(size, paint) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  paint(cv.getContext("2d"), size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const moonMap = canvasMap(256, (c, n) => {
  const g = c.createRadialGradient(n * 0.42, n * 0.4, 0, n / 2, n / 2, n / 2);
  g.addColorStop(0, "#fffbe8");
  g.addColorStop(1, "#f0d890");
  c.fillStyle = g;
  c.beginPath();
  c.arc(n / 2, n / 2, n / 2 - 1, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(170,140,90,0.28)";
  for (const [x, y, r] of [
    [0.36, 0.38, 0.1],
    [0.62, 0.3, 0.06],
    [0.58, 0.62, 0.13],
    [0.32, 0.66, 0.05],
    [0.72, 0.5, 0.04],
  ]) {
    c.beginPath();
    c.arc(x * n, y * n, r * n, 0, Math.PI * 2);
    c.fill();
  }
});
const haloMap = canvasMap(256, (c, n) => {
  const g = c.createRadialGradient(n / 2, n / 2, n * 0.18, n / 2, n / 2, n / 2);
  g.addColorStop(0, "rgba(255,236,180,0.45)");
  g.addColorStop(1, "rgba(255,236,180,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, n, n);
});
const batMap = canvasMap(128, (c, n) => {
  c.fillStyle = "#000";
  c.beginPath();
  c.moveTo(n / 2, n * 0.42);
  // Scalloped wings out to each side.
  for (const s of [1, -1]) {
    c.moveTo(n / 2, n * 0.42);
    c.quadraticCurveTo(
      n / 2 + s * n * 0.2,
      n * 0.18,
      n / 2 + s * n * 0.48,
      n * 0.3,
    );
    c.quadraticCurveTo(
      n / 2 + s * n * 0.38,
      n * 0.48,
      n / 2 + s * n * 0.32,
      n * 0.6,
    );
    c.quadraticCurveTo(
      n / 2 + s * n * 0.24,
      n * 0.5,
      n / 2 + s * n * 0.18,
      n * 0.6,
    );
    c.quadraticCurveTo(n / 2 + s * n * 0.1, n * 0.5, n / 2, n * 0.58);
  }
  c.fill();
  // Body and ears.
  c.beginPath();
  c.ellipse(n / 2, n * 0.48, n * 0.06, n * 0.12, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(n * 0.45, n * 0.4);
  c.lineTo(n * 0.46, n * 0.3);
  c.lineTo(n * 0.5, n * 0.37);
  c.lineTo(n * 0.54, n * 0.3);
  c.lineTo(n * 0.55, n * 0.4);
  c.fill();
});
const sky = new THREE.Group();
props.add(sky);
const flat = (map, opts = {}) =>
  new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      ...opts,
    }),
  );
const halo = flat(haloMap, { blending: THREE.AdditiveBlending });
halo.scale.setScalar(2.4);
const moon = flat(moonMap);
sky.add(halo, moon);
const bats = Array.from({ length: 5 }, (_, i) => {
  const b = flat(batMap, { color: 0x1a0f22 });
  b.userData = {
    phase: i * 1.3,
    speed: 0.25 + i * 0.04,
    radius: 0.7 + i * 0.22,
  };
  sky.add(b);
  return b;
});

onTheme((t) => {
  props.visible = t.id === "halloween";
  if (props.visible && !web.material.map) {
    web.material.map = cobweb();
    web.material.needsUpdate = true;
  }
});

const right = new THREE.Vector3();
const up = new THREE.Vector3();
export function animateHalloween(now) {
  if (!props.visible) return;
  // Pin the sky to the top-right of the view, sized to it, facing the camera.
  const w = (camera.right - camera.left) / camera.zoom;
  const h = (camera.top - camera.bottom) / camera.zoom;
  right.set(1, 0, 0).applyQuaternion(camera.quaternion);
  up.set(0, 1, 0).applyQuaternion(camera.quaternion);
  const size = Math.min(w, h) * 0.16;
  sky.position
    .copy(CAM_TARGET)
    .addScaledVector(right, w * 0.34)
    .addScaledVector(up, h * 0.3);
  sky.quaternion.copy(camera.quaternion);
  sky.scale.setScalar(size);
  // Bats loop round the moon, flapping.
  for (const b of bats) {
    const { phase, speed, radius } = b.userData;
    const a = phase + (now / 1000) * speed * Math.PI;
    b.position.set(
      Math.cos(a) * radius,
      Math.sin(a * 1.7) * radius * 0.45,
      0.01,
    );
    const flap = Math.abs(Math.sin(now / 90 + phase * 3));
    b.scale.set(0.32 * (0.4 + 0.6 * flap), 0.2, 1);
  }
  // The jack-o'-lanterns flicker like candles.
  candle.intensity = 9 + Math.sin(now / 70) * 1.5 + Math.sin(now / 23) * 0.8;
}
