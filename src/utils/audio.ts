// Synthesized Web Audio API sound effects and ambient focus soundscapes

class SoundEffects {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private ambientNode: {
    osc1?: OscillatorNode;
    osc2?: OscillatorNode;
    noiseNode?: AudioNode;
    gainNode?: GainNode;
    filterNode?: BiquadFilterNode;
    type?: string;
  } | null = null;

  constructor() {
    // Lazy AudioContext initialization on first user action
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playComplete() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Harmonious major chord arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  public playTimerStart() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  public playTimerAlarm() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [0, 0.2, 0.4].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + offset);

        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.15);
      });
    } catch {
      // Ignore
    }
  }

  public playPop() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }

  // Ambient Focus Soundscapes (White Noise, Rain, Binaural Beats)
  public startAmbient(type: 'whitenoise' | 'rain' | 'binaural') {
    if (!this.soundEnabled) return;
    this.stopAmbient();

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.connect(ctx.destination);

      if (type === 'whitenoise') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        noise.connect(filter);
        filter.connect(gainNode);
        noise.start();

        this.ambientNode = { noiseNode: noise, gainNode, filterNode: filter, type };
      } else if (type === 'rain') {
        // Pink / Rain noise simulation with bandpass filter
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.11;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1.0;

        noise.connect(filter);
        filter.connect(gainNode);
        noise.start();

        this.ambientNode = { noiseNode: noise, gainNode, filterNode: filter, type };
      } else if (type === 'binaural') {
        // Binaural beats (theta focus 200Hz left, 204Hz right)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);

        osc1.type = 'sine';
        osc1.frequency.value = 200;

        osc2.type = 'sine';
        osc2.frequency.value = 204;

        osc1.connect(merger, 0, 0); // Left
        osc2.connect(merger, 0, 1); // Right

        const stereoGain = ctx.createGain();
        stereoGain.gain.setValueAtTime(0.08, ctx.currentTime);
        merger.connect(stereoGain);
        stereoGain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        this.ambientNode = { osc1, osc2, gainNode: stereoGain, type };
      }
    } catch {
      // Ignore
    }
  }

  public stopAmbient() {
    try {
      if (this.ambientNode) {
        if (this.ambientNode.osc1) {
          try { this.ambientNode.osc1.stop(); } catch {}
        }
        if (this.ambientNode.osc2) {
          try { this.ambientNode.osc2.stop(); } catch {}
        }
        if (this.ambientNode.noiseNode && 'stop' in this.ambientNode.noiseNode) {
          try { (this.ambientNode.noiseNode as AudioBufferSourceNode).stop(); } catch {}
        }
        if (this.ambientNode.gainNode) {
          this.ambientNode.gainNode.disconnect();
        }
        this.ambientNode = null;
      }
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundEffects();

