import { settingsEl, settingsPanel } from "./dom.js";
import { THEMES, THEME_IDS } from "./themes.js";
import { applyTheme, setAimAssist, settings } from "./settings.js";
import { hold, release } from "./pause.js";
import { askConfirm, renderOver, renderTitle } from "./overlays.js";
import { enterCheat } from "./levels.js";
import { LOVE_NAME, openLove } from "./love.js";
import { cleanName } from "./rules.js";
import { game, startGame } from "./game.js";
import { renderBag } from "./bag.js";
import { renderHud } from "./hud.js";
import { sfx } from "./audio.js";

// ---------- settings ----------

// The gear button (or O) opens it. Theme changes apply on the spot and leave the run alone;
// aim assist asks first, because flipping it either way restarts the run.
function render() {
  const cards = THEME_IDS.map((id) => {
    const t = THEMES[id];
    const on = settings.theme === id;
    return `<button type="button" class="theme-card${on ? " on" : ""}" data-theme-pick="${id}" aria-pressed="${on}">
      <span class="swatch">${t.swatch.map((c) => `<i style="background:${c}"></i>`).join("")}</span>
      <b>${t.label}</b><small>${t.blurb}</small>
    </button>`;
  }).join("");
  settingsPanel.innerHTML = `
    <h1>SETTINGS</h1>
    <h2>THEME</h2>
    <div class="themes">${cards}</div>
    <h2>AIM ASSIST</h2>
    <button type="button" class="switch${settings.aimAssist ? " on" : ""}" data-assist role="switch" aria-checked="${settings.aimAssist}">
      <span class="knob"></span><span>${settings.aimAssist ? "ON" : "OFF"}</span>
    </button>
    <p class="aside">A laser shows where the claw will land. Scores made with it on stay off the high score boards, and switching it either way restarts the game.</p>
    <h2>CHEATS</h2>
    <form class="name cheat"><div class="row"><input name="cheat" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE" aria-label="Cheat code" /><button class="btn" type="submit">ENTER</button></div><p class="aside" aria-live="polite">${cheatNote}</p></form>
    <div class="actions"><button class="btn big" type="button" data-close-settings>DONE</button></div>`;
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
  render();
  settingsEl.hidden = false;
  settingsPanel.scrollTop = 0;
  sfx.blip();
  if (game.mode === "play") hold("settings");
}
export function closeSettings() {
  if (settingsEl.hidden) return;
  settingsEl.hidden = true;
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
  const card = t.closest("[data-theme-pick]");
  if (card) return pickTheme(card.dataset.themePick);
  if (t.closest("[data-assist]"))
    askConfirm(settings.aimAssist ? "assistOff" : "assistOn");
});
