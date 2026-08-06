import { afterEach, describe, expect, it } from 'vitest';
import { isMuted, setMuted, toggleMuted } from './audioSettings';

describe('audio settings', () => {
  afterEach(() => setMuted(false));

  it('defaults to unmuted in Node (no localStorage)', () => {
    expect(isMuted()).toBe(false);
  });

  it('sets and toggles the mute state', () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(toggleMuted()).toBe(false);
    expect(toggleMuted()).toBe(true);
    expect(isMuted()).toBe(true);
  });
});
