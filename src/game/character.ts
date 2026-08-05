import type { SpriteKey } from './sprites';

/**
 * The character-select choices from page 1 of the notebook:
 * "pick eyes amount and color of body".
 */
export type EyeCount = 1 | 2 | 3;

export type BodyStyle = 'purple' | 'orange' | 'red' | 'stripes' | 'spots';

export interface CharacterConfig {
  eyes: EyeCount;
  body: BodyStyle;
}

export const EYE_COUNTS: readonly EyeCount[] = [1, 2, 3];

export const BODY_STYLES: readonly BodyStyle[] = ['purple', 'orange', 'red', 'stripes', 'spots'];

export const DEFAULT_CHARACTER: CharacterConfig = { eyes: 2, body: 'purple' };

export function swatchKey(body: BodyStyle): SpriteKey {
  return `swatch-${body}`;
}

export function isValidCharacter(value: unknown): value is CharacterConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    (EYE_COUNTS as readonly unknown[]).includes(candidate['eyes']) &&
    (BODY_STYLES as readonly unknown[]).includes(candidate['body'])
  );
}

function cycle<T>(values: readonly T[], current: T, dir: 1 | -1): T {
  const index = values.indexOf(current);
  const next = values[(index + dir + values.length) % values.length];
  if (next === undefined) {
    throw new Error(`Cannot cycle from unknown value: ${String(current)}`);
  }
  return next;
}

export function cycleEyes(eyes: EyeCount, dir: 1 | -1): EyeCount {
  return cycle(EYE_COUNTS, eyes, dir);
}

export function cycleBody(body: BodyStyle, dir: 1 | -1): BodyStyle {
  return cycle(BODY_STYLES, body, dir);
}
