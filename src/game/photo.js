import * as THREE from "three";
import { M, scene } from "./scene.js";
import { viewfinderEl, viewfinderTimeEl } from "./dom.js";
import { onTheme } from "./settings.js";
import { coffeeSleeve, smudges, sticker } from "./textures.js";

// ---------- 4K props ----------

// The ultra-real theme leans in until it's funny: fingerprints on the glass, dust drifting in the
// lamp light, a crooked price sticker, somebody's coffee on the floor, and a camcorder viewfinder
// recording the whole thing.
const props = new THREE.Group();
props.visible = false;
scene.add(props);

// Dust motes, drifting inside the cabinet.
const DUST = 140;
const dustPos = new Float32Array(DUST * 3);
const dustSeed = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) {
  dustPos.set(
    [
      (Math.random() - 0.5) * 7.6,
      1 + Math.random() * 8,
      (Math.random() - 0.5) * 7.6,
    ],
    i * 3,
  );
  dustSeed[i] = Math.random() * 100;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({
    color: 0xfff1d6,
    size: 1.6,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
props.add(dust);

// "50c PER PLAY", stuck on slightly crooked next to the button.
const priceTag = new THREE.Mesh(
  new THREE.PlaneGeometry(1.1, 0.5),
  new THREE.MeshStandardMaterial({ roughness: 0.6, transparent: true }),
);
priceTag.position.set(3.15, -0.5, 5.805);
priceTag.rotation.z = 0.07;
props.add(priceTag);

// A paper coffee cup somebody left on the floor next to the machine.
const cup = new THREE.Group();
const paper = new THREE.Mesh(
  new THREE.CylinderGeometry(0.34, 0.25, 0.95, 40, 1, true),
  new THREE.MeshPhysicalMaterial({ roughness: 0.7, side: THREE.DoubleSide }),
);
const lid = new THREE.Mesh(
  new THREE.CylinderGeometry(0.37, 0.36, 0.09, 40),
  new THREE.MeshPhysicalMaterial({
    color: 0x2a1c14,
    roughness: 0.35,
    clearcoat: 0.6,
  }),
);
lid.position.y = 0.5;
const base = new THREE.Mesh(
  new THREE.CircleGeometry(0.25, 32),
  new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.8 }),
);
base.rotation.x = Math.PI / 2;
base.position.y = -0.47;
cup.add(paper, lid, base);
cup.traverse((o) => (o.castShadow = o.receiveShadow = true));
cup.position.set(5.9, -3.6 + 0.475, -1.2);
cup.rotation.y = 0.6;
props.add(cup);

onTheme((t) => {
  const real = t.id === "real";
  props.visible = real;
  viewfinderEl.hidden = !real;
  if (!real) return;
  priceTag.material.map = sticker();
  paper.material.map = coffeeSleeve();
  for (const m of [priceTag.material, paper.material]) m.needsUpdate = true;
  // Fingerprints: the glass is mostly clear, with greasy smudges where people lean on it.
  M.glass.alphaMap = smudges();
  M.glass.opacity = 1;
  // Real glass reflects the room, but at full strength it fogs everything behind it.
  M.glass.envMapIntensity = 0.3;
  M.glass.needsUpdate = true;
});

const start = performance.now();
const pad = (n) => String(n).padStart(2, "0");
export function animatePhoto(now) {
  if (!props.visible) return;
  // Dust: a slow brownian wobble, wrapping round when it drifts out of the cabinet.
  const p = dustGeo.attributes.position;
  for (let i = 0; i < DUST; i++) {
    const s = dustSeed[i];
    p.array[i * 3] += Math.sin(now / 2100 + s) * 0.0015;
    p.array[i * 3 + 1] += 0.0009 + Math.sin(now / 1700 + s * 2) * 0.0012;
    p.array[i * 3 + 2] += Math.cos(now / 2300 + s) * 0.0015;
    if (p.array[i * 3 + 1] > 9) p.array[i * 3 + 1] = 1;
  }
  p.needsUpdate = true;
  // Camcorder timecode, HH:MM:SS:FF at 30 frames.
  const t = (now - start) / 1000;
  const frame = Math.floor((t % 1) * 30);
  const sec = Math.floor(t);
  const code = `${pad(Math.floor(sec / 3600))}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}:${pad(frame)}`;
  if (viewfinderTimeEl.textContent !== code)
    viewfinderTimeEl.textContent = code;
}
