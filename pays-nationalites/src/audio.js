// Subtle Web Audio sound engine for interactive feedback.
// Operates with zero assets, fails gracefully without audio context, and supports mute toggle.

const MUTE_STORAGE_KEY = "pays-nationalites:muted:v1";

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initMutePreference();
  }

  initMutePreference() {
    try {
      this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
    } catch {
      this.muted = false;
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    } catch {
      /* storage optional */
    }
    return this.muted;
  }

  init() {
    if (this.muted) return false;
    try {
      if (!this.ctx && typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return Boolean(this.ctx);
    } catch {
      return false;
    }
  }

  playHit() {
    if (!this.init()) return;
    try {
      const now = this.ctx.currentTime;
      // Note 1: C5 (523.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.24);

      // Note 2: E5 (659.25 Hz) slightly delayed
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.07);
      gain2.gain.setValueAtTime(0.14, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.38);
    } catch {
      /* ignore audio error */
    }
  }

  playDuplicate() {
    if (!this.init()) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(260, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      /* ignore audio error */
    }
  }

  playVictory() {
    if (!this.init()) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const time = this.ctx.currentTime + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.35);
      });
    } catch {
      /* ignore audio error */
    }
  }

  playTick() {
    if (!this.init()) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      /* ignore audio error */
    }
  }
}

export const sound = new SoundManager();
