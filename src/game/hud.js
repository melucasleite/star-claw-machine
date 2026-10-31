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
  renderStreak();
  const why = [game.assisted && "AIM ASSIST", game.family && "OUR FAMILY"]
    .filter(Boolean)
    .join(" + ");
  assistTagEl.hidden = !(game.mode === "play" && why);
  if (why) assistTagEl.innerHTML = `${why} &middot; UNRANKED`;
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

// The combo counter: a multiplier that punches in when the streak grows, heats from gold to red
// as it climbs, and shakes off when the streak breaks. Only changes animate, so the many
// re-renders in between leave it still.
let shownStreak = 0;
// Once it has shaken off, it takes up no room.
streakEl.addEventListener("animationend", (e) => {
  if (e.animationName === "streak-break") streakEl.classList.remove("break");
});
const replay = (el, cls) => {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
};
function renderStreak() {
  const n = game.mode === "play" ? game.streak : 0;
  if (n === shownStreak) return;
  const grew = n > shownStreak;
  shownStreak = n;
  if (!n) {
    if (streakEl.classList.contains("on")) replay(streakEl, "break");
    streakEl.classList.remove("on");
    return;
  }
  const mult = streakMult();
  streakEl.classList.remove("break");
  streakEl.classList.add("on");
  // 1 = x1.5 ... 4 = x3, the cap.
  streakEl.dataset.heat = String(Math.round((mult - 1) / RULES.streakStep));
  streakEl.innerHTML = `<b>x${mult}</b>`;
  streakEl.setAttribute("aria-label", `Streak x${mult}`);
  if (grew) replay(streakEl.querySelector("b"), "up");
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
