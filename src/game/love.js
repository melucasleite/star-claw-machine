import { loveEl, lovePanel } from "./dom.js";
import { ringAgain, startSong, stopSong } from "./lovesong.js";
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
const svg = (body, cls = "") =>
  `<svg class="doodle ${cls}" viewBox="0 0 160 120" aria-hidden="true">${body}</svg>`;

// ----- story scenes: stick figures, in beats -----

// A wider canvas for scenes with people in them.
const scene = (body) =>
  `<svg class="doodle scene" viewBox="0 0 240 150" aria-hidden="true">${body}</svg>`;
// A beat of the story: everything in it draws in `d` seconds after the slide arrives. A `pop`
// beat springs in instead, like a thought bubble.
const beat = (d, body, cls = "") =>
  `<g class="beat ${cls}" style="--d:${d}s">${body}</g>`;
// A beat with a looping idle motion once it has drawn in (drip, float, spin, glow).
const beatc = (cls, d, body) => beat(d, body, cls);
// A heart that keeps beating after it has drawn in.
const hearty = (x, y, size) =>
  `<g class="throb">${fill(heart(x, y, size))}${ink(heart(x, y, size))}</g>`;
const label = (x, y, text) =>
  `<text class="label" x="${x}" y="${y}" text-anchor="middle">${text}</text>`;
const scaled = (x, y, k, body) =>
  `<g transform="translate(${x} ${y}) scale(${k})">${body}</g>`;

// A head centred on (x, y): brunette hair (long, bob or short), dot eyes glancing toward `look`
// (-1 left, 1 right), rosy cheeks and a smile.
function head(x, y, o = {}) {
  const R = 9;
  const lx = (o.look ?? 0) * 2.5;
  let s = "";
  if (o.hair === "long" || o.hair === "bob") {
    const end = o.hair === "long" ? 24 : 11;
    s += fill(
      `M${x - R} ${y} C${x - R - 3} ${y + end * 0.6} ${x - R - 2} ${y + end} ${x - R + 1} ${y + end} L${x + R - 1} ${y + end} C${x + R + 2} ${y + end} ${x + R + 3} ${y + end * 0.6} ${x + R} ${y} A${R} ${R} 0 0 0 ${x - R} ${y}Z`,
      "hair",
    );
  }
  if (o.veil)
    s += fill(
      `M${x - 4} ${y - R} Q${x + R + 12} ${y + 6} ${x + R + 8} ${y + 30} L${x + R - 2} ${y + 8}Z`,
      "veil",
    );
  s += fill(circle(x, y, R), "skin") + ink(circle(x, y, R));
  s += fill(
    `M${x - R} ${y - 1} A${R} ${R} 0 0 1 ${x + R} ${y - 1} Q${x + 2} ${y - 6} ${x - R} ${y - 1}Z`,
    "hair",
  );
  s += fill(
    circle(x - 3 + lx, y + 0.5, 1.1) + circle(x + 3 + lx, y + 0.5, 1.1),
    "eye",
  );
  s += fill(
    circle(x - 5.5 + lx, y + 3.2, 1.7) + circle(x + 5.5 + lx, y + 3.2, 1.7),
  );
  s += ink(
    `M${x - 3.5 + lx} ${y + 3.5} Q${x + lx} ${y + (o.big ? 8.5 : 6.5)} ${x + 3.5 + lx} ${y + 3.5}`,
  );
  return s;
}

