import Phaser from 'phaser';
import { createSfx, type Sfx } from '../audio/sfx';
import { DEFAULT_CHARACTER, isValidCharacter, type CharacterConfig } from '../game/character';
import {
  EXIT,
  LEVEL_PICKUPS,
  LEVEL_PLATFORMS,
  PLATFORM_H,
  SPAWN,
} from '../game/level';
import type { PowerUpType } from '../game/powerups';
import { PlayerController } from './PlayerController';
import { Hud } from './ui/hud';
import { drawWobblyRect, ensurePlatformTexture } from './ui/marker';
import { goToNext } from './ui/nav';
import { PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';

const TOAST_FOR: Record<PowerUpType, string> = {
  bigJump: 'label-bigjump',
  speed: 'label-speed',
  x: 'label-mayhem',
  special: 'label-mayhem',
};

export class PlatformScene extends Phaser.Scene {
  private player!: PlayerController;
  private hud!: Hud;
  private sfx!: Sfx;
  private exitRect = new Phaser.Geom.Rectangle(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  private ending = false;

  constructor() {
    super('Platform');
  }

  create(): void {
    const { width, height } = this.scale;
    this.ending = false;
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);
    this.sfx = createSfx();

    const platforms = this.physics.add.staticGroup();
    LEVEL_PLATFORMS.forEach((def, i) => {
      const key = ensurePlatformTexture(this, def.w, PLATFORM_H, 100 + i);
      platforms.create(def.x + def.w / 2, def.y + PLATFORM_H / 2, key);
    });

    // exit door to the first boss
    const door = this.add.graphics();
    drawWobblyRect(door, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 71, {
      thickness: 3.5,
      fill: 0xf6d8a8,
      fillAlpha: 0.9,
    });
    door.fillStyle(0x2b2b2b, 1);
    door.fillCircle(EXIT.x + EXIT.w - 14, EXIT.y + EXIT.h / 2, 4);
    addMarkerText(this, EXIT.x + EXIT.w / 2, EXIT.y - 16, 'boss!', 24, '#c2601a');

    const stored: unknown = this.registry.get('character');
    const config: CharacterConfig = isValidCharacter(stored) ? stored : DEFAULT_CHARACTER;
    this.player = new PlayerController(this, SPAWN.x, SPAWN.y, config, this.sfx, {
      onDied: () => this.handleDeath(),
    });
    this.physics.add.collider(this.player.sprite, platforms);

    for (const pickup of LEVEL_PICKUPS) {
      const icon = pickup.type === 'bigJump' || pickup.type === 'speed'
        ? `icon-${pickup.type.toLowerCase()}`
        : 'icon-x';
      const image = this.physics.add.staticImage(pickup.x, pickup.y, icon);
      image.setDisplaySize(46, 46);
      image.refreshBody();
      this.tweens.add({
        targets: image,
        y: pickup.y - 6,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.physics.add.overlap(this.player.sprite, image, () => {
        image.destroy();
        this.player.pickUp(pickup.type, this.time.now);
        this.showToast(TOAST_FOR[pickup.type]);
      });
    }

    this.hud = new Hud(this);
    addMarkerText(this, width / 2, height - 18, 'arrows move · SPACE jumps · E is special', 22, '#6b6b6b');
  }

  private showToast(labelKey: string): void {
    const toast = this.add.image(this.scale.width / 2, 96, labelKey).setAlpha(0).setScale(0.9);
    this.tweens.chain({
      targets: toast,
      tweens: [
        { alpha: 1, scale: 1.15, duration: 220, ease: 'Back.easeOut' },
        { alpha: 1, duration: 1200 },
        { alpha: 0, y: 70, duration: 320, onComplete: () => toast.destroy() },
      ],
    });
  }

  private handleDeath(): void {
    if (this.ending) {
      return;
    }
    this.ending = true;
    this.player.sprite.setTint(0x8888ff);
    this.cameras.main.shake(300, 0.01);
    this.time.delayedCall(900, () => this.scene.restart());
  }

  override update(time: number): void {
    if (this.ending) {
      return;
    }
    this.player.update(time);
    this.hud.update(this.player.health, this.player.effects, time);

    // fell off the world: lose a heart, back to the start
    if (this.player.sprite.y > this.scale.height + 40) {
      this.player.hurt(time);
      this.player.respawn();
    }

    if (
      Phaser.Geom.Rectangle.Contains(this.exitRect, this.player.sprite.x, this.player.sprite.y)
    ) {
      this.ending = true;
      this.cameras.main.fadeOut(350, 245, 242, 232);
      this.time.delayedCall(380, () => goToNext(this, 'platform'));
    }
  }
}
