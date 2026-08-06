/**
 * The boss arena layout, shared by all four fights: full-width ground and a
 * low platform on each side (they hold the X pickups in the final fight, so
 * they must be comfortably reachable).
 */
export const ARENA_GROUND = { x: 0, y: 505, w: 960 };

export const ARENA_SIDE_PLATFORMS = [
  { x: 70, y: 395, w: 150 },
  { x: 740, y: 395, w: 150 },
] as const;

/** Clear of both side platforms so nothing overlaps the spawn. */
export const ARENA_PLAYER_SPAWN = { x: 300, y: 430 };
