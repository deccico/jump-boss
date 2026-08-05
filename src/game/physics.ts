/**
 * Platforming feel. All numbers live here; scenes only consume them.
 * Forgiving by design for a 6-year-old player: coyote time lets you jump
 * shortly after walking off a ledge, the jump buffer makes a slightly-early
 * jump press still count when you land.
 */
export const GRAVITY = 1400;
export const RUN_SPEED = 260;
export const JUMP_VELOCITY = -560;
export const STOMP_BOUNCE = -420;
export const COYOTE_MS = 120;
export const JUMP_BUFFER_MS = 120;

/** Peak height of a jump launched at `velocity` px/s: v^2 / 2g. */
export function jumpHeight(velocity: number, gravity: number = GRAVITY): number {
  return (velocity * velocity) / (2 * gravity);
}

/**
 * A jump fires when the player was on the ground within the coyote window
 * and pressed jump within the buffer window.
 */
export function canJump(
  groundedAtMs: number | null,
  jumpPressedAtMs: number | null,
  nowMs: number,
): boolean {
  if (groundedAtMs === null || jumpPressedAtMs === null) {
    return false;
  }
  return nowMs - groundedAtMs <= COYOTE_MS && nowMs - jumpPressedAtMs <= JUMP_BUFFER_MS;
}
