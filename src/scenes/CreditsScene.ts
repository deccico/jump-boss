import Phaser from 'phaser';
import { music } from '../audio/music';
import { goToNext } from './ui/nav';
import { PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';
import { addMuteButton } from './ui/muteButton';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create(): void {
    const { width, height } = this.scale;
    music.play('victory');
    addMuteButton(this);
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);

    addMarkerText(this, width / 2, height * 0.14, 'credits', 52);

    addMarkerText(this, width / 2, height * 0.34, 'Game design and graphics', 28, '#6b6b6b');
    addMarkerText(this, width / 2, height * 0.42, 'Giulio Deccico', 44);

    addMarkerText(this, width / 2, height * 0.58, 'Game programming', 28, '#6b6b6b');
    addMarkerText(this, width / 2, height * 0.66, 'Adrian Deccico', 44);

    // the legs take the final bow
    const legs = this.add.image(width / 2, height * 0.85, 'legs').setScale(0.55);
    this.tweens.add({
      targets: legs,
      y: legs.y - 30,
      duration: 320,
      yoyo: true,
      repeat: -1,
      repeatDelay: 650,
      ease: 'Quad.easeOut',
    });

    const advance = (): void => goToNext(this, 'credits');
    this.time.delayedCall(7000, advance);
    this.input.keyboard?.once('keydown-SPACE', advance);
    this.input.once('pointerdown', advance);
  }
}
