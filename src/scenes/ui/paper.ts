import Phaser from 'phaser';

export const PAPER_KEY = 'paper';

const PAPER_COLOR = '#f7f4ea';
const LINE_COLOR = 'rgba(120, 155, 200, 0.35)';
const DASH_COLOR = 'rgba(120, 155, 200, 0.16)';
const LINE_SPACING = 36;

/**
 * Generates the ruled notebook-paper background as a canvas texture:
 * off-white paper, a solid blue line every LINE_SPACING px and a faint
 * dashed line halfway between, like the notebook the game was designed in.
 */
export function createPaperTexture(scene: Phaser.Scene, width: number, height: number): void {
  if (scene.textures.exists(PAPER_KEY)) {
    return;
  }
  const canvas = scene.textures.createCanvas(PAPER_KEY, width, height);
  if (!canvas) {
    return;
  }
  const ctx = canvas.context;

  ctx.fillStyle = PAPER_COLOR;
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  for (let y = LINE_SPACING; y < height; y += LINE_SPACING) {
    ctx.strokeStyle = LINE_COLOR;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    const dashY = y - LINE_SPACING / 2;
    ctx.strokeStyle = DASH_COLOR;
    ctx.setLineDash([7, 9]);
    ctx.beginPath();
    ctx.moveTo(0, dashY);
    ctx.lineTo(width, dashY);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  canvas.refresh();
}
