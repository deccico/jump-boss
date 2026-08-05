import Phaser from 'phaser';
import type { CharacterConfig } from '../../game/character';
import { buildPlayerDrawCommands, PLAYER_H, PLAYER_W } from '../../game/playerSprite';
import type { Point } from '../../game/wobble';

const INK = '#2b2b2b';
const PLAYER_SEED = 7;

function tracePath(ctx: CanvasRenderingContext2D, points: Point[]): void {
  const first = points[0];
  if (!first) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}

function sourceImage(scene: Phaser.Scene, key: string): CanvasImageSource {
  return scene.textures.get(key).getSourceImage() as CanvasImageSource;
}

/**
 * Builds (and caches) the player texture for a character config by replaying
 * the pure draw plan onto a canvas: swatch-scan pattern fill, wobbly ink
 * outline, Giulio's drawn eyes and the striped legs.
 */
export function ensurePlayerTexture(scene: Phaser.Scene, config: CharacterConfig): string {
  const key = `player-${config.eyes}-${config.body}`;
  if (scene.textures.exists(key)) {
    return key;
  }

  const canvas = document.createElement('canvas');
  canvas.width = PLAYER_W;
  canvas.height = PLAYER_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d canvas context unavailable');
  }

  for (const command of buildPlayerDrawCommands(config, PLAYER_SEED)) {
    switch (command.kind) {
      case 'body': {
        const image = sourceImage(scene, command.textureKey);
        const pattern = ctx.createPattern(image, 'repeat');
        tracePath(ctx, command.outline);
        if (pattern) {
          const imageHeight = (image as HTMLImageElement).height || 256;
          // scale the swatch scan so its scribble texture reads at body size
          const scale = 140 / imageHeight;
          pattern.setTransform(new DOMMatrix().scale(scale));
          ctx.fillStyle = pattern;
          ctx.fill();
        }
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3.5;
        ctx.lineJoin = 'round';
        ctx.stroke();
        break;
      }
      case 'eye': {
        const image = sourceImage(scene, 'eye') as HTMLImageElement;
        const aspect = image.width && image.height ? image.width / image.height : 1;
        const h = command.h;
        const w = h * aspect;
        ctx.drawImage(image, command.x - w / 2, command.y - h / 2, w, h);
        break;
      }
      case 'legs': {
        const image = sourceImage(scene, 'legs') as HTMLImageElement;
        const aspect = image.width && image.height ? image.width / image.height : 1.5;
        // fit inside the legs box, centered
        let w = command.w;
        let h = w / aspect;
        if (h > command.h) {
          h = command.h;
          w = h * aspect;
        }
        ctx.drawImage(image, command.x + (command.w - w) / 2, command.y, w, h);
        break;
      }
    }
  }

  scene.textures.addCanvas(key, canvas);
  return key;
}
