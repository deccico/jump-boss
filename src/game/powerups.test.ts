import { describe, expect, it } from 'vitest';
import { jumpHeight, RUN_SPEED } from './physics';
import {
  applyPickup,
  canTransform,
  createEffects,
  EFFECT_DURATION_MS,
  isTransformed,
  jumpVelocity,
  METER_MAX,
  moveSpeed,
  startTransform,
  TRANSFORM_DURATION_MS,
  X_CHARGE,
} from './powerups';

describe('power-ups', () => {
  it('big jump makes jumps exactly twice as high ("two times")', () => {
    const effects = applyPickup(createEffects(), 'bigJump', 1000);
    const base = jumpHeight(jumpVelocity(createEffects(), 1000));
    const boosted = jumpHeight(jumpVelocity(effects, 1000));
    expect(boosted).toBeCloseTo(base * 2, 6);
  });

  it('speed power-up doubles run speed', () => {
    const effects = applyPickup(createEffects(), 'speed', 1000);
    expect(moveSpeed(effects, 1000)).toBe(RUN_SPEED * 2);
    expect(moveSpeed(createEffects(), 1000)).toBe(RUN_SPEED);
  });

  it('effects expire exactly after their duration', () => {
    const effects = applyPickup(applyPickup(createEffects(), 'bigJump', 1000), 'speed', 1000);
    const lastActive = 1000 + EFFECT_DURATION_MS - 1;
    const expired = 1000 + EFFECT_DURATION_MS;
    expect(jumpHeight(jumpVelocity(effects, lastActive))).toBeGreaterThan(112.5);
    expect(jumpHeight(jumpVelocity(effects, expired))).toBeCloseTo(112, 6);
    expect(moveSpeed(effects, expired)).toBe(RUN_SPEED);
  });

  it('re-pickup refreshes the timer', () => {
    const first = applyPickup(createEffects(), 'speed', 1000);
    const refreshed = applyPickup(first, 'speed', 5000);
    expect(moveSpeed(refreshed, 5000 + EFFECT_DURATION_MS - 1)).toBe(RUN_SPEED * 2);
  });

  it('two X pickups fill the special meter, clamped at max', () => {
    let effects = applyPickup(createEffects(), 'x', 1000);
    expect(effects.specialMeter).toBe(X_CHARGE);
    expect(canTransform(effects, 1000)).toBe(false);
    effects = applyPickup(effects, 'x', 2000);
    expect(effects.specialMeter).toBe(METER_MAX);
    expect(canTransform(effects, 2000)).toBe(true);
    effects = applyPickup(effects, 'x', 3000);
    expect(effects.specialMeter).toBe(METER_MAX);
  });

  it('transforming drains the meter and lasts its duration', () => {
    const charged = applyPickup(applyPickup(createEffects(), 'x', 0), 'x', 0);
    const transformed = startTransform(charged, 1000);
    expect(transformed.specialMeter).toBe(0);
    expect(isTransformed(transformed, 1000)).toBe(true);
    expect(isTransformed(transformed, 1000 + TRANSFORM_DURATION_MS - 1)).toBe(true);
    expect(isTransformed(transformed, 1000 + TRANSFORM_DURATION_MS)).toBe(false);
  });

  it('cannot transform with a partial meter or while already transformed', () => {
    const half = applyPickup(createEffects(), 'x', 0);
    expect(startTransform(half, 1000)).toBe(half);
    const charged = applyPickup(half, 'x', 0);
    const transformed = startTransform(charged, 1000);
    const rechargedWhileTransformed = applyPickup(
      applyPickup(transformed, 'x', 1100),
      'x',
      1200,
    );
    expect(canTransform(rechargedWhileTransformed, 1300)).toBe(false);
    expect(canTransform(rechargedWhileTransformed, 1000 + TRANSFORM_DURATION_MS)).toBe(true);
  });
});
