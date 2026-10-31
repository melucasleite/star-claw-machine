import * as THREE from "three";
import { CHUTE, CLAW, GRIP } from "./config.js";
import { claw, hub, prongs } from "./claw.js";
import { scene } from "./scene.js";
import { theme } from "./settings.js";
import { noise, setMusicLevel, tone } from "./audio.js";
import { G_PRIZE, G_STATIC } from "./physics.js";

// ---------- the eel ----------

// A Halloween secret: drop the claw straight down the chute hole and it doesn't stop at the floor.
// It sinks into the dark, clamps on something, and slowly hauls up a big skeleton eel (glowing eyes,
// a snapping jaw, a long swaying spine), which growls, then drops back down the hole. Free: it's
// not a turn, so it costs no heart and keeps the streak.
export const overHole = () =>
  hub.position.x < -CHUTE.edge && hub.position.z > CHUTE.edge;
export const eelReady = () => theme().id === "halloween" && overHole();

// The timeline, in order: line up over the hole, sink into it, grab, haul up, show off, let go,
// then the claw goes back up.
const DEPTH = -1.7;
const SHOW_Y = 6.4;
const SEGMENTS = 22;

const bone = new THREE.MeshStandardMaterial({
  color: 0xe6dcc3,
  roughness: 0.6,
});
const sphere = new THREE.SphereGeometry(1, 16, 12);
const eyeGlow = new THREE.MeshBasicMaterial({
  color: 0x9bff5a,
  toneMapped: false,
});
const dark = new THREE.MeshBasicMaterial({ color: 0x0c070a });

function ball(mat, r, x, y, z, s = [1, 1, 1]) {
  const m = new THREE.Mesh(sphere, mat);
  m.scale.set(r * s[0], r * s[1], r * s[2]);
  m.position.set(x, y, z);
  return m;
}
function teeth(g, y, z0, flip) {
  for (let i = -3; i <= 3; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.11, 6), bone);
    const a = (i / 3) * 0.9;
    t.position.set(Math.sin(a) * 0.16, y, z0 + Math.cos(a) * 0.32);
    if (flip) t.rotation.x = Math.PI;
    g.add(t);
  }
}

// The skull faces +z; the spine hangs down from the back of it.
function buildEel() {
  const g = new THREE.Group();
  const head = new THREE.Group();
  head.add(ball(bone, 0.34, 0, 0.05, 0, [0.95, 0.75, 1.3]));
  head.add(ball(bone, 0.2, 0, 0.0, 0.36, [0.85, 0.6, 1.2]));
  for (const s of [-1, 1]) {
    head.add(ball(dark, 0.11, 0.17 * s, 0.13, 0.22, [1, 1, 0.6]));
    head.add(ball(eyeGlow, 0.055, 0.18 * s, 0.13, 0.27));
    // A ridge of spikes down the crown.
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 6), bone);
    spike.position.set(0.09 * s, 0.32, -0.1);
    spike.rotation.z = -0.4 * s;
    head.add(spike);
  }
  teeth(head, -0.08, 0.06, true);
  // The lower jaw hinges at the back, so it can snap.
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.12, -0.12);
  jaw.add(ball(bone, 0.24, 0, -0.03, 0.32, [0.8, 0.3, 1.3]));
  teeth(jaw, 0.03, 0.18, false);
  head.add(jaw);
  const glow = new THREE.PointLight(0x9bff5a, 4, 4, 2);
  glow.position.set(0, 0.2, 0.5);
  head.add(glow);
  g.add(head);
  // The spine: vertebrae shrinking toward the tail, ribs on the front two thirds.
  const spine = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const seg = new THREE.Group();
    const r = 0.11 - (i / SEGMENTS) * 0.07;
    seg.add(ball(bone, r, 0, 0, 0, [1, 0.7, 1]));
    if (i < SEGMENTS * 0.65) {
      const span = 0.26 - i * 0.008;
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(span, 0.022, 5, 14, Math.PI * 1.25),
        bone,
      );
      rib.rotation.set(Math.PI / 2, 0, -Math.PI * 0.12);
      seg.add(rib);
    }
    if (i === SEGMENTS - 1)
      for (const s of [-1, 1]) {
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 5), bone);
        fin.position.set(0.08 * s, -0.18, 0);
        fin.rotation.z = Math.PI + 0.5 * s;
        seg.add(fin);
      }
    g.add(seg);
    spine.push(seg);
  }
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  // Big enough to fill the cabinet as it rises: about half its height, nose to tail.
  g.scale.setScalar(1.7);
  return { g, head, jaw, spine };
}

// Low, scary-ish but silly: a growl with a wobble, and a rattle of bones.
const growl = (t = 0) => {
  tone({ f: 82, f2: 58, t, dur: 1.4, vol: 0.12, type: "sawtooth" });
  tone({ f: 87, f2: 61, t: t + 0.05, dur: 1.3, vol: 0.08, type: "sawtooth" });
};
const rattle = (t = 0, n = 6) => {
  for (let i = 0; i < n; i++)
    noise({ t: t + i * 0.07, dur: 0.05, vol: 0.12, freq: 2400, q: 6 });
};

