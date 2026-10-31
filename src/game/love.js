import { loveEl, lovePanel } from "./dom.js";
import { notes } from "./audio.js";
import { game } from "./game.js";
import { hold, release } from "./pause.js";

// ---------- for Mikaela ----------

// Clear the machine, sign the end screen as MIKAELA, and this opens: Lucas's wedding vows as a
// little slideshow, one doodle per slide, each drawing itself in as the slide arrives.
export const LOVE_NAME = "MIKAELA";

// Doodle pieces. Every stroke has pathLength 1 so CSS can draw it in; `tone` picks the colour.
const ink = (d, tone = "") =>
  `<path class="ink ${tone}" pathLength="1" d="${d}"/>`;
const fill = (d, tone = "") => `<path class="blush ${tone}" d="${d}"/>`;
const circle = (cx, cy, r) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const heart = (x, y, s) =>
  `M${x} ${y + s * 0.9} C${x - s * 1.25} ${y + s * 0.05} ${x - s * 0.85} ${y - s * 0.85} ${x} ${y - s * 0.3} C${x + s * 0.85} ${y - s * 0.85} ${x + s * 1.25} ${y + s * 0.05} ${x} ${y + s * 0.9}Z`;
const sparkle = (x, y, s) =>
  `M${x} ${y - s} L${x} ${y + s} M${x - s} ${y} L${x + s} ${y}`;
const star = (x, y, s) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? s * 0.45 : s;
    d += `${i ? "L" : "M"}${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`;
  }
  return d + "Z";
};
const svg = (body) =>
  `<svg class="doodle" viewBox="0 0 160 120" aria-hidden="true">${body}</svg>`;

