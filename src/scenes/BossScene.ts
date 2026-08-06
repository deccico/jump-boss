import Phaser from 'phaser';
import { createSfx, type Sfx } from '../audio/sfx';
import { ARENA_GROUND as GROUND, ARENA_PLAYER_SPAWN as PLAYER_SPAWN, ARENA_SIDE_PLATFORMS as SIDE_PLATFORMS } from '../game/arena';
import {
  createAttackState,
  knifeVelocity,
  bulletVelocity,
  starArcVelocity,
  updateAttacks,
  type AttackEvent,
  type AttackState,
} from '../game/attacks';
import { BOSSES, isStomp, stompDamage, WEAK_SPOT_DAMAGE, type BossDefinition, type BossId } from '../game/bosses';
import { DEFAULT_CHARACTER, isValidCharacter, type CharacterConfig } from '../game/character';
import {
  applyDamage,
  BOSS_IFRAMES_MS,
  createHealth,
  isDead,
  isInvulnerable,
  type HealthState,
} from '../game/health';
import { GRAVITY } from '../game/physics';
import { TRANSFORM_CONTACT_DAMAGE, TRANSFORM_HIT_COOLDOWN_MS } from '../game/powerups';
import { PlayerController } from './PlayerController';
import { Hud } from './ui/hud';
import { drawWobblyRect, ensurePlatformTexture, MARKER_ORANGE } from './ui/marker';
import { goToNext } from './ui/nav';
import { PAPER_KEY } from './ui/paper';
import { addMarkerText } from './ui/text';

const HP_BAR = { x: 620, y: 22, w: 300, h: 22 };

type ProjectileKind = 'knife' | 'bullet' | 'star' | 'sweep' | 'shockwave';

export class BossScene extends Phaser.Scene {
  private bossId: BossId = 'bossA';
  private def!: BossDefinition;
  private player!: PlayerController;
  private hud!: Hud;
  private sfx!: Sfx;
  private boss!: Phaser.Physics.Arcade.Sprite;
  private bossHealth!: HealthState;
  private attackState!: AttackState;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private hpFill!: Phaser.GameObjects.Graphics;
  private weakSpotPulse!: Phaser.GameObjects.Graphics;
  private staggeredUntilMs = 0;
  private weakSpotHitThisStagger = false;
  private moveUntilMs = 0;
  private slamAirborne = false;
  private lastTransformHitMs = 0;
  private patrolDir = -1;
  private ending = false;

  constructor() {
    super('Boss');
  }

  init(data: { bossId?: BossId }): void {
    this.bossId = data.bossId ?? 'bossA';
  }

  create(): void {
    const { width, height } = this.scale;
    this.def = BOSSES[this.bossId];
    this.ending = false;
    this.staggeredUntilMs = 0;
    this.weakSpotHitThisStagger = false;
    this.moveUntilMs = 0;
    this.slamAirborne = false;
    this.lastTransformHitMs = 0;
    this.patrolDir = -1;

    this.cameras.main.fadeIn(300, 245, 242, 232);
    this.add.image(0, 0, PAPER_KEY).setOrigin(0, 0);
    this.sfx = createSfx();

    const ground = this.physics.add.staticGroup();
    ground.create(
      GROUND.x + GROUND.w / 2,
      GROUND.y + 9,
      ensurePlatformTexture(this, GROUND.w, 18, 200),
    );
    const platforms = this.physics.add.staticGroup();
    SIDE_PLATFORMS.forEach((def, i) => {
      platforms.create(def.x + def.w / 2, def.y + 9, ensurePlatformTexture(this, def.w, 18, 210 + i));
    });

    // the monster, straight from the notebook
    const texture = this.textures.get(this.def.textureKey).getSourceImage();
    const aspect = texture.width / texture.height;
    this.boss = this.physics.add.sprite(width * 0.72, GROUND.y - this.def.displayH / 2, this.def.textureKey);
    this.boss.setDisplaySize(this.def.displayH * aspect, this.def.displayH);
    const body = this.boss.body as Phaser.Physics.Arcade.Body;
    body.setSize((this.boss.width * 0.7), this.boss.height * 0.86, true);
    this.boss.setCollideWorldBounds(true);
    this.physics.add.collider(this.boss, ground);
    this.bossHealth = createHealth(this.def.maxHp);
    this.attackState = createAttackState(this.def.attacks, this.time.now + 1200);

    const stored: unknown = this.registry.get('character');
    const config: CharacterConfig = isValidCharacter(stored) ? stored : DEFAULT_CHARACTER;
    this.player = new PlayerController(this, PLAYER_SPAWN.x, PLAYER_SPAWN.y, config, this.sfx, {
      onDied: () => this.handleDeath(),
    });
    this.physics.add.collider(this.player.sprite, ground);
    this.physics.add.collider(this.player.sprite, platforms);

    this.projectiles = this.physics.add.group();
    this.physics.add.overlap(this.player.sprite, this.projectiles, (_p, projectile) => {
      const sprite = projectile as Phaser.Physics.Arcade.Image;
      if (this.player.isTransformed(this.time.now)) {
        sprite.destroy();
        return;
      }
      if (this.player.hurt(this.time.now)) {
        sprite.destroy();
      }
    });

    this.physics.add.overlap(this.player.sprite, this.boss, () => this.resolveBossContact());

    // boss HP bar
    const frame = this.add.graphics();
    drawWobblyRect(frame, HP_BAR.x, HP_BAR.y, HP_BAR.w, HP_BAR.h, 61, { thickness: 3 });
    this.hpFill = this.add.graphics();
    addMarkerText(this, HP_BAR.x + HP_BAR.w / 2, HP_BAR.y + HP_BAR.h + 18, this.def.name, 26);
    this.weakSpotPulse = this.add.graphics();

    this.hud = new Hud(this);

    // the finale is meant to be won monster-vs-monster: X pickups keep
    // respawning on the side platforms so the kid can charge the special
    if (this.bossId === 'mayhem') {
      for (const platform of SIDE_PLATFORMS) {
        this.spawnArenaPickup(platform.x + platform.w / 2, platform.y - 30);
      }
    }

    // entrance card
    const card = addMarkerText(this, width / 2, height * 0.32, `${this.def.name}!!`, 54, '#c2601a');
    card.setScale(0.2).setAlpha(0);
    this.tweens.chain({
      targets: card,
      tweens: [
        { alpha: 1, scale: 1.1, duration: 380, ease: 'Back.easeOut' },
        { alpha: 1, duration: 900 },
        { alpha: 0, duration: 300, onComplete: () => card.destroy() },
      ],
    });
  }

