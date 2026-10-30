import { ac, hz, musicBus, noise, sound, tone } from "./audio.js";

// ---------- music ----------

// A loop of 16 bars of 16 steps: an 8-bar tune, then 8 bars of just groove so it never nags.
// Chords C, Am, F, G. Notes are [step, midi, length in steps].
export const BPM = 132;
export const STEP = 60 / BPM / 4;
export const CHORDS = [
  [48, 52, 55],
  [45, 48, 52],
  [41, 45, 48],
  [43, 47, 50],
];
export const TUNE = [
  [
    [0, 76, 2],
    [2, 79, 2],
    [4, 84, 4],
    [8, 83, 2],
    [10, 79, 2],
    [12, 76, 4],
  ],
  [
    [0, 81, 4],
    [4, 79, 2],
    [6, 76, 2],
    [8, 72, 4],
    [12, 74, 2],
    [14, 76, 2],
  ],
  [
    [0, 77, 2],
    [2, 81, 2],
    [4, 84, 4],
    [8, 81, 2],
    [10, 77, 2],
    [12, 81, 4],
  ],
  [
    [0, 79, 6],
    [6, 77, 2],
    [8, 76, 2],
    [10, 74, 2],
    [12, 71, 2],
    [14, 74, 2],
  ],
  [
    [0, 76, 2],
    [2, 79, 2],
    [4, 84, 4],
    [8, 83, 2],
    [10, 79, 2],
    [12, 76, 4],
  ],
  [
    [0, 81, 2],
    [2, 84, 2],
    [4, 88, 4],
    [8, 86, 2],
    [10, 84, 2],
    [12, 81, 4],
  ],
  [
    [0, 77, 2],
    [2, 79, 2],
    [4, 81, 2],
    [6, 84, 2],
    [8, 86, 4],
    [12, 84, 4],
  ],
  [
    [0, 83, 4],
    [4, 81, 2],
    [6, 83, 2],
    [8, 86, 8],
  ],
];
export const music = { on: false, step: 0, next: 0, timer: 0 };
export function startMusic() {
  if (music.on || !ac) return;
  music.on = true;
  music.step = 0;
  music.next = ac.currentTime + 0.1;
  music.timer = setInterval(scheduleMusic, 25);
}
export function scheduleMusic() {
  if (ac.state !== "running") return;
  // Behind (tab was hidden): skip ahead instead of firing a burst of notes.
  if (music.next < ac.currentTime) music.next = ac.currentTime + 0.05;
  while (music.next < ac.currentTime + 0.12) {
    playStep(music.step, music.next);
    music.step = (music.step + 1) % (16 * 16);
    music.next += STEP;
  }
}
export function playStep(n, at) {
  if (!sound.music) return;
  const bar = Math.floor(n / 16);
  const s = n % 16;
  const chord = CHORDS[bar % 4];
  const tuneBar = bar < 8 ? TUNE[bar] : null;
  const bus = musicBus;
  // Bass: bouncy root / octave eighths.
  if (s % 2 === 0)
    tone({
      f: hz(chord[0] - 12 + (s % 4 === 2 ? 12 : 0)),
      at,
      dur: STEP * 1.6,
      vol: 0.22,
      type: "triangle",
      bus,
    });
  // Drums.
  if (s === 0 || s === 8 || (s === 10 && bar % 2))
    tone({ f: 150, f2: 45, at, dur: 0.14, vol: 0.5, type: "sine", bus });
  if (s === 4 || s === 12)
    noise({ at, dur: 0.12, vol: 0.18, freq: 1800, q: 0.8, bus });
  if (s % 2 === 0)
    noise({
      at,
      dur: 0.03,
      vol: s % 4 ? 0.05 : 0.08,
      freq: 8000,
      type: "highpass",
      bus,
    });
  // Arpeggio: a soft sparkle in the groove half, a whisper under the tune.
  const arp = chord[[0, 1, 2, 1][s % 4]] + 24;
  tone({
    f: hz(arp),
    at,
    dur: STEP * 0.9,
    vol: tuneBar ? 0.025 : 0.05,
    bus,
  });
  if (tuneBar)
    for (const [st, m, len] of tuneBar)
      if (st === s)
        tone({
          f: hz(m),
          at,
          dur: STEP * len * 0.95,
          vol: 0.09,
          attack: 0.01,
          bus,
        });
}
