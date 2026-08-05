import Phaser from 'phaser';
import { wobblyRectPoints } from '../../game/wobble';

export const INK = 0x2b2b2b;
export const MARKER_ORANGE = 0xe8801a;

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

/** Marker-stroke platform texture: ink outline, faint pencil-gray fill. */
export function ensurePlatformTexture(
  scene: Phaser.Scene,
  w: number,
  h: number,
  seed: number,
): string {
  const key = `platform-${w}x${h}-${seed}`;
  if (scene.textures.exists(key)) {
    return key;
  }
  const graphics = scene.make.graphics({}, false);
  drawWobblyRect(graphics, 3, 3, w - 6, h - 6, seed, {
    thickness: 3,
    fill: 0xd9d2bd,
    fillAlpha: 0.8,
  });
  graphics.generateTexture(key, w, h);
  graphics.destroy();
  return key;
}

/** Hand-drawn red heart for the HUD. */
export function ensureHeartTexture(scene: Phaser.Scene): string {
  const key = 'heart';
  if (scene.textures.exists(key)) {
    return key;
  }
  const canvas = scene.textures.createCanvas(key, 30, 28);
  if (!canvas) {
    return key;
  }
  const ctx = canvas.context;
  ctx.beginPath();
  ctx.moveTo(15, 26);
  ctx.bezierCurveTo(2, 16, 1, 6, 8, 3);
  ctx.bezierCurveTo(12, 1.5, 15, 5, 15, 8);
  ctx.bezierCurveTo(15, 5, 18, 1.5, 22, 3);
  ctx.bezierCurveTo(29, 6, 28, 16, 15, 26);
  ctx.closePath();
  ctx.fillStyle = '#e0393e';
  ctx.fill();
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 2;
  ctx.stroke();
  canvas.refresh();
  return key;
}
