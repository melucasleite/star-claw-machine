import { settingsEl, settingsPanel } from "./dom.js";
import { THEMES, THEME_IDS } from "./themes.js";
import { applyTheme, setAimAssist, setFamily, settings } from "./settings.js";
import { hold, release } from "./pause.js";
import {
  askConfirm,
  boardsHtml,
  levelsHtml,
  playLevel,
  renderOver,
} from "./overlays.js";
import {
  LEVELS,
  currentLevel,
  enterCheat,
  familyOn,
  familyUnlocked,
  isUnlocked,
} from "./levels.js";
import { PETS, TIERS } from "./config.js";
import { ANIMALS, HUSKY } from "./animals.js";
import { TANK } from "./tank.js";
import { collection } from "./bag.js";
import { helpBodyHtml } from "./help.js";
import { closeDetail, fillThumbs, showDetail } from "./showcase.js";
import { fetchWorld } from "./scores.js";
import { restock } from "./plushies.js";
import { LOVE_NAME, openLove } from "./love.js";
import { cleanName } from "./rules.js";
import { game, startGame } from "./game.js";
import { renderHud } from "./hud.js";
import { sfx } from "./audio.js";

// ---------- menu & settings ----------

// The menu button (or O) opens the game menu: NEW GAME (pick a level, play), HOW TO PLAY, the
// COLLECTION (a gallery of every prize, with a 3D close-up you can spin and poke) and SETTINGS.
// Escape goes back a page. Theme changes apply on the spot and leave the run alone; aim assist
// asks first, because flipping it either way restarts the run.
let view = "home";
// Settings come in pages, so none of them needs scrolling: the look, the game, and cheats.
const PAGES = [
  ["theme", "THEME"],
  ["game", "GAME"],
  ["cheats", "CHEATS"],
];
let page = "theme";

function themePage() {
  const cards = THEME_IDS.map((id) => {
    const t = THEMES[id];
    const on = settings.theme === id;
    return `<button type="button" class="theme-card${on ? " on" : ""}" data-theme-pick="${id}" aria-pressed="${on}">
      <span class="swatch">${t.swatch.map((c) => `<i style="background:${c}"></i>`).join("")}</span>
      <b>${t.label}</b><small>${t.blurb}</small>
    </button>`;
  }).join("");
  return `<div class="themes">${cards}</div>`;
}

function gamePage() {
  const family = familyUnlocked()
    ? `<h2>OUR FAMILY</h2>
    <button type="button" class="switch${familyOn() ? " on" : ""}" data-family role="switch" aria-checked="${familyOn()}">
      <span class="knob"></span><span>${familyOn() ? "ON" : "OFF"}</span>
    </button>
    <p class="aside">Pets and fish in machine 1. Unranked.</p>`
    : "";
  return `<h2>AIM ASSIST</h2>
    <button type="button" class="switch${settings.aimAssist ? " on" : ""}" data-assist role="switch" aria-checked="${settings.aimAssist}">
      <span class="knob"></span><span>${settings.aimAssist ? "ON" : "OFF"}</span>
    </button>
    <p class="aside">Shows where the claw lands. Unranked.</p>
    ${family}
    <button type="button" class="btn ghost erase" data-erase>ERASE DATA</button>`;
}

const cheatsPage = () =>
  `<form class="name cheat"><div class="row"><input name="cheat" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE" aria-label="Cheat code" /><button class="btn" type="submit">ENTER</button></div><p class="aside" aria-live="polite">${cheatNote || "Know a code? Type it in."}</p></form>`;

function settingsView() {
  const tabs = PAGES.map(
    ([id, label]) =>
      `<button type="button" class="tab${id === page ? " on" : ""}" data-settings-page="${id}" role="tab" aria-selected="${id === page}">${label}</button>`,
  ).join("");
  const body = { theme: themePage, game: gamePage, cheats: cheatsPage }[page]();
  return `<h1>SETTINGS</h1>
    <div class="tabs" role="tablist">${tabs}</div>
    <div class="settings-page" role="tabpanel">${body}</div>`;
}

// Pixel icons for the menu, drawn on a 12 x 12 grid like the corner buttons.
const ICON = (d) =>
  `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill-rule="evenodd" d="${d}"/></svg>`;
