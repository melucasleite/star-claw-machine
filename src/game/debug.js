import { CLAW, GRIP, MG, RULES, TIERS } from "./config.js";
import { claw, hub, prongs } from "./claw.js";
import { plushies } from "./plushies.js";
import { keys, pressed } from "./input.js";
import { game, startGame } from "./game.js";
import { M, scene } from "./scene.js";
import { postFxComposer } from "./postfx.js";
import { music } from "./music.js";
import { ac } from "./audio.js";
import { applyTheme } from "./settings.js";
import { LEVELS, enterCheat } from "./levels.js";
import { refreshMenu } from "./settingsui.js";

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
  music,
  audioState: () => ac?.state ?? "none",
  applyTheme,
  LEVELS,
  // Same as typing FART in the settings cheats box.
  unlockLevels() {
    enterCheat("FART");
    refreshMenu();
  },
};
