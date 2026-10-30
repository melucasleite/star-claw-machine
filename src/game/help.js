import { TOUCH, howtoEl, howtoPanel } from "./dom.js";
import { RULES, TIERS } from "./config.js";
import { heartSvg } from "./hud.js";
import { pendingConfirm } from "./overlays.js";
import { game } from "./game.js";
import { hold, release } from "./pause.js";
import { COLLECTION_SIZE } from "./bag.js";
import { sfx } from "./audio.js";

// ---------- how to play ----------

// One help sheet, opened by the ? button, H, or automatically the first time this browser plays.
export const HOWTO_KEY = "startclaw.howto.v1";

// The three moves of a turn, as cards with a little pixel gesture each.
export const GESTURES = {
  drag: `<svg viewBox="0 0 24 24" shape-rendering="crispEdges"><path d="M10 9h4v4h-4z" fill="#fff4e2"/><path d="M11 2h2v5h-2zM11 15h2v5h-2zM3 10h5v2H3zM16 10h5v2h-5zM10 4h1v1h-1zM13 4h1v1h-1zM10 17h1v1h-1zM13 17h1v1h-1zM5 9h1v1H5zM5 12h1v1H5zM18 9h1v1h-1zM18 12h1v1h-1z" fill="#ffd75e"/></svg>`,
  tap: `<svg viewBox="0 0 24 24" shape-rendering="crispEdges"><path d="M10 10h4v4h-4z" fill="#fff4e2"/><path d="M8 6h8v1H8zM8 17h8v1H8zM6 8h1v8H6zM17 8h1v8h-1zM7 7h1v1H7zM16 7h1v1h-1zM7 16h1v1H7zM16 16h1v1h-1z" fill="#ffd75e"/></svg>`,
  hold: `<svg viewBox="0 0 24 24" shape-rendering="crispEdges"><path d="M9 9h6v6H9z" fill="#fff4e2"/><path d="M7 4h10v1H7zM7 19h10v1H7zM4 7h1v10H4zM19 7h1v10h-1zM5 5h2v2H5zM17 5h2v2h-2zM5 17h2v2H5zM17 17h2v2h-2z" fill="#5ee05e"/></svg>`,
};
export function stepsHtml() {
  const steps = TOUCH
    ? [
        ["drag", "DRAG", "to move"],
        ["tap", "TAP", "to drop"],
        ["hold", "HOLD", "to reel"],
      ]
    : [
        ["drag", "ARROWS", "to move"],
        ["tap", "SPACE", "to drop"],
        ["hold", "HOLD SPACE", "to reel"],
      ];
  return `<div class="steps">${steps
    .map(
      ([icon, key, text], n) =>
        `<div class="step"><span class="n">${n + 1}</span>${GESTURES[icon]}<b>${key}</b><span>${text}</span></div>`,
    )
    .join("")}</div>`;
}
export function openHelp() {
  if (!howtoEl.hidden || pendingConfirm) return;
  const heart = heartSvg("inline");
  // Kept short enough to fit a phone screen without scrolling; GOT IT also sticks to the bottom.
  const tiers = TIERS.map(
    (t) =>
      `<div><i class="dot" style="background:${t.css}"></i>${t.name.toUpperCase()}<b>${t.points}</b></div>`,
  ).join("");
  howtoPanel.innerHTML = `
    <h1>HOW TO PLAY</h1>
    <p>Drop the claw on a plushie, then keep it in the green bar to reel it into the chute.</p>
    ${stepsHtml()}
    <p class="aside">${TOUCH ? "QUIT &amp; SAVE cashes out &middot; &#9835; / &#128264; toggle sound" : "Q cashes out &middot; M / S toggle sound &middot; H opens this"}</p>
    <h2>POINTS</h2>
    <div class="tiers">${tiers}</div>
    <p>Perfect reel x1.5 &middot; streaks up to x${RULES.streakMax}</p>
    <h2>HEARTS</h2>
    <p>Miss or drop -&frac12;${heart} &middot; lost reel -1${heart} &middot; catch +&frac12;${heart}<br />Cash out +${RULES.cashOutPerHalf} per &frac12;${heart} &middot; clear it all +${RULES.clearBonus}</p>
    <p>Collect all ${COLLECTION_SIZE} and top the world board.</p>
    <div class="actions"><button class="btn big" type="button" data-close-help>GOT IT</button></div>`;
  howtoEl.hidden = false;
  howtoPanel.scrollTop = 0;
  sfx.blip();
  if (game.mode === "play") hold("help");
}
export function closeHelp() {
  if (howtoEl.hidden) return;
  howtoEl.hidden = true;
  release("help");
  try {
    localStorage.setItem(HOWTO_KEY, "1");
  } catch {}
}
addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  if (e.target.closest("[data-help]")) openHelp();
  else if (e.target.closest("[data-close-help]") || e.target === howtoEl)
    closeHelp();
});
