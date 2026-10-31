import { loveEl, lovePanel } from "./dom.js";
import { notes } from "./audio.js";

// ---------- for Mikaela ----------

// Clear the machine, sign the end screen as MIKAELA, and this opens: Lucas's wedding vows.
export const LOVE_NAME = "MIKAELA";

const VOWS = `
  <p class="eyebrow">for Mikaela</p>
  <h1>I made this for you</h1>
  <div class="flourish" aria-hidden="true"><span></span>&#9829;<span></span></div>
  <p class="lead">My love, today is our big day. I&rsquo;m marrying my best friend. In front of my best friends, isn&rsquo;t that crazy? We all here under this one roof. There&rsquo;s just so much love in this room. Today is the happiest day of my life.</p>
  <p>Let me seize this moment and share this with everyone. The exact moment I fell in love with you. It was when I saw your loving smile for the very first time. Naturally we had just met so you were smiling to Sandra. It was a big, beautiful, beautiful smile. It was the most beautiful smile I had ever seen. I immediately thought to myself, <em>I want her to smile like that for me.</em> And here you are, smiling now. And I feel like the luckiest man alive.</p>
  <p class="vow"><span class="n">Here is my first vow:</span>I will live to make you smile.</p>
  <p>Devotion and love are hard to earn, but you did that. You bring out the very best in me&mdash; I just can&rsquo;t hide from you. You&rsquo;ve seen me at my worst, and at my best, and you didn&rsquo;t just accept me as I am. You insisted on my potential, believed in me, and helped me grow as a person. I saw the man I wanted to be through your eyes and in many ways, you saved my life.</p>
  <p class="vow"><span class="n">So here&rsquo;s my second vow:</span>I will always grow, and I will keep stepping it up, day after day, so you can continuously fall in love with me, and so our marriage can always flourish.</p>
  <p>Finally, I want to say that I&rsquo;m living my biggest dreams with you.</p>
  <p class="vow"><span class="n">Here&rsquo;s my third and final vow:</span>I will believe in your dreams, just as you believed in mine. I will live to help fulfill your dreams, especially the one we had to delay.</p>
  <p>I&rsquo;m here for you, babe. And as God is my witness I will never settle and put you aside&mdash;body and soul. Your partner, your lover, the one you chose to walk life with.</p>
  <p class="close">I love you.</p>
  <p class="sign">&mdash; Lucas</p>
  <div class="actions"><button class="love-btn" type="button" data-close-love>&#9829;</button></div>`;

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
  lovePanel.innerHTML = VOWS;
  loveEl.querySelector(".love-hearts").innerHTML = heartsHtml();
  loveEl.hidden = false;
  lovePanel.scrollTop = 0;
  // A soft music-box rise.
  notes([72, 76, 79, 84, 88, 91, 96], 0.14, {
    vol: 0.05,
    type: "sine",
    dur: 0.9,
  });
  lovePanel.querySelector("[data-close-love]").focus({ preventScroll: true });
}
export function closeLove() {
  if (loveEl.hidden) return;
  loveEl.hidden = true;
}

addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  if (e.target.closest("[data-close-love]") || e.target === loveEl) closeLove();
});
