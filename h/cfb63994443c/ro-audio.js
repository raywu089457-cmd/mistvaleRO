/* RO-flavoured sound: warm acoustic timbres, light room reverb, bell/wood SFX,
   and a field-music arrangement (pizzicato, harp, flute, strings). Original
   synthesis only; no RO audio files are used. */
"use strict";
const roAu = { ready: false, wet: null };
function roAuSetup() {
  const a = AU.ctx;
  if (roAu.ready || !a || !AU.sfx) return;
  roAu.ready = true;
  // Small hall impulse generated on the fly.
  const len = Math.floor(a.sampleRate * 1.8),
    ir = a.createBuffer(2, len, a.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  const conv = a.createConvolver(),
    wet = a.createGain(),
    tone = a.createBiquadFilter();
  conv.buffer = ir;
  tone.type = "lowpass";
  tone.frequency.value = 4200;
  wet.gain.value = 0.22;
  conv.connect(tone);
  tone.connect(wet);
  wet.connect(a.destination);
  const sfxSend = a.createGain(),
    musSend = a.createGain();
  sfxSend.gain.value = 0.55;
  musSend.gain.value = 1;
  AU.sfx.connect(sfxSend);
  AU.mus.connect(musSend);
  sfxSend.connect(conv);
  musSend.connect(conv);
  roAu.wet = wet;
}
// One voice with attack/decay envelope, optional vibrato and filter.
function roTone(t, o) {
  const a = AU.ctx,
    v = a.createOscillator(),
    g = a.createGain();
  v.type = o.w || "sine";
  v.frequency.setValueAtTime(o.f, t);
  if (o.f2) v.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fd || o.d));
  if (o.det) v.detune.value = o.det;
  let out = v;
  if (o.lp) {
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lp;
    f.Q.value = o.q || 0.7;
    v.connect(f);
    out = f;
  }
  if (o.vib) {
    const lfo = a.createOscillator(),
      depth = a.createGain();
    lfo.frequency.value = o.vibR || 5.2;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(o.f * o.vib, t + 0.25);
    lfo.connect(depth);
    depth.connect(v.frequency);
    lfo.start(t);
    lfo.stop(t + o.d + 0.1);
  }
  out.connect(g);
  g.connect(o.to || AU.sfx);
  const at = o.a || 0.005,
    peak = o.g || 0.15;
  g.gain.setValueAtTime(1e-4, t);
  g.gain.exponentialRampToValueAtTime(peak, t + at);
  if (o.sus) g.gain.setValueAtTime(peak, t + Math.max(at, o.d - (o.rel || 0.15)));
  g.gain.exponentialRampToValueAtTime(1e-4, t + o.d);
  v.start(t);
  v.stop(t + o.d + 0.05);
  voice(v, o.to);
}
// Instruments.
const roBell = (t, f, g = 0.12, d = 0.9, to) => {
  roTone(t, { f, g, d, to });
  roTone(t, { f: f * 2.76, g: g * 0.35, d: d * 0.45, to });
  roTone(t, { f: f * 5.4, g: g * 0.12, d: d * 0.2, to });
};
const roWood = (t, f, g = 0.18, to) => {
  roTone(t, { w: "triangle", f, f2: f * 0.8, d: 0.07, g, to });
  nzv(t, { ft: "bandpass", f: f * 3, q: 4, d: 0.03, g: g * 0.5, to });
};
const roPluck = (t, f, g = 0.2, d = 0.45, to) => {
  roTone(t, { w: "triangle", f, d, g, lp: 1800, to });
  roTone(t, { f: f * 2, d: d * 0.3, g: g * 0.25, to });
};
const roFlute = (t, f, d, g = 0.07, to) => {
  roTone(t, { f, d, g, a: 0.06, sus: 1, rel: 0.12, vib: 0.006, to });
  roTone(t, { w: "triangle", f: f * 2, d, g: g * 0.12, a: 0.08, sus: 1, to });
  nzv(t, { ft: "bandpass", f: f * 2, q: 6, d: Math.min(d, 0.15), g: g * 0.25, to });
};
const roPad = (t, f, d, g = 0.025, to) => {
  for (const det of [-7, 7])
    roTone(t, { w: "sawtooth", f, det, d, g, a: Math.min(0.35, d / 3), sus: 1, rel: 0.4, lp: 1100, to });
};
const roPoof = (t, a = 1, big = 0) => {
  nzv(t, { ft: "bandpass", f: 1400 * a, f2: 380, q: 1.4, d: big ? 0.32 : 0.18, g: big ? 0.38 : 0.26 });
  roTone(t, { f: (big ? 420 : 620) * a, f2: (big ? 120 : 200) * a, d: big ? 0.28 : 0.14, g: big ? 0.2 : 0.12 });
};
// Soften the engine's chiptune voices everywhere (skills keep their identity).
const roRawOsc = osc;
osc = function (t, o) {
  if (o.w === "square" || o.w === undefined)
    o = { ...o, w: "triangle", lp: Math.min(o.lp || 2600, 2600), g: (o.g || 0.2) * 1.35 };
  else if (o.w === "sawtooth") o = { ...o, lp: Math.min(o.lp || 2200, 2200) };
  return roRawOsc(t, o);
};
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
Object.assign(SFX, {
  swing: [0.05, (t, a) => nzv(t, { f: 700 * a, f2: 2400 * a, q: 0.9, d: 0.11, a: 0.03, g: 0.34 })],
  hit: [
    0.035,
    (t, a) => {
      nzv(t, { ft: "lowpass", f: 1800 * a, f2: 300, d: 0.08, g: 0.3 });
      roTone(t, { w: "triangle", f: 160 * a, f2: 70, d: 0.09, g: 0.3 });
    },
  ],
  crit: [
    0.05,
    (t, a) => {
      nzv(t, { ft: "lowpass", f: 3200, f2: 400, d: 0.12, g: 0.36 });
      roTone(t, { w: "triangle", f: 190 * a, f2: 60, d: 0.14, g: 0.38 });
      roBell(t + 0.01, 1318 * a, 0.06, 0.35);
    },
  ],
  kill: [0.04, (t, a) => roPoof(t, a)],
  big: [0.15, (t, a) => (roPoof(t, a * 0.8, 1), roTone(t, { f: 70, f2: 40, d: 0.35, g: 0.32 }))],
  hurt: [0.12, (t) => (roTone(t, { w: "triangle", f: 210, f2: 110, d: 0.12, g: 0.22 }), nzv(t, { ft: "lowpass", f: 900, d: 0.08, g: 0.2 }))],
  miss: [0.08, (t) => nzv(t, { ft: "highpass", f: 2400, f2: 5200, d: 0.09, a: 0.02, g: 0.12 })],
  pot: [
    0.3,
    (t) => {
      roTone(t, { f: 320, f2: 520, d: 0.09, g: 0.16 });
      roTone(t + 0.1, { f: 360, f2: 600, d: 0.09, g: 0.14 });
      [1568, 2093, 2637].forEach((f, i) => roBell(t + 0.2 + i * 0.06, f, 0.045, 0.5));
    },
  ],
  pick: [0.05, (t, a) => (roWood(t, 900 * a, 0.12), roBell(t + 0.02, 1760 * a, 0.05, 0.25))],
  mat: [0.06, (t, a) => (roBell(t, 2350 * a, 0.06, 0.3), roBell(t + 0.05, 3136 * a, 0.04, 0.25))],
  drop: [
    0.08,
    (t, a, tier) => {
      roWood(t, 520 * a, 0.12);
      if (tier >= 3) roBell(t + 0.04, 1568, 0.07, 0.6);
      if (tier >= 4)
        [2093, 2637, 3136].forEach((f, i) => roBell(t + 0.12 + i * 0.07, f, 0.06, 0.7));
    },
  ],
  lvl: [
    0.5,
    (t) => {
      [72, 76, 79, 84, 88].forEach((m, i) => roBell(t + i * 0.08, midiHz(m), 0.08, 1.2));
      [60, 64, 67, 72].forEach((m) => roPad(t, midiHz(m), 1.6, 0.03));
      nzv(t + 0.3, { ft: "highpass", f: 6000, d: 0.9, a: 0.3, g: 0.05 });
    },
  ],
  quest: [0.4, (t) => [79, 84].forEach((m, i) => roBell(t + i * 0.1, midiHz(m), 0.09, 0.8))],
  click: [0.03, (t) => roWood(t, 1200, 0.08)],
});
// Field and boss music with acoustic instruments.
musStep = function (song, step, time, beat) {
  roAuSetup();
  const bar = (step >> 3) % 8,
    l = step & 7,
    chord = song.prog[bar % 4],
    to = AU.mus,
    boss = song.boss,
    note = (deg) => song.root + song.sc[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);
  if (boss) {
    roPluck(time, midiHz(note(chord) - 12 + (l & 1 ? 12 : 0)), 0.22, beat * 0.9, to);
    if (l === 0 || l === 4) {
      roTone(time, { f: 95, f2: 52, d: 0.35, g: 0.42, to });
      nzv(time, { ft: "lowpass", f: 400, d: 0.25, g: 0.16, to });
    }
    if (l === 0) for (const k of [0, 2, 4]) roPad(time, midiHz(note(chord + k)), beat * 8, 0.02, to);
    if (l & 1) nzv(time, { ft: "highpass", f: 7000, d: 0.03, g: 0.04, to });
  } else {
    if (l === 0 || l === 4 || (l === 6 && bar & 1))
      roPluck(time, midiHz(note(chord + (l === 4 ? 4 : 0)) - 12), 0.24, beat * (l === 0 ? 2.5 : 1.5), to);
    if (l === 0) for (const k of [0, 2, 4]) roPad(time, midiHz(note(chord + k)), beat * 8, 0.016, to);
    roBell(time, midiHz(note(chord + [0, 2, 4, 7, 4, 2, 0, 2][l]) + 12), 0.026, beat * 2.4, to);
    if (l & 1) nzv(time, { ft: "highpass", f: 8000, d: 0.025, g: 0.018, to });
  }
  const m = song.mel[step % 64];
  if (m) {
    const f = midiHz(note(m[0]) + 12),
      d = beat * m[1] * 0.95;
    if (boss) roTone(time, { w: "sawtooth", f, d, g: 0.05, a: 0.03, sus: 1, lp: 1700, vib: 0.004, to });
    else roFlute(time, f, d, 0.075, to);
  }
};
const roSfx = sfx;
sfx = function (...args) {
  roAuSetup();
  return roSfx(...args);
};
