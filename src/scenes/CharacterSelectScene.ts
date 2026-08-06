import Phaser from 'phaser';
import {
  BODY_STYLES,
  cycleBody,
  cycleEyes,
  DEFAULT_CHARACTER,
  EYE_COUNTS,
  isValidCharacter,
  swatchKey,
  type CharacterConfig,
} from '../game/character';
import { ensurePlayerTexture } from './ui/drawPlayer';
import { drawWobblyRect } from './ui/marker';
import { goToNext } from './ui/nav';
import { PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';
import { addMuteButton } from './ui/muteButton';

const HIGHLIGHT = 0xe8801a;

export class CharacterSelectScene extends Phaser.Scene {
  private config: CharacterConfig = { ...DEFAULT_CHARACTER };
  private highlight!: Phaser.GameObjects.Graphics;
  private preview!: Phaser.GameObjects.Image;
  private eyeTiles: { rect: Phaser.Geom.Rectangle; count: (typeof EYE_COUNTS)[number] }[] = [];
  private bodyTiles: { rect: Phaser.Geom.Rectangle; body: (typeof BODY_STYLES)[number] }[] = [];

  constructor() {
    super('Select');
  }

  create(): void {
    const { width, height } = this.scale;
    this.config = { ...DEFAULT_CHARACTER };
    this.eyeTiles = [];
    addMuteButton(this);
    this.bodyTiles = [];
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);

    addMarkerText(this, width * 0.32, 44, 'make your jumper!', 40);
    addMarkerText(this, width * 0.68, height * 0.14, 'pick your eyes and body!', 26, '#6b6b6b');

    // eye-count tiles
    addMarkerText(this, 88, 118, 'eyes', 28);
    const frames = this.add.graphics();
    EYE_COUNTS.forEach((count, i) => {
      const rect = new Phaser.Geom.Rectangle(60 + i * 100, 140, 84, 84);
      this.eyeTiles.push({ rect, count });
      drawWobblyRect(frames, rect.x, rect.y, rect.width, rect.height, 20 + i, { thickness: 2.5 });
      const eyeImage = this.textures.get('eye').getSourceImage();
      const eyeAspect = eyeImage.width / eyeImage.height;
      const eyeH = 26;
      const spacing = 6;
      const totalW = count * eyeH * eyeAspect + (count - 1) * spacing;
      for (let e = 0; e < count; e++) {
        this.add
          .image(
            rect.centerX - totalW / 2 + eyeH * eyeAspect * (e + 0.5) + e * spacing,
            rect.centerY,
            'eye',
          )
          .setDisplaySize(eyeH * eyeAspect, eyeH);
      }
      this.makeClickable(rect, () => {
        this.config.eyes = count;
        this.refresh();
      });
    });

    // body swatch tiles
    addMarkerText(this, 88, 268, 'body', 28);
    BODY_STYLES.forEach((body, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const rect = new Phaser.Geom.Rectangle(60 + col * 100, 290 + row * 100, 84, 84);
      this.bodyTiles.push({ rect, body });
      drawWobblyRect(frames, rect.x, rect.y, rect.width, rect.height, 30 + i, { thickness: 2.5 });
      this.add
        .image(rect.centerX, rect.centerY, swatchKey(body))
        .setDisplaySize(rect.width - 10, rect.height - 10);
      this.makeClickable(rect, () => {
        this.config.body = body;
        this.refresh();
      });
    });

    // live preview
    const previewX = width * 0.68;
    const previewY = height * 0.45;
    this.preview = this.add.image(previewX, previewY, ensurePlayerTexture(this, this.config));
    this.preview.setScale(1.9);
    this.tweens.add({
      targets: this.preview,
      y: previewY - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // play button
    const play = this.add.graphics();
    const playRect = new Phaser.Geom.Rectangle(width * 0.68 - 90, height - 110, 180, 64);
    drawWobblyRect(play, playRect.x, playRect.y, playRect.width, playRect.height, 55, {
      thickness: 4,
      fill: 0xfff3c8,
      fillAlpha: 0.9,
    });
    addMarkerText(this, playRect.centerX, playRect.centerY, 'PLAY!', 38);
    this.makeClickable(playRect, () => this.startGame());

    this.highlight = this.add.graphics();
    this.refresh();

    addMarkerText(
      this,
      width * 0.68,
      height - 28,
      'arrows change · SPACE plays',
      22,
      '#6b6b6b',
    );

    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.on('keydown-LEFT', () => {
        this.config.body = cycleBody(this.config.body, -1);
        this.refresh();
      });
      keyboard.on('keydown-RIGHT', () => {
        this.config.body = cycleBody(this.config.body, 1);
        this.refresh();
      });
      keyboard.on('keydown-UP', () => {
        this.config.eyes = cycleEyes(this.config.eyes, 1);
        this.refresh();
      });
      keyboard.on('keydown-DOWN', () => {
        this.config.eyes = cycleEyes(this.config.eyes, -1);
        this.refresh();
      });
      keyboard.on('keydown-SPACE', () => this.startGame());
      keyboard.on('keydown-ENTER', () => this.startGame());
    }
  }

  private makeClickable(rect: Phaser.Geom.Rectangle, onClick: () => void): void {
    this.add
      .zone(rect.centerX, rect.centerY, rect.width, rect.height)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onClick);
  }

  private refresh(): void {
    this.preview.setTexture(ensurePlayerTexture(this, this.config));
    this.highlight.clear();
    const eyeTile = this.eyeTiles.find((t) => t.count === this.config.eyes);
    const bodyTile = this.bodyTiles.find((t) => t.body === this.config.body);
    for (const tile of [eyeTile, bodyTile]) {
      if (tile) {
        drawWobblyRect(
          this.highlight,
          tile.rect.x - 5,
          tile.rect.y - 5,
          tile.rect.width + 10,
          tile.rect.height + 10,
          77,
          { stroke: HIGHLIGHT, thickness: 5 },
        );
      }
    }
  }

  private startGame(): void {
    if (!isValidCharacter(this.config)) {
      return;
    }
    this.registry.set('character', { ...this.config });
    this.input.keyboard?.removeAllListeners();
    goToNext(this, 'select');
  }
}
