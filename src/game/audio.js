import { soundEl } from "./dom.js";
import { music, startMusic } from "./music.js";
import { onTheme, theme } from "./settings.js";

// ---------- sound ----------

// Everything is synthesised with Web Audio: no files to load. Browsers (iPhone especially)
// only start audio after a tap or key press, so the context is created on the first one.
export const SOUND_KEY = "startclaw.sound.v1";
export const sound = { music: true, sfx: true };
try {
  Object.assign(sound, JSON.parse(localStorage.getItem(SOUND_KEY)));
} catch {}
export const MUSIC_VOL = 0.32;
export let ac = null;
export let sfxBus;
export let musicBus;
export let noiseBuf;
export let motor;
export let musicLevel = 1;
// Theme effects: a reverb send (carousel, 4K) and a bit-crusher on the whole mix (8-bit).
let reverbSend;
let crusher;

export function audioOn() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    // Lets iPhones play through the silent switch, like a game should.
    try {
      if (navigator.audioSession) navigator.audioSession.type = "playback";
    } catch {}
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.connect(ac.destination);
    crusher = ac.createWaveShaper();
    crusher.connect(comp);
    const master = ac.createGain();
    master.gain.value = 0.7;
    master.connect(crusher);
    // Reverb: a convolver fed a second and a half of decaying noise.
    const verb = ac.createConvolver();
    const len = Math.floor(ac.sampleRate * 1.6);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    verb.buffer = ir;
    reverbSend = ac.createGain();
    reverbSend.gain.value = 0;
    reverbSend.connect(verb).connect(master);
    sfxBus = ac.createGain();
    sfxBus.connect(master);
    sfxBus.connect(reverbSend);
    musicBus = ac.createGain();
    musicBus.connect(master);
    musicBus.connect(reverbSend);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // The gantry motor: a low filtered buzz whose volume follows the claw's speed.
    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 62;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    motor = ac.createGain();
    motor.gain.value = 0;
    osc.connect(lp).connect(motor).connect(sfxBus);
    osc.start();
    applySound();
    applyAudioTheme(theme());
  }
  if (ac.state !== "running") ac.resume();
  if (sound.music) startMusic();
  return ac;
}
for (const ev of ["pointerdown", "pointerup", "keydown", "touchend"])
  addEventListener(ev, audioOn, { capture: true });

export function applySound() {
  if (!ac) return;
  const now = ac.currentTime;
  sfxBus.gain.setTargetAtTime(sound.sfx ? 1 : 0, now, 0.02);
  musicBus.gain.setTargetAtTime(
    sound.music ? MUSIC_VOL * musicLevel : 0,
    now,
    0.15,
  );
}
export function setMusicLevel(level) {
  musicLevel = level;
  applySound();
}
export function toggleSound(kind) {
  sound[kind] = !sound[kind];
  try {
    localStorage.setItem(SOUND_KEY, JSON.stringify(sound));
  } catch {}
  audioOn();
  applySound();
  renderSoundButtons();
  if (kind === "sfx" && sound.sfx) sfx.click();
}
export function renderSoundButtons() {
  for (const b of soundEl.querySelectorAll("button[data-sound]")) {
    const on = sound[b.dataset.sound];
    b.classList.toggle("off", !on);
    b.setAttribute("aria-pressed", String(on));
    b.title = `${b.dataset.sound === "music" ? "Music" : "Sound effects"} ${on ? "on" : "off"} (${b.dataset.sound === "music" ? "M" : "S"})`;
  }
}
addEventListener("pointerdown", (e) => {
  if (e.target.closest("button:not([data-sound])")) sfx.click();
});
soundEl.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-sound]");
  if (b) toggleSound(b.dataset.sound);
});
renderSoundButtons();

