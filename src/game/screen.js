import { TOUCH, screenCanvas } from "./dom.js";
import { MG } from "./config.js";
import { screenTex } from "./cabinet.js";

import { game } from "./game.js";
import { theme } from "./settings.js";

// The screen font in the active theme, at `px` pixels.
const font = (px) => {
  const t = theme();
  return `${t.screen.weight ?? 400} ${px}px ${t.font}`;
};

// ---------- carriage screen ----------

export const sctx = screenCanvas.getContext("2d");
export const SW = screenCanvas.width;
export const SH = screenCanvas.height;
export const TRACK = { x: 14, y: 12, w: 110, h: SH - 24 };
export const METER = { x: 136, y: 12, w: 20, h: SH - 24 };
export const IDLE_TEXT = {
  home: ["RESET"],
  settle: ["STOCKING"],
  aim: ["ALIGN", "", TOUCH ? "TAP" : "SPACE", "TO DROP"],
  drop: ["DROP!"],
  close: ["GRAB!"],
  lift: ["UP UP"],
  top: ["..."],
  return: ["MISSED"],
  release: ["OPEN"],
  grace: ["..."],
};
export const MODE_TEXT = {
  title: ["PRESS", "START"],
  clear: ["YOU", "WIN!"],
  over: ["GAME", "OVER"],
};

