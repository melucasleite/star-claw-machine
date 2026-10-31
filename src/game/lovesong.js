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

// An original, goofy little reggae sing-along for the letter. An old telephone rings to open it,
// then a "doo doo doo" voice sings the tune and the phone rings back in the gaps: call and
// response. Under it: off-beat skank chords, a one-drop (kick and rim on beat three), a bubbling
// bass and a shaker. It plays on the music bus, so the music button mutes it, and the game's
// own music hushes meanwhile. Bars are [step, midi note, length in steps], 16 steps a bar.
const BPM = 100;
const SWING = 0.18;
const MELODY = [
  [
    [0, 72, 2],
    [3, 76, 1],
    [4, 79, 3],
    [8, 76, 2],
    [10, 74, 2],
    [12, 76, 2],
  ],
  [[0, 72, 6]],
  [
    [0, 77, 2],
    [3, 76, 1],
    [4, 74, 3],
    [8, 72, 2],
    [10, 69, 2],
    [12, 72, 4],
  ],
  [[0, 74, 6]],
  [
    [0, 76, 2],
    [3, 79, 1],
    [4, 81, 3],
    [8, 79, 2],
    [10, 76, 2],
    [12, 79, 4],
  ],
  [
    [0, 81, 2],
    [2, 79, 2],
    [4, 76, 4],
  ],
  [
    [0, 74, 2],
    [2, 76, 2],
    [4, 79, 2],
    [6, 74, 2],
    [8, 76, 2],
    [10, 74, 2],
    [12, 71, 4],
  ],
  [[0, 72, 6]],
];
// C, C, F, G, Am, F, G, C.
const CHORDS = [
  [48, 52, 55],
  [48, 52, 55],
  [41, 45, 48],
  [43, 47, 50],
  [45, 48, 52],
  [41, 45, 48],
  [43, 47, 50],
  [48, 52, 55],
];
// The phone answers in the second half of every other bar, where the voice rests.
const ANSWERS = new Set([1, 3, 5, 7]);
// The opening rings, before the beat comes in.
const INTRO = 3.4;

const song = { on: false, step: 0, next: 0, timer: 0, level: 1 };

// A sung "doo": an "oo" vowel (a soft triangle through a low filter), scooping up into the note
// with a little vibrato.
function doo(midi, at, dur) {
  const f = hz(midi);
  const o = ac.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(f * 0.94, at);
  o.frequency.exponentialRampToValueAtTime(f, at + 0.06);
  const vib = ac.createOscillator();
  vib.frequency.value = 5.5;
  const depth = ac.createGain();
  depth.gain.setValueAtTime(0, at);
  depth.gain.linearRampToValueAtTime(f * 0.012, at + Math.min(dur, 0.3));
  vib.connect(depth).connect(o.frequency);
  const vowel = ac.createBiquadFilter();
  vowel.type = "lowpass";
  vowel.frequency.value = 900;
  vowel.Q.value = 4;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.16, at + 0.04);
  g.gain.setValueAtTime(0.16, at + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.08);
  o.connect(vowel).connect(g).connect(musicBus);
  for (const n of [o, vib]) {
    n.start(at);
    n.stop(at + dur + 0.12);
  }
}

// An old telephone bell: a hammer striking two bells fast, `seconds` long.
function ring(at, seconds, vol = 0.03) {
  for (let t = 0; t < seconds; t += 0.05) {
    const strike = { at: at + t, dur: 0.07, type: "sine", bus: musicBus };
    tone({ ...strike, f: 1320, vol });
    tone({ ...strike, f: 1640, vol: vol * 0.7 });
  }
}

function play(step, at, len) {
  const bar = Math.floor(step / 16) % MELODY.length;
  const s = step % 16;
  const chord = CHORDS[bar];
  const bus = musicBus;
  for (const [n, midi, l] of MELODY[bar]) if (n === s) doo(midi, at, len * l);
  // Ring-ring! Answering the voice.
  if (ANSWERS.has(bar) && (s === 8 || s === 12)) ring(at, len * 3);
  // Bubbling bass: root, a hop up to the fifth, back home.
  if ([0, 3, 6, 10].includes(s))
    tone({
      f: hz(chord[s === 6 ? 2 : 0] - 12),
      at,
      dur: len * 2,
      vol: 0.22,
      type: "triangle",
      bus,
    });
  // Skank: short chord chops on every off-beat.
  if (s % 4 === 2)
    for (const m of chord)
      tone({
        f: hz(m + 12),
        at,
        dur: len * 0.8,
        vol: 0.03,
        type: "epiano",
        bus,
      });
  // One drop: kick and a rim click together on beat three.
  if (s === 8) {
    tone({ f: 130, f2: 45, at, dur: 0.22, vol: 0.3, type: "sine", bus });
    noise({ at, dur: 0.03, vol: 0.12, freq: 3200, q: 6, bus });
  }
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
  // Ring... ring... then the beat drops.
  const now = ac.currentTime;
  ring(now + 0.2, 1.1, 0.04);
  ring(now + 1.9, 1.1, 0.04);
  song.next = now + INTRO;
  song.timer = setInterval(schedule, 25);
  music.hush = true;
  // Full volume for it, even over the quieter end screen.
  song.level = musicLevel;
  setMusicLevel(1);
}
// One more ring, for the last slide.
export function ringAgain() {
  if (song.on) ring(ac.currentTime + 0.5, 0.9, 0.04);
}
export function stopSong() {
  if (!song.on) return;
  song.on = false;
  clearInterval(song.timer);
  music.hush = false;
  setMusicLevel(song.level);
}
