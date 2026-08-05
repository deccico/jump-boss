import Phaser from 'phaser';
import { wobblyRectPoints } from '../../game/wobble';

export const INK = 0x2b2b2b;

/** Strokes (and optionally fills) a hand-drawn-looking rectangle. */
export function drawWobblyRect(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  options: { stroke?: number; thickness?: number; fill?: number; fillAlpha?: number } = {},
): void {
  const { stroke = INK, thickness = 3, fill, fillAlpha = 1 } = options;
  const points = wobblyRectPoints(x, y, w, h, seed);
  if (fill !== undefined) {
    graphics.fillStyle(fill, fillAlpha);
    graphics.fillPoints(points, true);
  }
  graphics.lineStyle(thickness, stroke, 1);
  graphics.strokePoints(points, true);
}