export const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Extra instruments for the themes, as harmonic recipes (sine amplitudes of partials 1, 2, 3...).
const HARMONICS = {
  organ: [1, 0.6, 0.45, 0.3, 0.2, 0.12, 0.08, 0.05],
  flute: [1, 0.25, 0.08],
  bell: [1, 0, 0.55, 0, 0.35, 0, 0.2, 0, 0.15],
  epiano: [1, 0.35, 0.1, 0.06, 0.02],
  pad: [1, 0.5, 0.33, 0.25, 0.2, 0.16, 0.14, 0.12],
};
const waves = {};
function setVoice(o, type) {
  const name = theme().audio.voices[type] ?? type;
  const h = HARMONICS[name];
  if (!h) return void (o.type = name);
  waves[name] ??= ac.createPeriodicWave(
    new Float32Array(h.length + 1),
    Float32Array.from([0, ...h]),
  );
  o.setPeriodicWave(waves[name]);
}

function applyAudioTheme(t) {
  if (!ac) return;
  reverbSend.gain.setTargetAtTime(t.audio.reverb, ac.currentTime, 0.1);
  // 8-bit: squash every sample onto 16 levels, the grit of an old sound chip.
  if (t.audio.crush) {
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++)
      curve[i] = Math.round(((i / (curve.length - 1)) * 2 - 1) * 8) / 8;
    crusher.curve = curve;
  } else crusher.curve = null;
}
onTheme(applyAudioTheme);

// One enveloped oscillator. `at` is an absolute time (for the music); otherwise `t` seconds from now.
export function tone({
  f,
  f2,
  type = "square",
  t = 0,
  at,
  dur = 0.12,
  vol = 0.15,
  attack = 0.005,
  bus,
}) {
  if (!ac || ac.state !== "running") return;
  const t0 = at ?? ac.currentTime + t;
  // Sound effects ring a little longer in the softer themes; the music sets its own lengths.
  if (at === undefined) dur *= theme().audio.lengthScale;
  const o = ac.createOscillator();
  const g = ac.createGain();
  setVoice(o, type);
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(bus ?? sfxBus);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
export function noise({
  t = 0,
  at,
  dur = 0.08,
  vol = 0.15,
  freq = 2000,
  f2,
  q = 1,
  type = "bandpass",
  bus,
}) {
  if (!ac || ac.state !== "running") return;
  const t0 = at ?? ac.currentTime + t;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t0);
  if (f2) filter.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src
    .connect(filter)
    .connect(g)
    .connect(bus ?? sfxBus);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.05);
}
export const notes = (list, step, o = {}) =>
  list.forEach(
    (m, i) => m && tone({ f: hz(m), t: i * step, dur: step * 1.6, ...o }),
  );