const MENU = [
  [
    "new",
    ICON("M3 1h2v1h1v1h1v1h1v1h1v2H8v1H7v1H6v1H5v1H3z"),
    "NEW GAME",
    "Pick a machine and play",
  ],
  [
    "help",
    ICON("M3 1h6v1h1v4H9v1H7v2H5V6h1V5h2V2H4v2H2V2h1zM5 10h2v2H5z"),
    "HOW TO PLAY",
    "The claw, the reel, the hearts",
  ],
  [
    "collection",
    ICON("M5 0h2v3h5v2h-1v1h-1v2h1v4H9v-1H7v-1H5v1H3v1H1V8h1V6H1V5H0V3h5z"),
    "COLLECTION",
    "Every prize you've caught, in 3D",
  ],
  [
    "leaderboard",
    ICON("M0 2h2v2h2V1h1V0h2v1h1v3h2V2h2v8H0zM1 11h10v1H1z"),
    "LEADERBOARD",
    "Your best, and the world's",
  ],
  [
    "settings",
    ICON(
      "M3 2h6v1h1v6H9v1H3V9H2V3h1zM5 0h2v2H5zM5 10h2v2H5zM0 5h2v2H0zM10 5h2v2h-2zM1 1h2v2H1zM9 1h2v2H9zM1 9h2v2H1zM9 9h2v2H9zM4 4v4h4V4z",
    ),
    "SETTINGS",
    "Themes, aim assist, cheats",
  ],
];
// The first screen: the logo over the live machine, then the menu, arcade style.
const homeView = () => `<header class="menu-hero">
    <div class="menu-logo" aria-label="Star Claw"><span class="star s1">&#9733;</span><span class="star s2">&#10022;</span><span class="star s3">&#10022;</span><b>STAR</b><b>CLAW</b></div>
    <p class="menu-tag">${game.mode === "play" ? "PAUSED" : "GRAB &middot; REEL &middot; WIN"}</p>
  </header>
  <nav class="menu-list" aria-label="Menu">${MENU.map(
    ([id, icon, label, sub], i) =>
      `<button type="button" class="menu-item" data-menu="${id}" style="--i:${i}"><span class="menu-icon">${icon}</span><b>${label}</b><small>${sub}</small></button>`,
  ).join("")}</nav>
  <p class="menu-foot"><span class="blink">INSERT COIN</span><span class="keys">&uarr;&darr; + ENTER</span></p>`;

// NEW GAME: the level cards, then PLAY.
let menuLevel = null;
const newView = () => `<h1>NEW GAME</h1>
  ${levelsHtml(menuLevel, "data-menu-level")}
  ${game.mode === "play" ? `<p class="aside">This ends the run you're on.</p>` : ""}`;

// COLLECTION: one gallery per level (and our family, once she has it), every prize in it shown,
// the ones not caught yet as silhouettes.
const KINDS = [...ANIMALS, HUSKY, ...TANK];
function galleries() {
  const list = LEVELS.filter((l) => !l.soon).map((l) => ({
    id: `lv${l.id}`,
    label: `LV ${l.id}`,
    items: l.kinds.flatMap((kind) =>
      TIERS.map((tier) => ({ tier, kind, name: `${tier.name} ${kind.name}` })),
    ),
  }));
  if (familyUnlocked())
    list.push({
      id: "family",
      label: "FAMILY",
      items: PETS.map((tier) => ({
        tier,
        kind: KINDS.find((k) => k.name === tier.animal),
        name: tier.name,
      })),
    });
  return list;
}
const caught = ({ tier, kind }) => collection.has(`${tier.name}:${kind.name}`);
let gallery = null;
let shownItems = [];
let item = null;
function collectionView() {
  const all = galleries();
  const g = all.find((x) => x.id === gallery) ?? all[0];
  gallery = g.id;
  shownItems = g.items;
  const got = g.items.filter(caught).length;
  const tabs = all
    .map(
      (x) =>
        `<button type="button" class="tab${x === g ? " on" : ""}" data-gallery="${x.id}">${x.label}</button>`,
    )
    .join("");
  const thumbs = g.items
    .map((it, i) => {
      const has = caught(it);
      return `<button type="button" class="thumb${has ? "" : " unseen"}" data-item="${i}"${has ? "" : " disabled"} title="${has ? it.name : "Not caught yet"}"><img data-thumb="${i}" alt="${has ? it.name : "Not caught yet"}" /></button>`;
    })
    .join("");
  return `<h1>COLLECTION</h1>
    <div class="tabs">${tabs}</div>
    <p class="collection">CAUGHT ${got}/${g.items.length}</p>
    <div class="gallery">${thumbs}</div>`;
}
const itemView = () => `<h1 class="item-name">${item.name.toUpperCase()}</h1>
  <p class="item-facts"><i class="dot" style="background:${item.tier.css}"></i>${item.tier.pet ? `Plays like ${item.tier.as}` : item.tier.name} &middot; ${item.tier.points} PTS</p>
  <div class="showcase-row">
    <button type="button" class="love-arrow item-arrow" data-item-step="-1" aria-label="Previous">&lsaquo;</button>
    <div class="showcase" id="showcase"></div>
    <button type="button" class="love-arrow item-arrow" data-item-step="1" aria-label="Next">&rsaquo;</button>
  </div>
  <p class="aside">Drag to spin &middot; tap to poke &middot; scroll or pinch to zoom</p>`;

