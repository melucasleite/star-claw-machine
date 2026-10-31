// Every element the game drives, looked up once. The markup lives in src/app/Game.js.

export const TOUCH = matchMedia("(pointer: coarse)").matches;
export const scoreEl = document.getElementById("score");
export const heartsEl = document.getElementById("hearts");
export const bestEl = document.getElementById("best");
export const leftEl = document.getElementById("left");
export const streakEl = document.getElementById("streak");
export const popupsEl = document.getElementById("popups");
export const overlayEl = document.getElementById("overlay");
export const panelEl = document.getElementById("panel");
export const confirmEl = document.getElementById("confirm");
export const bagEl = document.getElementById("bag");
export const bagItemsEl = document.getElementById("bag-items");
export const bagCountEl = document.getElementById("bag-count");
export const howtoEl = document.getElementById("howto");
export const howtoPanel = document.getElementById("howto-panel");
export const settingsEl = document.getElementById("settings");
export const settingsPanel = document.getElementById("settings-panel");
export const assistTagEl = document.getElementById("assist-tag");
export const viewfinderEl = document.getElementById("viewfinder");
export const viewfinderTimeEl = document.getElementById("viewfinder-time");
export const loveEl = document.getElementById("love");
export const lovePanel = document.getElementById("love-panel");
export const soundEl = document.getElementById("sound");
export const screenCanvas = document.getElementById("screen");
export const fxCanvas = document.getElementById("fx");
