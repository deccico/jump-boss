import { describe, expect, it } from 'vitest';
import {
  canAirJump,
  canJump,
  COYOTE_MS,
  GRAVITY,
  JUMP_BUFFER_MS,
  JUMP_VELOCITY,
  jumpHeight,
  MAX_AIR_JUMPS,
} from './physics';

describe('jump physics', () => {
  it('computes the base jump height as v^2 / 2g (= 112 px)', () => {
    expect(jumpHeight(JUMP_VELOCITY)).toBeCloseTo((560 * 560) / (2 * GRAVITY), 6);
    expect(jumpHeight(JUMP_VELOCITY)).toBeCloseTo(112, 6);
  });

  it('allows a jump while grounded within the coyote window', () => {
    expect(canJump(1000, 1000, 1000)).toBe(true);
    expect(canJump(1000, 1000 + COYOTE_MS, 1000 + COYOTE_MS)).toBe(true);
  });

  it('refuses a jump after the coyote window has passed', () => {
    expect(canJump(1000, 1000 + COYOTE_MS + 1, 1000 + COYOTE_MS + 1)).toBe(false);
  });

  it('honours a jump press buffered just before landing', () => {
    const pressedAt = 2000;
    const landedAt = pressedAt + JUMP_BUFFER_MS;
    expect(canJump(landedAt, pressedAt, landedAt)).toBe(true);
    expect(canJump(landedAt, pressedAt - 1, landedAt)).toBe(false);
  });

  it('refuses to jump with no ground contact or no jump press', () => {
    expect(canJump(null, 1000, 1000)).toBe(false);
    expect(canJump(1000, null, 1000)).toBe(false);
  });

  it('allows exactly one extra jump in mid-air', () => {
    expect(MAX_AIR_JUMPS).toBe(1);
    expect(canAirJump(0)).toBe(true);
    expect(canAirJump(1)).toBe(false);
    expect(canAirJump(2)).toBe(false);
  });
});
