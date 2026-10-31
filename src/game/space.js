import * as THREE from "three";
import { CAM_TARGET, camera, scene } from "./scene.js";
import { onTheme } from "./settings.js";
import { peek } from "./peek.js";

// ---------- space props ----------

// The Deep Space theme's scenery: lumpy asteroids drifting and tumbling around the machine, a
// ringed planet with a little moon on an orbit (pinned to the top-right of the view, like the
// Halloween moon), and a shooting star now and then.
const props = new THREE.Group();
props.visible = false;
scene.add(props);

// Asteroids: icosahedrons with their corners pushed in and out, so no two look alike.
const rock = new THREE.MeshStandardMaterial({
  color: 0x6b6470,
  roughness: 0.95,
  flatShading: true,
});
function asteroid(size, seed) {
  const geo = new THREE.IcosahedronGeometry(size, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.75 + 0.5 * Math.abs(Math.sin(i * 12.9898 + seed * 78.233));
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, rock);
  m.castShadow = true;
  return m;
}
const rocks = [
  [1.1, 7.2, 1.2, -1.5],
  [0.6, 6.4, 7.8, 0.5],
  [0.8, -6.5, 4.5, 3.5],
  [0.45, 5.6, 4.2, 5.8],
  [0.5, -4.8, 9.5, -5.2],
  [0.35, 1.5, 11.4, 6.6],
].map(([size, x, y, z], i) => {
  const m = asteroid(size, i + 1);
  m.position.set(x, y, z);
  m.userData = { y, spin: 0.15 + i * 0.05, phase: i * 1.7 };
  props.add(m);
  return m;
});

// The sky: a ringed planet with a moon going round it, in camera space.
const sky = new THREE.Group();
props.add(sky);
function canvasMap(size, paint) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  paint(cv.getContext("2d"), size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
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
const planetMap = canvasMap(256, (c, n) => {
  c.save();
  c.beginPath();
  c.arc(n / 2, n / 2, n / 2 - 2, 0, Math.PI * 2);
  c.clip();
  // Banded like a gas giant, lit from the top left.
  const bands = [
    "#f2c48a",
    "#e0a066",
    "#f5d6a8",
    "#c9844e",
    "#efc08c",
    "#d99a5e",
  ];
  bands.forEach((col, i) => {
    c.fillStyle = col;
    c.fillRect(0, (i * n) / bands.length, n, n / bands.length + 1);
  });
  const shade = c.createRadialGradient(
    n * 0.35,
    n * 0.3,
    n * 0.1,
    n / 2,
    n / 2,
    n / 2,
  );
  shade.addColorStop(0, "rgba(255,255,255,0.15)");
  shade.addColorStop(1, "rgba(10,0,40,0.65)");
  c.fillStyle = shade;
  c.fillRect(0, 0, n, n);
  c.restore();
});
const ringMap = canvasMap(256, (c, n) => {
  c.translate(n / 2, n / 2);
  c.scale(1, 0.28);
  for (const [r, w, a] of [
    [110, 10, 0.55],
    [94, 6, 0.4],
    [80, 4, 0.3],
  ]) {
    c.strokeStyle = `rgba(240,220,190,${a})`;
    c.lineWidth = w;
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.stroke();
  }
});
const moonMap = canvasMap(64, (c, n) => {
  const g = c.createRadialGradient(n * 0.4, n * 0.38, 2, n / 2, n / 2, n / 2);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#8a93a8");
  c.fillStyle = g;
  c.beginPath();
  c.arc(n / 2, n / 2, n / 2 - 1, 0, Math.PI * 2);
  c.fill();
});
const ring = flat(ringMap);
ring.scale.set(2.3, 2.3, 1);
ring.rotation.z = -0.35;
const planet = flat(planetMap);
const moon = flat(moonMap);
moon.scale.setScalar(0.22);
sky.add(ring, planet, moon);

// A shooting star: a streak that crosses the sky every few seconds.
const streak = flat(
  canvasMap(128, (c, n) => {
    const g = c.createLinearGradient(0, n / 2, n, n / 2);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,1)");
    c.fillStyle = g;
    c.fillRect(0, n / 2 - 2, n, 4);
  }),
  { blending: THREE.AdditiveBlending },
);
streak.visible = false;
props.add(streak);

onTheme((t) => {
  props.visible = t.id === "space";
});

const right = new THREE.Vector3();
const up = new THREE.Vector3();
let nextStar = 0;
let star = null;
export function animateSpace(now) {
  if (!props.visible) return;
  const t = now / 1000;
  for (const m of rocks) {
    // Out of the way while peeking through the glass.
    m.visible = peek.view === "iso";
    const { y, spin, phase } = m.userData;
    m.rotation.x = t * spin;
    m.rotation.y = t * spin * 0.7 + phase;
    m.position.y = y + Math.sin(t * 0.4 + phase) * 0.35;
  }
  // Pin the sky to the top-right of the view, sized to it, facing the camera.
  const w = (camera.right - camera.left) / camera.zoom;
  const h = (camera.top - camera.bottom) / camera.zoom;
  right.set(1, 0, 0).applyQuaternion(camera.quaternion);
  up.set(0, 1, 0).applyQuaternion(camera.quaternion);
  const size = Math.min(w, h) * 0.14;
  sky.position
    .copy(CAM_TARGET)
    .addScaledVector(right, w * 0.34)
    .addScaledVector(up, h * 0.3);
  sky.quaternion.copy(camera.quaternion);
  sky.scale.setScalar(size);
  // The moon orbits: behind the planet on the far side, in front on the near side.
  const a = t * 0.35;
  moon.position.set(Math.cos(a) * 1.15, Math.sin(a) * 0.32, Math.sin(a) * 0.05);
  // Shooting stars.
  if (!star && now > nextStar) {
    star = {
      from: Math.random() * 0.6 - 0.5,
      at: now,
      y: 0.15 + Math.random() * 0.25,
    };
    streak.visible = true;
  }
  if (star) {
    const k = (now - star.at) / 700;
    const len = Math.min(w, h) * 0.12;
    streak.position
      .copy(CAM_TARGET)
      .addScaledVector(right, w * (star.from + k * 0.5))
      .addScaledVector(up, h * (star.y - k * 0.18));
    streak.quaternion.copy(camera.quaternion);
    streak.rotateZ(-0.35);
    streak.scale.set(len, len * 0.06, 1);
    streak.material.opacity = Math.sin(Math.min(1, k) * Math.PI);
    if (k >= 1) {
      star = null;
      streak.visible = false;
      nextStar = now + 3000 + Math.random() * 5000;
    }
  }
}
