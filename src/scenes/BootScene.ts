import Phaser from 'phaser';
import { SPRITE_KEYS, spritePath } from '../game/sprites';
import { createPaperTexture, PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    createPaperTexture(this, this.scale.width, this.scale.height);
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);
    const loading = addMarkerText(this, this.scale.width / 2, this.scale.height / 2, 'loading…', 36);
    this.load.on('progress', (value: number) => {
      loading.setText(`loading… ${Math.round(value * 100)}%`);
    });

    for (const key of SPRITE_KEYS) {
      this.load.image(key, spritePath(key));
    }
  }

  create(): void {
    this.scene.start('Title');
  }
}
