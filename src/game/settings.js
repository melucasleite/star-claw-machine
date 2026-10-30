// Player settings that outlive a run: the theme, aim assist and the picked level. A leaf module: it only stores
// values and tells subscribers when the theme changes, so anything can import it at load time.
import { THEMES } from "./themes.js";

const SETTINGS_KEY = "startclaw.settings.v1";

export const settings = { theme: "default", aimAssist: false, level: 1 };
try {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
  if (saved && THEMES[saved.theme]) settings.theme = saved.theme;
  if (saved && typeof saved.aimAssist === "boolean")
    settings.aimAssist = saved.aimAssist;
  // Whether it is still open is checked in levels.js.
  if (saved && Number.isInteger(saved.level)) settings.level = saved.level;
} catch {}

function save() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export const theme = () => THEMES[settings.theme];

const themeListeners = [];
// Runs `fn(theme)` now and on every theme change. Modules restyle themselves from it.
export function onTheme(fn) {
  themeListeners.push(fn);
}
export function applyTheme(id = settings.theme) {
  if (!THEMES[id]) return;
  settings.theme = id;
  save();
  document.body.dataset.theme = id;
  for (const fn of themeListeners) fn(THEMES[id]);
}

export function setAimAssist(on) {
  settings.aimAssist = on;
  save();
}

export function setLevel(id) {
  settings.level = id;
  save();
}
