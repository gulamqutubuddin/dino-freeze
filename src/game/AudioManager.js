// ---------------- Web Audio: procedural SFX + chiptune-style music sequencer ----------------
import { seeded } from './utils.js';

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  pent: [0, 2, 4, 7, 9],
  mixo: [0, 2, 4, 5, 7, 9, 10],
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

class AudioManagerClass {
  constructor() {
    this.ctx = null;
    this.soundOn = true;
    this.musicOn = true;
    this.supported = !!(window.AudioContext || window.webkitAudioContext);
    this.last = {};
    this.music = null;
    this.ducked = false;
  }

  /** Must be called from a user gesture (click / touch). */
  unlock() {
    if (!this.supported) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
        // gentle compressor keeps lots of overlapping sounds pleasant
        this.comp = this.ctx.createDynamicsCompressor();
        this.comp.threshold.value = -16;
        this.comp.ratio.value = 4;
        this.comp.connect(this.master);
        this.sfx = this.ctx.createGain();
        this.sfx.gain.value = this.soundOn ? 0.55 : 0;
        this.sfx.connect(this.comp);
        this.mus = this.ctx.createGain();
        this.mus.gain.value = this.musicOn ? 0.16 : 0;
        this.mus.connect(this.comp);
        const len = this.ctx.sampleRate * 1.5;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      this.supported = false;
    }
  }

  setSound(on) { this.soundOn = on; if (this.sfx) this.sfx.gain.value = on && !this.ducked ? 0.55 : 0; }
  setMusic(on) { this.musicOn = on; if (this.mus) this.mus.gain.value = on && !this.ducked ? 0.16 : 0; }
  duck(d) { this.ducked = d; this.setSound(this.soundOn); this.setMusic(this.musicOn); }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  ok(name, minGap = 0) {
    if (!this.ctx || !this.soundOn || this.ducked) return false;
    const t = this.ctx.currentTime;
    if (minGap && this.last[name] && t - this.last[name] < minGap) return false;
    this.last[name] = t;
    return true;
  }

  tone(freq, dur, type = 'sine', vol = 0.3, when = 0, slideTo = 0, dest = null, attack = 0.005) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }

  noise(dur, vol = 0.3, ftype = 'bandpass', freq = 2000, Q = 1, when = 0, slideTo = 0, dest = null) {
    const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = ftype; f.frequency.setValueAtTime(freq, t); f.Q.value = Q;
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  // ---------------- SFX ----------------
  shoot(pitch = 1) {
    if (!this.ok('shoot', 0.11)) return;
    this.noise(0.09, 0.07, 'bandpass', 2400 * pitch, 1.2, 0, 900);
    this.tone(520 * pitch + Math.random() * 80, 0.06, 'sine', 0.035, 0, 300 * pitch);
  }
  hit() {
    if (!this.ok('hit', 0.07)) return;
    this.noise(0.07, 0.09, 'highpass', 3000 + Math.random() * 2000, 0.7);
    this.tone(900 + Math.random() * 300, 0.05, 'sine', 0.04, 0, 1500);
  }
  freezeTick(level) {
    if (!this.ok('ftick', 0.08)) return;
    const base = [880, 1100, 1320][level] || 880;
    this.tone(base, 0.18, 'triangle', 0.09);
    this.tone(base * 1.5, 0.22, 'sine', 0.05, 0.05);
  }
  frozen() {
    if (!this.ok('frozen', 0.05)) return;
    [1318, 1568, 1976, 2637].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.07, i * 0.04));
    this.noise(0.3, 0.05, 'highpass', 6000, 0.5);
  }
  crack() {
    if (!this.ok('crack', 0.04)) return;
    this.noise(0.12, 0.3, 'highpass', 1800, 0.8);
    this.tone(160, 0.12, 'square', 0.08, 0, 60);
  }
  shatter(big = false) {
    if (!this.ok('shatter', 0.04)) return;
    this.noise(big ? 0.7 : 0.35, big ? 0.35 : 0.22, 'highpass', 2500, 0.4, 0, 8000);
    this.tone(big ? 90 : 140, big ? 0.4 : 0.18, 'sine', 0.25, 0, 40);
    const n = big ? 10 : 5;
    for (let i = 0; i < n; i++) this.tone(1800 + Math.random() * 2600, 0.12, 'triangle', 0.05, 0.02 + i * 0.025);
  }
  combo(n) {
    if (!this.ok('combo', 0.05)) return;
    const base = 523 * Math.pow(2, Math.min(n, 20) / 24);
    [0, 4, 7, 12].forEach((s, i) => this.tone(base * Math.pow(2, s / 12), 0.14, 'square', 0.05, i * 0.05));
  }
  powerup() {
    if (!this.ok('pu', 0.05)) return;
    [0, 4, 7, 12, 16].forEach((s, i) => this.tone(659 * Math.pow(2, s / 12), 0.16, 'triangle', 0.1, i * 0.055));
  }
  coin() {
    if (!this.ok('coin', 0.06)) return;
    this.tone(1568, 0.07, 'square', 0.04); this.tone(2093, 0.15, 'square', 0.04, 0.06);
  }
  bump() {
    if (!this.ok('bump', 0.1)) return;
    this.tone(300, 0.12, 'sine', 0.3, 0, 120);
    this.tone(140, 0.25, 'sine', 0.25, 0.1, 420);
    this.noise(0.1, 0.1, 'lowpass', 600, 1);
  }
  splat() {
    if (!this.ok('splat', 0.1)) return;
    this.noise(0.25, 0.3, 'lowpass', 1200, 1, 0, 300);
    this.tone(220, 0.15, 'sine', 0.15, 0, 90);
  }
  pop() {
    if (!this.ok('pop', 0.04)) return;
    this.tone(700, 0.08, 'sine', 0.15, 0, 1400);
  }
  bossAppear() {
    if (!this.ok('boss', 0.5)) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.linearRampToValueAtTime(170, t + 0.5); o.frequency.linearRampToValueAtTime(90, t + 1.2);
    lfo.frequency.value = 9; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); lfo.start(t); o.stop(t + 1.4); lfo.stop(t + 1.4);
    [0, 0.25, 0.5].forEach((w) => this.tone(196, 0.2, 'square', 0.06, 1.2 + w));
  }
  roar() {
    if (!this.ok('roar', 0.8)) return;
    this.tone(180, 0.6, 'sawtooth', 0.08, 0, 90);
    this.noise(0.6, 0.12, 'bandpass', 500, 2, 0, 200);
  }
  whoosh() {
    if (!this.ok('whoosh', 0.3)) return;
    this.noise(0.8, 0.18, 'bandpass', 300, 1.5, 0, 3000);
  }
  superFreeze() {
    if (!this.ok('super', 0.3)) return;
    this.noise(1.2, 0.25, 'bandpass', 200, 1, 0, 6000);
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 1.2, 'triangle', 0.08, 0.1 + i * 0.06));
  }
  bossDefeat() {
    this.shatter(true);
    [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.3, 'square', 0.07, 0.4 + i * 0.12));
  }
  wave() {
    if (!this.ok('wave', 0.3)) return;
    [392, 523, 659].forEach((f, i) => this.tone(f, 0.18, 'square', 0.06, i * 0.08));
  }
  click() {
    if (!this.ctx) this.unlock();
    if (!this.ok('click', 0.03)) return;
    this.tone(880, 0.06, 'square', 0.06, 0, 1320);
  }
  levelComplete() {
    const seq = [523, 659, 784, 1046, 0, 784, 1046, 1318];
    seq.forEach((f, i) => f && this.tone(f, 0.25, 'square', 0.07, i * 0.13));
    seq.forEach((f, i) => f && this.tone(f / 2, 0.25, 'triangle', 0.08, i * 0.13));
  }
  gameOver() {
    [523, 466, 415, 392].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, i * 0.2));
    this.tone(196, 0.6, 'sine', 0.15, 0.8, 260);
  }

  // ---------------- Music ----------------
  playMusic(cfg) {
    if (!this.ctx) return;
    const key = JSON.stringify(cfg);
    if (this.music && this.music.key === key) return;
    this.stopMusic();
    const rng = seeded(cfg.seed * 7919);
    const scale = SCALES[cfg.scale] || SCALES.major;
    const n = scale.length;
    const note = (deg, oct = 0) => cfg.root + scale[((deg % n) + n) % n] + 12 * (Math.floor(deg / n) + oct);
    const prog = [0, 4, 5, 3].map((d) => Math.min(d, n - 1)); // I V vi IV
    // generate 4-bar melody (random walk, seeded so each level has its own tune)
    const mel = [];
    let deg = n;
    for (let i = 0; i < 64; i++) {
      if (rng() < (i % 4 === 0 ? 0.8 : 0.38)) {
        deg += Math.floor(rng() * 5) - 2;
        deg = Math.max(n - 2, Math.min(n * 2 + 2, deg));
        mel.push(deg);
      } else mel.push(null);
    }
    const stepDur = 60 / cfg.tempo / 4;
    const m = { key, step: 0, next: this.ctx.currentTime + 0.1 };
    const sched = () => {
      if (!this.ctx) return;
      while (m.next < this.ctx.currentTime + 0.15) {
        const s = m.step % 64, bar = Math.floor(s / 16), b = s % 16;
        const when = m.next - this.ctx.currentTime;
        const chord = prog[bar];
        if (b === 0 || b === 6 || b === 8 || b === 14) this.tone(mtof(note(chord, -2)), stepDur * 1.8, 'triangle', 0.5, when, 0, this.mus);
        if (b === 0) [0, 2, 4].forEach((k) => this.tone(mtof(note(chord + k, -1)), stepDur * 14, 'sine', 0.09, when, 0, this.mus, 0.08));
        if (mel[s] !== null) this.tone(mtof(note(mel[s])), stepDur * 1.6, cfg.lead, cfg.lead === 'sawtooth' ? 0.08 : 0.12, when, 0, this.mus);
        if (b % 8 === 0) this.tone(150, 0.12, 'sine', 0.55, when, 45, this.mus);
        if (b % 8 === 4) this.noise(0.1, 0.18, 'bandpass', 1800, 0.8, when, 0, this.mus);
        if (b % 2 === 0) this.noise(0.03, 0.06, 'highpass', 8000, 0.5, when, 0, this.mus);
        m.step++;
        m.next += stepDur;
      }
    };
    m.timer = setInterval(sched, 25);
    sched();
    this.music = m;
  }
  stopMusic() {
    if (this.music) { clearInterval(this.music.timer); this.music = null; }
  }
}

export const AudioManager = new AudioManagerClass();
