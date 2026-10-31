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
import { setAssist, setFamilyChoice } from "./settingsui.js";
import { collectedIn, collectionSize, prizeImg } from "./bag.js";
import {
  LEVELS,
  currentLevel,
  isUnlocked,
  marqueeFor,
  pickLevel,
  unlockLove,
} from "./levels.js";
import { restock } from "./plushies.js";
import { drawMarquee } from "./cabinet.js";
import { applyTheme } from "./settings.js";
import { sfx } from "./audio.js";
import { LOVE_NAME, openLove } from "./love.js";

// ---------- overlays ----------

export function setMode(mode) {
  game.mode = mode;
  game.modeAt = performance.now();
  document.body.dataset.mode = mode;
}

const LOCK_SVG = `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" role="img" aria-label="Locked"><path fill-rule="evenodd" d="M4 1h4v1h1v3h1v6H2V5h1V2h1zM4 2h4v3H4zM5 7h2v2H5z"/></svg>`;

// One card per level: open ones can be picked, locked ones say what opens them.
// `selected` is the highlighted card; the menu's NEW GAME page passes its own pick and attribute.
export function levelsHtml(
  selected = currentLevel(),
  attr = "data-level-pick",
) {
  const current = selected;
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
    return `<button type="button" class="${cls}" ${attr}="${l.id}" aria-pressed="${l === current}"${open ? "" : " disabled"}>
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
  drawMarquee(marqueeFor(currentLevel()));
  // Re-styling from the theme puts the cabinet back, then the new level's stage dresses it.
  applyTheme();
  sfx.coinIn();
  if (game.mode === "over") renderOver();
}

// Start a run on a level, from the menu: mid-run too (the current run is abandoned).
export function playLevel(id) {
  // A new level brings its own stage; re-styling from the theme dresses it.
  if (pickLevel(id)) applyTheme();
  startGame();
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
export const boardHtml = (pending, highlight, level = currentLevel().id) =>
  listHtml(loadScores(level), BOARD_SIZE, pending, (r) => r.date === highlight);
export let worldPending = 0;
export function worldHtml(level = currentLevel().id) {
  const current = level === currentLevel().id;
  const rows = current ? globalBoard.rows : globalBoard.byLevel[level];
  if (rows)
    return listHtml(
      rows,
      WORLD.size,
      current ? worldPending : 0,
      (r) => r.id === globalBoard.mine,
    );
  return `<p class="empty">${globalBoard.failed ? "World board is offline." : "Loading..."}</p>`;
}
export function refreshWorldBoard() {
  for (const el of document.querySelectorAll(".world-board"))
    el.innerHTML = worldHtml(Number(el.dataset.level));
}
// Local top 5 and world top 10 for a level, side by side when there is room.
export function boardsHtml(
  title,
  pending,
  highlight,
  level = currentLevel().id,
) {
  worldPending = pending && makesWorld(pending) ? pending : 0;
  return `<div class="boards">
    <div><h2>${title} &middot; LV ${level}</h2>${boardHtml(pending && makesBoard(pending) ? pending : 0, highlight, level)}</div>
    <div><h2>WORLD TOP ${WORLD.size} &middot; LV ${level}</h2><div class="world-board" data-level="${level}">${worldHtml(level)}</div></div>
  </div>`;
}

export function showPanel(html) {
  panelEl.innerHTML = html;
  overlayEl.hidden = false;
  panelEl.scrollTop = 0;
}

export function renderOver() {
  const r = game.result;
  // Clearing the machine always lets you sign it, high score or not.
  const entering = (r.highscore || r.cleared) && !r.saved;
  const head = r.cleared
    ? `<h1 class="win">MACHINE CLEARED!</h1><p>Every plushie found a home. Clear bonus +${fmt(r.bonus)}</p>${r.unlocked ? `<p class="hey">LEVEL ${r.unlocked.id} UNLOCKED: ${r.unlocked.name}</p>` : ""}`
    : r.quit
      ? r.highscore
        ? `<h1 class="win">CASHED OUT!</h1><p class="hey">and it's a highscore</p><p>Hearts bonus +${fmt(r.bonus)}</p>`
        : `<h1 class="win">CASHED OUT</h1><p>Hearts bonus +${fmt(r.bonus)}. Not quite enough for the list this time.</p>`
      : r.highscore
        ? `<h1 class="lost">YOU LOST THE GAME,</h1><p class="hey">but hey this is a highscore</p>`
        : `<h1 class="lost">YOU LOST THE GAME</h1>`;
  const why = [r.assisted && "Aim assist", r.family && "Our family"].filter(
    Boolean,
  );
  const assisted = why.length
    ? `<p class="aside">${why.join(" and ")} ${why.length > 1 ? "were" : "was"} on, so this run stays off the high score boards.</p>`
    : "";
  const form = entering
    ? `<form class="name"><label for="name">PUT YOUR NAME ON THE LIST</label><div class="row"><input id="name" name="name" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NAME" /><button class="btn" type="submit">SAVE</button></div></form>`
    : "";
  // Just the result: the score and what made it, what's new in the collection, the name box when
  // it's earned, and PLAY AGAIN. The boards live in the menu's LEADERBOARD.
  const caughtCount = game.bag.length;
  const fresh = game.bag.filter((p) => p.fresh);
  const tally = [
    `${caughtCount} ${caughtCount === 1 ? "prize" : "prizes"} caught`,
    r.bonus && `bonus +${fmt(r.bonus)}`,
  ]
    .filter(Boolean)
    .join(" &middot; ");
  showPanel(`
    ${head}
    ${assisted}
    <div class="final">SCORE<b>${fmt(r.score)}</b></div>
    <p class="tally">${tally}</p>
    <h2>NEW IN YOUR COLLECTION</h2>
    ${fresh.length ? `<div class="haul">${fresh.map(prizeImg).join("")}</div>` : `<p class="empty">Nothing new this time.</p>`}
    ${r.top && !r.saved ? `<p class="hey">NEW #1 HIGH SCORE!</p>` : ""}
    ${form}
    ${r.saved && r.highscore ? `<p class="aside">Saved! Find it in Menu &rsaquo; Leaderboard.</p>` : ""}
    <div class="actions"><button class="btn ghost big" type="button" data-settings>MENU</button><button class="btn big" type="button" data-action="play">${TOUCH ? "PLAY AGAIN" : "PLAY AGAIN (SPACE)"}</button></div>`);
  if (entering && !TOUCH) panelEl.querySelector("input").focus();
}

export function submitName(fallback) {
  const r = game.result;
  if (!r || (!r.highscore && !r.cleared) || r.saved) return;
  const input = panelEl.querySelector("input");
  const typed = cleanName(input?.value ?? "");
  const name = typed || fallback || "";
  if (!name) return input?.focus();
  if (makesBoard(r.score)) r.savedDate = saveScore(name, r.score, r.level).date;
  // Only names people actually typed go to the world board, not the PLAYER fallback.
  if (typed && makesWorld(r.score)) postWorld(name, r.score, r.level);
  if (typed) sfx.saved();
  r.saved = true;
  // Names are upper-cased and trimmed already, so any casing of her name counts.
  r.love = r.cleared && typed === LOVE_NAME;
}

panelEl.addEventListener("submit", (e) => {
  e.preventDefault();
  submitName();
  renderOver();
  renderHud();
  if (game.result?.love) {
    // From now on every machine is hers; she sees it renamed when the letter closes.
    unlockLove();
    drawMarquee(marqueeFor(currentLevel()));
    setTimeout(openLove, 600);
  }
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
  // OUR FAMILY works like aim assist: the first machine holds our pets and fish instead, those
  // runs stay off the boards, and a level-1 run in progress restarts when it's switched.
  familyOn: {
    title: "OUR FAMILY?",
    text: () =>
      `Our pets and our fish fill the first machine. While it is on, those runs stay off the high score boards.${familyRestarts() ? " Turning it on restarts the game." : ""}`,
    yes: "TURN ON",
    no: "CANCEL",
    run: () => setFamilyChoice(true),
  },
  familyOff: {
    title: "OUR FAMILY OFF?",
    text: () =>
      familyRestarts()
        ? "Back to the usual plushies. Turning it off restarts the game, so the next run counts for high scores again."
        : "Back to the usual plushies. Your next run on the first machine counts for high scores again.",
    yes: "TURN OFF",
    no: "CANCEL",
    run: () => setFamilyChoice(false),
  },
};
// Switching OUR FAMILY mid-run restarts it only on the first machine, the one it changes.
const familyRestarts = () => game.mode === "play" && currentLevel().id === 1;
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
