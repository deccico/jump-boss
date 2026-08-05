import type { CharacterConfig, EyeCount } from './character';
import { swatchKey } from './character';
import type { SpriteKey } from './sprites';
import { wobblyRectPoints, type Point } from './wobble';

/**
 * Pure "draw plan" for the player character assembled from the select-screen
 * choices: a wobbly body block filled with the chosen scanned swatch, 1-3 of
 * Giulio's drawn eyes, and the striped legs from page 1. The Phaser side
 * (scenes/ui/drawPlayer.ts) replays these commands onto a canvas texture.
 */
export const PLAYER_W = 120;
export const PLAYER_H = 150;

export const BODY = { x: 12, y: 8, w: 96, h: 96 } as const;
const LEGS = { x: 24, y: 100, w: 72, h: 46 } as const;
const EYE_H = 22;

export type DrawCmd =
  | { kind: 'body'; textureKey: SpriteKey; outline: Point[] }
  | { kind: 'eye'; x: number; y: number; h: number }
  | { kind: 'legs'; x: number; y: number; w: number; h: number };

export function eyePositions(count: EyeCount): Point[] {
  const cx = BODY.x + BODY.w / 2;
  const y = BODY.y + BODY.h * 0.32;
  switch (count) {
    case 1:
      return [{ x: cx, y }];
    case 2:
      return [
        { x: cx - BODY.w * 0.16, y },
        { x: cx + BODY.w * 0.16, y },
      ];
    case 3:
      return [
        { x: cx - BODY.w * 0.27, y },
        { x: cx, y },
        { x: cx + BODY.w * 0.27, y },
      ];
  }
}

export function buildPlayerDrawCommands(config: CharacterConfig, seed: number): DrawCmd[] {
  const commands: DrawCmd[] = [
    {
      kind: 'body',
      textureKey: swatchKey(config.body),
      outline: wobblyRectPoints(BODY.x, BODY.y, BODY.w, BODY.h, seed),
    },
  ];
  for (const eye of eyePositions(config.eyes)) {
    commands.push({ kind: 'eye', x: eye.x, y: eye.y, h: EYE_H });
  }
  commands.push({ kind: 'legs', ...LEGS });
  return commands;
}