const DOODLES = {
  // A claw machine holding a heart.
  claw: svg(
    fill(heart(80, 60, 11)) +
      ink("M41 21 Q80 18 119 21 Q122 60 119 99 Q80 102 41 99 Q38 60 41 21") +
      ink("M41 76 Q80 74 119 76") +
      ink(
        "M80 21 L80 40 M71 52 Q70 41 80 40 Q90 41 89 52 M71 52 L74 56 M89 52 L86 56",
      ) +
      ink(heart(80, 60, 11)) +
      ink(circle(58, 88, 4) + " M100 93 L100 84" + circle(100, 82, 3)) +
      ink(sparkle(24, 32, 5) + sparkle(138, 46, 4) + sparkle(30, 80, 3)),
  ),
  // Two rings, one with a diamond.
  rings: svg(
    fill("M60 40 L66 32 L72 40 L66 47Z", "y") +
      ink(circle(66, 70, 22)) +
      ink(circle(94, 70, 22)) +
      ink("M60 40 L66 32 L72 40 L66 47Z M60 40 L72 40", "y") +
      ink("M66 24 L66 18 M56 28 L52 24 M76 28 L80 24", "y") +
      fill(heart(130, 34, 7)) +
      ink(heart(130, 34, 7)) +
      ink(heart(28, 44, 5)),
  ),
  // A big happy face with rosy cheeks.
  smile: svg(
    fill(circle(64, 70, 6) + circle(96, 70, 6)) +
      ink(circle(80, 60, 34)) +
      ink("M65 55 Q70 48 75 55 M85 55 Q90 48 95 55") +
      ink("M62 68 Q80 90 98 68") +
      ink(star(132, 26, 9), "y") +
      ink(sparkle(26, 30, 5) + sparkle(138, 90, 4)),
  ),
  // A four-leaf clover: the luckiest man alive.
  clover: svg(
    [0, 90, 180, 270]
      .map(
        (a) =>
          `<g transform="rotate(${a} 80 52)">${fill(heart(80, 38, 14), "g")}${ink(heart(80, 38, 14), "g")}</g>`,
      )
      .join("") +
      ink("M80 66 Q86 88 76 110", "g") +
      ink(sparkle(130, 28, 5) + sparkle(30, 92, 4), "y"),
  ),
  // Heart eyes and a big grin.
  grin: svg(
    fill(heart(64, 50, 9) + heart(96, 50, 9)) +
      ink(heart(64, 50, 9)) +
      ink(heart(96, 50, 9)) +
      ink("M56 70 Q80 98 104 70 Q80 80 56 70") +
      ink(heart(134, 26, 6) + heart(24, 30, 5) + heart(140, 88, 4)),
  ),
  // A seedling in a pot.
  sprout: svg(
    fill(
      "M80 60 Q66 58 61 45 Q76 45 80 60Z M80 53 Q95 49 99 36 Q84 36 80 53Z",
      "g",
    ) +
      ink("M58 80 L102 80 M62 80 L67 106 L93 106 L98 80") +
      ink("M80 80 Q77 64 80 44", "g") +
      ink(
        "M80 60 Q66 58 61 45 Q76 45 80 60 M80 53 Q95 49 99 36 Q84 36 80 53",
        "g",
      ) +
      ink(circle(130, 26, 9), "y") +
      ink(
        "M130 10 L130 13 M146 26 L143 26 M141 15 L139 17 M119 15 L121 17",
        "y",
      ),
  ),
  // A flower in bloom.
  bloom: svg(
    [0, 60, 120, 180, 240, 300]
      .map(
        (a) =>
          `<g transform="rotate(${a} 80 40)">${fill("M80 40 Q70 28 80 16 Q90 28 80 40Z")}${ink("M80 40 Q70 28 80 16 Q90 28 80 40Z")}</g>`,
      )
      .join("") +
      fill(circle(80, 40, 7), "y") +
      ink(circle(80, 40, 7), "y") +
      ink("M80 47 Q76 80 80 112", "g") +
      ink(
        "M79 80 Q62 76 56 64 Q72 64 79 80 M80 92 Q98 88 104 76 Q88 76 80 92",
        "g",
      ) +
      ink(sparkle(30, 30, 5) + sparkle(132, 60, 4)),
  ),
  // The moon and the stars.
  moon: svg(
    fill("M88 22 A34 34 0 1 0 116 84 A28 28 0 1 1 88 22Z", "y") +
      ink("M88 22 A34 34 0 1 0 116 84 A28 28 0 1 1 88 22Z", "y") +
      ink(star(128, 30, 8) + star(140, 62, 5) + star(30, 28, 6), "y") +
      ink("M128 30 L140 62", "dot"),
  ),
  // A hot-air balloon, off to chase a dream.
  balloon: svg(
    fill(heart(80, 44, 9)) +
      ink(
        "M80 14 C54 14 47 40 57 58 C63 68 71 74 74 80 L86 80 C89 74 97 68 103 58 C113 40 106 14 80 14Z",
      ) +
      ink("M80 14 Q68 46 75 80 M80 14 Q92 46 85 80") +
      ink(heart(80, 44, 9)) +
      ink("M74 80 L74 90 M86 80 L86 90 M72 90 L88 90 L86 102 L74 102Z") +
      ink(
        "M14 96 Q18 86 28 90 Q34 82 42 90 Q50 90 48 98 L14 98Z M116 40 Q120 32 128 36 Q134 30 140 38 Q146 38 144 44 L116 44Z",
        "sky",
      ),
  ),
  // The two of us, holding hands.
  us: svg(
    fill("M100 44 L88 78 L112 78Z") +
      fill(heart(80, 30, 7)) +
      ink(circle(60, 35, 9) + circle(100, 35, 9)) +
      ink(
        "M60 44 L60 72 M60 72 L53 94 M60 72 L67 94 M60 52 L48 66 M60 52 L80 62",
      ) +
      ink(
        "M100 44 L88 78 L112 78Z M95 78 L93 95 M105 78 L107 95 M100 52 L80 62 M100 52 L112 64",
      ) +
      ink("M91 32 Q89 46 87 50 M109 32 Q111 46 113 50") +
      ink(heart(80, 30, 7)) +
      ink("M26 104 Q53 99 80 104 T134 104"),
  ),
  // A heart with Cupid's arrow through it.
  arrow: svg(
    fill(heart(80, 58, 28)) +
      ink(heart(80, 58, 28)) +
      ink(
        "M28 94 L132 26 M132 26 L120 27 M132 26 L128 37 M28 94 L34 84 M28 94 L38 92",
      ) +
      ink(heart(26, 30, 5) + heart(138, 92, 6)),
  ),
};

// The vows, word for word, a few lines to a slide.
const SLIDES = [
  [
    "claw",
    `<p class="big">A prize for the one who cleared the whole machine.</p><p class="hint">Tap the arrow, my love &rarr;</p>`,
  ],
  [
    "rings",
    `<p>My love, today is our big day. I&rsquo;m marrying my best friend. In front of my best friends, isn&rsquo;t that crazy? We all here under this one roof. There&rsquo;s just so much love in this room. Today is the happiest day of my life.</p>`,
  ],
  [
    "smile",
    `<p>Let me seize this moment and share this with everyone. The exact moment I fell in love with you. It was when I saw your loving smile for the very first time. Naturally we had just met so you were smiling to Sandra. It was a big, beautiful, beautiful smile.</p>`,
  ],
  [
    "clover",
    `<p>It was the most beautiful smile I had ever seen. I immediately thought to myself, <em>I want her to smile like that for me.</em> And here you are, smiling now. And I feel like the luckiest man alive.</p>`,
  ],
  [
    "grin",
    `<p class="vow"><span class="n">Here is my first vow:</span>I will live to make you smile.</p>`,
  ],
  [
    "sprout",
    `<p>Devotion and love are hard to earn, but you did that. You bring out the very best in me&mdash; I just can&rsquo;t hide from you. You&rsquo;ve seen me at my worst, and at my best, and you didn&rsquo;t just accept me as I am. You insisted on my potential, believed in me, and helped me grow as a person. I saw the man I wanted to be through your eyes and in many ways, you saved my life.</p>`,
  ],
  [
    "bloom",
    `<p class="vow"><span class="n">So here&rsquo;s my second vow:</span>I will always grow, and I will keep stepping it up, day after day, so you can continuously fall in love with me, and so our marriage can always flourish.</p>`,
  ],
  [
    "moon",
    `<p class="big">Finally, I want to say that I&rsquo;m living my biggest dreams with you.</p>`,
  ],
  [
    "balloon",
    `<p class="vow"><span class="n">Here&rsquo;s my third and final vow:</span>I will believe in your dreams, just as you believed in mine. I will live to help fulfill your dreams, especially the one we had to delay.</p>`,
  ],
  [
    "us",
    `<p>I&rsquo;m here for you, babe. And as God is my witness I will never settle and put you aside&mdash;body and soul. Your partner, your lover, the one you chose to walk life with.</p>`,
  ],
  [
    "arrow",
    `<p class="close">I love you.</p><p class="sign">&mdash; Lucas</p>`,
  ],
];

