import { TOUCH, confirmEl, overlayEl, panelEl } from "./dom.js";
import { TIERS } from "./config.js";
import {
  BOARD_SIZE,
  WORLD,
  cleanName,
  globalBoard,
  loadScores,
  makesBoard,
  makesWorld,
  postWorld,
  saveScore,
} from "./scores.js";
import { keys } from "./input.js";
import { esc, fmt, renderHud } from "./hud.js";
import { cashOutBonus, game, gameOver, startGame } from "./game.js";
import { collectionHtml, prizeImg } from "./bag.js";
import { sfx } from "./audio.js";

// ---------- overlays ----------

export function setMode(mode) {
  game.mode = mode;
  game.modeAt = performance.now();
  document.body.dataset.mode = mode;
}

export const tiersHtml = () =>
  `<div class="tiers">${TIERS.map(
    (t) =>
      `<div><i class="dot" style="background:${t.css}"></i>${t.name.toUpperCase()}<b>${t.points}</b></div>`,
  ).join("")}</div><p>Easy &rarr; hard. Cherry is the tough one.</p>`;

export function listHtml(rows, size, pending, isMine) {
  rows = [...rows];
  if (pending) rows.push({ name: "???", score: pending, you: true });
  rows.sort((a, b) => b.score - a.score);
  if (!rows.length) return `<p class="empty">No scores yet. Be the first!</p>`;
  return `<ol class="board">${rows
    .slice(0, size)
    .map(
      (r, i) =>
        `<li class="${r.you || isMine(r) ? "you" : ""}"><span>${i + 1}.</span><span>${esc(r.name)}</span><span>${fmt(r.score)}</span></li>`,
    )
    .join("")}</ol>`;
}
export const boardHtml = (pending, highlight) =>
  listHtml(loadScores(), BOARD_SIZE, pending, (r) => r.date === highlight);
export let worldPending = 0;
export function worldHtml() {
  if (globalBoard.rows)
    return listHtml(
      globalBoard.rows,
      WORLD.size,
      worldPending,
      (r) => r.id === globalBoard.mine,
    );
  return `<p class="empty">${globalBoard.failed ? "World board is offline." : "Loading..."}</p>`;
}
export function refreshWorldBoard() {
  const el = document.getElementById("world-board");
  if (el) el.innerHTML = worldHtml();
}
// Local top 5 and world top 10, side by side when there is room.
export function boardsHtml(title, pending, highlight) {
  worldPending = pending && makesWorld(pending) ? pending : 0;
  return `<div class="boards">
    <div><h2>${title}</h2>${boardHtml(pending && makesBoard(pending) ? pending : 0, highlight)}</div>
    <div><h2>WORLD TOP ${WORLD.size}</h2><div id="world-board">${worldHtml()}</div></div>
  </div>`;
}

export function showPanel(html) {
  panelEl.innerHTML = html;
  overlayEl.hidden = false;
  panelEl.scrollTop = 0;
}

export function renderTitle() {
  showPanel(`
    <h1>STAR CLAW</h1>
    <p>Grab plushies, win the reel, drop them in the chute.</p>
    ${tiersHtml()}
    ${collectionHtml()}
    ${boardsHtml("YOUR TOP 5")}
    <div class="actions">
      <button class="btn big" type="button" data-action="play">${TOUCH ? "TAP TO PLAY" : "PLAY (SPACE)"}</button>
    </div>`);
}

export function renderOver() {
  const r = game.result;
  const entering = r.highscore && !r.saved;
  const head = r.cleared
    ? `<h1 class="win">MACHINE CLEARED!</h1><p>Every plushie found a home. Clear bonus +${fmt(r.bonus)}</p>`
    : r.quit
      ? r.highscore
        ? `<h1 class="win">CASHED OUT!</h1><p class="hey">and it's a highscore</p><p>Hearts bonus +${fmt(r.bonus)}</p>`
        : `<h1 class="win">CASHED OUT</h1><p>Hearts bonus +${fmt(r.bonus)}. Not quite enough for the list this time.</p>`
      : r.highscore
        ? `<h1 class="lost">YOU LOST THE GAME,</h1><p class="hey">but hey this is a highscore</p>`
        : `<h1 class="lost">YOU LOST THE GAME</h1>`;
  const form = entering
    ? `<form class="name"><label for="name">PUT YOUR NAME ON THE LIST</label><div class="row"><input id="name" name="name" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NAME" /><button class="btn" type="submit">SAVE</button></div></form>`
    : "";
  showPanel(`
    ${head}
    <div class="final">SCORE<b>${fmt(r.score)}</b></div>
    <h2>YOUR HAUL</h2>
    ${game.bag.length ? `<div class="haul">${game.bag.map(prizeImg).join("")}</div>` : `<p class="empty">The bag stayed empty this time.</p>`}
    ${collectionHtml()}
    ${r.top && !r.saved ? `<p class="hey">NEW #1 HIGH SCORE!</p>` : ""}
    ${form}
    ${boardsHtml(entering ? "PREVIOUS WINNERS" : "YOUR TOP 5", entering ? r.score : 0, r.savedDate)}
    <div class="actions"><button class="btn big" type="button" data-action="play">${TOUCH ? "PLAY AGAIN" : "PLAY AGAIN (SPACE)"}</button></div>`);
  if (entering && !TOUCH) panelEl.querySelector("input").focus();
}

export function submitName(fallback) {
  const r = game.result;
  if (!r?.highscore || r.saved) return;
  const input = panelEl.querySelector("input");
  const typed = cleanName(input?.value ?? "");
  const name = typed || fallback || "";
  if (!name) return input?.focus();
  if (makesBoard(r.score)) r.savedDate = saveScore(name, r.score).date;
  // Only names people actually typed go to the world board, not the PLAYER fallback.
  if (typed && makesWorld(r.score)) postWorld(name, r.score);
  if (typed) sfx.saved();
  r.saved = true;
}

panelEl.addEventListener("submit", (e) => {
  e.preventDefault();
  submitName();
  renderOver();
  renderHud();
});
panelEl.addEventListener("click", (e) => {
  if (e.target.closest("[data-action=play]")) startGame();
});

export const CONFIRMS = {
  quit: {
    title: "CASH OUT?",
    text: () =>
      `End the run now and keep your ${fmt(game.score)} points, plus ${fmt(cashOutBonus())} for the hearts you have left.`,
    yes: "CASH OUT",
    run: () => gameOver("quit", cashOutBonus()),
  },
};
export let pendingConfirm = null;
export function askConfirm(kind) {
  if (game.mode !== "play" || game.paused) return;
  const c = CONFIRMS[kind];
  pendingConfirm = c;
  game.paused = true;
  keys.Space = false;
  document.getElementById("confirm-title").textContent = c.title;
  document.getElementById("confirm-text").textContent = c.text();
  document.getElementById("confirm-yes").textContent = c.yes;
  confirmEl.hidden = false;
  sfx.blip();
  document.getElementById("confirm-no").focus();
}
export function answerConfirm(yes) {
  const c = pendingConfirm;
  pendingConfirm = null;
  game.paused = false;
  confirmEl.hidden = true;
  document.activeElement?.blur?.();
  if (yes) c?.run();
}
document
  .getElementById("quit")
  .addEventListener("click", () => askConfirm("quit"));
document
  .getElementById("confirm-yes")
  .addEventListener("click", () => answerConfirm(true));
document
  .getElementById("confirm-no")
  .addEventListener("click", () => answerConfirm(false));
