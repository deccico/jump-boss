import Phaser from 'phaser';
import { nextScreen, sceneKeyFor, type ScreenId } from '../../game/flow';

/** Moves to the screen that follows `current` in the notebook's flow. */
export function goToNext(scene: Phaser.Scene, current: ScreenId): void {
  const target = sceneKeyFor(nextScreen(current));
  scene.scene.start(target.key, target.data);
}
