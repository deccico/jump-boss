import Phaser from 'phaser';
import { isMuted, toggleMuted } from '../../audio/audioSettings';
import { music } from '../../audio/music';

const INK = '#2b2b2b';

function drawSpeaker(ctx: CanvasRenderingContext2D, off: boolean): void {
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  // speaker box + cone
  ctx.beginPath();
  ctx.moveTo(5, 15);
  ctx.lineTo(12, 15);
  ctx.lineTo(20, 7);
  ctx.lineTo(20, 33);
  ctx.lineTo(12, 25);
  ctx.lineTo(5, 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (off) {
    ctx.strokeStyle = '#d23c3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(25, 13);
    ctx.lineTo(36, 27);
    ctx.moveTo(36, 13);
    ctx.lineTo(25, 27);
    ctx.stroke();
  } else {
    ctx.lineWidth = 2.5;
    for (const radius of [6, 11]) {
      ctx.beginPath();
      ctx.arc(22, 20, radius, -0.9, 0.9);
      ctx.stroke();
    }
  }
}

function ensureSpeakerTextures(scene: Phaser.Scene): void {
  for (const [key, off] of [
    ['icon-sound-on', false],
    ['icon-sound-off', true],
  ] as const) {
    if (scene.textures.exists(key)) {
      continue;
    }
    const canvas = scene.textures.createCanvas(key, 40, 40);
    if (!canvas) {
      continue;
    }
    drawSpeaker(canvas.context, off);
    canvas.refresh();
  }
}

/**
 * Speaker icon in the top-right corner that mutes/unmutes all sound effects
 * and music (M key works too). The choice is remembered across visits.
 */
export function addMuteButton(scene: Phaser.Scene): void {
  ensureSpeakerTextures(scene);
  const button = scene.add
    .image(scene.scale.width - 26, 27, isMuted() ? 'icon-sound-off' : 'icon-sound-on')
    .setDepth(30)
    .setInteractive({ useHandCursor: true });

  const toggle = (): void => {
    toggleMuted();
    music.refreshMuted();
    button.setTexture(isMuted() ? 'icon-sound-off' : 'icon-sound-on');
  };

  button.on(
    'pointerdown',
    (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      toggle();
    },
  );
  scene.input.keyboard?.on('keydown-M', toggle);
}
