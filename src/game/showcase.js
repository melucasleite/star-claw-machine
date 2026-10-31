import * as THREE from "three";
import { buildPlushGroup } from "./plushies.js";
import { tone } from "./audio.js";
import { theme } from "./settings.js";

// ---------- collection showcase ----------

// The collection's 3D side: a little studio with its own renderer. It paints thumbnails for the
// gallery, and runs the close-up viewer, where a prize can be spun, zoomed and poked: a poke
// squashes it, boings the part you hit, wobbles its eyes like googly eyes and pops a heart.
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(0x000000, 0);
const studio = new THREE.Scene();
studio.add(new THREE.HemisphereLight(0xffffff, 0x6b5a4a, 1.3));
const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
key.position.set(2.5, 4, 3.5);
const rim = new THREE.DirectionalLight(0xcfe3ff, 1.4);
rim.position.set(-3, 2, -3);
studio.add(key, rim);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

// Centre a prize on the origin and size it to `fit` units across its biggest side.
function stage(tier, kind, fit) {
  const group = buildPlushGroup(tier, kind);
  const holder = new THREE.Group();
  holder.add(group);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const k = fit / Math.max(size.x, size.y, size.z);
  group.scale.setScalar(k);
  group.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-k));
  studio.add(holder);
  return holder;
}

// ----- thumbnails -----

const thumbs = {};
const thumbKey = (tier, kind) =>
  `${theme().id}:${tier.name}:${tier.color}:${kind.name}`;
export function thumbnail(tier, kind) {
  const id = thumbKey(tier, kind);
  if (thumbs[id]) return thumbs[id];
  renderer.setPixelRatio(1);
  renderer.setSize(128, 128, false);
  camera.aspect = 1;
  camera.position.set(0, 0.5, 4.4);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  const holder = stage(tier, kind, 1.7);
  holder.rotation.set(0.15, 0.6, 0);
  renderer.render(studio, camera);
  studio.remove(holder);
  return (thumbs[id] = renderer.domElement.toDataURL());
}

// Fills every <img data-thumb> under `root` a few at a time, so a big gallery opens at once.
// `items[i]` is the { tier, kind } for data-thumb="i". Returns a cancel function.
export function fillThumbs(root, items) {
  let cancelled = false;
  const imgs = [...root.querySelectorAll("img[data-thumb]")];
  const step = () => {
    if (cancelled || detail) return;
    for (const img of imgs.splice(0, 4)) {
      const { tier, kind } = items[img.dataset.thumb];
      img.src = thumbnail(tier, kind);
    }
    if (imgs.length) setTimeout(step, 0);
  };
  step();
  return () => (cancelled = true);
}

// ----- close-up viewer -----

