import {
  assistTagEl,
  bestEl,
  heartsEl,
  leftEl,
  popupsEl,
  scoreEl,
  streakEl,
} from "./dom.js";
import { RULES } from "./config.js";
import { streakMult as multForStreak } from "./rules.js";
import { plushies } from "./plushies.js";
import { loadScores } from "./scores.js";
import { game } from "./game.js";

// ---------- HUD ----------

export const fmt = (n) => Math.round(n).toLocaleString("en-US");
export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

export const HEART_RECTS = [
  ".XX.XX.",
  "XXXXXXX",
  "XXXXXXX",
  ".XXXXX.",
  "..XXX..",
  "...X...",
]
  .flatMap((row, y) =>
    [...row].map((c, x) =>
      c === "X" ? `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>` : "",
    ),
  )
  .join("");
export const heartSvg = (cls = "") =>
  `<svg class="${cls}" viewBox="0 0 7 6" shape-rendering="crispEdges">${HEART_RECTS}</svg>`;

export function renderHearts() {
  // Down to the last heart, the hearts race.
  heartsEl.classList.toggle("low", game.lives <= 1 && game.mode === "play");
  heartsEl.innerHTML = Array.from({ length: RULES.lives }, (_, i) => {
    const f = Math.max(0, Math.min(1, game.lives - i));
    return `<span class="heart">${heartSvg("empty")}<span class="fill" style="width:${f * 100}%">${heartSvg()}</span></span>`;
  }).join("");
}

export const streakMult = () => multForStreak(game.streak);

export function renderHud() {
  renderHearts();
  const best = Math.max(loadScores()[0]?.score ?? 0, game.score);
  bestEl.innerHTML = `BEST <b>${fmt(best)}</b>`;
  leftEl.innerHTML = `<b>${plushies.length}</b> LEFT`;
  const hot = game.streak > 0;
  streakEl.innerHTML = hot
    ? `<b>x${streakMult()}</b> STREAK${game.streak > 1 ? ` &middot; ${game.streak} IN A ROW` : ""}`
    : "";
  streakEl.classList.toggle("on", hot);
  streakEl.classList.toggle("fire", game.streak >= 3);
  assistTagEl.hidden = !(game.mode === "play" && game.assisted);
}

// "+250" floating up off the score.
export function floatScore(text) {
  const el = document.createElement("span");
  el.className = "score-float";
  el.textContent = text;
  // Anchored to the score box, so it floats up right beside the number.
  scoreEl.parentElement.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

export function popup(main, detail, color, big = false) {
  const el = document.createElement("div");
  el.className = big ? "popup big" : "popup";
  el.style.color = color;
  el.innerHTML = `<b>${main}</b>${detail ? `<small>${detail}</small>` : ""}`;
  popupsEl.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

// The score counts up toward the real value instead of jumping.
export let shownScore = 0;
export function tallyScore(dt) {
  if (shownScore === game.score) return;
  const step = Math.max(1, (game.score - shownScore) * Math.min(1, dt * 5));
  shownScore =
    game.score < shownScore
      ? game.score
      : Math.min(game.score, shownScore + step);
  scoreEl.textContent = fmt(shownScore);
  // Glows while it counts up.
  scoreEl.classList.toggle("ticking", shownScore !== game.score);
}
export function resetScore() {
  shownScore = 0;
  scoreEl.textContent = "0";
}
export function bumpScore() {
  scoreEl.classList.remove("bump");
  void scoreEl.offsetWidth;
  scoreEl.classList.add("bump");
}
