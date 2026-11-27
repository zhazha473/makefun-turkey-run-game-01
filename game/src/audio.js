// Sound for Gobble Run: every effect is synthesized with WebAudio —
// oscillators, filtered noise and envelopes — so the game ships no
// audio files at all. A quiet tension loop (a low plucked bass line
// with a sparse autumn melody) runs under play and quickens when the
// farmer chases. M toggles mute; the engine starts on the first user
// gesture, as browsers require.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = 0;
    this.musicStep = 0;
    this.chase = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, filterFreq, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  // The turkey's own voice: three quick descending clucks.
  gobble() {
    this.tone(520, 0.09, 'square', 0.16, 300);
    this.tone(470, 0.09, 'square', 0.16, 280, 0.09);
    this.tone(620, 0.12, 'square', 0.18, 340, 0.18);
  }

  step() {
    this.noise(0.05, 0.05, 900);
  }

  jump() {
    this.tone(300, 0.16, 'sine', 0.14, 620);
  }

  corn() {
    this.tone(880, 0.09, 'sine', 0.2, 1320);
    this.tone(1320, 0.12, 'sine', 0.14, 1760, 0.07);
  }

  alarm() {
    this.tone(740, 0.14, 'sawtooth', 0.16, 740);
    this.tone(740, 0.14, 'sawtooth', 0.16, 740, 0.17);
    this.tone(988, 0.22, 'sawtooth', 0.16, 988, 0.34);
  }

  whoosh() {
    this.noise(0.28, 0.22, 2400);
  }

  hiss() {
    this.noise(0.5, 0.16, 5200);
  }

  thud() {
    this.tone(120, 0.2, 'sine', 0.3, 55);
    this.noise(0.12, 0.2, 300);
  }

  snareSnap() {
    this.noise(0.08, 0.3, 3200);
    this.tone(180, 0.12, 'square', 0.18, 90);
  }

  caught() {
    this.tone(392, 0.2, 'sawtooth', 0.2, 392);
    this.tone(311, 0.2, 'sawtooth', 0.2, 311, 0.2);
    this.tone(233, 0.42, 'sawtooth', 0.2, 233, 0.4);
  }

  win() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((n, i) => this.tone(n, 0.22, 'triangle', 0.22, n, i * 0.13));
    this.tone(1319, 0.5, 'triangle', 0.18, 1319, 0.8);
  }

  click() {
    this.tone(660, 0.06, 'sine', 0.14, 660);
  }

  stageClear() {
    const notes = [659, 784, 988];
    notes.forEach((n, i) => this.tone(n, 0.18, 'triangle', 0.2, n, i * 0.1));
  }

  // A sparse bass-and-pluck loop. `chase` quickens it; call every frame.
  updateMusic(dt, chase) {
    if (!this.ctx || this.muted) return;
    this.chase = chase;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    this.musicTimer = chase ? 0.21 : 0.34;
    const bass = [110, 0, 98, 0, 123, 0, 98, 0, 110, 0, 82, 0, 98, 0, 123, 147];
    const pluck = [440, 0, 0, 523, 0, 0, 659, 0, 0, 587, 0, 0, 523, 0, 440, 0];
    const step = this.musicStep % 16;
    const b = bass[step];
    if (b) this.tone(b, 0.3, 'triangle', 0.10, b);
    const p = pluck[step];
    if (p && (step % 4 === 0 || chase)) this.tone(p, 0.22, 'sine', 0.05, p);
    this.musicStep++;
  }
}