let detail = null;
const SPRING = { stiffness: 220, damping: 12 };
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Mounts the viewer into `host` for one prize. Returns an unmount function.
export function showDetail(host, tier, kind) {
  closeDetail();
  const size = Math.min(360, host.clientWidth || 300);
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setSize(size, size, false);
  const canvas = renderer.domElement;
  canvas.className = "showcase-canvas";
  canvas.style.width = canvas.style.height = `${size}px`;
  host.prepend(canvas);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  const holder = stage(tier, kind, 2.1);
  // The eyes: small dark buttons. They wobble like googly eyes when poked.
  const eyes = [];
  holder.traverse((m) => {
    const p = m.userData.part;
    if (m.isMesh && p && (p.mat === "dark" || p.mat === "nose") && p.r < 0.08)
      eyes.push({ mesh: m, base: m.position.clone(), t: 9 });
  });
  const d = (detail = {
    host,
    holder,
    eyes,
    yaw: 0.5,
    pitch: 0.12,
    spin: 0,
    zoom: 4.2,
    squash: { a: 0, v: 0 },
    boings: [],
    last: performance.now(),
    drag: null,
    raf: 0,
  });

  const frame = (now) => {
    const dt = Math.min(0.05, (now - d.last) / 1000);
    d.last = now;
    // Idle: a slow turn once nobody's touching it, and a little breathing.
    if (!d.drag) d.yaw += (d.spin + 0.25) * dt;
    d.spin *= Math.pow(0.05, dt);
    const q = d.squash;
    q.v += (-SPRING.stiffness * q.a - SPRING.damping * q.v) * dt;
    q.a = Math.max(-0.35, Math.min(0.35, q.a + q.v * dt));
    const breathe = 1 + 0.012 * Math.sin(now / 700);
    holder.scale.set(
      (1 + q.a / 2) * breathe,
      (1 - q.a) * breathe,
      (1 + q.a / 2) * breathe,
    );
    holder.rotation.set(d.pitch, d.yaw, 0);
    // Poked parts boing back to size.
    for (const b of d.boings) {
      b.v += (-SPRING.stiffness * b.a - SPRING.damping * 0.6 * b.v) * dt;
      b.a += b.v * dt;
      b.mesh.scale.copy(b.base).multiplyScalar(1 + b.a);
    }
    // Googly eyes: jiggle about their spot, settling down.
    for (const e of eyes) {
      e.t += dt;
      const wob = Math.exp(-e.t * 3) * 0.035;
      e.mesh.position.set(
        e.base.x + Math.sin(e.t * 31) * wob,
        e.base.y + Math.cos(e.t * 27) * wob,
        e.base.z,
      );
    }
    camera.position.set(0, 0.35, d.zoom);
    camera.lookAt(0, 0, 0);
    renderer.render(studio, camera);
    d.raf = requestAnimationFrame(frame);
  };
  d.raf = requestAnimationFrame(frame);

  canvas.onpointerdown = (e) => {
    canvas.setPointerCapture(e.pointerId);
    d.drag = {
      x: e.clientX,
      y: e.clientY,
      x0: e.clientX,
      y0: e.clientY,
      moved: 0,
    };
  };
  canvas.onpointermove = (e) => {
    if (!d.drag) return;
    const dx = e.clientX - d.drag.x;
    const dy = e.clientY - d.drag.y;
    d.drag.x = e.clientX;
    d.drag.y = e.clientY;
    d.drag.moved += Math.abs(dx) + Math.abs(dy);
    d.yaw += dx * 0.012;
    d.pitch = Math.max(-0.8, Math.min(0.9, d.pitch + dy * 0.01));
    d.spin = dx * 0.4;
  };
  canvas.onpointerup = (e) => {
    const tap = d.drag && d.drag.moved < 8;
    d.drag = null;
    if (tap) poke(e);
  };
  canvas.onwheel = (e) => {
    e.preventDefault();
    d.zoom = Math.max(2.6, Math.min(6, d.zoom + e.deltaY * 0.004));
  };
  // Two-finger pinch zooms on a phone.
  let pinch = null;
  canvas.ontouchmove = (e) => {
    if (e.touches.length !== 2) return (pinch = null);
    e.preventDefault();
    const [a, b] = e.touches;
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (pinch)
      d.zoom = Math.max(2.6, Math.min(6, d.zoom - (dist - pinch) * 0.01));
    pinch = dist;
  };

  function poke(e) {
    const r = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObject(holder, true)[0];
    if (!hit) return;
    // Squash the whole thing, boing the bit you hit, wobble the eyes.
    d.squash.v += 4.5;
    const mesh = hit.object;
    let b = d.boings.find((x) => x.mesh === mesh);
    if (!b) d.boings.push((b = { mesh, base: mesh.scale.clone(), a: 0, v: 0 }));
    b.v += 5;
    for (const eye of eyes) eye.t = 0;
    d.spin += (Math.random() - 0.5) * 3;
    tone({
      f: 420 + Math.random() * 260,
      f2: 900,
      dur: 0.14,
      vol: 0.08,
      type: "sine",
    });
    // A heart pops out where you poked.
    const heart = document.createElement("i");
    heart.className = "poke-heart";
    heart.textContent = "♥";
    heart.style.left = `${e.clientX - r.left}px`;
    heart.style.top = `${e.clientY - r.top}px`;
    host.append(heart);
    heart.addEventListener("animationend", () => heart.remove());
  }
  return closeDetail;
}

export function closeDetail() {
  if (!detail) return;
  cancelAnimationFrame(detail.raf);
  studio.remove(detail.holder);
  const canvas = renderer.domElement;
  canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = null;
  canvas.onwheel = canvas.ontouchmove = null;
  canvas.remove();
  detail = null;
}