// A stick figure standing on y = base. `arms` are the two hands relative to the shoulder.
function person(x, base, o = {}) {
  const hy = base - 60;
  const top = hy + 9;
  const hip = base - 20;
  const sy = top + 7;
  const [l, r] = o.arms ?? [
    [-10, 14],
    [10, 14],
  ];
  let s = "";
  if (o.dress)
    s +=
      fill(`M${x} ${top} L${x - 11} ${hip + 4} L${x + 11} ${hip + 4}Z`) +
      ink(`M${x} ${top} L${x - 11} ${hip + 4} L${x + 11} ${hip + 4}Z`) +
      ink(
        `M${x - 4} ${hip + 4} L${x - 5} ${base} M${x + 4} ${hip + 4} L${x + 5} ${base}`,
      );
  else
    s += ink(
      `M${x} ${top} L${x} ${hip} M${x} ${hip} L${x - 7} ${base} M${x} ${hip} L${x + 7} ${base}`,
    );
  s += ink(`M${x} ${sy} l${l[0]} ${l[1]} M${x} ${sy} l${r[0]} ${r[1]}`);
  if (o.bow)
    s += ink(
      `M${x - 4} ${top + 2} L${x + 4} ${top + 6} L${x + 4} ${top + 2} L${x - 4} ${top + 6}Z`,
    );
  s += head(x, hy, o);
  if (o.name) s += label(x, base + 13, o.name);
  const phase = o.phase ?? (x * 0.37 + base * 0.11) % 2.6;
  return `<g class="sway" style="--sway:${-phase}s">${s}</g>`;
}

const cloverAt = (x, y, k) =>
  scaled(
    x,
    y,
    k,
    [0, 90, 180, 270]
      .map(
        (a) =>
          `<g transform="rotate(${a})">${fill(heart(0, -14, 14), "g")}${ink(heart(0, -14, 14), "g")}</g>`,
      )
      .join("") + ink("M0 14 Q6 36 -4 58", "g"),
  );

const DOODLES = {
  // A banana phone, ringing: curly cord, ring lines at both ends, a couple of notes.
  bananaphone: svg(
    fill(
      "M30 48 Q78 112 132 46 Q136 40 130 40 Q80 92 36 42 Q28 40 30 48Z",
      "y",
    ) +
      ink(
        "M30 48 Q78 112 132 46 Q136 40 130 40 Q80 92 36 42 Q28 40 30 48Z",
        "y",
      ) +
      ink("M131 41 L137 33 L141 35 M30 48 Q26 45 31 42", "y") +
      ink("M44 54 Q80 92 120 52", "y") +
      ink("M80 80 q-7 5 0 9 q7 4 0 9 q-7 4 0 9 q7 4 0 9") +
      ink(
        "M22 30 Q16 38 20 46 M12 24 Q4 38 10 50 M142 24 Q148 32 144 40 M150 16 Q160 30 154 44",
      ) +
      ink(
        "M98 22 L98 8 L110 5 L110 19 M98 8 L110 5" +
          circle(95, 22, 3) +
          circle(107, 19, 3),
      ),
    "ringing",
  ),
  // Heart eyes and a big grin.
  grin: svg(
    hearty(64, 50, 9) +
      hearty(96, 50, 9) +
      ink("M56 70 Q80 98 104 70 Q80 80 56 70") +
      ink(heart(134, 26, 6) + heart(24, 30, 5) + heart(140, 88, 4)),
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
      `<g class="twinkle">${ink(star(128, 30, 8) + star(140, 62, 5) + star(30, 28, 6), "y")}</g>` +
      ink("M128 30 L140 62", "dot march"),
  ),
  // A hot-air balloon, off to chase a dream.
  balloon: svg(
    fill(heart(80, 44, 9)) +
      ink(
        "M80 14 C54 14 47 40 57 58 C63 68 71 74 74 80 L86 80 C89 74 97 68 103 58 C113 40 106 14 80 14Z",
      ) +
      ink("M80 14 Q68 46 75 80 M80 14 Q92 46 85 80") +
      ink(heart(80, 44, 9)) +
      scaled(
        76.5,
        87,
        0.36,
        head(0, 0, { hair: "short", look: 1, big: true }),
      ) +
      scaled(
        83.5,
        87,
        0.36,
        head(0, 0, { hair: "long", look: -1, big: true }),
      ) +
      ink("M74 80 L74 90 M86 80 L86 90 M72 90 L88 90 L86 102 L74 102Z") +
      ink(
        "M14 96 Q18 86 28 90 Q34 82 42 90 Q50 90 48 98 L14 98Z M116 40 Q120 32 128 36 Q134 30 140 38 Q146 38 144 44 L116 44Z",
        "sky",
      ),
  ),
  // A heart with Cupid's arrow through it.
  arrow: svg(
    hearty(80, 58, 28) +
      ink(
        "M28 94 L132 26 M132 26 L120 27 M132 26 L128 37 M28 94 L34 84 M28 94 L38 92",
      ) +
      ink(heart(26, 30, 5) + heart(138, 92, 6)),
  ),
};

