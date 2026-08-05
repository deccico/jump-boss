import Phaser from 'phaser';
import { DEFAULT_CHARACTER, isValidCharacter, type CharacterConfig } from '../game/character';
import { ensurePlayerTexture } from './ui/drawPlayer';
import { PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';

export class PlatformScene extends Phaser.Scene {
  constructor() {
    super('Platform');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);

    const stored: unknown = this.registry.get('character');
    const config: CharacterConfig = isValidCharacter(stored) ? stored : DEFAULT_CHARACTER;
    this.add.image(width / 2, height / 2, ensurePlayerTexture(this, config));

    addMarkerText(this, width / 2, height * 0.8, 'level under construction…', 30, '#6b6b6b');
  }
}
