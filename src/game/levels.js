// The levels: which prizes stock the machine, what the marquee says, and which levels are open.
// A leaf module like settings.js (data, localStorage, no DOM or three.js), so anything can import
// it at load time. Adding a level is adding an entry here plus its kinds (see arcade.js).
import { ANIMALS } from "./animals.js";
import { ARCADE } from "./arcade.js";
import { levelUnlocked } from "./rules.js";
import { setLevel, settings } from "./settings.js";

// `stage` picks the set dressing (see stages.js); without one it's the plain cabinet.
// `kinds` work like ANIMALS: each is a shape the tiers colour in. A kind can also set `upright`
// (stocked standing, facing a random way), `walks` (wanders the floor, see walkers.js) and
// `dress()` (picks per-prize materials, like a customer's skin and hair).
export const LEVELS = [
  {
    id: 1,
    name: "THE MACHINE",
    blurb: "Knitted critters in a glass box.",
    marquee: "STAR CLAW",
    kinds: ANIMALS,
  },
  {
    id: 2,
    name: "THE ARCADE",
    blurb: "Plush cabinets and customers. The customers wander.",
    marquee: "ARCADE",
    stage: "arcade",
    kinds: ARCADE,
  },
  {
    id: 3,
    name: "THE CITY",
    blurb: "The streets around the arcade.",
    soon: true,
    kinds: [],
  },
];

// Beating the game as Mikaela renames every machine for good, in this browser: her own unlock.
const LOVE_KEY = "startclaw.love.v1";
export const love = { unlocked: false };
try {
  love.unlocked = localStorage.getItem(LOVE_KEY) === "1";
} catch {}
export function unlockLove() {
  love.unlocked = true;
  try {
    localStorage.setItem(LOVE_KEY, "1");
  } catch {}
}
// What the marquee says on a level.
export const marqueeFor = (level) =>
  love.unlocked ? "MIKAELA'S CLAW MACHINE" : level.marquee;

// Ids of the levels this browser has cleared in a single run.
const CLEARED_KEY = "startclaw.levels.v1";
export let cleared;
try {
  cleared = new Set(JSON.parse(localStorage.getItem(CLEARED_KEY)) ?? []);
} catch {
  cleared = new Set();
}
// Cheat codes, typed into the settings dialog. Each sets a flag that sticks in this browser.
const CHEATS_KEY = "startclaw.cheats.v1";
export const CHEATS = {
  FART: { flag: "unlockAll", message: "ALL LEVELS UNLOCKED" },
};
export const cheat = { unlockAll: false };
try {
  Object.assign(cheat, JSON.parse(localStorage.getItem(CHEATS_KEY)));
} catch {}
// Returns the cheat's message, or null for a code that does nothing.
export function enterCheat(code) {
  const c = CHEATS[code.trim().toUpperCase()];
  if (!c) return null;
  cheat[c.flag] = true;
  try {
    localStorage.setItem(CHEATS_KEY, JSON.stringify(cheat));
  } catch {}
  return c.message;
}

export const levelById = (id) => LEVELS.find((l) => l.id === id);
export const isUnlocked = (level) =>
  !level.soon && (cheat.unlockAll || levelUnlocked(LEVELS, cleared, level.id));
export const nextLevel = (level) => LEVELS[LEVELS.indexOf(level) + 1];

// The picked level, falling back to the first if it isn't open (or no longer exists).
export function currentLevel() {
  const level = levelById(settings.level);
  return level && isUnlocked(level) ? level : LEVELS[0];
}
export function pickLevel(id) {
  const level = levelById(id);
  if (!level || !isUnlocked(level) || level === currentLevel()) return false;
  setLevel(id);
  return true;
}

// Returns the level this clear just opened, if any.
export function markCleared(level) {
  if (cleared.has(level.id)) return null;
  cleared.add(level.id);
  try {
    localStorage.setItem(CLEARED_KEY, JSON.stringify([...cleared]));
  } catch {}
  const next = nextLevel(level);
  return next && !next.soon ? next : null;
}