  private spawnArenaPickup(x: number, y: number): void {
    const pickup = this.physics.add.staticImage(x, y, 'icon-x');
    pickup.setDisplaySize(42, 42);
    pickup.refreshBody();
    this.tweens.add({
      targets: pickup,
      y: y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.physics.add.overlap(this.player.sprite, pickup, () => {
      pickup.destroy();
      this.player.pickUp('x', this.time.now);
      this.time.delayedCall(15_000, () => {
        if (!this.ending && this.scene.isActive()) {
          this.spawnArenaPickup(x, y);
        }
      });
    });
  }

  // ---- combat resolution ---------------------------------------------------

  private resolveBossContact(): void {
    if (this.ending) {
      return;
    }
    const now = this.time.now;
    const playerBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
    const inStagger = now < this.staggeredUntilMs;

    if (isStomp(playerBody.velocity.y, playerBody.bottom, bossBody.top, bossBody.height * 0.3)) {
      this.player.sprite.setVelocityY(-420);
      this.damageBoss(stompDamage(inStagger), now);
      if (this.def.staggerMs > 0 && !isDead(this.bossHealth)) {
        this.staggeredUntilMs = now + this.def.staggerMs;
        this.weakSpotHitThisStagger = false;
      }
      return;
    }

    if (this.player.isTransformed(now)) {
      if (now - this.lastTransformHitMs >= TRANSFORM_HIT_COOLDOWN_MS) {
        this.lastTransformHitMs = now;
        this.damageBoss(TRANSFORM_CONTACT_DAMAGE, now);
        this.cameras.main.shake(120, 0.006);
      }
      return;
    }

    if (!inStagger && this.player.hurt(now)) {
      // knock the player away so contact doesn't re-trigger instantly
      const away = this.player.sprite.x < this.boss.x ? -1 : 1;
      this.player.sprite.setVelocity(away * 280, -220);
    }
  }

  private damageBoss(amount: number, nowMs: number): void {
    if (isInvulnerable(this.bossHealth, nowMs)) {
      return;
    }
    this.bossHealth = applyDamage(this.bossHealth, amount, nowMs, BOSS_IFRAMES_MS);
    this.sfx.stomp();
    this.boss.setTintFill(0xffffff);
    this.time.delayedCall(140, () => this.boss.clearTint());
    if (isDead(this.bossHealth)) {
      this.defeatBoss();
    }
  }

  private defeatBoss(): void {
    this.ending = true;
    this.sfx.fanfare();
    this.boss.setVelocity(0, 0);
    (this.boss.body as Phaser.Physics.Arcade.Body).setEnable(false);
    this.projectiles.clear(true, true);
    this.tweens.add({
      targets: this.boss,
      angle: 360 * 2,
      scale: 0.05,
      alpha: 0,
      duration: 1100,
      ease: 'Quad.easeIn',
    });
    this.time.delayedCall(1500, () => goToNext(this, this.bossId));
  }

  private handleDeath(): void {
    if (this.ending) {
      return;
    }
    this.ending = true;
    this.player.sprite.setTint(0x8888ff);
    this.cameras.main.shake(300, 0.01);
    this.time.delayedCall(900, () => this.scene.restart({ bossId: this.bossId }));
  }

  // ---- boss attacks --------------------------------------------------------

  private handleAttack(event: AttackEvent, nowMs: number): void {
    const speed = event.spec.speed ?? 200;
    const playerPos = { x: this.player.sprite.x, y: this.player.sprite.y };
    const dir = playerPos.x < this.boss.x ? -1 : 1;
    switch (event.type) {
      case 'lunge':
        this.boss.setVelocityX(dir * speed);
        this.moveUntilMs = nowMs + 600;
        break;
      case 'charge':
        this.boss.setVelocityX(dir * speed);
        this.moveUntilMs = nowMs + 1300;
        break;
      case 'knife':
        this.spawnProjectile('knife', {
          from: { x: this.boss.x + dir * this.boss.displayWidth * 0.3, y: this.boss.y - this.boss.displayHeight * 0.2 },
          velocity: knifeVelocity(
            { x: this.boss.x, y: this.boss.y - this.boss.displayHeight * 0.2 },
            playerPos,
            speed,
          ),
          spin: 420,
        });
        break;
      case 'bullet':
        this.spawnProjectile('bullet', {
          from: { x: this.boss.x + dir * this.boss.displayWidth * 0.35, y: this.boss.y - this.boss.displayHeight * 0.05 },
          velocity: bulletVelocity(this.boss, playerPos, speed),
        });
        break;
      case 'star':
        this.spawnProjectile('star', {
          from: { x: this.boss.x, y: this.boss.y - this.boss.displayHeight * 0.45 },
          velocity: starArcVelocity(
            { x: this.boss.x, y: this.boss.y - this.boss.displayHeight * 0.45 },
            playerPos,
            GRAVITY,
            900,
          ),
          spin: 300,
          gravity: true,
        });
        break;
      case 'sweep':
        this.spawnProjectile('sweep', {
          from: { x: this.boss.x + dir * this.boss.displayWidth * 0.4, y: GROUND.y - 20 },
          velocity: { x: dir * speed, y: 0 },
        });
        break;
      case 'slam':
        this.boss.setVelocityY(-540);
        this.slamAirborne = true;
        break;
    }
  }

  private spawnProjectile(
    kind: ProjectileKind,
    options: { from: { x: number; y: number }; velocity: { x: number; y: number }; spin?: number; gravity?: boolean },
  ): void {
    if (this.projectiles.countActive(true) >= 3 && kind !== 'shockwave') {
      return;
    }
    const texture = this.ensureProjectileTexture(kind);
    const projectile = this.projectiles.create(options.from.x, options.from.y, texture) as Phaser.Physics.Arcade.Image;
    const sizes: Record<ProjectileKind, [number, number]> = {
      knife: [54, 30],
      bullet: [16, 16],
      star: [56, 50],
      sweep: [180, 26],
      shockwave: [46, 16],
    };
    const [w, h] = sizes[kind];
    projectile.setDisplaySize(w, h);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setSize(projectile.width * 0.8, projectile.height * 0.8, true);
    body.setAllowGravity(options.gravity ?? false);
    projectile.setVelocity(options.velocity.x, options.velocity.y);
    if (options.spin) {
      body.setAngularVelocity(options.spin);
    }
  }

  private ensureProjectileTexture(kind: ProjectileKind): string {
    if (kind === 'knife' || kind === 'star') {
      return kind;
    }
    const key = `proj-${kind}`;
    if (this.textures.exists(key)) {
      return key;
    }
    const graphics = this.make.graphics({}, false);
    if (kind === 'bullet') {
      graphics.fillStyle(0x2b2b2b, 1);
      graphics.fillCircle(8, 8, 7);
      graphics.generateTexture(key, 16, 16);
    } else {
      // sweep arm / shockwave: low marker bar
      const w = kind === 'sweep' ? 180 : 46;
      drawWobblyRect(graphics, 2, 2, w - 4, kind === 'sweep' ? 22 : 12, 300, {
        thickness: 3,
        fill: kind === 'sweep' ? 0xb9b1a1 : 0xe8d9a8,
        fillAlpha: 1,
      });
      graphics.generateTexture(key, w, kind === 'sweep' ? 26 : 16);
    }
    graphics.destroy();
    return key;
  }

  // ---- frame loop ----------------------------------------------------------

  override update(time: number): void {
    if (this.ending) {
      return;
    }
    this.player.update(time);
    this.hud.update(this.player.health, this.player.effects, time);

    if (this.player.sprite.y > this.scale.height + 40) {
      this.player.hurt(time);
      this.player.respawn();
    }

    this.updateBoss(time);
    this.drawHpBar();
    this.drawWeakSpot(time);
    this.cullProjectiles();
  }

  private updateBoss(time: number): void {
    const body = this.boss.body as Phaser.Physics.Arcade.Body;
    const staggered = time < this.staggeredUntilMs;

    if (staggered) {
      this.boss.setVelocityX(0);
      this.boss.setAngle(Math.sin(time / 60) * 4);
      this.checkWeakSpotTouch(time);
      return;
    }
    this.boss.setAngle(0);

    // land a slam: shockwaves along the ground both ways
    if (this.slamAirborne && body.blocked.down) {
      this.slamAirborne = false;
      this.cameras.main.shake(220, 0.012);
      this.sfx.stomp();
      for (const dir of [-1, 1]) {
        this.spawnProjectile('shockwave', {
          from: { x: this.boss.x + dir * this.boss.displayWidth * 0.4, y: GROUND.y - 10 },
          velocity: { x: dir * 260, y: 0 },
        });
      }
    }

    const tick = updateAttacks(this.attackState, time);
    this.attackState = tick.state;
    for (const event of tick.events) {
      this.handleAttack(event, time);
    }
    if (tick.telegraphing && !isInvulnerable(this.bossHealth, time)) {
      this.boss.setTint(0xffb0a0);
    } else if (!isInvulnerable(this.bossHealth, time)) {
      this.boss.clearTint();
    }

    // patrol when not mid-lunge/charge/slam
    if (time >= this.moveUntilMs && !this.slamAirborne && body.blocked.down) {
      if (this.def.patrolSpeed === 0) {
        this.boss.setVelocityX(0);
      } else {
        if (this.boss.x < 380) {
          this.patrolDir = 1;
        } else if (this.boss.x > 880) {
          this.patrolDir = -1;
        }
        this.boss.setVelocityX(this.def.patrolSpeed * this.patrolDir);
      }
    }
  }

  private weakSpotWorldRect(): Phaser.Geom.Rectangle | null {
    const spot = this.def.weakSpot;
    if (!spot) {
      return null;
    }
    const bounds = this.boss.getBounds();
    return new Phaser.Geom.Rectangle(
      bounds.x + spot.x * bounds.width,
      bounds.y + spot.y * bounds.height,
      spot.w * bounds.width,
      spot.h * bounds.height,
    );
  }

  private checkWeakSpotTouch(time: number): void {
    // don't consume the once-per-stagger touch while the boss can't take
    // damage (e.g. the player's body crossing the X during the stomp bounce)
    if (this.weakSpotHitThisStagger || isInvulnerable(this.bossHealth, time)) {
      return;
    }
    const rect = this.weakSpotWorldRect();
    if (!rect) {
      return;
    }
    const playerBounds = this.player.sprite.getBounds();
    if (Phaser.Geom.Rectangle.Overlaps(rect, playerBounds)) {
      this.weakSpotHitThisStagger = true;
      this.damageBoss(WEAK_SPOT_DAMAGE, time);
      this.cameras.main.shake(150, 0.008);
    }
  }

  private drawWeakSpot(time: number): void {
    this.weakSpotPulse.clear();
    if (time >= this.staggeredUntilMs || this.weakSpotHitThisStagger) {
      return;
    }
    const rect = this.weakSpotWorldRect();
    if (!rect) {
      return;
    }
    const pulse = 1 + 0.18 * Math.sin(time / 110);
    this.weakSpotPulse.lineStyle(4, MARKER_ORANGE, 0.9);
    this.weakSpotPulse.strokeCircle(rect.centerX, rect.centerY, (rect.width / 2) * pulse + 8);
  }

  private drawHpBar(): void {
    this.hpFill.clear();
    const fraction = this.bossHealth.hp / this.bossHealth.max;
    if (fraction > 0) {
      this.hpFill.fillStyle(0xd23c3c, 0.9);
      this.hpFill.fillRect(HP_BAR.x + 3, HP_BAR.y + 3, (HP_BAR.w - 6) * fraction, HP_BAR.h - 6);
    }
  }

  private cullProjectiles(): void {
    for (const child of this.projectiles.getChildren()) {
      const projectile = child as Phaser.Physics.Arcade.Image;
      if (
        projectile.x < -80 ||
        projectile.x > this.scale.width + 80 ||
        projectile.y > this.scale.height + 80
      ) {
        projectile.destroy();
      }
    }
  }
}
