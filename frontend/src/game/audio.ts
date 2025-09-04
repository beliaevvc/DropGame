// Простейший звуковой движок на WebAudio (без внешних файлов).
class AudioEngine {
  ctx: AudioContext | null = null;

  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  beep(freq: number, durMs: number, type: OscillatorType = "sine", gain=0.05) {
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    g.gain.value = gain;
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + durMs / 1000);
  }

  click() { this.beep(700, 60, "triangle", 0.04); }
  bomb()  { this.beep(120, 240, "sawtooth", 0.08); }
  rocket(){ this.beep(500, 300, "square", 0.05); }
  freeze(){ this.beep(900, 120, "sine", 0.04); }
}

export const SFX = new AudioEngine();
