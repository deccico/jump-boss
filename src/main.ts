import '@fontsource/patrick-hand';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { BossScene } from './scenes/BossScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { PlatformScene } from './scenes/PlatformScene';
import { RipScene } from './scenes/RipScene';
import { TitleScene } from './scenes/TitleScene';
import { VictoryScene } from './scenes/VictoryScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#f5f2e8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1400 },
    },
  },
  scene: [BootScene, TitleScene, CharacterSelectScene, PlatformScene, BossScene, RipScene, VictoryScene],
});

// dev/debug hook (used by the headless smoke tests)
(window as unknown as { __game: Phaser.Game }).__game = game;
