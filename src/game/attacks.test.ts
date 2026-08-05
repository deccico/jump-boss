import { describe, expect, it } from 'vitest';
import {
  bulletVelocity,
  createAttackState,
  knifeVelocity,
  starArcVelocity,
  updateAttacks,
  type AttackSpec,
  type AttackState,
} from './attacks';

const KNIFE: AttackSpec = { type: 'knife', telegraphMs: 600, cooldownMs: 2000, speed: 340 };
const BULLET: AttackSpec = { type: 'bullet', telegraphMs: 600, cooldownMs: 2000, speed: 130 };

function runUntil(state: AttackState, from: number, to: number, stepMs = 16) {
  const fired: { type: string; at: number }[] = [];
  let current = state;
  for (let t = from; t <= to; t += stepMs) {
    const tick = updateAttacks(current, t);
    current = tick.state;
    for (const event of tick.events) {
      fired.push({ type: event.type, at: t });
    }
  }
  return { fired, state: current };
}

describe('attack scheduler', () => {
  it('alternates Monster B knife and bullet in round-robin order', () => {
    const state = createAttackState([KNIFE, BULLET], 0);
    const { fired } = runUntil(state, 0, 12_000);
    expect(fired.length).toBeGreaterThanOrEqual(4);
    expect(fired.map((f) => f.type).slice(0, 4)).toEqual(['knife', 'bullet', 'knife', 'bullet']);
  });

  it('never fires during the telegraph phase and telegraphs before each fire', () => {
    const state = createAttackState([KNIFE], 0);
    // idle until cooldown(2000), telegraph until 2600, fire at >= 2600
    let tick = updateAttacks(state, 1999);
    expect(tick.events).toHaveLength(0);
    expect(tick.telegraphing).toBeNull();
    tick = updateAttacks(tick.state, 2100);
    expect(tick.events).toHaveLength(0);
    expect(tick.telegraphing?.type).toBe('knife');
    tick = updateAttacks(tick.state, 2610);
    expect(tick.events.map((e) => e.type)).toEqual(['knife']);
  });

  it('respects cooldown + telegraph spacing across 30 simulated seconds', () => {
    const state = createAttackState([KNIFE], 0);
    const { fired } = runUntil(state, 0, 30_000);
    expect(fired.length).toBeGreaterThanOrEqual(10);
    for (let i = 1; i < fired.length; i++) {
      const gap = (fired[i]?.at ?? 0) - (fired[i - 1]?.at ?? 0);
      expect(gap).toBeGreaterThanOrEqual(KNIFE.cooldownMs + KNIFE.telegraphMs - 32);
    }
  });

  it('throws knives straight at the target at the given speed', () => {
    const v = knifeVelocity({ x: 0, y: 0 }, { x: 300, y: -400 }, 340);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(340, 6);
    expect(v.x / v.y).toBeCloseTo(300 / -400, 6);
  });

  it('fires bullets slowly and horizontally toward the player', () => {
    const left = bulletVelocity({ x: 700, y: 400 }, { x: 100, y: 380 }, 130);
    expect(left).toEqual({ x: -130, y: 0 });
    const right = bulletVelocity({ x: 100, y: 400 }, { x: 700, y: 380 }, 130);
    expect(right).toEqual({ x: 130, y: 0 });
  });

  it('lobs stars on an arc that starts upward and lands on the target', () => {
    const gravity = 1400;
    const from = { x: 600, y: 300 };
    const target = { x: 200, y: 440 };
    const flightMs = 900;
    const v = starArcVelocity(from, target, gravity, flightMs);
    expect(v.y).toBeLessThan(0); // launches upward
    const t = flightMs / 1000;
    const landX = from.x + v.x * t;
    const landY = from.y + v.y * t + (gravity * t * t) / 2;
    expect(landX).toBeCloseTo(target.x, 6);
    expect(landY).toBeCloseTo(target.y, 6);
  });
});
