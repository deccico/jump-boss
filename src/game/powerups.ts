import { JUMP_VELOCITY, RUN_SPEED } from './physics';

/**
 * The power-ups from page 2 of the notebook:
 *  - "BIG JUMPS (two times)": jumps exactly twice as high (velocity x sqrt(2))
 *  - "2x SPEED"
 *  - "X turns into MUSCLE MAYHEM" / "SPECIAL (turns into a monster)":
 *    X pickups charge a meter; when full, the player can transform into the
 *    Monster Mayhem drawing — big, invincible, damaging on contact.
 */
export type PowerUpType = 'bigJump' | 'speed' | 'x' | 'special';

export const BIG_JUMP_MULTIPLIER = Math.SQRT2;
export const SPEED_MULTIPLIER = 2;
export const EFFECT_DURATION_MS = 10_000;
export const X_CHARGE = 50;
export const METER_MAX = 100;
export const TRANSFORM_DURATION_MS = 8_000;
export const TRANSFORM_CONTACT_DAMAGE = 2;
export const TRANSFORM_HIT_COOLDOWN_MS = 600;

export interface EffectsState {
  bigJumpUntilMs: number;
  speedUntilMs: number;
  specialMeter: number;
  transformedUntilMs: number;
}

export function createEffects(): EffectsState {
  return { bigJumpUntilMs: 0, speedUntilMs: 0, specialMeter: 0, transformedUntilMs: 0 };
}

export function applyPickup(effects: EffectsState, type: PowerUpType, nowMs: number): EffectsState {
  switch (type) {
    case 'bigJump':
      return { ...effects, bigJumpUntilMs: nowMs + EFFECT_DURATION_MS };
    case 'speed':
      return { ...effects, speedUntilMs: nowMs + EFFECT_DURATION_MS };
    case 'x':
    case 'special':
      return {
        ...effects,
        specialMeter: Math.min(METER_MAX, effects.specialMeter + X_CHARGE),
      };
  }
}

export function hasBigJump(effects: EffectsState, nowMs: number): boolean {
  return nowMs < effects.bigJumpUntilMs;
}

export function hasSpeed(effects: EffectsState, nowMs: number): boolean {
  return nowMs < effects.speedUntilMs;
}

export function jumpVelocity(effects: EffectsState, nowMs: number): number {
  return hasBigJump(effects, nowMs) ? JUMP_VELOCITY * BIG_JUMP_MULTIPLIER : JUMP_VELOCITY;
}

export function moveSpeed(effects: EffectsState, nowMs: number): number {
  return hasSpeed(effects, nowMs) ? RUN_SPEED * SPEED_MULTIPLIER : RUN_SPEED;
}

export function canTransform(effects: EffectsState, nowMs: number): boolean {
  return effects.specialMeter >= METER_MAX && !isTransformed(effects, nowMs);
}

export function startTransform(effects: EffectsState, nowMs: number): EffectsState {
  if (!canTransform(effects, nowMs)) {
    return effects;
  }
  return {
    ...effects,
    specialMeter: 0,
    transformedUntilMs: nowMs + TRANSFORM_DURATION_MS,
  };
}

export function isTransformed(effects: EffectsState, nowMs: number): boolean {
  return nowMs < effects.transformedUntilMs;
}
