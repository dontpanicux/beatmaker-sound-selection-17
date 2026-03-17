import { useEffect, useRef } from 'react';

interface AudioEngineProps {
  isPlaying: boolean;
  tempo: number;
  pattern: boolean[][];
  tracks: string[];
  onStepChange?: (step: number) => void;
}

// Simple drum sound generator using Web Audio API
class DrumSynth {
  private audioContext: AudioContext | null = null;

  getContext(): AudioContext | null {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  resume(): Promise<void> {
    const ctx = this.getContext();
    return ctx?.state === 'suspended' ? ctx.resume() : Promise.resolve();
  }

  playKick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);

    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playSnare() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseEnvelope = ctx.createGain();

    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseEnvelope);
    noiseEnvelope.connect(ctx.destination);

    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    noiseEnvelope.gain.setValueAtTime(1, now);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.start(now);
    noise.stop(now + 0.2);
  }

  playHiHat(open: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseEnvelope = ctx.createGain();

    const bufferSize = ctx.sampleRate * (open ? 0.3 : 0.1);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseEnvelope);
    noiseEnvelope.connect(ctx.destination);

    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = open ? 7000 : 10000;

    const duration = open ? 0.3 : 0.05;
    noiseEnvelope.gain.setValueAtTime(0.3, now);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.start(now);
    noise.stop(now + duration);
  }

  playClap() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseEnvelope = ctx.createGain();

    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseEnvelope);
    noiseEnvelope.connect(ctx.destination);

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2000;

    noiseEnvelope.gain.setValueAtTime(0.5, now);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    noise.start(now);
    noise.stop(now + 0.1);
  }

  playSound(soundName: string) {
    switch (soundName.toLowerCase()) {
      case 'kick':
        this.playKick();
        break;
      case 'snare':
        this.playSnare();
        break;
      case 'open hi-hat':
        this.playHiHat(true);
        break;
      case 'closed hi-hat':
        this.playHiHat(false);
        break;
      case 'clap':
        this.playClap();
        break;
    }
  }
}

export function AudioEngine({ isPlaying, tempo, pattern, tracks, onStepChange }: AudioEngineProps) {
  const synthRef = useRef<DrumSynth | null>(null);
  const currentStepRef = useRef<number>(0);
  const patternRef = useRef(pattern);
  const tracksRef = useRef(tracks);

  patternRef.current = pattern;
  tracksRef.current = tracks;

  useEffect(() => {
    synthRef.current = new DrumSynth();
  }, []);

  useEffect(() => {
    if (!isPlaying || !synthRef.current) {
      currentStepRef.current = 0;
      onStepChange?.(-1);
      return;
    }

    onStepChange?.(0);
    const synth = synthRef.current;
    const p = patternRef.current;
    const t = tracksRef.current;
    t.forEach((track, trackIndex) => {
      if (p[trackIndex]?.[0]) {
        synth.playSound(track);
      }
    });
    const intervalMs = (60 / tempo) * 1000 / 4;
    let nextStepTime = performance.now() + intervalMs;
    let cancelled = false;

    const rafLoop = () => {
      if (cancelled) return;
      const now = performance.now();
      if (now >= nextStepTime) {
        const step = currentStepRef.current;
        const p = patternRef.current;
        const t = tracksRef.current;

        t.forEach((track, trackIndex) => {
          if (p[trackIndex]?.[step]) {
            synth.playSound(track);
          }
        });

        const steps = p[0]?.length ?? 16;
        currentStepRef.current = (step + 1) % steps;
        onStepChange?.(currentStepRef.current);
        nextStepTime += intervalMs;
      }
      requestAnimationFrame(rafLoop);
    };
    const rafId = requestAnimationFrame(rafLoop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [isPlaying, tempo, onStepChange]);

  useEffect(() => {
    if (isPlaying && synthRef.current) {
      synthRef.current.resume();
    }
  }, [isPlaying]);

  return null;
}