// Level 2's prizes: cabinets drawn as boxes, customers as a head over a shirt in the tier colour.
const SKIN = "#d5a07a";
const GLOW = "#2f7fd8";
const ARCADE_ICONS = {
  // Level 3: the city.
  hall: (d) => {
    d.rect(-0.9, -0.9, 1.8, 1.9, d.color);
    d.rect(-0.7, -0.75, 1.4, 0.35, GLOW);
    d.rect(-0.55, -0.1, 0.35, 0.3, "#fff4e2");
    d.rect(0.2, -0.1, 0.35, 0.3, "#fff4e2");
    d.rect(-0.2, 0.45, 0.4, 0.55, d.ink);
  },
  tower: (d) => {
    d.rect(-0.55, -1.3, 1.1, 2.3, d.color);
    d.rect(-0.03, -1.7, 0.06, 0.4, d.ink);
    for (let y = -1.05; y < 0.8; y += 0.45)
      for (const x of [-0.35, 0.1]) d.rect(x, y, 0.25, 0.22, "#fff4e2");
  },
  cafe: (d) => {
    d.rect(-0.9, -0.4, 1.8, 1.4, d.color);
    for (let i = 0; i < 5; i++)
      d.rect(-1 + i * 0.4, -0.8, 0.4, 0.4, i % 2 ? d.color : "#fff4e2");
    d.rect(-0.7, 0.0, 0.8, 0.5, "#d8ecff");
    d.rect(0.3, 0.2, 0.35, 0.8, d.ink);
  },
  taxi: (d) => {
    d.rect(-0.6, -0.6, 1.2, 0.55, d.color);
    d.rect(-0.45, -0.5, 0.9, 0.3, GLOW);
    d.rect(-0.2, -0.8, 0.4, 0.2, "#f2a65a");
    d.rect(-1.15, -0.1, 2.3, 0.6, d.color);
    d.blob(-0.6, 0.55, 0.25, 0.25, d.ink);
    d.blob(0.6, 0.55, 0.25, 0.25, d.ink);
  },
  bus: (d) => {
    d.rect(-1.2, -0.75, 2.4, 1.3, d.color);
    for (const x of [-1.0, -0.35, 0.3]) d.rect(x, -0.55, 0.5, 0.4, GLOW);
    d.rect(0.95, -0.55, 0.15, 0.4, GLOW);
    d.blob(-0.7, 0.6, 0.25, 0.25, d.ink);
    d.blob(0.7, 0.6, 0.25, 0.25, d.ink);
  },
  pigeon: (d) => {
    d.blob(-0.1, 0.25, 0.85, 0.6, d.color);
    d.blob(0.55, -0.4, 0.38, 0.38, d.color);
    d.blob(0.98, -0.32, 0.16, 0.08, "#f2a65a");
    d.dot(0.62, -0.48, 0.09, d.ink);
    d.rect(-0.2, 0.8, 0.06, 0.3, "#f2a65a");
    d.rect(0.15, 0.8, 0.06, 0.3, "#f2a65a");
  },
  cabinet: (d) => {
    d.rect(-0.75, -1.3, 1.5, 2.3, d.color);
    d.rect(-0.6, -1.15, 1.2, 0.3, "#fff4e2");
    d.rect(-0.6, -0.7, 1.2, 0.75, GLOW);
    d.rect(-0.9, 0.15, 1.8, 0.3, d.color);
    d.dot(-0.4, 0.3, 0.12, d.ink);
    d.dot(0.3, 0.3, 0.1, "#f7a8b8");
  },
  pinball: (d) => {
    d.rect(-0.7, -1.3, 1.4, 1.0, d.color);
    d.rect(-0.55, -1.15, 1.1, 0.7, GLOW);
    d.rect(-1.0, -0.2, 2.0, 0.6, d.color);
    d.rect(-0.85, 0.4, 0.15, 0.7, d.ink);
    d.rect(0.7, 0.4, 0.15, 0.7, d.ink);
  },
  claw: (d) => {
    d.rect(-0.85, -1.3, 1.7, 0.4, d.color);
    d.rect(-0.8, -0.9, 1.6, 1.15, "#d8ecff");
    d.rect(-0.85, 0.25, 1.7, 0.8, d.color);
    d.dot(0.2, 0.0, 0.25, "#f7a8b8");
    d.dot(-0.3, 0.05, 0.2, "#f2a65a");
    d.rect(-0.04, -0.9, 0.08, 0.4, d.ink);
  },
  kid: (d) => {
    d.person();
    d.blob(0, -0.55, 0.66, 0.38, d.hair);
  },
  teen: (d) => {
    d.blob(0.55, 0.0, 0.22, 0.45, d.hair);
    d.person();
    d.blob(0, -0.6, 0.66, 0.36, d.hair);
    d.blob(-0.68, -0.25, 0.14, 0.24, d.ink);
    d.blob(0.68, -0.25, 0.14, 0.24, d.ink);
  },
  grandpa: (d) => {
    d.person();
    d.blob(-0.55, -0.35, 0.18, 0.26, "#c9c4bd");
    d.blob(0.55, -0.35, 0.18, 0.26, "#c9c4bd");
    d.blob(0, 0.02, 0.28, 0.1, "#c9c4bd");
  },
};
function drawArcadeIcon(c, draw, color, x, y, s) {
  const ink = theme().screen.outline;
  c.strokeStyle = ink;
  c.lineWidth = Math.max(2, s / 6);
  const d = {
    color,
    ink,
    hair: "#3d2817",
    rect(rx, ry, w, h, fill) {
      c.fillStyle = fill;
      c.fillRect(x + rx * s, y + ry * s, w * s, h * s);
      c.strokeRect(x + rx * s, y + ry * s, w * s, h * s);
    },
    blob(bx, by, rx, ry, fill) {
      c.fillStyle = fill;
      c.beginPath();
      c.ellipse(x + bx * s, y + by * s, rx * s, ry * s, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    },
    dot(bx, by, r, fill) {
      c.fillStyle = fill;
      c.beginPath();
      c.arc(x + bx * s, y + by * s, r * s, 0, Math.PI * 2);
      c.fill();
    },
    person() {
      d.blob(0, 0.85, 0.85, 0.5, color);
      d.blob(0, -0.25, 0.62, 0.62, SKIN);
      d.dot(-0.24, -0.2, 0.1, ink);
      d.dot(0.24, -0.2, 0.1, ink);
    },
  };
  draw(d);
}

// Pixel-ish portrait of the hooked plushie, drawn in its tier colour.
export function drawPlushIcon(c, icon, color, x, y, s) {
  if (ARCADE_ICONS[icon])
    return drawArcadeIcon(c, ARCADE_ICONS[icon], color, x, y, s);
  c.fillStyle = color;
  c.strokeStyle = theme().screen.outline;
  c.lineWidth = Math.max(2, s / 6);
  const blob = (bx, by, rx, ry, rot = 0) => {
    c.beginPath();
    c.ellipse(bx, by, rx, ry, rot, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  };
  if (icon === "bear")
    for (const k of [-1, 1])
      blob(x + k * 0.72 * s, y - 0.72 * s, 0.38 * s, 0.38 * s);
  if (icon === "bunny")
    for (const k of [-1, 1])
      blob(x + k * 0.38 * s, y - 1.2 * s, 0.24 * s, 0.7 * s, k * 0.15);
  if (icon === "frog")
    for (const k of [-1, 1])
      blob(x + k * 0.5 * s, y - 0.75 * s, 0.36 * s, 0.36 * s);
  if (icon === "pig")
    for (const k of [-1, 1])
      blob(x + k * 0.62 * s, y - 0.82 * s, 0.26 * s, 0.32 * s, k * 0.5);
  if (icon === "cat" || icon === "fox")
    for (const k of [-1, 1]) {
      const tall = icon === "fox" ? 1.45 : 1.25;
      c.beginPath();
      c.moveTo(x + k * 0.95 * s, y - 0.25 * s);
      c.lineTo(x + k * 0.8 * s, y - tall * s);
      c.lineTo(x + k * 0.2 * s, y - 0.85 * s);
      c.closePath();
      c.fill();
      c.stroke();
    }
  if (icon === "axolotl")
    for (const k of [-1, 1])
      for (const a of [-0.6, 0, 0.6])
        blob(
          x + k * 1.25 * s,
          y - 0.15 * s + a * 0.6 * s,
          0.32 * s,
          0.14 * s,
          a * k,
        );
  const wide = ["axolotl", "cat", "frog", "fox"].includes(icon);
  blob(x, y, (wide ? 1.15 : 1) * s, (icon === "frog" ? 0.85 : 1) * s);
  if (icon === "penguin") {
    c.fillStyle = "#fff4e2";
    blob(x, y + 0.12 * s, 0.75 * s, 0.7 * s);
  }
  if (icon === "fox") {
    c.fillStyle = "#fff4e2";
    blob(x, y + 0.42 * s, 0.55 * s, 0.38 * s);
  }
  if (icon === "pig") {
    c.fillStyle = color;
    blob(x, y + 0.32 * s, 0.38 * s, 0.26 * s);
  }
  if (icon === "duck" || icon === "penguin") {
    c.fillStyle = "#f2a65a";
    blob(x, y + 0.36 * s, (icon === "duck" ? 0.42 : 0.22) * s, 0.18 * s);
  }
  if (icon === "dog")
    for (const k of [-1, 1]) {
      c.fillStyle = color;
      blob(x + k * 0.95 * s, y + 0.05 * s, 0.3 * s, 0.6 * s, -k * 0.3);
    }
  c.fillStyle = theme().screen.outline;
  for (const k of [-1, 1]) {
    c.beginPath();
    c.arc(x + k * 0.38 * s, y - 0.12 * s, 0.13 * s, 0, Math.PI * 2);
    c.fill();
  }
  if (icon === "pig")
    for (const k of [-1, 1]) {
      c.beginPath();
      c.arc(x + k * 0.12 * s, y + 0.32 * s, 0.06 * s, 0, Math.PI * 2);
      c.fill();
    }
  else if (icon !== "duck" && icon !== "penguin") {
    c.beginPath();
    c.arc(x, y + 0.28 * s, 0.11 * s, 0, Math.PI * 2);
    c.fill();
  }
}

export function drawScreen() {
  const c = sctx;
  const th = theme().screen;
  c.fillStyle = th.background;
  c.fillRect(0, 0, SW, SH);
  c.fillStyle = th.track;
  c.fillRect(TRACK.x, TRACK.y, TRACK.w, TRACK.h);
  c.fillStyle = th.lines;
  for (let i = 0; i < 6; i++)
    c.fillRect(TRACK.x, TRACK.y + 20 + i * 48, TRACK.w, 2);
  c.fillStyle = th.meter;
  c.fillRect(METER.x, METER.y, METER.w, METER.h);
  c.textAlign = "center";
  const y = (n) => TRACK.y + TRACK.h - n * TRACK.h;
  const mg = game.mg;

  if (mg) {
    const bh = mg.tier.barHeight * TRACK.h;
    c.fillStyle = th.bar;
    c.fillRect(TRACK.x + 4, y(mg.barPos) - bh, TRACK.w - 8, bh);
    c.strokeStyle = th.barEdge;
    c.lineWidth = 2;
    c.strokeRect(TRACK.x + 4, y(mg.barPos) - bh, TRACK.w - 8, bh);
    drawPlushIcon(
      c,
      mg.animal.icon,
      mg.tier.css,
      TRACK.x + TRACK.w / 2,
      y(mg.fishPos),
      11,
    );
    const p = mg.progress;
    c.fillStyle = `hsl(${p * 120},80%,50%)`;
    c.fillRect(
      METER.x + 2,
      METER.y + METER.h - p * METER.h,
      METER.w - 4,
      p * METER.h,
    );
    // time remaining
    c.fillStyle = th.text;
    c.fillRect(
      TRACK.x,
      SH - 8,
      TRACK.w * Math.max(0, 1 - mg.t / MG.timeLimit),
      4,
    );
    c.font = font(12);
    if (mg.result) {
      const label = {
        caught: mg.perfect ? "PERFECT!" : "CAUGHT!",
        slipped: "SLIPPED",
        escaped: "ESCAPED",
        timeout: "TIME!",
      };
      c.fillStyle = th.ink;
      c.fillText(label[mg.result], TRACK.x + TRACK.w / 2 + 2, 42);
      c.fillStyle = th.text;
      c.fillText(label[mg.result], TRACK.x + TRACK.w / 2, 40);
    } else {
      c.font = font(8);
      c.fillStyle = mg.tier.css;
      c.fillText(`${mg.tier.points} PTS`, TRACK.x + TRACK.w / 2, 34);
    }
  } else {
    c.font = font(11);
    c.fillStyle = th.text;
    const lines = MODE_TEXT[game.mode] ?? IDLE_TEXT[game.state] ?? [];
    lines.forEach((l, i) =>
      c.fillText(l, TRACK.x + TRACK.w / 2, SH / 2 - 20 + i * 18),
    );
  }
  screenTex.needsUpdate = true;
}
