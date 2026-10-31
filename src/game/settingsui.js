import { settingsEl, settingsPanel } from "./dom.js";
import { THEMES, THEME_IDS } from "./themes.js";
import { applyTheme, setAimAssist, setFamily, settings } from "./settings.js";
import { hold, release } from "./pause.js";
import {
  askConfirm,
  levelsHtml,
  playLevel,
  renderOver,
  renderTitle,
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
import { restock } from "./plushies.js";
import { LOVE_NAME, openLove } from "./love.js";
import { cleanName } from "./rules.js";
import { game, startGame } from "./game.js";
import { renderBag } from "./bag.js";
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
    <p class="aside">The first machine is stocked with our pets and our fish, worth the same as the usual plushies.${game.mode === "play" ? " Takes effect on your next run." : ""}</p>`
    : "";
  return `<h2>AIM ASSIST</h2>
    <button type="button" class="switch${settings.aimAssist ? " on" : ""}" data-assist role="switch" aria-checked="${settings.aimAssist}">
      <span class="knob"></span><span>${settings.aimAssist ? "ON" : "OFF"}</span>
    </button>
    <p class="aside">A laser shows where the claw will land. Scores made with it on stay off the high score boards, and switching it either way restarts the game.</p>
    ${family}`;
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

const MENU = [
  ["new", "&#9654;", "NEW GAME", "Pick a level and play"],
  ["help", "?", "HOW TO PLAY", "The claw, the reel, the hearts"],
  ["collection", "&#9733;", "COLLECTION", "Every prize you've caught, in 3D"],
  ["settings", "&#9881;", "SETTINGS", "Themes, aim assist, cheats"],
];
const homeView = () => `<h1>MENU</h1>
  <div class="menu-list">${MENU.map(
    ([id, icon, label, sub]) =>
      `<button type="button" class="menu-item" data-menu="${id}"><span class="menu-icon">${icon}</span><b>${label}</b><small>${sub}</small></button>`,
  ).join("")}</div>`;

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
  <div class="showcase" id="showcase"></div>
  <p class="aside">Drag to spin &middot; tap to poke &middot; scroll or pinch to zoom</p>`;

const BACK = {
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
        : `<button class="btn big" type="button" data-close-settings>${view === "home" ? "CLOSE" : "DONE"}</button>`;
  settingsPanel.innerHTML = `${back}${body}<div class="actions">${action}</div>`;
  settingsPanel.dataset.view = view;
  if (view === "collection") stopThumbs = fillThumbs(settingsPanel, shownItems);
  if (view === "item")
    showDetail(settingsPanel.querySelector("#showcase"), item.tier, item.kind);
}
function go(next) {
  view = next;
  if (next === "new") menuLevel = currentLevel();
  render();
  settingsPanel.scrollTop = 0;
}
export function menuBack() {
  if (BACK[view]) go(BACK[view]);
  else closeSettings();
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
    if (game.mode === "title") renderTitle();
    else if (game.mode === "over") renderOver();
  } else sfx.empty();
  render();
  settingsPanel.querySelector("form.cheat input").focus();
});

export function openSettings() {
  if (!settingsEl.hidden) return;
  cheatNote = "";
  page = "theme";
  view = "home";
  render();
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
  // Prize icons are drawn per theme.
  renderBag();
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

addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  const t = e.target;
  if (t.closest("[data-settings]")) return openSettings();
  if (t.closest("[data-close-settings]") || t === settingsEl)
    return closeSettings();
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
  const gal = t.closest("[data-gallery]");
  if (gal) {
    gallery = gal.dataset.gallery;
    return render();
  }
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
  if (t.closest("[data-family]")) {
    setFamily(!familyOn());
    // Restock now so the machine behind the dialog shows it; mid-run it waits for the next run.
    if (game.mode !== "play") restock();
    sfx.coinIn();
    return render();
  }
  if (t.closest("[data-assist]"))
    askConfirm(settings.aimAssist ? "assistOff" : "assistOn");
});
