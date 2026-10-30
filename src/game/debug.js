import { CLAW, GRIP, MG, RULES, TIERS } from "./config.js";
import { claw, hub, prongs } from "./claw.js";
import { plushies } from "./plushies.js";
import { keys, pressed } from "./input.js";
import { game, startGame } from "./game.js";
import { M, scene } from "./scene.js";
import { postFxComposer } from "./postfx.js";

// Debug handle for playtesting from the console.
window.__claw = {
  game,
  hub,
  plushies,
  prongs,
  claw,
  keys,
  pressed,
  CLAW,
  GRIP,
  MG,
  RULES,
  TIERS,
  startGame,
  scene,
  M,
  postFxComposer,
};
