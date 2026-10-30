import { fxCanvas, popupsEl } from "./dom.js";
import { TIERS } from "./config.js";
import { pick } from "./plushies.js";

// ---------- confetti ----------

export const fx = fxCanvas.getContext("2d");
export const confetti = [];
export const CONFETTI_COLORS = [
  ...TIERS.map((t) => t.css),
  "#ffd75e",
  "#fff4dc",
];
export function sizeFx() {
  const d = Math.min(devicePixelRatio, 2);
  fxCanvas.width = innerWidth * d;
  fxCanvas.height = innerHeight * d;
  fx.setTransform(d, 0, 0, d, 0, 0);
}
export const piece = (x, y, vx, vy, life) => ({
  x,
  y,
  vx,
  vy,
  life,
  rot: Math.random() * 6.28,
  spin: (Math.random() - 0.5) * 12,
  w: 6 + Math.random() * 6,
  h: 4 + Math.random() * 4,
  color: pick(CONFETTI_COLORS),
});
export function burst(x, y, n, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
    const s = (200 + Math.random() * 380) * power;
    confetti.push(
      piece(x, y, Math.cos(a) * s, Math.sin(a) * s, 3 + Math.random()),
    );
  }
}
export function rain(n) {
  for (let i = 0; i < n; i++) {
    const p = piece(
      Math.random() * innerWidth,
      -20 - Math.random() * innerHeight * 1.5,
      (Math.random() - 0.5) * 80,
      80 + Math.random() * 80,
      9,
    );
    confetti.push(p);
  }
}
export let fxDirty = false;
export function stepFx(dt) {
  if (!confetti.length && !fxDirty) return;
  fx.clearRect(0, 0, innerWidth, innerHeight);
  fxDirty = confetti.length > 0;
  const drag = Math.pow(0.35, dt);
  for (let i = confetti.length - 1; i >= 0; i--) {
    const p = confetti[i];
    p.life -= dt;
    p.vx *= drag;
    p.vy = p.vy * drag + 500 * dt;
    p.x += p.vx * dt + Math.sin(p.rot) * 20 * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
    if (p.life <= 0 || p.y > innerHeight + 30) {
      confetti.splice(i, 1);
      continue;
    }
    fx.save();
    fx.globalAlpha = Math.min(1, p.life);
    fx.translate(p.x, p.y);
    fx.rotate(p.rot);
    fx.fillStyle = p.color;
    fx.fillRect(
      -p.w / 2,
      (-p.h / 2) * Math.cos(p.rot * 2),
      p.w,
      p.h * Math.cos(p.rot * 2),
    );
    fx.restore();
  }
}
export function popupPoint() {
  const r = popupsEl.getBoundingClientRect();
  return [r.left, r.top + 20];
}
