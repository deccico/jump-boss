/**
 * Hearts + invulnerability frames, shared by the player (5 hearts, long
 * i-frames) and bosses (more HP, short i-frames so stomps can't machine-gun).
 */
export interface HealthState {
  hp: number;
  max: number;
  iframesUntilMs: number;
}

export const PLAYER_MAX_HEARTS = 5;
export const PLAYER_IFRAMES_MS = 1500;
export const BOSS_IFRAMES_MS = 800;

export function createHealth(max: number): HealthState {
  return { hp: max, max, iframesUntilMs: 0 };
}

export function isInvulnerable(health: HealthState, nowMs: number): boolean {
  return nowMs < health.iframesUntilMs;
}

export function applyDamage(
  health: HealthState,
  amount: number,
  nowMs: number,
  iframesMs: number = PLAYER_IFRAMES_MS,
): HealthState {
  if (isInvulnerable(health, nowMs) || amount <= 0) {
    return health;
  }
  return {
    ...health,
    hp: Math.max(0, health.hp - amount),
    iframesUntilMs: nowMs + iframesMs,
  };
}

export function isDead(health: HealthState): boolean {
  return health.hp <= 0;
}
