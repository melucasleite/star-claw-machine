import { loveEl, settingsEl } from "./dom.js";
import { CLAW } from "./config.js";
import { CAM_OFFSET, camera } from "./scene.js";
import { hub } from "./claw.js";
import {
  answerConfirm,
  askConfirm,
  chooseLevel,
  pendingConfirm,
} from "./overlays.js";
import {
  closeSettings,
  menuBack,
  menuFocus,
  openSettings,
  stepItem,
} from "./settingsui.js";
import { closeLove, stepLove } from "./love.js";
import { game, startGame } from "./game.js";
import { toggleSound } from "./audio.js";

// ---------- input ----------

export const keys = {};
export const pressed = {};
export const GAME_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
];
addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  // The letter swallows every key, so nothing starts a game behind it. Arrows, Space and Enter
  // turn the pages; Escape closes it.
  if (!loveEl.hidden) {
    if (e.code === "Escape") closeLove();
    else if (e.code === "ArrowLeft") stepLove(-1);
    else if (["ArrowRight", "Space", "Enter"].includes(e.code)) {
      e.preventDefault();
      stepLove(1);
    }
    return;
  }
  if (e.code === "KeyH" && !e.repeat && settingsEl.hidden)
    return openSettings("help");
  if ((e.code === "KeyM" || e.code === "KeyS") && !e.repeat)
    return toggleSound(e.code === "KeyM" ? "music" : "sfx");
  if (pendingConfirm) {
    if (e.code === "Enter" || e.code === "KeyY") answerConfirm(true);
    else if (e.code === "Escape" || e.code === "KeyN") answerConfirm(false);
    return;
  }
  if (!settingsEl.hidden) {
    if (e.code === "Escape") menuBack();
    else if (e.code === "KeyO") closeSettings();
    else if (e.code === "ArrowUp") menuFocus(-1);
    else if (e.code === "ArrowDown") menuFocus(1);
    else if (e.code === "ArrowLeft") stepItem(-1);
    else if (e.code === "ArrowRight") stepItem(1);
    return;
  }
  if (e.code === "KeyO" && !e.repeat) return openSettings();
  if (game.paused) return;
  if (game.mode !== "play") {
    const ready =
      (game.mode === "title" || game.mode === "over") &&
      performance.now() - game.modeAt > 1200;
    if (ready && !e.repeat && (e.code === "Space" || e.code === "Enter"))
      startGame();
    // 1, 2, ... pick a level.
    else if (/^Digit[1-9]$/.test(e.code) && !e.repeat)
      chooseLevel(Number(e.code.slice(5)));
    return;
  }
  if (!e.repeat) pressed[e.code] = true;
  keys[e.code] = true;
  if (e.code === "KeyQ" && !e.repeat) askConfirm("quit");
});
addEventListener("keyup", (e) => (keys[e.code] = false));

// Touch and mouse: drag to move the claw, tap to drop, hold anywhere to reel.
export const TAP = { maxMove: 10, maxMs: 350 };
export const SIN_ELEV = CAM_OFFSET.y / CAM_OFFSET.length();
export let drag = null;
export let dragTarget = null;

// Converts a screen-space drag (CSS px) into a move on the floor plane.
export function screenDeltaToGround(dx, dy) {
  const s = (camera.right - camera.left) / innerWidth;
  const right = dx * s; // along (1, 0, -1)
  const toward = (dy * s) / SIN_ELEV; // along (1, 0, 1)
  return {
    x: (right + toward) / Math.SQRT2,
    z: (toward - right) / Math.SQRT2,
  };
}

export const isUi = (t) =>
  t instanceof Element && t.closest("button, input, .overlay");

addEventListener("pointerdown", (e) => {
  if (drag || isUi(e.target) || game.mode !== "play" || game.paused) return;
  e.preventDefault();
  drag = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    t: performance.now(),
    hubX: hub.position.x,
    hubZ: hub.position.z,
    moved: false,
  };
  if (game.state !== "aim") keys.Space = true;
});
addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) > TAP.maxMove) drag.moved = true;
  if (game.state === "aim" && drag.moved) {
    const d = screenDeltaToGround(dx, dy);
    const clamp = (n) => Math.max(-CLAW.reach, Math.min(CLAW.reach, n));
    dragTarget = { x: clamp(drag.hubX + d.x), z: clamp(drag.hubZ + d.z) };
  }
});
export function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const tap = !drag.moved && performance.now() - drag.t < TAP.maxMs;
  if (tap && game.state === "aim") pressed.Space = true;
  keys.Space = false;
  drag = null;
  dragTarget = null;
}
addEventListener("pointerup", endDrag);
addEventListener("pointercancel", endDrag);

// iOS Safari ignores user-scalable=no, so quick taps double-tap-zoom and two fingers pinch.
// Cancelling the touch events stops that; pointer events still fire. Buttons and inputs keep working.
export const blockZoom = (e) => {
  if (!(e.target instanceof Element)) return e.preventDefault();
  if (e.target.closest("button, input")) return;
  const oneFinger = e.touches && e.touches.length < 2;
  if (e.type !== "touchend" && oneFinger && e.target.closest(".panel")) return;
  e.preventDefault();
};
for (const type of ["touchstart", "touchmove", "touchend"]) {
  document.addEventListener(type, blockZoom, { passive: false });
}
for (const type of ["gesturestart", "gesturechange", "dblclick"]) {
  document.addEventListener(type, (e) => e.preventDefault());
}