export const sfx = {
  click: () => tone({ f: 1200, f2: 900, dur: 0.04, vol: 0.06 }),
  blip: () => notes([79, 84], 0.06, { vol: 0.08 }),
  coinIn: () => notes([72, 76, 79, 84, 88], 0.06, { vol: 0.1 }),
  drop: () => {
    tone({ f: 520, f2: 180, dur: 0.35, vol: 0.06, type: "triangle" });
    noise({ dur: 0.05, vol: 0.05, freq: 900 });
  },
  clack: () => {
    noise({ dur: 0.05, vol: 0.18, freq: 1400, q: 3 });
    tone({ f: 260, f2: 120, dur: 0.07, vol: 0.08 });
  },
  lift: () => tone({ f: 140, f2: 280, dur: 0.6, vol: 0.05, type: "triangle" }),
  release: () => {
    noise({ dur: 0.04, vol: 0.12, freq: 2200, q: 4 });
    tone({ f: 600, f2: 900, dur: 0.08, vol: 0.06, type: "triangle" });
  },
  empty: () =>
    notes([67, 63], 0.14, { vol: 0.07, type: "triangle", dur: 0.25 }),
  reelStart: () => notes([76, 79, 76, 79, 83], 0.05, { vol: 0.08 }),
  inBar: () =>
    tone({ f: 1320, dur: 0.08, vol: 0.06, type: "sine", attack: 0.002 }),
  outBar: () => tone({ f: 150, f2: 110, dur: 0.12, vol: 0.07 }),
  ratchet: (p) =>
    tone({
      f: 300 + p * 900,
      dur: 0.035,
      vol: 0.05,
      type: "triangle",
    }),
  slack: (p) => tone({ f: 200 + p * 200, f2: 120, dur: 0.05, vol: 0.04 }),
  caught: (perfect) => {
    notes([72, 76, 79, 84], 0.07, { vol: 0.1 });
    if (perfect)
      notes([0, 0, 0, 0, 88, 91, 96], 0.05, {
        vol: 0.06,
        type: "triangle",
      });
  },
  escaped: () =>
    notes([67, 66, 65, 64], 0.13, {
      vol: 0.08,
      type: "sawtooth",
      dur: 0.2,
    }),
  slipped: () =>
    tone({ f: 500, f2: 160, dur: 0.4, vol: 0.07, type: "triangle" }),
  // Bigger tiers get a longer, higher jingle.
  prize: (tierIndex, streak) => {
    const up = Math.min(streak, 6);
    tone({ f: hz(83 + up), dur: 0.08, vol: 0.09 });
    tone({ f: hz(88 + up), t: 0.08, dur: 0.3, vol: 0.09 });
    const extra = [76, 79, 84, 88, 91].slice(0, tierIndex + 1);
    notes(
      extra.map((m) => m + up),
      0.06,
      {
        vol: 0.05,
        type: "triangle",
        t: 0,
      },
    );
  },
  fresh: () =>
    [96, 100, 103, 108].forEach((m, i) =>
      tone({
        f: hz(m),
        t: 0.35 + i * 0.05,
        dur: 0.15,
        vol: 0.04,
        type: "sine",
      }),
    ),
  plop: () => tone({ f: 700, f2: 260, dur: 0.09, vol: 0.09, type: "sine" }),
  heal: () => notes([79, 83, 86], 0.06, { vol: 0.06, type: "sine", t: 0.2 }),
  hurt: (full) => {
    tone({ f: 330, f2: 160, dur: 0.18, vol: 0.09 });
    if (full) tone({ f: 250, f2: 110, t: 0.18, dur: 0.25, vol: 0.09 });
  },
  lost: () =>
    notes([72, 71, 70, 69, 0, 64, 0, 60], 0.16, {
      vol: 0.08,
      type: "triangle",
      dur: 0.3,
    }),
  cashOut: () =>
    notes([84, 0, 88, 84, 91], 0.08, { vol: 0.08, type: "square" }),
  fanfare: () => {
    notes([72, 72, 72, 76, 0, 72, 76, 79], 0.1, { vol: 0.09 });
    notes([60, 0, 0, 64, 0, 0, 67, 72], 0.1, {
      vol: 0.06,
      type: "triangle",
      dur: 0.3,
    });
  },
  cleared: () => {
    sfx.fanfare();
    notes([84, 88, 91, 96, 91, 96, 100, 103, 108], 0.08, {
      vol: 0.06,
      type: "triangle",
      t: 0.9,
    });
  },
  saved: () => notes([79, 84, 88], 0.07, { vol: 0.07, type: "sine" }),
};

// Some sounds get a theme-specific version instead of just a new voice.
const THEME_SFX = {
  retro: {
    // The classic two-note coin.
    coinIn: () => {
      tone({ f: hz(83), dur: 0.08, vol: 0.1 });
      tone({ f: hz(88), t: 0.08, dur: 0.4, vol: 0.1 });
    },
    // Boing.
    drop: () => tone({ f: 220, f2: 880, dur: 0.18, vol: 0.07 }),
    // A one-up fanfare, higher for the rarer colours.
    prize: (tierIndex, streak) =>
      notes(
        [76, 79, 88, 84, 86, 91].map(
          (m) => m + tierIndex + Math.min(streak, 6),
        ),
        0.07,
        { vol: 0.08, dur: 0.1 },
      ),
    hurt: () => notes([67, 0, 60], 0.08, { vol: 0.09, dur: 0.12 }),
  },
};
for (const [name, play] of Object.entries(sfx))
  sfx[name] = (...args) => (THEME_SFX[theme().id]?.[name] ?? play)(...args);

export function setMotor(speed) {
  if (!motor) return;
  motor.gain.setTargetAtTime(
    Math.min(1, speed / 4) * 0.12,
    ac.currentTime,
    0.06,
  );
}
