import Phaser from 'phaser';
import { music } from '../audio/music';
import { createSfx } from '../audio/sfx';
import { goToNext } from './ui/nav';
import { PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';

/** Page 7 of the notebook: the tombstone. Huggie Wagye dies. */
export class RipScene extends Phaser.Scene {
  constructor() {
    super('Rip');
  }

  create(): void {
    const { width, height } = this.scale;
    music.stop(); // a quiet moment for Huggie Wagye
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);
    const sfx = createSfx();

    const tombstone = this.add.image(width / 2, -260, 'tombstone');
    tombstone.setScale(Math.min(1, (height * 0.62) / tombstone.height));

    this.tweens.add({
      targets: tombstone,
      y: height * 0.52,
      duration: 900,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.cameras.main.shake(200, 0.008);
        sfx.stomp();
      },
    });

    const caption = addMarkerText(this, width / 2, height * 0.92, 'Huggie Wagye dies…', 34);
    caption.setAlpha(0);
    this.tweens.add({ targets: caption, alpha: 1, delay: 1100, duration: 500 });

    const advance = (): void => goToNext(this, 'rip');
    this.time.delayedCall(4200, advance);
    this.input.keyboard?.once('keydown-SPACE', advance);
    this.input.once('pointerdown', advance);
  }
}
