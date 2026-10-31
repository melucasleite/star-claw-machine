import { makesList } from "./rules.js";
import { refreshWorldBoard } from "./overlays.js";
import { unranked } from "./game.js";
import { currentLevel } from "./levels.js";

// ---------- high scores ----------

// Boards are per level, local and world alike. Scores saved before levels existed are level 1's.
export const SCORE_KEY = "startclaw.highscores.v1";
export const BOARD_SIZE = 5;
const levelOf = (s) => s.level ?? 1;
function loadAll() {
  try {
    const list = JSON.parse(localStorage.getItem(SCORE_KEY));
    if (!Array.isArray(list)) return [];
    return list.filter(
      (s) => typeof s?.score === "number" && typeof s?.name === "string",
    );
  } catch {
    return [];
  }
}
export function loadScores(level = currentLevel().id) {
  return loadAll()
    .filter((s) => levelOf(s) === level)
    .sort((a, b) => b.score - a.score)
    .slice(0, BOARD_SIZE);
}
export function saveScore(name, score, level) {
  const entry = { name, score, level, date: Date.now() };
  const mine = [...loadScores(level), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, BOARD_SIZE);
  const others = loadAll().filter((s) => levelOf(s) !== level);
  try {
    localStorage.setItem(SCORE_KEY, JSON.stringify([...others, ...mine]));
  } catch {}
  return entry;
}
// Global board: one public table on Supabase. Anyone can read it and add a score, nothing else.
// The publishable key is meant to ship in the page; row-level security does the gatekeeping.
export const WORLD = {
  url: "https://rmswzajiqycfvlgrsqbm.supabase.co/rest/v1/star_claw_scores",
  key: "sb_publishable_QX8Ah8CUiAnjHgUtpf74gg_HnIAKX8E",
  size: 10,
};
// `level` is the level the loaded rows belong to.
export const globalBoard = {
  rows: null,
  level: null,
  failed: false,
  mine: null,
  // Every level's rows fetched so far, for the menu's leaderboard.
  byLevel: {},
};
export const worldHeaders = {
  apikey: WORLD.key,
  Authorization: `Bearer ${WORLD.key}`,
};
export async function fetchWorld(level = currentLevel().id) {
  // Switching levels: don't show the old level's rows while the new ones load.
  if (level === currentLevel().id && globalBoard.level !== level)
    globalBoard.rows = null;
  try {
    const res = await fetch(
      `${WORLD.url}?select=id,name,score&level=eq.${level}&order=score.desc,created_at.asc&limit=${WORLD.size}`,
      { headers: worldHeaders },
    );
    if (!res.ok) throw new Error(res.status);
    const rows = await res.json();
    globalBoard.byLevel[level] = rows;
    // The picked level's rows also back the high score checks.
    if (level === currentLevel().id) {
      globalBoard.rows = rows;
      globalBoard.level = level;
    }
    globalBoard.failed = false;
  } catch {
    globalBoard.failed = !globalBoard.rows;
  }
  refreshWorldBoard();
}
export async function postWorld(name, score, level) {
  try {
    const res = await fetch(WORLD.url, {
      method: "POST",
      headers: {
        ...worldHeaders,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ name, score, level }),
    });
    if (!res.ok) throw new Error(res.status);
    globalBoard.mine = (await res.json())[0]?.id ?? null;
  } catch {}
  await fetchWorld();
}
// Runs played with aim assist (or our family) never reach either board.
export const makesWorld = (score) =>
  !unranked() &&
  !!globalBoard.rows &&
  makesList(globalBoard.rows, WORLD.size, score);

export const makesBoard = (score) =>
  !unranked() && makesList(loadScores(), BOARD_SIZE, score);
