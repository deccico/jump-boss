import { describe, expect, it } from 'vitest';
import { EYE_COUNTS } from './character';
import { BODY, buildPlayerDrawCommands, eyePositions, PLAYER_H, PLAYER_W } from './playerSprite';

describe('eyePositions', () => {
  it('returns as many positions as eyes, all at the same height', () => {
    for (const count of EYE_COUNTS) {
      const positions = eyePositions(count);
      expect(positions).toHaveLength(count);
      const ys = new Set(positions.map((p) => p.y));
      expect(ys.size).toBe(1);
    }
  });

  it('is symmetric about the body center', () => {
    const cx = BODY.x + BODY.w / 2;
    for (const count of EYE_COUNTS) {
      const offsets = eyePositions(count).map((p) => p.x - cx);
      const sum = offsets.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(0, 6);
    }
  });

  it('centers a single eye and keeps all eyes inside the body', () => {
    expect(eyePositions(1)[0]?.x).toBeCloseTo(BODY.x + BODY.w / 2, 6);
    for (const count of EYE_COUNTS) {
      for (const p of eyePositions(count)) {
        expect(p.x).toBeGreaterThan(BODY.x);
        expect(p.x).toBeLessThan(BODY.x + BODY.w);
        expect(p.y).toBeGreaterThan(BODY.y);
        expect(p.y).toBeLessThan(BODY.y + BODY.h);
      }
    }
  });
});

describe('buildPlayerDrawCommands', () => {
  it('fills the body with the chosen swatch texture', () => {
    const commands = buildPlayerDrawCommands({ eyes: 2, body: 'stripes' }, 7);
    const body = commands.find((c) => c.kind === 'body');
    expect(body).toBeDefined();
    expect(body?.kind === 'body' && body.textureKey).toBe('swatch-stripes');
  });

  it('stamps the right number of eyes and always the legs', () => {
    for (const count of EYE_COUNTS) {
      const commands = buildPlayerDrawCommands({ eyes: count, body: 'red' }, 7);
      expect(commands.filter((c) => c.kind === 'eye')).toHaveLength(count);
      expect(commands.filter((c) => c.kind === 'legs')).toHaveLength(1);
    }
  });

  it('is deterministic per seed', () => {
    const a = buildPlayerDrawCommands({ eyes: 3, body: 'spots' }, 42);
    const b = buildPlayerDrawCommands({ eyes: 3, body: 'spots' }, 42);
    expect(a).toEqual(b);
    const c = buildPlayerDrawCommands({ eyes: 3, body: 'spots' }, 43);
    expect(a).not.toEqual(c);
  });

  it('keeps the body inside the texture bounds', () => {
    expect(BODY.x + BODY.w).toBeLessThanOrEqual(PLAYER_W);
    expect(BODY.y + BODY.h).toBeLessThanOrEqual(PLAYER_H);
  });
});