const SCENES = {
  // Our wedding: the two of us under one roof, our best friends all around.
  wedding: scene(
    beat(0.2, ink("M24 76 L120 22 L216 76") + hearty(120, 12, 6)) +
      beat(
        0.7,
        [
          [40, "bob", 1],
          [64, "short", 1],
          [176, "long", -1],
          [200, "short", -1],
        ]
          .map(([x, hair, look]) =>
            scaled(
              x,
              136,
              0.62,
              person(0, 0, {
                hair,
                look,
                dress: hair !== "short",
                phase: x / 30,
              }),
            ),
          )
          .join(""),
      ) +
      beat(
        1.1,
        person(104, 136, {
          hair: "short",
          bow: true,
          look: 1,
          arms: [
            [-9, 15],
            [12, 9],
          ],
          name: "me",
        }) +
          person(136, 136, {
            hair: "long",
            dress: true,
            veil: true,
            look: -1,
            big: true,
            arms: [
              [-12, 9],
              [9, 15],
            ],
            name: "you",
          }),
      ) +
      beat(
        1.9,
        hearty(120, 52, 6) + ink(heart(96, 44, 3.5) + heart(146, 42, 3.5)),
        "pop",
      ),
  ),
  // The day we met: you beaming at Sandra, Sandra beaming back, and me, watching you smile.
  sandra: scene(
    beat(
      0.2,
      person(56, 130, {
        hair: "long",
        dress: true,
        look: 1,
        big: true,
        arms: [
          [-10, 14],
          [12, 9],
        ],
        name: "you",
      }) +
        person(104, 130, {
          hair: "bob",
          dress: true,
          look: -1,
          big: true,
          arms: [
            [-12, 9],
            [10, 14],
          ],
          name: "Sandra",
        }),
    ) +
      beat(
        1.2,
        hearty(80, 52, 5) + hearty(86, 38, 3.5) + ink(sparkle(70, 60, 2.5)),
      ) +
      beat(
        1.7,
        person(196, 130, {
          hair: "short",
          look: -1,
          big: true,
          arms: [
            [-8, 15],
            [8, 15],
          ],
          name: "me",
        }),
      ) +
      beat(2.4, ink("M184 66 Q120 22 62 58", "dot march")) +
      beat(
        2.9,
        hearty(196, 54, 6) + ink(sparkle(208, 46, 3) + sparkle(184, 44, 2.5)),
        "pop",
      ),
  ),
  // And I thought: I want her to smile like that for me.
  thought: scene(
    beat(
      0.2,
      person(52, 132, {
        hair: "short",
        look: 1,
        arms: [
          [-8, 15],
          [5, 5],
        ],
        name: "me",
      }),
    ) +
      beat(
        1.0,
        ink(circle(68, 62, 2.2) + circle(78, 52, 3.2) + circle(91, 42, 4.5)),
        "pop",
      ) +
      beat(
        1.4,
        fill(
          "M112 62 Q100 46 118 38 Q118 18 140 22 Q152 6 172 16 Q194 8 204 28 Q224 30 218 50 Q230 70 208 76 Q200 94 176 84 Q160 98 142 86 Q118 94 116 76 Q100 74 112 62Z",
          "cloud",
        ) +
          ink(
            "M112 62 Q100 46 118 38 Q118 18 140 22 Q152 6 172 16 Q194 8 204 28 Q224 30 218 50 Q230 70 208 76 Q200 94 176 84 Q160 98 142 86 Q118 94 116 76 Q100 74 112 62Z",
          ),
        "pop",
      ) +
      beatc(
        "float",
        1.9,
        scaled(
          142,
          82,
          0.5,
          person(0, 0, { hair: "long", dress: true, look: 1, big: true }),
        ) +
          scaled(
            184,
            82,
            0.5,
            person(0, 0, { hair: "short", look: -1, big: true }),
          ) +
          hearty(163, 42, 4),
      ) +
      beat(2.6, cloverAt(214, 118, 0.42)),
  ),
  // You helped me grow: you with a watering can, me a little sprout.
  grow: scene(
    beat(
      0.2,
      person(64, 132, {
        hair: "long",
        dress: true,
        look: 1,
        big: true,
        arms: [
          [-10, 14],
          [16, 2],
        ],
        name: "you",
      }),
    ) +
      beat(
        0.9,
        fill("M80 82 L98 82 L96 96 L82 96Z", "sky") +
          ink(
            "M80 82 L98 82 L96 96 L82 96Z M98 86 L112 76 M80 84 Q74 88 82 94",
          ),
      ) +
      beatc("drip", 1.5, ink("M115 80 l1 5 M120 84 l1 5 M114 90 l1 5", "sky")) +
      beat(
        1.2,
        ink("M138 116 L166 116 M141 116 L144 134 L160 134 L163 116") +
          fill(
            "M152 102 Q140 100 136 90 Q148 90 152 102Z M152 96 Q164 92 168 82 Q156 82 152 96Z",
            "g",
          ) +
          ink("M152 116 Q150 104 152 90", "g") +
          ink(
            "M152 102 Q140 100 136 90 Q148 90 152 102 M152 96 Q164 92 168 82 Q156 82 152 96",
            "g",
          ) +
          head(152, 76, { hair: "short", look: -1, big: true }) +
          label(152, 147, "me"),
      ) +
      beatc(
        "spin",
        2.2,
        ink(
          circle(212, 30, 9) +
            " M212 12 L212 16 M230 30 L226 30 M225 17 L222 20 M199 17 L202 20",
          "y",
        ),
      ),
  ),
  // Walking life together, toward the sunrise.
  walk: scene(
    beatc(
      "glow",
      0.2,
      fill("M66 104 A54 54 0 0 1 174 104Z", "y") +
        ink(
          "M66 104 A54 54 0 0 1 174 104 M120 40 L120 32 M80 58 L74 52 M160 58 L166 52 M58 82 L50 80 M182 82 L190 80",
          "y",
        ),
    ) +
      beat(0.5, ink("M10 140 Q60 134 120 140 T232 138")) +
      beat(
        0.9,
        person(102, 136, {
          hair: "short",
          look: 1,
          big: true,
          arms: [
            [-9, 15],
            [18, 10],
          ],
          name: "me",
        }) +
          person(138, 136, {
            hair: "long",
            dress: true,
            look: -1,
            big: true,
            arms: [
              [-18, 10],
              [9, 15],
            ],
            name: "you",
          }),
      ) +
      beat(1.8, hearty(120, 54, 6), "pop"),
  ),
};
Object.assign(DOODLES, SCENES);

