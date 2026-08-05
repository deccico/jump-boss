import Phaser from 'phaser';

export const HAND_FONT = '"Patrick Hand", "Comic Sans MS", "Chalkboard SE", cursive';

export function addMarkerText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  color = '#2b2b2b',
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: HAND_FONT,
      fontSize: `${size}px`,
      color,
    })
    .setOrigin(0.5);
}
