// Entry point, imported once by src/app/Game.js after the markup mounts.
// The base layer goes first, in dependency order, so nothing in the import cycles above it
// (game <-> overlays <-> input ...) is touched before it exists.
import "./config.js";
import "./animals.js";
import "./dom.js";
import "./scene.js";
import "./physics.js";
import "./cabinet.js";
import "./claw.js";
import "./plushies.js";
import { resize } from "./scene.js";
import { drawMarquee } from "./cabinet.js";
import { restock } from "./plushies.js";
import { fetchWorld } from "./scores.js";
import { renderHud } from "./hud.js";
import { sizeFx } from "./confetti.js";
import { renderTitle, setMode } from "./overlays.js";
import { HOWTO_KEY, openHelp } from "./help.js";
import { setState } from "./game.js";
import { frame } from "./loop.js";
import "./debug.js";

// The confetti canvas follows the page size too.
function onResize() {
  resize();
  sizeFx();
}
addEventListener("resize", onResize);
// Span, unspan, rotate or fold: the layout can settle after the resize event, so also watch
// the page box itself and re-measure once things have settled.
new ResizeObserver(onResize).observe(document.documentElement);
visualViewport?.addEventListener("resize", onResize);
addEventListener("orientationchange", () => setTimeout(onResize, 300));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) onResize();
});
onResize();
document.fonts.load('16px "Press Start 2P"').then(() => drawMarquee());
restock();
setMode("title");
setState("settle");
renderHud();
renderTitle();
try {
  if (!localStorage.getItem(HOWTO_KEY)) openHelp();
} catch {}
fetchWorld();
requestAnimationFrame(frame);
