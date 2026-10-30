import * as THREE from "three";
import { scene } from "./scene.js";
import { floorMeshes } from "./cabinet.js";
import { hub } from "./claw.js";
import { plushies } from "./plushies.js";
import { game } from "./game.js";
import { onTheme } from "./settings.js";

// ---------- aim assist ----------

// A laser straight down from the claw to whatever it would land on first, with a glowing spot
// where it hits. Only while aiming (and dropping) in a run started with aim assist on.
const TIP = 1.25; // How far below the hub the prong tips hang.
const beamMat = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
});
const glowMat = beamMat.clone();
glowMat.opacity = 0.22;
const spotMat = beamMat.clone();
spotMat.side = THREE.DoubleSide;

const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(0.025, 0.025, 1, 8),
  beamMat,
);
const glow = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.08, 1, 12),
  glowMat,
);
const spot = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.2, 24), spotMat);
const dot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), spotMat);
spot.add(dot);
const laser = new THREE.Group();
laser.add(beam, glow, spot);
laser.visible = false;
laser.renderOrder = 10;
scene.add(laser);

onTheme((t) => {
  for (const m of [beamMat, glowMat, spotMat]) m.color.setHex(t.laser);
});

const ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
const from = new THREE.Vector3();
const normal = new THREE.Vector3();

export function updateLaser(now) {
  laser.visible =
    game.mode === "play" &&
    game.assisted &&
    !game.paused &&
    (game.state === "aim" || game.state === "drop");
  if (!laser.visible) return;
  from.set(hub.position.x, hub.position.y - TIP, hub.position.z);
  ray.set(from, DOWN);
  const hit = ray.intersectObjects(
    [...plushies.map((p) => p.root), ...floorMeshes],
    true,
  )[0];
  const y = hit ? hit.point.y : 0;
  const len = Math.max(0.01, from.y - y);
  for (const m of [beam, glow]) {
    m.scale.y = len;
    m.position.set(from.x, from.y - len / 2, from.z);
  }
  // Lay the spot flat on whatever it hits, a hair above it, and let it pulse.
  normal.copy(hit?.face?.normal ?? THREE.Object3D.DEFAULT_UP);
  if (hit) normal.transformDirection(hit.object.matrixWorld);
  spot.position.set(from.x, y, from.z).addScaledVector(normal, 0.02);
  spot.lookAt(spot.position.clone().add(normal));
  spot.scale.setScalar(1 + 0.15 * Math.sin(now / 120));
}
