/**
 * Manifest of every sprite extracted from Giulio's notebook by
 * tools/extract-sprites.sh. BootScene preloads exactly this list, and the
 * test asserts the files exist so a broken extraction fails the suite.
 */
export const SPRITE_KEYS = [
  'title-logo',
  'note-pick-eyes',
  'eye',
  'swatch-purple',
  'swatch-orange',
  'swatch-red',
  'swatch-stripes',
  'swatch-spots',
  'legs',
  'icon-bigjump',
  'icon-speed',
  'icon-x',
  'icon-special',
  'label-bigjump',
  'label-speed',
  'label-mayhem',
  'label-special',
  'boss-a',
  'boss-b',
  'knife',
  'boss-huggie',
  'star',
  'boss-mayhem',
  'tombstone',
  'trophy',
  'victory-lettering',
  'victory-caption',
] as const;

export type SpriteKey = (typeof SPRITE_KEYS)[number];

export function spritePath(key: SpriteKey): string {
  return `assets/sprites/${key}.png`;
}
