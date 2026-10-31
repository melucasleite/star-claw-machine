import { leftEl } from "./dom.js";
import * as THREE from "three";
import { CHUTE, TIERS } from "./config.js";
import { currentLevel } from "./levels.js";
import { camera } from "./scene.js";
import { game } from "./game.js";
import { drawPlushIcon } from "./screen.js";
import { sfx } from "./audio.js";
import { theme } from "./settings.js";

// ---------- prize bag & collection ----------

export const iconUrls = {};
export function plushIconUrl(tier, animal) {
  const t = theme();
  const id = `${t.id}:${tier.name}:${animal.name}`;
  if (iconUrls[id]) return iconUrls[id];
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const c = cv.getContext("2d");
  if (t.screen.pixel) {
    // 8-bit icons: draw at 16 x 16, then blow them up without smoothing.
    const small = document.createElement("canvas");
    small.width = small.height = 16;
    drawPlushIcon(small.getContext("2d"), animal.icon, tier.css, 8, 9, 4.5);
    c.imageSmoothingEnabled = false;
    c.drawImage(small, 0, 0, 64, 64);
  } else drawPlushIcon(c, animal.icon, tier.css, 32, 36, 18);
  return (iconUrls[id] = cv.toDataURL());
}
export const prizeImg = (p) =>
  `<img class="prize-icon${p.fresh ? " fresh" : ""}" src="${plushIconUrl(p.tier, p.animal)}" alt="${p.tier.name} ${p.animal.name}" title="${p.tier.name} ${p.animal.name}${p.fresh ? " (new!)" : ""}" />`;

// Every colour + kind combo you have ever won, across runs and levels. Kind names are unique
// across levels, so the ids need no level prefix (and level 1's saved ids still work).
export const COLLECTION_KEY = "startclaw.collection.v1";
export const collectionSize = (level) => TIERS.length * level.kinds.length;
export const collectedIn = (level) =>
  level.kinds.reduce(
    (n, k) =>
      n + TIERS.filter((t) => collection.has(`${t.name}:${k.name}`)).length,
    0,
  );
export let collection;
try {
  collection = new Set(JSON.parse(localStorage.getItem(COLLECTION_KEY)) ?? []);
} catch {
  collection = new Set();
}
export function collect(plush) {
  const id = `${plush.tier.name}:${plush.animal.name}`;
  if (collection.has(id)) return false;
  collection.add(id);
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify([...collection]));
  } catch {}
  return true;
}
export const collectionHtml = (level = currentLevel()) =>
  `<p class="collection">COLLECTION ${collectedIn(level)}/${collectionSize(level)}</p>`;

// The won plushie pops out of the chute and arcs into the LEFT counter, which ticks down.
export function flyToBag(plush, prize) {
  const v = new THREE.Vector3(CHUTE.x, 0.5, CHUTE.z).project(camera);
  const x0 = ((v.x + 1) / 2) * innerWidth;
  const y0 = ((1 - v.y) / 2) * innerHeight;
  const r = leftEl.getBoundingClientRect();
  const x1 = r.left + 18;
  const y1 = r.top + r.height / 2;
  const fly = document.createElement("img");
  fly.className = "prize-flyer";
  fly.src = plushIconUrl(prize.tier, prize.animal);
  document.body.appendChild(fly);
  const peak = Math.min(y0, y1) - 120;
  fly
    .animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(0.4)` },
        {
          transform: `translate(${(x0 + x1) / 2}px, ${peak}px) scale(1.6) rotate(-14deg)`,
          offset: 0.45,
        },
        {
          transform: `translate(${x1}px, ${y1}px) scale(0.45) rotate(0deg)`,
          opacity: 0.4,
        },
      ],
      { duration: 850, easing: "cubic-bezier(.3,.7,.4,1)" },
    )
    .finished.then(() => {
      fly.remove();
      sfx.plop();
      leftEl.classList.remove("bump");
      void leftEl.offsetWidth;
      leftEl.classList.add("bump");
    });
}
