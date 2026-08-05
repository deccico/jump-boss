import type { AttackSpec } from './attacks';
import { nextScreen, type BossId, type ScreenId } from './flow';
import type { SpriteKey } from './sprites';

export type { BossId } from './flow';

/** Fraction-of-display-size rectangle (origin top-left of the boss sprite). */
export interface FractionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BossDefinition {
  id: BossId;
  name: string;
  textureKey: SpriteKey;
  maxHp: number;
  /** On-screen height in px; width follows the drawing's aspect. */
  displayH: number;
  /** Back-and-forth walk speed; 0 keeps the boss mostly in place. */
  patrolSpeed: number;
  attacks: readonly AttackSpec[];
  /** Monster A's chest X — touching it during a stagger deals bonus damage. */
  weakSpot?: FractionRect;
  /** How long a stomp staggers this boss (0 = no stagger phase). */
  staggerMs: number;
}

export const BOSSES: Record<BossId, BossDefinition> = {
  bossA: {
    id: 'bossA',
    name: 'Monster A',
    textureKey: 'boss-a',
    maxHp: 6,
    displayH: 280,
    patrolSpeed: 80,
    attacks: [{ type: 'lunge', telegraphMs: 700, cooldownMs: 3200, speed: 310 }],
    weakSpot: { x: 0.33, y: 0.26, w: 0.3, h: 0.18 },
    staggerMs: 2000,
  },
  bossB: {
    id: 'bossB',
    name: 'Monster B',
    textureKey: 'boss-b',
    maxHp: 8,
    displayH: 300,
    patrolSpeed: 0,
    attacks: [
      { type: 'knife', telegraphMs: 650, cooldownMs: 2600, speed: 340 },
      { type: 'bullet', telegraphMs: 650, cooldownMs: 2600, speed: 130 },
    ],
    staggerMs: 1200,
  },
  huggie: {
    id: 'huggie',
    name: 'Huggie Wagye',
    textureKey: 'boss-huggie',
    maxHp: 10,
    displayH: 330,
    patrolSpeed: 55,
    attacks: [
      { type: 'sweep', telegraphMs: 850, cooldownMs: 3400, speed: 300 },
      { type: 'star', telegraphMs: 650, cooldownMs: 3000 },
    ],
    staggerMs: 2500,
  },
  mayhem: {
    id: 'mayhem',
    name: 'Monster Mayhem',
    textureKey: 'boss-mayhem',
    maxHp: 12,
    displayH: 340,
    patrolSpeed: 60,
    attacks: [
      { type: 'charge', telegraphMs: 750, cooldownMs: 2800, speed: 240 },
      { type: 'star', telegraphMs: 650, cooldownMs: 2600 },
      { type: 'bullet', telegraphMs: 650, cooldownMs: 2600, speed: 140 },
      { type: 'slam', telegraphMs: 850, cooldownMs: 3800 },
    ],
    staggerMs: 1500,
  },
};

/**
 * A stomp = the player is falling and their feet are around the boss's head
 * zone (the top slice of the body, padded generously for small players).
 */
export function isStomp(
  playerVy: number,
  playerBottom: number,
  bossTop: number,
  headZoneDepth: number,
  pad = 14,
): boolean {
  return playerVy > 0 && playerBottom >= bossTop - pad && playerBottom <= bossTop + headZoneDepth;
}

/** Touching Monster A's chest X while he's staggered lands this much. */
export const WEAK_SPOT_DAMAGE = 2;

/** Stomps land double damage while the boss is staggered/vulnerable. */
export function stompDamage(inStaggerWindow: boolean): number {
  return inStaggerWindow ? 2 : 1;
}

export function nextScreenAfter(bossId: BossId): ScreenId {
  return nextScreen(bossId);
}
