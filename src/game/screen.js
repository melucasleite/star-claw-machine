import { TOUCH, screenCanvas } from "./dom.js";
import { MG } from "./config.js";
import { screenTex } from "./cabinet.js";

import { game } from "./game.js";

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

// Pixel-ish portrait of the hooked plushie, drawn in its tier colour.
export function drawPlushIcon(c, icon, color, x, y, s) {
  c.fillStyle = color;
  c.strokeStyle = "#3a2a1a";
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
  c.fillStyle = "#3a2a1a";
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
  c.fillStyle = "#14233d";
  c.fillRect(0, 0, SW, SH);
  c.fillStyle = "#2a6fdb";
  c.fillRect(TRACK.x, TRACK.y, TRACK.w, TRACK.h);
  c.fillStyle = "#4b8cf0";
  for (let i = 0; i < 6; i++)
    c.fillRect(TRACK.x, TRACK.y + 20 + i * 48, TRACK.w, 2);
  c.fillStyle = "#222";
  c.fillRect(METER.x, METER.y, METER.w, METER.h);
  c.textAlign = "center";
  const y = (n) => TRACK.y + TRACK.h - n * TRACK.h;
  const mg = game.mg;

  if (mg) {
    const bh = mg.tier.barHeight * TRACK.h;
    c.fillStyle = "rgba(94,224,94,0.55)";
    c.fillRect(TRACK.x + 4, y(mg.barPos) - bh, TRACK.w - 8, bh);
    c.strokeStyle = "#5ee05e";
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
    c.fillStyle = "#ffd75e";
    c.fillRect(
      TRACK.x,
      SH - 8,
      TRACK.w * Math.max(0, 1 - mg.t / MG.timeLimit),
      4,
    );
    c.font = '12px "Press Start 2P", monospace';
    if (mg.result) {
      const label = {
        caught: mg.perfect ? "PERFECT!" : "CAUGHT!",
        slipped: "SLIPPED",
        escaped: "ESCAPED",
        timeout: "TIME!",
      };
      c.fillStyle = "#3a2a1a";
      c.fillText(label[mg.result], TRACK.x + TRACK.w / 2 + 2, 42);
      c.fillStyle = "#ffd75e";
      c.fillText(label[mg.result], TRACK.x + TRACK.w / 2, 40);
    } else {
      c.font = '8px "Press Start 2P", monospace';
      c.fillStyle = mg.tier.css;
      c.fillText(`${mg.tier.points} PTS`, TRACK.x + TRACK.w / 2, 34);
    }
  } else {
    c.font = '11px "Press Start 2P", monospace';
    c.fillStyle = "#ffd75e";
    const lines = MODE_TEXT[game.mode] ?? IDLE_TEXT[game.state] ?? [];
    lines.forEach((l, i) =>
      c.fillText(l, TRACK.x + TRACK.w / 2, SH / 2 - 20 + i * 18),
    );
  }
  screenTex.needsUpdate = true;
}
