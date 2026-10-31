import {
  ac,
  hz,
  musicBus,
  noise,
  setMusicLevel,
  musicLevel,
  tone,
} from "./audio.js";
import { music } from "./music.js";

// ---------- Mikaela's song ----------

// An original, bouncy little tune for the letter, in the spirit of a goofy sing-along: a calypso
// bass, off-beat chord plinks, a shaker, and a phone going "ring-ring!" every few bars. It plays
// on the music bus, so the music button mutes it, and the game's own music hushes meanwhile.
// Bars are [step, midi note, length in steps], 16 steps a bar.
const BPM = 112;
const MELODY = [
  [
    [0, 67, 2],
    [2, 72, 2],
    [4, 76, 2],
    [6, 79, 4],
    [10, 76, 2],
    [12, 74, 4],
  ],
  [
    [0, 77, 2],
    [2, 76, 2],
    [4, 74, 2],
    [6, 72, 2],
    [8, 69, 4],
    [12, 72, 4],
  ],
  [
    [0, 71, 2],
    [2, 74, 2],
    [4, 79, 4],
    [8, 77, 2],
    [10, 76, 2],
    [12, 74, 4],
  ],
  [
    [0, 76, 2],
    [2, 72, 2],
    [4, 67, 4],
    [8, 72, 8],
  ],
  [
    [0, 69, 2],
    [2, 72, 2],
    [4, 76, 2],
    [6, 81, 4],
    [10, 79, 2],
    [12, 76, 4],
  ],
  [
    [0, 77, 4],
    [4, 81, 2],
    [6, 79, 2],
    [8, 77, 2],
    [10, 76, 2],
    [12, 74, 4],
  ],
  [
    [0, 79, 2],
    [2, 81, 2],
    [4, 83, 2],
    [6, 86, 4],
    [10, 83, 2],
    [12, 79, 4],
  ],
  [
    [0, 84, 4],
    [4, 79, 2],
    [6, 76, 2],
    [8, 72, 8],
  ],
];
// C, F, G, C, Am, F, G, C.
const CHORDS = [
  [48, 52, 55],
  [41, 45, 48],
  [43, 47, 50],
  [48, 52, 55],
  [45, 48, 52],
  [41, 45, 48],
  [43, 47, 50],
  [48, 52, 55],
];
const SWING = 0.16;

const song = { on: false, step: 0, next: 0, timer: 0, level: 1 };

function play(step, at, len) {
  const bar = Math.floor(step / 16) % MELODY.length;
  const s = step % 16;
  const chord = CHORDS[bar];
  const bus = musicBus;
  for (const [n, midi, l] of MELODY[bar])
    if (n === s)
      tone({
        f: hz(midi),
        at,
        dur: len * l * 0.95,
        vol: 0.09,
        type: "epiano",
        bus,
      });
  // Calypso bass: boom, ba-boom.
  if ([0, 6, 8, 14].includes(s))
    tone({
      f: hz(chord[s === 6 || s === 14 ? 2 : 0] - 12),
      at,
      dur: len * 2,
      vol: 0.22,
      type: "triangle",
      bus,
    });
  // Off-beat plinks.
  if (s === 4 || s === 12)
    for (const m of chord)
      tone({
        f: hz(m + 24),
        at,
        dur: len * 1.5,
        vol: 0.025,
        type: "bell",
        bus,
      });
  // Shaker on every eighth, a little louder on the off-beats.
  if (s % 2 === 0)
    noise({
      at,
      dur: 0.04,
      vol: s % 4 ? 0.05 : 0.025,
      freq: 7000,
      q: 1.5,
      bus,
    });
  // Ring-ring! Over the held note at the end of bars 4 and 8.
  if ((bar === 3 || bar === 7) && (s === 9 || s === 12))
    for (let i = 0; i < 8; i++)
      tone({
        f: hz(i % 2 ? 91 : 88),
        at: at + (i * len) / 2,
        dur: len / 2,
        vol: 0.035,
        type: "sine",
        bus,
      });
}

function schedule() {
  if (ac.state !== "running") return;
  if (song.next < ac.currentTime) song.next = ac.currentTime + 0.05;
  const len = 60 / BPM / 4;
  while (song.next < ac.currentTime + 0.12) {
    play(song.step, song.next + (song.step % 2 ? SWING * len : 0), len);
    song.step = (song.step + 1) % (MELODY.length * 16);
    song.next += len;
  }
}

export function startSong() {
  if (song.on || !ac || !musicBus) return;
  song.on = true;
  song.step = 0;
  song.next = ac.currentTime + 0.4;
  song.timer = setInterval(schedule, 25);
  music.hush = true;
  // Full volume for it, even over the quieter end screen.
  song.level = musicLevel;
  setMusicLevel(1);
}
export function stopSong() {
  if (!song.on) return;
  song.on = false;
  clearInterval(song.timer);
  music.hush = false;
  setMusicLevel(song.level);
}
