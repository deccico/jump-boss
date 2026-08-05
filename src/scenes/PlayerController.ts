import Phaser from 'phaser';
import type { Sfx } from '../audio/sfx';
import type { CharacterConfig } from '../game/character';
import {
  applyDamage,
  createHealth,
  isDead,
  isInvulnerable,
  PLAYER_MAX_HEARTS,
  type HealthState,
} from '../game/health';
import { canJump } from '../game/physics';
import {
  applyPickup,
  canTransform,
  createEffects,
  isTransformed,
  jumpVelocity,
  moveSpeed,
  startTransform,
  type EffectsState,
  type PowerUpType,
} from '../game/powerups';
import { ensurePlayerTexture } from './ui/drawPlayer';

export interface PlayerCallbacks {
  onDied?: () => void;
  onTransform?: () => void;
  onPickup?: (type: PowerUpType) => void;
}

const NORMAL_DISPLAY = { w: 74, h: 96 };
const NORMAL_HURTBOX = { w: 52, h: 84 };
const TRANSFORMED_DISPLAY = { w: 128, h: 154 };
const TRANSFORMED_HURTBOX = { w: 92, h: 138 };

/** Sets the arcade body size in *display* pixels regardless of texture scale. */
function setBodyDisplaySize(sprite: Phaser.Physics.Arcade.Sprite, w: number, h: number): void {
  sprite.body?.setSize(w / sprite.scaleX, h / sprite.scaleY, true);
}

/**
 * The player: arcade sprite + input on the Phaser side, with all rules
 * (jump windows, power-ups, hearts, transform) delegated to the pure modules.
 * Shared by the platform level and every boss arena.
 */
export class PlayerController {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  effects: EffectsState = createEffects();
  health: HealthState = createHealth(PLAYER_MAX_HEARTS);

  private keys: Record<'left' | 'right' | 'up' | 'a' | 'd' | 'w' | 'space' | 'e' | 'shift', Phaser.Input.Keyboard.Key> | null = null;
  private groundedAt: number | null = null;
  private jumpPressedAt: number | null = null;
  private baseTexture: string;
  private transformed = false;
  private spawnPoint: { x: number; y: number };

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    config: CharacterConfig,
    private sfx: Sfx,
    private callbacks: PlayerCallbacks = {},
  ) {
    this.baseTexture = ensurePlayerTexture(scene, config);
    this.spawnPoint = { x, y };
    this.sprite = scene.physics.add.sprite(x, y, this.baseTexture);
    this.sprite.setDisplaySize(NORMAL_DISPLAY.w, NORMAL_DISPLAY.h);
    setBodyDisplaySize(this.sprite, NORMAL_HURTBOX.w, NORMAL_HURTBOX.h);
    this.sprite.setCollideWorldBounds(true);

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.keys = {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        e: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        shift: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      };
    }
  }

  update(nowMs: number): void {
    const keys = this.keys;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!keys || !body) {
      return;
    }

    const speed = moveSpeed(this.effects, nowMs);
    const left = keys.left.isDown || keys.a.isDown;
    const right = keys.right.isDown || keys.d.isDown;
    if (left && !right) {
      this.sprite.setVelocityX(-speed);
      this.sprite.setFlipX(true);
    } else if (right && !left) {
      this.sprite.setVelocityX(speed);
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    if (body.blocked.down || body.touching.down) {
      this.groundedAt = nowMs;
    }
    const jumpJustPressed =
      Phaser.Input.Keyboard.JustDown(keys.space) ||
      Phaser.Input.Keyboard.JustDown(keys.up) ||
      Phaser.Input.Keyboard.JustDown(keys.w);
    if (jumpJustPressed) {
      this.jumpPressedAt = nowMs;
    }
    if (canJump(this.groundedAt, this.jumpPressedAt, nowMs)) {
      this.sprite.setVelocityY(jumpVelocity(this.effects, nowMs));
      this.groundedAt = null;
      this.jumpPressedAt = null;
      this.sfx.jump();
    }

    const specialPressed =
      Phaser.Input.Keyboard.JustDown(keys.e) || Phaser.Input.Keyboard.JustDown(keys.shift);
    if (specialPressed && canTransform(this.effects, nowMs)) {
      this.effects = startTransform(this.effects, nowMs);
      this.applyTransformLook(true);
      this.sfx.transform();
      this.scene.cameras.main.shake(250, 0.008);
      this.callbacks.onTransform?.();
    }

    const transformedNow = isTransformed(this.effects, nowMs);
    if (this.transformed && !transformedNow) {
      this.applyTransformLook(false);
    }
    this.transformed = transformedNow;

    // blink through i-frames
    if (isInvulnerable(this.health, nowMs) && !transformedNow) {
      this.sprite.setAlpha(Math.floor(nowMs / 125) % 2 === 0 ? 0.35 : 0.9);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  private applyTransformLook(on: boolean): void {
    if (on) {
      this.sprite.setTexture('boss-mayhem');
      this.sprite.setDisplaySize(TRANSFORMED_DISPLAY.w, TRANSFORMED_DISPLAY.h);
      setBodyDisplaySize(this.sprite, TRANSFORMED_HURTBOX.w, TRANSFORMED_HURTBOX.h);
    } else {
      this.sprite.setTexture(this.baseTexture);
      this.sprite.setDisplaySize(NORMAL_DISPLAY.w, NORMAL_DISPLAY.h);
      setBodyDisplaySize(this.sprite, NORMAL_HURTBOX.w, NORMAL_HURTBOX.h);
    }
  }

  pickUp(type: PowerUpType, nowMs: number): void {
    this.effects = applyPickup(this.effects, type, nowMs);
    this.sfx.pickup();
    this.callbacks.onPickup?.(type);
  }

  isTransformed(nowMs: number): boolean {
    return isTransformed(this.effects, nowMs);
  }

  /** Applies damage unless invulnerable or transformed. Returns true if it landed. */
  hurt(nowMs: number, amount = 1): boolean {
    if (this.isTransformed(nowMs) || isInvulnerable(this.health, nowMs)) {
      return false;
    }
    this.health = applyDamage(this.health, amount, nowMs);
    this.sfx.hurt();
    if (isDead(this.health)) {
      this.callbacks.onDied?.();
    }
    return true;
  }

  respawn(): void {
    this.sprite.setVelocity(0, 0);
    this.sprite.setPosition(this.spawnPoint.x, this.spawnPoint.y);
  }
}
