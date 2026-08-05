import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  BOSS_IFRAMES_MS,
  createHealth,
  isDead,
  isInvulnerable,
  PLAYER_IFRAMES_MS,
  PLAYER_MAX_HEARTS,
} from './health';

describe('health and i-frames', () => {
  it('starts at full health with no i-frames', () => {
    const health = createHealth(PLAYER_MAX_HEARTS);
    expect(health.hp).toBe(5);
    expect(isInvulnerable(health, 0)).toBe(false);
    expect(isDead(health)).toBe(false);
  });

  it('takes damage and grants i-frames', () => {
    const hit = applyDamage(createHealth(5), 1, 1000);
    expect(hit.hp).toBe(4);
    expect(isInvulnerable(hit, 1000 + PLAYER_IFRAMES_MS - 1)).toBe(true);
    expect(isInvulnerable(hit, 1000 + PLAYER_IFRAMES_MS)).toBe(false);
  });

  it('ignores hits during i-frames', () => {
    const hit = applyDamage(createHealth(5), 1, 1000);
    const during = applyDamage(hit, 1, 1000 + PLAYER_IFRAMES_MS - 1);
    expect(during.hp).toBe(4);
    const after = applyDamage(hit, 1, 1000 + PLAYER_IFRAMES_MS);
    expect(after.hp).toBe(3);
  });

  it('supports the shorter boss i-frame window', () => {
    const boss = applyDamage(createHealth(6), 1, 1000, BOSS_IFRAMES_MS);
    expect(isInvulnerable(boss, 1000 + BOSS_IFRAMES_MS - 1)).toBe(true);
    expect(isInvulnerable(boss, 1000 + BOSS_IFRAMES_MS)).toBe(false);
  });

  it('clamps at zero and reports death', () => {
    const dead = applyDamage(createHealth(1), 5, 1000);
    expect(dead.hp).toBe(0);
    expect(isDead(dead)).toBe(true);
  });

  it('ignores non-positive damage', () => {
    expect(applyDamage(createHealth(5), 0, 1000).hp).toBe(5);
    expect(applyDamage(createHealth(5), -2, 1000).hp).toBe(5);
  });
});