// LEADERBOARD: your top 5 and the world top 10, a tab per level.
let boardLevel = 1;
function leaderboardView() {
  const tabs = LEVELS.filter((l) => !l.soon)
    .map(
      (l) =>
        `<button type="button" class="tab${l.id === boardLevel ? " on" : ""}" data-board-level="${l.id}">LV ${l.id}</button>`,
    )
    .join("");
  return `<h1>LEADERBOARD</h1>
    <div class="tabs">${tabs}</div>
    ${boardsHtml("YOUR TOP 5", 0, null, boardLevel)}`;
}

const BACK = {
  leaderboard: "home",
  new: "home",
  help: "home",
  collection: "home",
  settings: "home",
  item: "collection",
};
let stopThumbs = null;
function render() {
  closeDetail();
  stopThumbs?.();
  stopThumbs = null;
  const body = {
    home: homeView,
    new: newView,
    help: helpBodyHtml,
    collection: collectionView,
    leaderboard: leaderboardView,
    item: itemView,
    settings: settingsView,
  }[view]();
  const back = BACK[view]
    ? `<button type="button" class="back" data-menu-back>&lsaquo; BACK</button>`
    : "";
  const action =
    view === "new"
      ? `<button class="btn big" type="button" data-menu-play>PLAY</button>`
      : view === "help"
        ? `<button class="btn big" type="button" data-menu-back>BACK</button>`
        : view === "home" && game.mode === "title"
          ? ""
          : `<button class="btn big" type="button" data-close-settings>${view === "home" ? "CLOSE" : "DONE"}</button>`;
  settingsPanel.innerHTML = `${back}${body}${action ? `<div class="actions">${action}</div>` : ""}`;
  settingsPanel.dataset.view = view;
  if (view === "collection") stopThumbs = fillThumbs(settingsPanel, shownItems);
  if (view === "leaderboard") fetchWorld(boardLevel);
  if (view === "item")
    showDetail(settingsPanel.querySelector("#showcase"), item.tier, item.kind);
}
function go(next) {
  view = next;
  if (next === "new") menuLevel = currentLevel();
  if (next === "leaderboard") boardLevel = currentLevel().id;
  render();
  settingsPanel.scrollTop = 0;
}
// Arrows on the close-up: the previous or next prize you've caught in this gallery, wrapping.
export function stepItem(d) {
  if (view !== "item") return;
  const got = shownItems.filter(caught);
  if (got.length < 2) return;
  item = got[(got.indexOf(item) + d + got.length) % got.length];
  sfx.blip();
  render();
}

export function menuBack() {
  if (BACK[view]) go(BACK[view]);
  // On the first screen there's nothing behind the menu to go back to.
  else if (game.mode !== "title") closeSettings();
}
// Up and down arrows walk the menu's buttons.
export function menuFocus(d) {
  const all = [...settingsPanel.querySelectorAll("button:not(:disabled)")];
  const i = all.indexOf(document.activeElement);
  all[(i + d + all.length) % all.length]?.focus();
}
// Re-renders the menu if it's up, e.g. after a cheat opened levels.
export function refreshMenu() {
  if (!settingsEl.hidden) render();
}