let eel = null;
let run = null;

export function startEel() {
  run = { phase: "center", t: 0, fall: 0 };
  // The prongs pass through the chute guard while they're down the hole.
  for (const p of prongs) p.body.collisionFilterMask = 0;
  setMusicLevel(0.35);
  tone({ f: 220, f2: 55, dur: 1.8, vol: 0.06, type: "sine" });
}

const next = (phase) => {
  run.phase = phase;
  run.t = 0;
};
// Moves the hub toward (x, y, z) at `speed`; true once it's there.
function moveTo(v, x, y, z, speed, dt) {
  const dx = x - hub.position.x;
  const dy = y - hub.position.y;
  const dz = z - hub.position.z;
  const d = Math.hypot(dx, dy, dz);
  if (d < 0.01) return true;
  const s = Math.min(speed, d / dt) / d;
  v.set(dx * s, dy * s, dz * s);
  return false;
}

// One step of the sequence, with the hub's velocity `v` to set. Returns true when it's over.
export function stepEel(dt, v) {
  run.t += dt;
  const { x, z } = { x: CHUTE.x, z: CHUTE.z };
  switch (run.phase) {
    case "center":
      if (moveTo(v, x, hub.position.y, z, CLAW.moveSpeed, dt)) next("down");
      break;
    case "down":
      claw.closing = false;
      if (moveTo(v, x, DEPTH, z, CLAW.dropSpeed, dt)) {
        claw.closing = true;
        claw.torque = GRIP.max;
        noise({ dur: 0.08, vol: 0.2, freq: 900, q: 2 });
        eel ??= buildEel();
        scene.add(eel.g);
        next("grab");
      }
      break;
    case "grab":
      if (run.t > 0.8) {
        growl();
        rattle(0.2);
        next("up");
      }
      break;
    case "up":
      if (moveTo(v, x, SHOW_Y, z, CLAW.liftSpeed * 0.6, dt)) {
        growl();
        noise({ dur: 0.7, vol: 0.08, freq: 5000, type: "highpass" });
        next("show");
      }
      break;
    case "show":
      if (run.t > 1.8) {
        claw.closing = false;
        rattle(0, 8);
        tone({ f: 300, f2: 60, dur: 1.1, vol: 0.07, type: "triangle" });
        next("drop");
      }
      break;
    case "drop":
      run.fall += 16 * dt;
      eel.g.position.y -= run.fall * dt;
      eel.g.rotation.z += dt * 0.8;
      if (eel.g.position.y < -5) {
        scene.remove(eel.g);
        next("home");
      }
      break;
    case "home":
      if (moveTo(v, x, CLAW.topY, z, CLAW.liftSpeed, dt)) {
        for (const p of prongs) p.body.collisionFilterMask = G_STATIC | G_PRIZE;
        setMusicLevel(1);
        run = null;
        return true;
      }
      break;
  }
  return false;
}

// Leaving the sequence early (cashing out, a restart): put everything back.
export function cancelEel() {
  if (!run) return;
  for (const p of prongs) p.body.collisionFilterMask = G_STATIC | G_PRIZE;
  if (eel) scene.remove(eel.g);
  setMusicLevel(1);
  run = null;
}

// Called every frame: the eel hangs from the claw by its head, swaying, its jaw snapping.
export function animateEel(now) {
  if (!eel || !eel.g.parent) return;
  const t = now / 1000;
  if (run?.phase !== "drop") {
    // Held by the crown, just below the prongs, so the skull is in full view.
    eel.g.position.set(hub.position.x, hub.position.y - 1.75, hub.position.z);
    eel.g.rotation.set(0, Math.PI / 4 + Math.sin(t * 0.9) * 0.25, 0);
    eel.head.rotation.x = 0.35;
  }
  const angry = run?.phase === "show";
  eel.jaw.rotation.x = angry
    ? 0.15 + Math.abs(Math.sin(t * 9)) * 0.45
    : 0.12 + Math.sin(t * 2) * 0.06;
  eel.head.rotation.z = Math.sin(t * 1.7) * 0.12;
  // The spine hangs from the back of the skull in a slow S that swings more toward the tail.
  eel.spine.forEach((seg, i) => {
    const k = (i + 1) / SEGMENTS;
    const sway = Math.sin(t * 2.6 - i * 0.42) * 0.55 * k;
    seg.position.set(
      sway,
      -0.25 - i * 0.24,
      -0.25 + Math.cos(t * 2 - i * 0.3) * 0.18 * k,
    );
    seg.rotation.z = Math.cos(t * 2.6 - i * 0.42) * 0.5 * k;
  });
}

// For playtesting from the console (window.__claw.eel()).
export const eelState = () => ({
  phase: run?.phase ?? null,
  inScene: !!eel?.g.parent,
  y: eel?.g.position.y ?? null,
  hubY: hub.position.y,
});
