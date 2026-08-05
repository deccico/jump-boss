/**
 * Boss attack scheduling: each boss round-robins through its attack specs
 * with a telegraph phase (the tell — kid-friendly warning) before every fire
 * and a cooldown after. Pure and time-explicit so it's fully testable.
 */
export type AttackType = 'lunge' | 'knife' | 'bullet' | 'sweep' | 'star' | 'charge' | 'slam';

export interface AttackSpec {
  type: AttackType;
  telegraphMs: number;
  cooldownMs: number;
  /** Projectile or movement speed in px/s, where relevant. */
  speed?: number;
}

export interface AttackState {
  specs: readonly AttackSpec[];
  index: number;
  phase: 'idle' | 'telegraph';
  phaseUntilMs: number;
}

export interface AttackEvent {
  type: AttackType;
  spec: AttackSpec;
}

export interface AttackTick {
  state: AttackState;
  /** Attacks fired on this tick (telegraph completed). */
  events: AttackEvent[];
  /** The spec currently telegraphing, for warning visuals. */
  telegraphing: AttackSpec | null;
}

export function createAttackState(specs: readonly AttackSpec[], nowMs: number): AttackState {
  const first = specs[0];
  return {
    specs,
    index: 0,
    phase: 'idle',
    phaseUntilMs: nowMs + (first ? first.cooldownMs : 0),
  };
}

export function updateAttacks(state: AttackState, nowMs: number): AttackTick {
  const events: AttackEvent[] = [];
  let { index, phase, phaseUntilMs } = state;
  const specs = state.specs;

  // resolve at most a handful of phase flips per tick (frames are short)
  for (let guard = 0; guard < 8 && nowMs >= phaseUntilMs && specs.length > 0; guard++) {
    const spec = specs[index % specs.length];
    if (!spec) {
      break;
    }
    if (phase === 'idle') {
      phase = 'telegraph';
      phaseUntilMs += spec.telegraphMs;
    } else {
      events.push({ type: spec.type, spec });
      index = (index + 1) % specs.length;
      const next = specs[index];
      phase = 'idle';
      phaseUntilMs += next ? next.cooldownMs : spec.cooldownMs;
    }
  }

  const current = specs[index % Math.max(1, specs.length)] ?? null;
  return {
    state: { specs, index, phase, phaseUntilMs },
    events,
    telegraphing: phase === 'telegraph' ? current : null,
  };
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Straight throw at the target. */
export function knifeVelocity(from: Vec2, target: Vec2, speed = 340): Vec2 {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: (dx / length) * speed, y: (dy / length) * speed };
}

/** Slow horizontal shot toward the target's side of the arena. */
export function bulletVelocity(from: Vec2, target: Vec2, speed = 130): Vec2 {
  return { x: target.x >= from.x ? speed : -speed, y: 0 };
}

/** Ballistic lob that lands on the target after `flightMs` under gravity. */
export function starArcVelocity(from: Vec2, target: Vec2, gravity: number, flightMs = 900): Vec2 {
  const t = flightMs / 1000;
  return {
    x: (target.x - from.x) / t,
    y: (target.y - from.y) / t - (gravity * t) / 2,
  };
}
