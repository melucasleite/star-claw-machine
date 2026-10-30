import { makesList } from "./rules.js";
import { refreshWorldBoard } from "./overlays.js";
import { game } from "./game.js";

// ---------- high scores ----------

export const SCORE_KEY = "startclaw.highscores.v1";
export const BOARD_SIZE = 5;
export function loadScores() {
  try {
    const list = JSON.parse(localStorage.getItem(SCORE_KEY));
    if (!Array.isArray(list)) return [];
    return list
      .filter(
        (s) => typeof s?.score === "number" && typeof s?.name === "string",
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, BOARD_SIZE);
  } catch {
    return [];
  }
}
export function saveScore(name, score) {
  const entry = { name, score, date: Date.now() };
  const list = [...loadScores(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, BOARD_SIZE);
  try {
    localStorage.setItem(SCORE_KEY, JSON.stringify(list));
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
export const globalBoard = { rows: null, failed: false, mine: null };
export const worldHeaders = {
  apikey: WORLD.key,
  Authorization: `Bearer ${WORLD.key}`,
};
export async function fetchWorld() {
  try {
    const res = await fetch(
      `${WORLD.url}?select=id,name,score&order=score.desc,created_at.asc&limit=${WORLD.size}`,
      { headers: worldHeaders },
    );
    if (!res.ok) throw new Error(res.status);
    globalBoard.rows = await res.json();
    globalBoard.failed = false;
  } catch {
    globalBoard.failed = !globalBoard.rows;
  }
  refreshWorldBoard();
}
export async function postWorld(name, score) {
  try {
    const res = await fetch(WORLD.url, {
      method: "POST",
      headers: {
        ...worldHeaders,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ name, score }),
    });
    if (!res.ok) throw new Error(res.status);
    globalBoard.mine = (await res.json())[0]?.id ?? null;
  } catch {}
  await fetchWorld();
}
// Runs played with aim assist never reach either board.
export const makesWorld = (score) =>
  !game.assisted &&
  !!globalBoard.rows &&
  makesList(globalBoard.rows, WORLD.size, score);

export const makesBoard = (score) =>
  !game.assisted && makesList(loadScores(), BOARD_SIZE, score);
