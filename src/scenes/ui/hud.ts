import Phaser from 'phaser';
import type { HealthState } from '../../game/health';
import { canTransform, isTransformed, METER_MAX, type EffectsState } from '../../game/powerups';
import { drawWobblyRect, ensureHeartTexture, MARKER_ORANGE } from './marker';
import { addMarkerText } from './text';

const METER = { x: 64, y: 58, w: 140, h: 20 };

export class Hud {
  private hearts: Phaser.GameObjects.Image[] = [];
  private meterFill: Phaser.GameObjects.Graphics;
  private prompt: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    ensureHeartTexture(scene);
    for (let i = 0; i < 5; i++) {
      this.hearts.push(scene.add.image(34 + i * 36, 34, 'heart').setDisplaySize(30, 28));
    }

    scene.add.image(38, METER.y + METER.h / 2, 'icon-special').setDisplaySize(34, 34);
    const frame = scene.add.graphics();
    drawWobblyRect(frame, METER.x, METER.y, METER.w, METER.h, 91, { thickness: 2.5 });
    this.meterFill = scene.add.graphics();
    this.prompt = addMarkerText(
      scene,
      METER.x + METER.w + 78,
      METER.y + METER.h / 2,
      '← full! press E',
      22,
      '#c2601a',
    );
    this.prompt.setVisible(false);
  }

  update(health: HealthState, effects: EffectsState, nowMs: number): void {
    this.hearts.forEach((heart, i) => {
      heart.setAlpha(i < health.hp ? 1 : 0.18);
    });

    this.meterFill.clear();
    const fraction = isTransformed(effects, nowMs) ? 0 : effects.specialMeter / METER_MAX;
    if (fraction > 0) {
      this.meterFill.fillStyle(MARKER_ORANGE, 0.85);
      this.meterFill.fillRect(METER.x + 3, METER.y + 3, (METER.w - 6) * fraction, METER.h - 6);
    }
    this.prompt.setVisible(canTransform(effects, nowMs));
  }
}
