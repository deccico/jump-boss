import { afterEach, describe, expect, it } from 'vitest';
import { setMuted } from './audioSettings';
import { createSfx, SFX_DEFS, type SfxName } from './sfx';

function stubAudioContext() {
  const oscillators: {
    type: string;
    setFreqs: { value: number; time: number }[];
    started: boolean;
  }[] = [];
  const context = {
    currentTime: 0,
    destination: {},
    createOscillator() {
      const osc = {
        type: '',
        setFreqs: [] as { value: number; time: number }[],
        started: false,
        frequency: {
          setValueAtTime(value: number, time: number) {
            osc.setFreqs.push({ value, time });
          },
          exponentialRampToValueAtTime() {},
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
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
    }),
  };
  return { context: context as unknown as AudioContext, oscillators };
}

describe('sfx definitions', () => {
  it('are all well-formed', () => {
    for (const def of Object.values<import('./sfx').SfxDef>(SFX_DEFS)) {
      expect(def.durationMs).toBeGreaterThan(0);
      expect(def.gain).toBeGreaterThan(0);
      expect(def.gain).toBeLessThanOrEqual(0.5);
      expect(def.freqStart).toBeGreaterThan(0);
      expect(def.freqEnd).toBeGreaterThan(0);
      for (const note of def.notes ?? []) {
        expect(note).toBeGreaterThan(0);
      }
    }
  });
});

describe('createSfx', () => {
  afterEach(() => setMuted(false));

  it('plays nothing while muted', () => {
    const { context, oscillators } = stubAudioContext();
    const sfx = createSfx(() => context);
    setMuted(true);
    sfx.jump();
    sfx.stomp();
    expect(oscillators).toHaveLength(0);
    setMuted(false);
    sfx.jump();
    expect(oscillators).toHaveLength(1);
  });

  it('never throws in Node where AudioContext is undefined', () => {
    const sfx = createSfx();
    for (const name of Object.keys(SFX_DEFS) as SfxName[]) {
      expect(() => sfx[name]()).not.toThrow();
    }
  });

  it('plays the jump bleep with the expected wave and start frequency', () => {
    const { context, oscillators } = stubAudioContext();
    const sfx = createSfx(() => context);
    sfx.jump();
    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.type).toBe('square');
    expect(oscillators[0]?.setFreqs[0]?.value).toBe(SFX_DEFS.jump.freqStart);
    expect(oscillators[0]?.started).toBe(true);
  });

  it('plays one oscillator per fanfare note', () => {
    const { context, oscillators } = stubAudioContext();
    const sfx = createSfx(() => context);
    sfx.fanfare();
    expect(oscillators).toHaveLength(SFX_DEFS.fanfare.notes.length);
  });

  it('creates the AudioContext lazily, once', () => {
    let created = 0;
    const { context } = stubAudioContext();
    const sfx = createSfx(() => {
      created++;
      return context;
    });
    expect(created).toBe(0);
    sfx.jump();
    sfx.stomp();
    expect(created).toBe(1);
  });
});
