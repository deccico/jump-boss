/**
 * Manifest of every sprite extracted from Giulio's notebook by
 * tools/extract-sprites.sh. BootScene preloads exactly this list, and the
 * test asserts the files exist so a broken extraction fails the suite.
 *
 * Only Giulio's own marks are used as art — the pencil annotations on the
 * pages are Adrian's notes and are deliberately not extracted; anything
 * they used to say is rendered as regular game text instead.
 */
export const SPRITE_KEYS = [
  'title-logo',
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
  'boss-a',
  'boss-b',
  'knife',
  'boss-huggie',
  'star',
  'boss-mayhem',
  'tombstone',
  'trophy',
  'victory-lettering',
] as const;

export type SpriteKey = (typeof SPRITE_KEYS)[number];

export function spritePath(key: SpriteKey): string {
  return `assets/sprites/${key}.png`;
}
