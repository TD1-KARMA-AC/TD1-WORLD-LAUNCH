// TD1.WORLD score: an ambient soundtrack generated live with the Web Audio API. No audio files.
// Each place has its own chord; the music swells with the sunrise, wind builds when the world spins,
// the ocean splashes when it spills, and Karma Core has a heartbeat.

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

const CHORDS = {
  intro: [38, 45, 50, 57, 62, 66], // D, open and rising
  space: [38, 45, 50, 57, 62, 69], // D add9, wide
  origins: [40, 47, 52, 55, 59], // E minor, ancient
  memory: [41, 48, 53, 57, 60, 64], // F major 7, warm
  intelligence: [43, 50, 55, 62, 66, 69], // G major 9, bright
  creation: [45, 52, 57, 60, 64, 71], // A minor add9, restless
  future: [38, 45, 50, 54, 57, 64], // D major add9, hopeful
  ocean: [36, 43, 48, 55, 62], // C, deep water
  core: [33, 40, 45, 52, 57], // low A, the heart
  shop: [43, 50, 55, 59, 62, 67], // G, golden
  contact: [41, 48, 53, 57, 62], // F, inviting
  moon: [44, 51, 56, 60, 63], // A flat, moonlight
};

export function createScore() {
  let ctx = null;
  let master, music, sfx, filter, reverb, windFilter, windGain;
  let voices = [];
  let current = 'intro';
  let on = false;

  function impulse(seconds = 4.5, decay = 2.6) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function noiseBuffer(seconds = 2) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = impulse();
    const wet = ctx.createGain();
    wet.gain.value = 0.6;
    reverb.connect(wet);
    wet.connect(master);

    music = ctx.createGain();
    music.gain.value = 0.9;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    filter.Q.value = 0.5;
    music.connect(filter);
    filter.connect(master);
    filter.connect(reverb);
    const lfo = ctx.createOscillator(); // the pad breathes slowly
    lfo.frequency.value = 0.045;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 220;
    lfo.connect(lfoDepth);
    lfoDepth.connect(filter.frequency);
    lfo.start();

    sfx = ctx.createGain();
    sfx.gain.value = 0.55;
    sfx.connect(master);
    sfx.connect(reverb);

    const wind = ctx.createBufferSource(); // wind for wild spins
    wind.buffer = noiseBuffer(3);
    wind.loop = true;
    windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 400;
    windFilter.Q.value = 0.9;
    windGain = ctx.createGain();
    windGain.gain.value = 0;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    wind.start();

    setChord(current, 0.5);
    return true;
  }

  function setChord(name, fade = 3.5) {
    current = name;
    if (!ctx) return;
    const notes = CHORDS[name] || CHORDS.space;
    const t = ctx.currentTime;
    voices.forEach((v) => {
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setValueAtTime(v.g.gain.value, t);
      v.g.gain.linearRampToValueAtTime(0, t + fade);
      v.oscs.forEach((o) => o.stop(t + fade + 0.2));
    });
    voices = notes.map((n, i) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(music);
      const oscs = [-8, 0, 7].map((detune, j) => {
        const o = ctx.createOscillator();
        o.type = j === 1 ? 'triangle' : 'sawtooth';
        o.frequency.value = hz(n);
        o.detune.value = detune + (Math.random() - 0.5) * 5;
        const og = ctx.createGain();
        og.gain.value = j === 1 ? 0.55 : 0.1;
        o.connect(og);
        og.connect(g);
        o.start(t);
        return o;
      });
      g.gain.linearRampToValueAtTime((0.11 / Math.sqrt(notes.length)) * (i === 0 ? 1.5 : 1), t + fade);
      return { g, oscs };
    });
  }

  function tone(freq, { type = 'sine', attack = 0.01, decay = 2.2, level = 0.18, bend = 0 } = {}) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * bend), t + decay * 0.6);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g);
    g.connect(sfx);
    o.start(t);
    o.stop(t + decay + 0.1);
  }

  return {
    get on() { return on; },
    enable() {
      if (!ctx && !init()) return false;
      ctx.resume();
      on = true;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0.85, t + 2.5);
      return true;
    },
    disable() {
      on = false;
      if (!ctx) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.8);
    },
    place(name) { if (name !== current) setChord(name); },
    swell(k) { // 0 = muffled, 1 = fully open
      if (!ctx) return;
      filter.frequency.setTargetAtTime(500 + k * 2600, ctx.currentTime, 0.5);
    },
    spin(energy) {
      if (!ctx) return;
      windGain.gain.setTargetAtTime(energy * 0.32, ctx.currentTime, 0.15);
      windFilter.frequency.setTargetAtTime(280 + energy * 1500, ctx.currentTime, 0.2);
    },
    chime(midi = 76) {
      if (!ctx || !on) return;
      tone(hz(midi), { level: 0.12, decay: 2.6 });
      tone(hz(midi + 7), { level: 0.05, decay: 2.0 });
      tone(hz(midi + 12), { level: 0.035, decay: 1.4 });
    },
    splash() {
      if (!ctx || !on) return;
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(2.5);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2400, t);
      lp.frequency.exponentialRampToValueAtTime(260, t + 2.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.55, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      src.connect(lp);
      lp.connect(g);
      g.connect(sfx);
      src.start(t);
      tone(55, { level: 0.3, decay: 1.4, bend: 0.5 });
    },
    thunder(k = 0.5) { // a distant rumble after the lightning
      if (!ctx || !on || k < 0.05) return;
      const t = ctx.currentTime + 0.3 + (1 - k) * 1.2;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(4);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(320 + k * 300, t);
      lp.frequency.exponentialRampToValueAtTime(90, t + 3.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5 * k, t + 0.12);
      g.gain.setTargetAtTime(0.25 * k, t + 0.4, 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);
      src.connect(lp);
      lp.connect(g);
      g.connect(sfx);
      src.start(t);
      src.stop(t + 4);
    },
    birds(k = 0.5) { // a few chirps when you're down among the flocks
      if (!ctx || !on) return;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const t = ctx.currentTime + i * (0.09 + Math.random() * 0.08);
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = 2600 + Math.random() * 1600;
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * (Math.random() < 0.5 ? 1.4 : 0.7), t + 0.07);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05 * k, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(g);
        g.connect(sfx);
        o.start(t);
        o.stop(t + 0.12);
      }
    },
    thump() { // Karma Core's heartbeat
      if (!ctx || !on) return;
      tone(62, { level: 0.32, decay: 0.5, bend: 0.55, attack: 0.005 });
    },
  };
}
