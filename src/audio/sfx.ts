import { isMuted } from './audioSettings';

/**
 * All sound effects are tiny WebAudio synth bleeps — no audio assets.
 * The AudioContext is created lazily on first play (which always happens
 * after a user input, satisfying autoplay policies) and everything no-ops
 * where AudioContext doesn't exist (Node test runs) or while muted.
 */
export interface SfxDef {
  wave: OscillatorType;
  freqStart: number;
  freqEnd: number;
  durationMs: number;
  gain: number;
  /** Successive note frequencies (arpeggio); overrides the freq sweep. */
  notes?: number[];
}

export const SFX_DEFS = {
  jump: { wave: 'square', freqStart: 220, freqEnd: 440, durationMs: 120, gain: 0.12 },
  stomp: { wave: 'square', freqStart: 160, freqEnd: 55, durationMs: 150, gain: 0.16 },
  hurt: { wave: 'sawtooth', freqStart: 200, freqEnd: 80, durationMs: 250, gain: 0.14 },
  pickup: { wave: 'sine', freqStart: 660, freqEnd: 660, durationMs: 90, gain: 0.14, notes: [660, 990] },
  transform: { wave: 'sawtooth', freqStart: 200, freqEnd: 800, durationMs: 500, gain: 0.14 },
  fanfare: {
    wave: 'square',
    freqStart: 523,
    freqEnd: 523,
    durationMs: 180,
    gain: 0.12,
    notes: [523, 659, 784, 1047],
  },
} satisfies Record<string, SfxDef>;

export type SfxName = keyof typeof SFX_DEFS;

export type Sfx = Record<SfxName, () => void>;

export function createSfx(ctxFactory?: () => AudioContext): Sfx {
  let ctx: AudioContext | null = null;
  const getContext = (): AudioContext | null => {
    if (!ctx) {
      if (ctxFactory) {
        ctx = ctxFactory();
      } else if (typeof AudioContext !== 'undefined') {
        ctx = new AudioContext();
      }
    }
    return ctx;
  };

  const play = (def: SfxDef): void => {
    if (isMuted()) {
      return;
    }
    const audio = getContext();
    if (!audio) {
      return;
    }
    const t0 = audio.currentTime;
    const notes = def.notes ?? [def.freqStart];
    notes.forEach((note, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = def.wave;
      const start = t0 + (i * def.durationMs) / 1000;
      const end = start + def.durationMs / 1000;
      osc.frequency.setValueAtTime(i === 0 ? def.freqStart : note, start);
      if (!def.notes) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, def.freqEnd), end);
      }
      gain.gain.setValueAtTime(def.gain, start);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(end);
    });
  };

  const sfx = {} as Sfx;
  for (const name of Object.keys(SFX_DEFS) as SfxName[]) {
    sfx[name] = () => play(SFX_DEFS[name]);
  }
  return sfx;
}
