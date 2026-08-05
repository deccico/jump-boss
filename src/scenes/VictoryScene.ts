import Phaser from 'phaser';
import { createSfx } from '../audio/sfx';
import { DEFAULT_CHARACTER, isValidCharacter, type CharacterConfig } from '../game/character';
import { ensurePlayerTexture } from './ui/drawPlayer';
import { goToNext } from './ui/nav';
import { PAPER_KEY } from './ui/paper';

const CONFETTI_COLORS = [0xe8801a, 0x7a4fb5, 0xd23c3c, 0x3aa0d8, 0x2b2b2b];

/** Page 8: the striped trophy. VICTORY. YOU WIN! */
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);
    const sfx = createSfx();

    const lettering = this.add.image(width / 2, 84, 'victory-lettering');
    lettering.setScale(Math.min(1, (width * 0.4) / lettering.width));

    const trophy = this.add.image(width / 2, height * 0.54, 'trophy');
    trophy.setScale(0.05);
    this.tweens.add({
      targets: trophy,
      scale: Math.min(1, (height * 0.5) / trophy.height),
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => sfx.fanfare(),
    });

    const caption = this.add.image(width / 2, height * 0.9, 'victory-caption');
    caption.setAlpha(0);
    this.tweens.add({ targets: caption, alpha: 1, delay: 900, duration: 500 });

    // the winner takes a bow beside the trophy
    const stored: unknown = this.registry.get('character');
    const config: CharacterConfig = isValidCharacter(stored) ? stored : DEFAULT_CHARACTER;
    const winner = this.add.image(width * 0.2, height * 0.62, ensurePlayerTexture(this, config));
    this.tweens.add({
      targets: winner,
      y: winner.y - 40,
      duration: 420,
      yoyo: true,
      repeat: -1,
      repeatDelay: 350,
      ease: 'Quad.easeOut',
    });

    // confetti rain
    if (!this.textures.exists('confetti')) {
      const graphics = this.make.graphics({}, false);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 9, 13);
      graphics.generateTexture('confetti', 9, 13);
      graphics.destroy();
    }
    this.add.particles(0, 0, 'confetti', {
      x: { min: 0, max: width },
      y: -20,
      lifespan: 5000,
      speedY: { min: 90, max: 200 },
      speedX: { min: -40, max: 40 },
      rotate: { start: 0, end: 360 },
      tint: CONFETTI_COLORS,
      quantity: 2,
      frequency: 90,
    });

    const advance = (): void => goToNext(this, 'victory');
    this.input.keyboard?.once('keydown-SPACE', advance);
    this.input.once('pointerdown', advance);
  }
}
