/**
 * Background music: tiny synthesized chiptune loops, no audio assets.
 * Tracks are pure data (a melody voice and a bass voice per track) played by
 * a lookahead scheduler. Autoplay-safe: if the AudioContext starts suspended,
 * playback waits for the first key/pointer gesture. Everything no-ops where
 * AudioContext doesn't exist (Node tests).
 */
import { isMuted } from './audioSettings';

export interface MusicNote {
  beat: number;
  freq: number;
  beats: number;
}

export interface MusicVoice {
  wave: OscillatorType;
  gain: number;
  notes: MusicNote[];
}

export interface MusicTrack {
  bpm: number;
  beatsPerLoop: number;
  voices: MusicVoice[];
}

const N = {
  A2: 110.0, Bb2: 116.54,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5,
} as const;

function n(beat: number, freq: number, beats: number): MusicNote {
  return { beat, freq, beats };
}

export const TRACKS = {
  // slow and spooky, for the title and character select — monsters ahead
  title: {
    bpm: 90,
    beatsPerLoop: 16,
    voices: [
      {
        wave: 'square',
        gain: 0.035,
        notes: [
          n(0, N.A4, 1.5), n(2, N.Bb4, 1.5), n(4, N.A4, 1), n(5.5, N.E4, 2),
          n(8, N.A4, 1.5), n(10, N.Eb5, 1.5), n(12, N.D5, 1), n(13.5, N.Bb4, 1),
          n(14.5, N.A4, 1.5),
        ],
      },
      {
        // a ghostly answer floating above
        wave: 'sine',
        gain: 0.03,
        notes: [n(6.5, N.E5, 1), n(11.5, N.Eb5, 1), n(14.5, N.B4, 1.5)],
      },
      {
        wave: 'triangle',
        gain: 0.075,
        notes: [
          n(0, N.A2, 4), n(4, N.Eb3, 4), n(8, N.A2, 4), n(12, N.E3, 2), n(14, N.Bb2, 2),
        ],
      },
    ],
  },
  // adventurous, for the platform level
  level: {
    bpm: 144,
    beatsPerLoop: 8,
    voices: [
      {
        wave: 'square',
        gain: 0.045,
        notes: [
          n(0, N.E5, 0.5), n(0.5, N.G5, 0.5), n(1, N.A5, 0.5), n(1.5, N.G5, 0.5),
          n(2, N.E5, 0.5), n(2.5, N.C5, 0.5), n(3, N.D5, 1),
          n(4, N.D5, 0.5), n(4.5, N.F5, 0.5), n(5, N.G5, 0.5), n(5.5, N.F5, 0.5),
          n(6, N.D5, 0.5), n(6.5, N.B4, 0.5), n(7, N.C5, 1),
        ],
      },
      {
        wave: 'triangle',
        gain: 0.06,
        notes: [
          n(0, N.A3, 1), n(1, N.A3, 1), n(2, N.F3, 1), n(3, N.F3, 1),
          n(4, N.G3, 1), n(5, N.G3, 1), n(6, N.E3, 1), n(7, N.A3, 1),
        ],
      },
    ],
  },
  // driving and a little tense, for every boss fight
  boss: {
    bpm: 152,
    beatsPerLoop: 8,
    voices: [
      {
        wave: 'square',
        gain: 0.04,
        notes: [
          n(0, N.A4, 0.5), n(0.5, N.A4, 0.5), n(1, N.C5, 0.5), n(1.5, N.A4, 0.5),
          n(2, N.E5, 0.5), n(2.5, N.D5, 0.5), n(3, N.C5, 0.5), n(3.5, N.B4, 0.5),
          n(4, N.A4, 0.5), n(4.5, N.A4, 0.5), n(5, N.D5, 0.5), n(5.5, N.C5, 0.5),
          n(6, N.B4, 0.5), n(6.5, N.G4, 0.5), n(7, N.E4, 1),
        ],
      },
      {
        wave: 'triangle',
        gain: 0.065,
        notes: [
          n(0, N.A3, 0.5), n(0.5, N.E3, 0.5), n(1, N.A3, 0.5), n(1.5, N.E3, 0.5),
          n(2, N.A3, 0.5), n(2.5, N.E3, 0.5), n(3, N.A3, 0.5), n(3.5, N.E3, 0.5),
          n(4, N.F3, 0.5), n(4.5, N.C3, 0.5), n(5, N.F3, 0.5), n(5.5, N.C3, 0.5),
          n(6, N.E3, 0.5), n(6.5, N.B3, 0.5), n(7, N.E3, 0.5), n(7.5, N.B3, 0.5),
        ],
      },
    ],
  },
  // triumphant, for the victory screen and credits
  victory: {
    bpm: 126,
    beatsPerLoop: 8,
    voices: [
      {
        wave: 'square',
        gain: 0.05,
        notes: [
          n(0, N.C5, 0.5), n(0.5, N.E5, 0.5), n(1, N.G5, 0.5), n(1.5, N.C6, 1),
          n(2.5, N.G5, 0.5), n(3, N.A5, 0.5), n(3.5, N.C6, 1.5),
          n(5, N.F5, 0.5), n(5.5, N.A5, 0.5), n(6, N.G5, 0.5), n(6.5, N.E5, 0.5),
          n(7, N.C5, 1),
        ],
      },
      {
        wave: 'triangle',
        gain: 0.06,
        notes: [
          n(0, N.C3, 1), n(1, N.E3, 1), n(2, N.F3, 1), n(3, N.F3, 1),
          n(4, N.G3, 1), n(5, N.G3, 1), n(6, N.C3, 2),
        ],
      },
    ],
  },
} satisfies Record<string, MusicTrack>;

