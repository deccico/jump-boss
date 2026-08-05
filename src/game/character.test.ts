import { describe, expect, it } from 'vitest';
import {
  BODY_STYLES,
  cycleBody,
  cycleEyes,
  DEFAULT_CHARACTER,
  EYE_COUNTS,
  isValidCharacter,
  swatchKey,
} from './character';

describe('character config', () => {
  it('offers 1-3 eyes and the five drawn body styles', () => {
    expect(EYE_COUNTS).toEqual([1, 2, 3]);
    expect(BODY_STYLES).toEqual(['purple', 'orange', 'red', 'stripes', 'spots']);
  });

  it('accepts every valid combination', () => {
    for (const eyes of EYE_COUNTS) {
      for (const body of BODY_STYLES) {
        expect(isValidCharacter({ eyes, body })).toBe(true);
      }
    }
    expect(isValidCharacter(DEFAULT_CHARACTER)).toBe(true);
  });

  it('rejects invalid configs', () => {
    expect(isValidCharacter(null)).toBe(false);
    expect(isValidCharacter(undefined)).toBe(false);
    expect(isValidCharacter({})).toBe(false);
    expect(isValidCharacter({ eyes: 0, body: 'purple' })).toBe(false);
    expect(isValidCharacter({ eyes: 4, body: 'purple' })).toBe(false);
    expect(isValidCharacter({ eyes: 2, body: 'plaid' })).toBe(false);
    expect(isValidCharacter({ eyes: 2 })).toBe(false);
    expect(isValidCharacter('purple')).toBe(false);
  });

  it('cycles eyes in both directions with wrap-around', () => {
    expect(cycleEyes(1, 1)).toBe(2);
    expect(cycleEyes(3, 1)).toBe(1);
    expect(cycleEyes(1, -1)).toBe(3);
  });

  it('cycles body styles in both directions with wrap-around', () => {
    expect(cycleBody('purple', 1)).toBe('orange');
    expect(cycleBody('spots', 1)).toBe('purple');
    expect(cycleBody('purple', -1)).toBe('spots');
  });

  it('maps body styles to their scanned swatch sprites', () => {
    expect(swatchKey('stripes')).toBe('swatch-stripes');
  });
});