const LAST = SLIDES.length - 1;
let at = 0;

function render() {
  const slides = SLIDES.map(
    ([doodle, html], i) =>
      `<section class="slide" aria-roledescription="slide" aria-label="${i + 1} of ${SLIDES.length}">${DOODLES[doodle]}${html}</section>`,
  ).join("");
  const dots = SLIDES.map(
    (_, i) =>
      `<button type="button" class="dot-btn" data-love-go="${i}" aria-label="Slide ${i + 1}"></button>`,
  ).join("");
  lovePanel.innerHTML = `
    <p class="eyebrow">for Mikaela</p>
    <h1>I made this for you</h1>
    <div class="flourish" aria-hidden="true"><span></span>&#9829;<span></span></div>
    <div class="slides" aria-live="polite">${slides}</div>
    <nav class="love-nav">
      <button type="button" class="love-arrow" data-love-step="-1" aria-label="Back">&lsaquo;</button>
      <div class="dots">${dots}</div>
      <button type="button" class="love-arrow" data-love-step="1" aria-label="Next">&rsaquo;</button>
      <button type="button" class="love-btn" data-close-love aria-label="Close">&#9829;</button>
    </nav>`;
}

function go(i) {
  at = Math.max(0, Math.min(LAST, i));
  lovePanel.querySelectorAll(".slide").forEach((s, k) => {
    s.classList.toggle("on", k === at);
    s.classList.toggle("past", k < at);
  });
  lovePanel
    .querySelectorAll(".dot-btn")
    .forEach((d, k) => d.classList.toggle("on", k === at));
  lovePanel.querySelector("[data-love-step='-1']").disabled = at === 0;
  // On the last slide the next arrow gives way to the heart, which closes.
  lovePanel.querySelector(".love-nav").classList.toggle("end", at === LAST);
  // Each slide gets a little two-note chime, rising toward the end.
  notes([72 + at * 2, 79 + at * 2], 0.09, {
    vol: 0.035,
    type: "sine",
    dur: 0.6,
  });
}
export const stepLove = (d) => go(at + d);

// Hearts drifting up behind the card, each with its own size, speed and sway.
function heartsHtml() {
  return Array.from({ length: 28 }, (_, i) => {
    const left = (i * 37) % 100;
    const size = 12 + ((i * 7) % 22);
    const dur = 9 + ((i * 5) % 9);
    const delay = -((i * 13) % 17);
    return `<i style="left:${left}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s">&#9829;</i>`;
  }).join("");
}

export function openLove() {
  // Opened from the cheats box mid-run, the game waits while she reads.
  if (game.mode === "play") hold("love");
  render();
  loveEl.querySelector(".love-hearts").innerHTML = heartsHtml();
  loveEl.hidden = false;
  lovePanel.scrollTop = 0;
  // A soft music-box rise.
  notes([72, 76, 79, 84, 88, 91, 96], 0.14, {
    vol: 0.05,
    type: "sine",
    dur: 0.9,
  });
  go(0);
  lovePanel
    .querySelector("[data-love-step='1']")
    .focus({ preventScroll: true });
}
export function closeLove() {
  if (loveEl.hidden) return;
  loveEl.hidden = true;
  release("love");
}

addEventListener("click", (e) => {
  if (!(e.target instanceof Element) || loveEl.hidden) return;
  const t = e.target;
  if (t.closest("[data-close-love]") || t === loveEl) return closeLove();
  const step = t.closest("[data-love-step]");
  if (step) return stepLove(Number(step.dataset.loveStep));
  const dot = t.closest("[data-love-go]");
  if (dot) go(Number(dot.dataset.loveGo));
});

// Swipe between slides on a phone.
let swipe = null;
lovePanel.addEventListener("pointerdown", (e) => {
  swipe = { x: e.clientX, y: e.clientY };
});
lovePanel.addEventListener("pointerup", (e) => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x;
  const dy = e.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
    stepLove(dx < 0 ? 1 : -1);
});
