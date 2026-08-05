import Phaser from 'phaser';
import type { BossId } from '../game/flow';
import { PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';

export class BossScene extends Phaser.Scene {
  private bossId: BossId = 'bossA';

  constructor() {
    super('Boss');
  }

  init(data: { bossId?: BossId }): void {
    this.bossId = data.bossId ?? 'bossA';
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);
    this.add.image(width / 2, height / 2, `boss-${this.bossId === 'bossA' ? 'a' : this.bossId === 'bossB' ? 'b' : this.bossId}`).setDisplaySize(220, 260);
    addMarkerText(this, width / 2, height * 0.85, `boss fight coming soon: ${this.bossId}`, 28, '#6b6b6b');
  }
}