// The vows, word for word, a few lines to a slide.
const SLIDES = [
  [
    "bananaphone",
    `<p class="big">A prize for the one who cleared the whole machine.</p><p class="hint">Tap the arrow, my love &rarr;</p>`,
  ],
  [
    "wedding",
    `<p>My love, today is our big day. I&rsquo;m marrying my <mark class="hl">best friend</mark>. In front of my best friends, isn&rsquo;t that crazy? We all here under this one roof. There&rsquo;s just so much love in this room. Today is the <mark class="hl y">happiest day of my life</mark>.</p>`,
  ],
  [
    "sandra",
    `<p>Let me seize this moment and share this with everyone. The exact moment I fell in love with you. It was when I saw your <mark class="hl">loving smile</mark> for the very first time. Naturally we had just met so you were smiling to <mark class="hl y name">Sandra</mark>. It was a <mark class="hl g">big, beautiful, beautiful smile</mark>.</p>`,
  ],
  [
    "thought",
    `<p>It was the most beautiful smile I had ever seen. I immediately thought to myself,</p><blockquote class="pull">I want her to smile like that for me.</blockquote><p>And here you are, smiling now. And I feel like the <mark class="hl y">luckiest man alive</mark>.</p>`,
  ],
  [
    "grin",
    `<p class="vow"><span class="n">Here is my first vow:</span><q>I will live to make you smile.</q></p>`,
  ],
  [
    "grow",
    `<p>Devotion and love are hard to earn, but you did that. You bring out <mark class="hl">the very best in me</mark>&mdash; I just can&rsquo;t hide from you. You&rsquo;ve seen me at my worst, and at my best, and you didn&rsquo;t just accept me as I am. You insisted on my potential, believed in me, and helped me grow as a person. I saw the man I wanted to be through your eyes and in many ways, <mark class="hl y">you saved my life</mark>.</p>`,
  ],
  [
    "bloom",
    `<p class="vow"><span class="n">So here&rsquo;s my second vow:</span><q>I will always grow, and I will keep stepping it up, day after day, so you can continuously fall in love with me, and so our marriage can always flourish.</q></p>`,
  ],
  [
    "moon",
    `<p class="big">Finally, I want to say that I&rsquo;m living my <mark class="hl y">biggest dreams</mark> with you.</p>`,
  ],
  [
    "balloon",
    `<p class="vow"><span class="n">Here&rsquo;s my third and final vow:</span><q>I will believe in your dreams, just as you believed in mine. I will live to help fulfill your dreams, especially the one we had to delay.</q></p>`,
  ],
  [
    "walk",
    `<p>I&rsquo;m here for you, babe. And as God is my witness I will never settle and put you aside&mdash;<mark class="hl">body and soul</mark>. Your partner, your lover, the one you chose to <mark class="hl g">walk life with</mark>.</p>`,
  ],
  [
    "arrow",
    `<p class="close">I love you.</p><p class="sign">&mdash; Lucas</p>`,
  ],
];

