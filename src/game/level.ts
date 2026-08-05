import type { PowerUpType } from './powerups';

/**
 * The tutorial platform level (page 2 of the notebook): an ascending path of
 * platforms with one of each power-up along the way, ending at a door to the
 * first boss. Coordinates are in game pixels (960x540 canvas).
 */
export const GAME_W = 960;
export const GAME_H = 540;

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
}

export const PLATFORM_H = 18;

export const LEVEL_PLATFORMS: readonly PlatformDef[] = [
  { x: 0, y: 505, w: 960 }, // ground
  { x: 80, y: 430, w: 140 },
  { x: 290, y: 360, w: 140 },
  { x: 500, y: 290, w: 140 },
  { x: 700, y: 215, w: 150 },
];

export interface PickupDef {
  type: PowerUpType;
  x: number;
  y: number;
}

export const LEVEL_PICKUPS: readonly PickupDef[] = [
  { type: 'bigJump', x: 150, y: 398 },
  { type: 'speed', x: 360, y: 328 },
  { type: 'x', x: 570, y: 258 },
  { type: 'x', x: 470, y: 470 },
];

export const SPAWN = { x: 70, y: 430 };

/** Door to the first boss, standing on the top platform. */
export const EXIT = { x: 780, y: 127, w: 64, h: 88 };
