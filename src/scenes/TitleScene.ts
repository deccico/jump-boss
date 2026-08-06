import Phaser from 'phaser';
import { music } from '../audio/music';
import { goToNext } from './ui/nav';
import { PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';
import { addMuteButton } from './ui/muteButton';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    music.play('title');
    addMuteButton(this);
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);

    const logo = this.add.image(width / 2, height * 0.28, 'title-logo');
    const logoScale = Math.min(1, (width * 0.6) / logo.width);
    logo.setScale(logoScale);
    this.tweens.add({
      targets: logo,
      y: logo.y - 12,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const legs = this.add.image(width / 2, height * 0.62, 'legs');
    legs.setScale(0.8);
    this.tweens.add({
      targets: legs,
      y: legs.y - 46,
      duration: 320,
      yoyo: true,
      repeat: -1,
      repeatDelay: 700,
      ease: 'Quad.easeOut',
    });

    addMarkerText(this, width / 2, height * 0.82, 'a game by Giulio', 26, '#6b6b6b');
    const prompt = addMarkerText(this, width / 2, height * 0.9, 'press SPACE or tap to start', 30);
    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    const credits = addMarkerText(this, width - 74, height - 26, 'credits', 24, '#6b6b6b');
    credits
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.scene.start('Credits');
      });
    this.input.keyboard?.on('keydown-C', () => this.scene.start('Credits'));

    this.input.keyboard?.once('keydown-SPACE', () => goToNext(this, 'title'));
    this.input.once('pointerdown', () => goToNext(this, 'title'));
  }
}
