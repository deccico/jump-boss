import { describe, expect, it } from 'vitest';
import { ARENA_GROUND, ARENA_PLAYER_SPAWN, ARENA_SIDE_PLATFORMS } from './arena';
import { GAME_W } from './level';
import { JUMP_VELOCITY, jumpHeight, MAX_AIR_JUMPS } from './physics';

describe('boss arena layout', () => {
  it('keeps the side platforms on screen above the ground', () => {
    for (const platform of ARENA_SIDE_PLATFORMS) {
      expect(platform.x).toBeGreaterThanOrEqual(0);
      expect(platform.x + platform.w).toBeLessThanOrEqual(GAME_W);
      expect(platform.y).toBeLessThan(ARENA_GROUND.y);
    }
  });

  it('makes the side platforms reachable from the ground', () => {
    const singleJump = jumpHeight(JUMP_VELOCITY);
    const withAirJumps = singleJump * (1 + MAX_AIR_JUMPS);
    for (const platform of ARENA_SIDE_PLATFORMS) {
      const rise = ARENA_GROUND.y - platform.y;
      // a base jump alone must get close, and the double jump makes it easy
      expect(rise).toBeLessThanOrEqual(singleJump);
      expect(rise).toBeLessThanOrEqual(withAirJumps * 0.6);
    }
  });

  it('spawns the player on the ground, clear of the side platforms', () => {
    expect(ARENA_PLAYER_SPAWN.y).toBeLessThan(ARENA_GROUND.y);
    for (const platform of ARENA_SIDE_PLATFORMS) {
      const clearOf =
        ARENA_PLAYER_SPAWN.x < platform.x - 40 || ARENA_PLAYER_SPAWN.x > platform.x + platform.w + 40;
      expect(clearOf).toBe(true);
    }
  });
});