// The title opens the first slide only.
const TITLE = `<header class="love-title">
    <p class="eyebrow">for Mikaela</p>
    <h1>I made this for you</h1>
    <div class="flourish" aria-hidden="true"><span></span>&#9829;<span></span></div>
  </header>`;

const LAST = SLIDES.length - 1;
let at = 0;

function render() {
  const slides = SLIDES.map(
    ([doodle, html], i) =>
      `<section class="slide" aria-roledescription="slide" aria-label="${i + 1} of ${SLIDES.length}">${i === 0 ? TITLE : ""}${DOODLES[doodle]}<div class="bubble">${html}</div></section>`,
  ).join("");
  const dots = SLIDES.map(
    (_, i) =>
      `<button type="button" class="dot-btn" data-love-go="${i}" aria-label="Slide ${i + 1}"></button>`,
  ).join("");
  lovePanel.innerHTML = `
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
  // The banana phone rings once more after "I love you".
  if (at === LAST) ringAgain();
}
export const stepLove = (d) => go(at + d);

// Hearts drifting up behind the card, each with its own size, speed and sway, and every third
// one a little banana.
function heartsHtml() {
  return Array.from({ length: 36 }, (_, i) => {
    const left = (i * 37) % 100;
    const size = 12 + ((i * 7) % 22);
    const dur = 9 + ((i * 5) % 9);
    const delay = -((i * 13) % 17);
    const banana = i % 3 === 1;
    return `<i${banana ? ' class="banana"' : ""} style="left:${left}%;font-size:${banana ? size + 12 : size}px;animation-duration:${dur}s;animation-delay:${delay}s">${banana ? "&#127820;" : "&#9829;"}</i>`;
  }).join("");
}

export function openLove() {
  // Opened from the cheats box mid-run, the game waits while she reads.
  if (game.mode === "play") hold("love");
  render();
  loveEl.querySelector(".love-hearts").innerHTML = heartsHtml();
  loveEl.hidden = false;
  lovePanel.scrollTop = 0;
  // Our song.
  startSong();
  go(0);
  lovePanel
    .querySelector("[data-love-step='1']")
    .focus({ preventScroll: true });
}
export function closeLove() {
  if (loveEl.hidden) return;
  loveEl.hidden = true;
  stopSong();
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
