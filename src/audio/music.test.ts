import { afterEach, describe, expect, it } from 'vitest';
import { setMuted } from './audioSettings';
import { MusicPlayer, TRACKS, type MusicTrack, type TrackName } from './music';

function stubAudioContext(state: AudioContextState = 'running') {
  const oscillators: { type: string; started: boolean; freq: number }[] = [];
  let resumed = 0;
  const context = {
    currentTime: 0,
    state,
    destination: {},
    resume() {
      resumed++;
      return Promise.resolve();
    },
    createOscillator() {
      const osc = {
        type: '',
        started: false,
        freq: 0,
        frequency: {
          setValueAtTime(value: number) {
            osc.freq = value;
          },
        },
        connect() {},
        start() {
          osc.started = true;
        },
        stop() {},
      };
      oscillators.push(osc);
      return osc;
    },
    createGain: () => ({
      gain: {
        value: 1,
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        setTargetAtTime() {},
      },
      connect() {},
      disconnect() {},
    }),
  };
  return { context: context as unknown as AudioContext, oscillators, resumedCount: () => resumed };
}

function noteCount(track: MusicTrack): number {
  return track.voices.reduce((sum, voice) => sum + voice.notes.length, 0);
}

describe('music tracks', () => {
  it('defines the four tracks with sane musical data', () => {
    const names: TrackName[] = ['title', 'level', 'boss', 'victory'];
    for (const name of names) {
      const track = TRACKS[name];
      expect(track.bpm).toBeGreaterThanOrEqual(60);
      expect(track.bpm).toBeLessThanOrEqual(200);
      expect(track.beatsPerLoop).toBeGreaterThan(0);
      expect(track.voices.length).toBeGreaterThanOrEqual(2);
      for (const voice of track.voices) {
        expect(voice.notes.length).toBeGreaterThan(0);
        expect(voice.gain).toBeGreaterThan(0);
        expect(voice.gain).toBeLessThanOrEqual(0.1);
        for (const note of voice.notes) {
          expect(note.freq).toBeGreaterThan(0);
          expect(note.beats).toBeGreaterThan(0);
          expect(note.beat + note.beats).toBeLessThanOrEqual(track.beatsPerLoop + 1e-9);
        }
      }
    }
  });
});

describe('MusicPlayer', () => {
  let player: MusicPlayer | null = null;
  afterEach(() => {
    player?.stop();
    player = null;
    setMuted(false);
  });

  it('never throws in Node without an AudioContext', () => {
    player = new MusicPlayer();
    expect(() => player?.play('title')).not.toThrow();
    expect(() => player?.stop()).not.toThrow();
  });

  it('schedules one full loop of notes on play', () => {
    const { context, oscillators } = stubAudioContext();
    player = new MusicPlayer(() => context);
    player.play('title');
    expect(oscillators).toHaveLength(noteCount(TRACKS.title));
    expect(oscillators.every((osc) => osc.started)).toBe(true);
  });

  it('is idempotent for the same track and switches for a new one', () => {
    const { context, oscillators } = stubAudioContext();
    player = new MusicPlayer(() => context);
    player.play('title');
    const afterFirst = oscillators.length;
    player.play('title');
    expect(oscillators.length).toBe(afterFirst);
    player.play('boss');
    expect(oscillators.length).toBe(afterFirst + noteCount(TRACKS.boss));
  });

  it('waits for a user gesture when the context is suspended (no window in Node)', () => {
    const { context, oscillators, resumedCount } = stubAudioContext('suspended');
    player = new MusicPlayer(() => context);
    player.play('title');
    // no window to attach the unlock to, so nothing plays and nothing throws
    expect(oscillators).toHaveLength(0);
    expect(resumedCount()).toBe(0);
  });

  it('stops cleanly', () => {
    const { context, oscillators } = stubAudioContext();
    player = new MusicPlayer(() => context);
    player.play('level');
    expect(oscillators.length).toBeGreaterThan(0);
    expect(() => player?.stop()).not.toThrow();
  });

  it('stays silent while muted and resumes the requested track on unmute', () => {
    const { context, oscillators } = stubAudioContext();
    player = new MusicPlayer(() => context);
    setMuted(true);
    player.play('level');
    expect(oscillators).toHaveLength(0);
    setMuted(false);
    player.refreshMuted();
    expect(oscillators).toHaveLength(noteCount(TRACKS.level));
  });

  it('silences on mute without forgetting the track', () => {
    const { context, oscillators } = stubAudioContext();
    player = new MusicPlayer(() => context);
    player.play('boss');
    const scheduled = oscillators.length;
    setMuted(true);
    player.refreshMuted();
    setMuted(false);
    player.refreshMuted();
    expect(oscillators.length).toBe(scheduled + noteCount(TRACKS.boss));
  });
});
