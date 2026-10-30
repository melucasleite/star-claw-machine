import { game } from "./game.js";
import { keys } from "./input.js";

// Help, settings and confirm dialogs each hold the game paused, and can stack (a confirm opens on
// top of settings). The game runs again once nothing holds it.
const holds = new Set();
export function hold(reason) {
  holds.add(reason);
  game.paused = true;
  keys.Space = false;
}
export function release(reason) {
  holds.delete(reason);
  game.paused = holds.size > 0;
}
export const holding = (reason) => holds.has(reason);
