import { TOUCH, confirmEl, overlayEl, panelEl } from "./dom.js";
import { TIERS } from "./config.js";
import {
  BOARD_SIZE,
  WORLD,
  fetchWorld,
  globalBoard,
  loadScores,
  makesBoard,
  makesWorld,
  postWorld,
  saveScore,
} from "./scores.js";
import { esc, fmt, renderHud } from "./hud.js";
import { cashOutBonus, game, gameOver, startGame } from "./game.js";
import { cleanName } from "./rules.js";
import { hold, release } from "./pause.js";
import { setAssist } from "./settingsui.js";
import {
  collectedIn,
  collectionHtml,
  collectionSize,
  prizeImg,
} from "./bag.js";
import { LEVELS, currentLevel, isUnlocked, pickLevel } from "./levels.js";
import { restock } from "./plushies.js";
import { drawMarquee } from "./cabinet.js";
import { applyTheme } from "./settings.js";
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

const LOCK_SVG = `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" role="img" aria-label="Locked"><path fill-rule="evenodd" d="M4 1h4v1h1v3h1v6H2V5h1V2h1zM4 2h4v3H4zM5 7h2v2H5z"/></svg>`;

// One card per level: open ones can be picked, locked ones say what opens them.
export function levelsHtml() {
  const current = currentLevel();
  const cards = LEVELS.map((l, i) => {
    const open = isUnlocked(l);
    const prev = LEVELS[i - 1];
    const state = l.soon
      ? "COMING SOON"
      : !open
        ? `CLEAR ${prev.name} IN ONE RUN TO UNLOCK`
        : `COLLECTION ${collectedIn(l)}/${collectionSize(l)}`;
    const cls = [
      "level-card",
      l === current && "on",
      !open && "locked",
      l.soon && "soon",
    ]
      .filter(Boolean)
      .join(" ");
    return `<button type="button" class="${cls}" data-level-pick="${l.id}" aria-pressed="${l === current}"${open ? "" : " disabled"}>
      <span class="num">${open ? l.id : LOCK_SVG}</span>
      <b>${l.name}</b><small>${l.blurb}</small><em>${state}</em>
    </button>`;
  }).join("");
  return `<h2>LEVELS</h2><div class="levels">${cards}</div>`;
}

// Picking a level restocks the machine with its prizes, so the title shows what you'll play.
export function chooseLevel(id) {
  if (game.mode === "play") return;
  // A score still waiting for a name belongs to the level it was played on: save it first.
  if (game.result) submitName("PLAYER");
  if (!pickLevel(id)) return;
  fetchWorld();
  restock();
  drawMarquee(currentLevel().marquee);
  // Re-styling from the theme puts the cabinet back, then the new level's stage dresses it.
  applyTheme();
  sfx.coinIn();
  if (game.mode === "over") renderOver();
  else renderTitle();
}

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
// Local top 5 and world top 10 for the picked level, side by side when there is room.
export function boardsHtml(title, pending, highlight) {
  worldPending = pending && makesWorld(pending) ? pending : 0;
  return `<div class="boards">
    <div><h2>${title} &middot; LV ${currentLevel().id}</h2>${boardHtml(pending && makesBoard(pending) ? pending : 0, highlight)}</div>
    <div><h2>WORLD TOP ${WORLD.size} &middot; LV ${currentLevel().id}</h2><div id="world-board">${worldHtml()}</div></div>
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
    ${levelsHtml()}
    ${boardsHtml("YOUR TOP 5")}
    <div class="actions">
      <button class="btn big" type="button" data-action="play">${TOUCH ? "TAP TO PLAY" : "PLAY (SPACE)"}</button>
    </div>`);
}

export function renderOver() {
  const r = game.result;
  const entering = r.highscore && !r.saved;
  const head = r.cleared
    ? `<h1 class="win">MACHINE CLEARED!</h1><p>Every plushie found a home. Clear bonus +${fmt(r.bonus)}</p>${r.unlocked ? `<p class="hey">LEVEL ${r.unlocked.id} UNLOCKED: ${r.unlocked.name}</p>` : ""}`
    : r.quit
      ? r.highscore
        ? `<h1 class="win">CASHED OUT!</h1><p class="hey">and it's a highscore</p><p>Hearts bonus +${fmt(r.bonus)}</p>`
        : `<h1 class="win">CASHED OUT</h1><p>Hearts bonus +${fmt(r.bonus)}. Not quite enough for the list this time.</p>`
      : r.highscore
        ? `<h1 class="lost">YOU LOST THE GAME,</h1><p class="hey">but hey this is a highscore</p>`
        : `<h1 class="lost">YOU LOST THE GAME</h1>`;
  const assisted = r.assisted
    ? `<p class="aside">Aim assist was on, so this run stays off the high score boards.</p>`
    : "";
  const form = entering
    ? `<form class="name"><label for="name">PUT YOUR NAME ON THE LIST</label><div class="row"><input id="name" name="name" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NAME" /><button class="btn" type="submit">SAVE</button></div></form>`
    : "";
  showPanel(`
    ${head}
    ${assisted}
    <div class="final">SCORE<b>${fmt(r.score)}</b></div>
    <h2>YOUR HAUL</h2>
    ${game.bag.length ? `<div class="haul">${game.bag.map(prizeImg).join("")}</div>` : `<p class="empty">The bag stayed empty this time.</p>`}
    ${collectionHtml()}
    ${levelsHtml()}
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
  if (makesBoard(r.score)) r.savedDate = saveScore(name, r.score, r.level).date;
  // Only names people actually typed go to the world board, not the PLAYER fallback.
  if (typed && makesWorld(r.score)) postWorld(name, r.score, r.level);
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
  const card = e.target.closest("[data-level-pick]");
  if (card) chooseLevel(Number(card.dataset.levelPick));
});

export const CONFIRMS = {
  quit: {
    title: "CASH OUT?",
    text: () =>
      `End the run now and keep your ${fmt(game.score)} points, plus ${fmt(cashOutBonus())} for the hearts you have left.`,
    yes: "CASH OUT",
    allowed: () => game.mode === "play" && !game.paused,
    run: () => gameOver("quit", cashOutBonus()),
  },
  assistOn: {
    title: "AIM ASSIST?",
    text: () =>
      "A laser shows exactly where the claw will land. While it is on, your scores stay off the high score boards. Turning it on restarts the game.",
    yes: "TURN ON",
    no: "CANCEL",
    run: () => setAssist(true),
  },
  assistOff: {
    title: "AIM ASSIST OFF?",
    text: () =>
      game.mode === "play"
        ? "Turning it off restarts the game, so the next run counts for high scores again."
        : "Your next run counts for high scores again.",
    yes: "TURN OFF",
    no: "CANCEL",
    run: () => setAssist(false),
  },
};
export let pendingConfirm = null;
export function askConfirm(kind) {
  const c = CONFIRMS[kind];
  if (pendingConfirm || (c.allowed && !c.allowed())) return;
  pendingConfirm = c;
  hold("confirm");
  document.getElementById("confirm-title").textContent = c.title;
  document.getElementById("confirm-text").textContent = c.text();
  document.getElementById("confirm-yes").textContent = c.yes;
  document.getElementById("confirm-no").textContent = c.no ?? "KEEP PLAYING";
  confirmEl.hidden = false;
  sfx.blip();
  document.getElementById("confirm-no").focus();
}
export function answerConfirm(yes) {
  const c = pendingConfirm;
  pendingConfirm = null;
  release("confirm");
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
