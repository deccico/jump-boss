import Phaser from 'phaser';
import { createPaperTexture, PAPER_KEY } from './ui/paper';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    createPaperTexture(this, this.scale.width, this.scale.height);
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'jump-boss', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);
  }
}
