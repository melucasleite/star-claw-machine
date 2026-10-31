import { ac, hz, musicBus, noise, sound, tone } from "./audio.js";
import { TIERS } from "./config.js";
import { game } from "./game.js";
import { plushies } from "./plushies.js";
import { musicDrive } from "./rules.js";
import { onTheme, theme } from "./settings.js";

// ---------- music ----------

// Each theme brings its own song (see themes.js): `tune` bars of melody, then as many bars of just
// groove so it never nags. While a run is on, the song speeds up and fills out as the machine
// empties (musicDrive in rules.js).
const STOCK = TIERS.reduce((n, t) => n + t.count, 0);

export const music = { on: false, step: 0, next: 0, timer: 0 };
export function startMusic() {
  if (music.on || !ac) return;
  music.on = true;
  music.step = 0;
  music.next = ac.currentTime + 0.1;
  music.timer = setInterval(scheduleMusic, 25);
}
// A new theme starts its song from the top.
onTheme(() => (music.step = 0));

const drive = () =>
  musicDrive(game.mode === "play" ? plushies.length : STOCK, STOCK);

export function scheduleMusic() {
  if (ac.state !== "running") return;
  // Hushed while the letter's song plays; pick up from here afterwards.
  if (music.hush) return void (music.next = ac.currentTime + 0.05);
  // Behind (tab was hidden): skip ahead instead of firing a burst of notes.
  if (music.next < ac.currentTime) music.next = ac.currentTime + 0.05;
  while (music.next < ac.currentTime + 0.12) {
    const song = theme().audio.music;
    const d = drive();
    const step = 60 / (song.bpm * d.tempo) / 4;
    // Swing pushes every off-beat step a little late.
    const late = music.step % 2 ? song.swing * step : 0;
    playStep(music.step, music.next + late, step, song, d);
    music.step = (music.step + 1) % (song.tune.length * 2 * song.bar);
    music.next += step;
  }
}

const KITS = {
  // Punchy chip drums.
  chip: {
    kick: (at, bus) =>
      tone({ f: 150, f2: 45, at, dur: 0.14, vol: 0.5, type: "sine", bus }),
    snare: (at, bus) =>
      noise({ at, dur: 0.12, vol: 0.18, freq: 1800, q: 0.8, bus }),
    hat: (at, bus, accent) =>
      noise({
        at,
        dur: 0.03,
        vol: accent ? 0.08 : 0.05,
        freq: 8000,
        type: "highpass",
        bus,
      }),
  },
  // Rounder, quieter drums: a felt kick, brushes and a whisper of hat.
  soft: {
    kick: (at, bus) =>
      tone({ f: 110, f2: 40, at, dur: 0.22, vol: 0.38, type: "sine", bus }),
    snare: (at, bus) =>
      noise({
        at,
        dur: 0.22,
        vol: 0.09,
        freq: 1200,
        q: 0.5,
        type: "lowpass",
        bus,
      }),
    hat: (at, bus, accent) =>
      noise({
        at,
        dur: 0.04,
        vol: accent ? 0.035 : 0.022,
        freq: 9000,
        type: "highpass",
        bus,
      }),
  },
};

export function playStep(n, at, step, song, d) {
  if (!sound.music) return;
  const bar = Math.floor(n / song.bar);
  const s = n % song.bar;
  const chord = song.chords[bar % song.chords.length];
  const tuneBar = bar < song.tune.length ? song.tune[bar] : null;
  const bus = musicBus;
  const kit = KITS[song.drums];
  const half = song.bar / 2;

  // Bass: on its listed steps, or every `every` steps, bouncing root / octave if asked.
  const { bass } = song;
  if (bass.steps ? bass.steps.includes(s) : s % bass.every === 0)
    tone({
      f: hz(chord[0] - 12 + (bass.bounce && s % 4 === 2 ? 12 : 0)),
      at,
      dur: step * (bass.steps ? 3 : 1.6),
      vol: bass.vol,
      type: bass.type,
      bus,
    });
  // Chord stabs (the carousel's pah-pah, the 4K pad).
  if (song.stab?.steps.includes(s))
    for (const m of chord.slice(1))
      tone({
        f: hz(m + 12),
        at,
        dur: step * (song.stab.length ?? 2),
        vol: song.stab.vol,
        type: song.stab.type,
        attack: song.stab.length ? 0.08 : 0.01,
        bus,
      });

  // Drums. As the machine empties the hats go double time and the kick pushes ahead.
  if (
    song.kick.includes(s) ||
    (bar % 2 && song.kickOdd?.includes(s)) ||
    (d.pushKick && s === half + 2)
  )
    kit.kick(at, bus);
  if (song.snare.includes(s)) kit.snare(at, bus);
  if (song.hat.includes(s) || (d.busyHats && s % 2 === 1))
    kit.hat(at, bus, s % 4 === 0);

  // Arpeggio: a soft sparkle in the groove half, a whisper under the tune, louder as things heat up.
  const { arp } = song;
  const every = arp.every ?? 1;
  if (s % every === 0)
    tone({
      f: hz(
        chord[arp.pattern[(s / every) % arp.pattern.length] % chord.length] +
          24,
      ),
      at,
      dur: step * every * 0.9,
      vol: (tuneBar ? arp.under : arp.vol) * (1 + d.intensity * 0.6),
      type: arp.type,
      bus,
    });

  if (tuneBar)
    for (const [st, m, len] of tuneBar)
      if (st === s) {
        const lead = { at, dur: step * len * 0.95, attack: 0.01, bus };
        tone({ ...lead, f: hz(m), vol: song.lead.vol, type: song.lead.type });
        // On the last few plushies the melody doubles an octave up.
        if (d.doubleLead)
          tone({
            ...lead,
            f: hz(m + 12),
            vol: song.lead.vol * 0.4,
            type: song.lead.type,
          });
      }
}
