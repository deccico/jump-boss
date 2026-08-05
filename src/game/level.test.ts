import { describe, expect, it } from 'vitest';
import {
  EXIT,
  GAME_H,
  GAME_W,
  LEVEL_PICKUPS,
  LEVEL_PLATFORMS,
  PLATFORM_H,
  SPAWN,
} from './level';
import { JUMP_VELOCITY, jumpHeight } from './physics';

describe('platform level layout', () => {
  it('keeps every platform on screen', () => {
    for (const p of LEVEL_PLATFORMS) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(GAME_W);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y + PLATFORM_H).toBeLessThanOrEqual(GAME_H);
    }
  });

  it('makes each platform reachable from the one below with a normal jump', () => {
    const maxRise = jumpHeight(JUMP_VELOCITY) * 0.85; // leave headroom for the kid
    for (let i = 1; i < LEVEL_PLATFORMS.length; i++) {
      const from = LEVEL_PLATFORMS[i - 1];
      const to = LEVEL_PLATFORMS[i];
      if (!from || !to) continue;
      expect(from.y - to.y).toBeGreaterThan(0); // ascending
      expect(from.y - to.y).toBeLessThanOrEqual(maxRise);
      // horizontal gap between platform edges stays small
      const gap = Math.max(0, to.x - (from.x + from.w), from.x - (to.x + to.w));
      expect(gap).toBeLessThanOrEqual(200);
    }
  });

  it('floats every pickup above a platform', () => {
    for (const pickup of LEVEL_PICKUPS) {
      const support = LEVEL_PLATFORMS.filter(
        (p) => pickup.x >= p.x && pickup.x <= p.x + p.w && pickup.y < p.y,
      ).sort((a, b) => a.y - b.y)[0];
      expect(support, `pickup ${pickup.type} at ${pickup.x},${pickup.y}`).toBeDefined();
      // hovering close enough to grab with a small jump
      expect((support?.y ?? 0) - pickup.y).toBeLessThanOrEqual(60);
    }
  });

  it('offers all four power-up types with two X charges for a full meter', () => {
    const types = LEVEL_PICKUPS.map((p) => p.type);
    expect(types).toContain('bigJump');
    expect(types).toContain('speed');
    expect(types.filter((t) => t === 'x' || t === 'special')).toHaveLength(2);
  });

  it('places spawn on the ground and the exit on the top platform', () => {
    const ground = LEVEL_PLATFORMS[0];
    const top = [...LEVEL_PLATFORMS].sort((a, b) => a.y - b.y)[0];
    expect(SPAWN.y).toBeLessThan(ground?.y ?? 0);
    expect(top).toBeDefined();
    if (!top) return;
    expect(EXIT.x).toBeGreaterThanOrEqual(top.x);
    expect(EXIT.x + EXIT.w).toBeLessThanOrEqual(top.x + top.w);
    expect(EXIT.y + EXIT.h).toBeLessThanOrEqual(top.y + 1);
  });
});
