import { describe, expect, it } from 'vitest';
import { BOSSES, isStomp, nextScreenAfter, stompDamage, type BossId } from './bosses';
import { SCREEN_ORDER } from './flow';
import { SPRITE_KEYS } from './sprites';

const BOSS_IDS: BossId[] = ['bossA', 'bossB', 'huggie', 'mayhem'];

describe('boss definitions', () => {
  it('defines all four notebook monsters with sane stats', () => {
    for (const id of BOSS_IDS) {
      const def = BOSSES[id];
      expect(def.id).toBe(id);
      expect(def.maxHp).toBeGreaterThan(0);
      expect(def.displayH).toBeGreaterThan(100);
      expect(def.attacks.length).toBeGreaterThan(0);
      expect(SPRITE_KEYS).toContain(def.textureKey);
    }
  });

  it('escalates difficulty through the fight order', () => {
    expect(BOSSES.bossA.maxHp).toBeLessThan(BOSSES.bossB.maxHp);
    expect(BOSSES.bossB.maxHp).toBeLessThan(BOSSES.huggie.maxHp);
    expect(BOSSES.huggie.maxHp).toBeLessThan(BOSSES.mayhem.maxHp);
  });

  it('gives Monster A the chest-X weak spot, inside his body', () => {
    const spot = BOSSES.bossA.weakSpot;
    expect(spot).toBeDefined();
    if (!spot) return;
    for (const value of [spot.x, spot.y, spot.w, spot.h]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(spot.x + spot.w).toBeLessThanOrEqual(1);
    expect(spot.y + spot.h).toBeLessThanOrEqual(1);
  });

  it('arms Monster B with the knife and the gun, as drawn', () => {
    const types = BOSSES.bossB.attacks.map((a) => a.type);
    expect(types).toContain('knife');
    expect(types).toContain('bullet');
  });

  it('routes every boss victory to the next notebook screen', () => {
    expect(nextScreenAfter('bossA')).toBe('bossB');
    expect(nextScreenAfter('bossB')).toBe('huggie');
    expect(nextScreenAfter('huggie')).toBe('rip');
    expect(nextScreenAfter('mayhem')).toBe('victory');
    for (const id of BOSS_IDS) {
      expect(SCREEN_ORDER).toContain(nextScreenAfter(id));
    }
  });

  it('telegraphs every attack long enough for a kid to react', () => {
    for (const id of BOSS_IDS) {
      for (const attack of BOSSES[id].attacks) {
        expect(attack.telegraphMs).toBeGreaterThanOrEqual(600);
        expect(attack.cooldownMs).toBeGreaterThanOrEqual(2000);
      }
    }
  });
});

describe('stomp rules', () => {
  it('detects a stomp only while falling onto the head zone', () => {
    expect(isStomp(200, 100, 100, 60)).toBe(true); // falling, feet at head top
    expect(isStomp(200, 150, 100, 60)).toBe(true); // inside head zone
    expect(isStomp(200, 175, 100, 60)).toBe(false); // too deep — body hit
    expect(isStomp(-100, 100, 100, 60)).toBe(false); // rising, not a stomp
    expect(isStomp(200, 80, 100, 60)).toBe(false); // above pad range
    expect(isStomp(200, 90, 100, 60)).toBe(true); // within the generous pad
  });

  it('doubles stomp damage during a stagger window', () => {
    expect(stompDamage(false)).toBe(1);
    expect(stompDamage(true)).toBe(2);
  });
});