let cheatNote = "";
settingsPanel.addEventListener("submit", (e) => {
  if (!e.target.matches("form.cheat")) return;
  e.preventDefault();
  const code = e.target.elements.cheat.value;
  // Her name opens the letter straight away, no machine to clear.
  if (cleanName(code) === LOVE_NAME) {
    closeSettings();
    return openLove();
  }
  const message = enterCheat(code);
  cheatNote = message ?? "NOTHING HAPPENS.";
  if (message) {
    sfx.fresh();
    // A cheat can change what's in the machine (FAMILY); restock it unless a run is on.
    if (game.mode !== "play") restock();
    // The level picker behind the dialog shows the newly opened levels.
    if (game.mode === "over") renderOver();
  } else sfx.empty();
  render();
  settingsPanel.querySelector("form.cheat input").focus();
});

export function openSettings(start = "home") {
  if (!settingsEl.hidden) return;
  cheatNote = "";
  page = "theme";
  go(start);
  settingsEl.hidden = false;
  settingsPanel.scrollTop = 0;
  sfx.blip();
  if (game.mode === "play") hold("settings");
}
export function closeSettings() {
  if (settingsEl.hidden) return;
  settingsEl.hidden = true;
  closeDetail();
  stopThumbs?.();
  release("settings");
}

function pickTheme(id) {
  if (id === settings.theme) return;
  applyTheme(id);
  render();
  sfx.coinIn();
}

// Called once the player confirms. A run in progress restarts so it can't switch mid-way.
export function setAssist(on) {
  setAimAssist(on);
  render();
  if (game.mode === "play") {
    closeSettings();
    startGame();
  }
  renderHud();
}

// Called once the player confirms OUR FAMILY either way. Like aim assist, a run in progress on
// the first machine restarts so it can't switch mid-way; otherwise the machine restocks now.
export function setFamilyChoice(on) {
  setFamily(on);
  render();
  if (game.mode === "play" && currentLevel().id === 1) {
    closeSettings();
    startGame();
  } else if (game.mode !== "play") restock();
  renderHud();
}

addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  const t = e.target;
  if (t.closest("[data-settings]")) return openSettings();
  if (t.closest("[data-close-settings]")) return closeSettings();
  // Clicking outside closes it, except on the first screen.
  if (t === settingsEl && game.mode !== "title") return closeSettings();
  const to = t.closest("[data-menu]");
  if (to) return go(to.dataset.menu);
  if (t.closest("[data-menu-back]")) return menuBack();
  const lv = t.closest("[data-menu-level]");
  if (lv) {
    const level = LEVELS.find((l) => l.id === Number(lv.dataset.menuLevel));
    if (level && isUnlocked(level)) menuLevel = level;
    return render();
  }
  if (t.closest("[data-menu-play]")) {
    closeSettings();
    return playLevel(menuLevel.id);
  }
  const bl = t.closest("[data-board-level]");
  if (bl) {
    boardLevel = Number(bl.dataset.boardLevel);
    return render();
  }
  const gal = t.closest("[data-gallery]");
  if (gal) {
    gallery = gal.dataset.gallery;
    return render();
  }
  const step = t.closest("[data-item-step]");
  if (step) return stepItem(Number(step.dataset.itemStep));
  const pick = t.closest("[data-item]");
  if (pick) {
    item = shownItems[Number(pick.dataset.item)];
    return go("item");
  }
  const card = t.closest("[data-theme-pick]");
  if (card) return pickTheme(card.dataset.themePick);
  const tab = t.closest("[data-settings-page]");
  if (tab) {
    page = tab.dataset.settingsPage;
    render();
    if (page === "cheats")
      settingsPanel.querySelector("form.cheat input").focus();
    return;
  }
  if (t.closest("[data-erase]")) return askConfirm("erase");
  if (t.closest("[data-family]"))
    return askConfirm(familyOn() ? "familyOff" : "familyOn");
  if (t.closest("[data-assist]"))
    askConfirm(settings.aimAssist ? "assistOff" : "assistOn");
});