export type TrackName = keyof typeof TRACKS;

const LOOKAHEAD_S = 0.4;
const PUMP_INTERVAL_MS = 120;

export class MusicPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private current: TrackName | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextLoopStart = 0;
  private unlockAttached = false;

  constructor(private ctxFactory?: () => AudioContext) {}

  play(name: TrackName): void {
    if (this.current === name) {
      return;
    }
    this.stopPlayback();
    this.current = name;
    this.startCurrent();
  }

  stop(): void {
    this.stopPlayback();
    this.current = null;
  }

  /** Re-reads the mute switch: silences, or resumes the requested track. */
  refreshMuted(): void {
    if (isMuted()) {
      this.stopPlayback();
    } else if (this.current) {
      this.startCurrent();
    }
  }

  private startCurrent(): void {
    if (isMuted() || !this.current) {
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }
    if (ctx.state === 'suspended') {
      this.attachUnlock(ctx, this.current);
      return;
    }
    this.beginPlayback(ctx, this.current);
  }

  private stopPlayback(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const { ctx, master } = this;
    if (ctx && master) {
      // quick fade so scheduled notes don't cut off with a click
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06);
      setTimeout(() => master.disconnect(), 400);
    }
    this.master = null;
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      if (this.ctxFactory) {
        this.ctx = this.ctxFactory();
      } else if (typeof AudioContext !== 'undefined') {
        this.ctx = new AudioContext();
      }
    }
    return this.ctx;
  }

  /** Browsers keep a fresh AudioContext suspended until a user gesture. */
  private attachUnlock(ctx: AudioContext, name: TrackName): void {
    if (this.unlockAttached || typeof window === 'undefined') {
      return;
    }
    this.unlockAttached = true;
    const unlock = (): void => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      this.unlockAttached = false;
      void ctx.resume().then(() => {
        if (this.current !== null && !isMuted()) {
          this.beginPlayback(ctx, this.current);
        }
      });
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    // keep the requested track queued for the unlock
    this.current = name;
  }

  private beginPlayback(ctx: AudioContext, name: TrackName): void {
    if (this.master) {
      return; // already playing
    }
    this.master = ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(ctx.destination);
    this.nextLoopStart = ctx.currentTime + 0.08;
    const pump = (): void => {
      while (this.master && this.nextLoopStart < ctx.currentTime + LOOKAHEAD_S) {
        this.scheduleLoop(ctx, TRACKS[name], this.nextLoopStart);
        this.nextLoopStart += (TRACKS[name].beatsPerLoop * 60) / TRACKS[name].bpm;
      }
    };
    pump();
    this.timer = setInterval(pump, PUMP_INTERVAL_MS);
  }

  private scheduleLoop(ctx: AudioContext, track: MusicTrack, startTime: number): void {
    const master = this.master;
    if (!master) {
      return;
    }
    const secondsPerBeat = 60 / track.bpm;
    for (const voice of track.voices) {
      for (const note of voice.notes) {
        const t0 = startTime + note.beat * secondsPerBeat;
        const duration = note.beats * secondsPerBeat * 0.92;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = voice.wave;
        osc.frequency.setValueAtTime(note.freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(voice.gain, t0 + 0.012);
        gain.gain.setValueAtTime(voice.gain, t0 + duration - 0.03);
        gain.gain.linearRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t0);
        osc.stop(t0 + duration);
      }
    }
  }
}

/** Shared player — scenes switch tracks; same track twice is a no-op. */
export const music = new MusicPlayer();
