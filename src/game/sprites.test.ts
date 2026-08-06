import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SPRITE_KEYS, spritePath } from './sprites';

describe('sprite manifest', () => {
  it('lists a reasonable number of sprites', () => {
    expect(SPRITE_KEYS.length).toBe(21);
    expect(new Set(SPRITE_KEYS).size).toBe(SPRITE_KEYS.length);
  });

  it("keeps Adrian's pencil annotations out of the art set", () => {
    for (const key of SPRITE_KEYS) {
      expect(key).not.toMatch(/^(label-|note-|victory-caption)/);
    }
  });

  it('has an extracted PNG on disk for every sprite key', () => {
    const missing = SPRITE_KEYS.filter(
      (key) => !existsSync(fileURLToPath(new URL(`../../public/${spritePath(key)}`, import.meta.url))),
    );
    expect(missing).toEqual([]);
  });

  it('builds public asset paths', () => {
    expect(spritePath('boss-a')).toBe('assets/sprites/boss-a.png');
  });
});
