/**
 * Screen flow for the whole game, straight from Giulio's notebook:
 * title → character select → platform level → Monster A → Monster B →
 * Huggie Wagye → RIP cutscene → Monster Mayhem → victory (→ back to title).
 */
export type BossId = 'bossA' | 'bossB' | 'huggie' | 'mayhem';

export type ScreenId =
  | 'title'
  | 'select'
  | 'platform'
  | 'bossA'
  | 'bossB'
  | 'huggie'
  | 'rip'
  | 'mayhem'
  | 'victory';

export const SCREEN_ORDER: readonly ScreenId[] = [
  'title',
  'select',
  'platform',
  'bossA',
  'bossB',
  'huggie',
  'rip',
  'mayhem',
  'victory',
];

export interface SceneTarget {
  key: string;
  data?: { bossId: BossId };
}

export function nextScreen(screen: ScreenId): ScreenId {
  const index = SCREEN_ORDER.indexOf(screen);
  if (index === -1) {
    throw new Error(`Unknown screen: ${screen}`);
  }
  const next = SCREEN_ORDER[(index + 1) % SCREEN_ORDER.length];
  if (next === undefined) {
    throw new Error(`No screen after: ${screen}`);
  }
  return next;
}

const BOSS_SCREENS: readonly BossId[] = ['bossA', 'bossB', 'huggie', 'mayhem'];

export function isBossScreen(screen: ScreenId): screen is BossId {
  return (BOSS_SCREENS as readonly string[]).includes(screen);
}

export function sceneKeyFor(screen: ScreenId): SceneTarget {
  if (isBossScreen(screen)) {
    return { key: 'Boss', data: { bossId: screen } };
  }
  switch (screen) {
    case 'title':
      return { key: 'Title' };
    case 'select':
      return { key: 'Select' };
    case 'platform':
      return { key: 'Platform' };
    case 'rip':
      return { key: 'Rip' };
    case 'victory':
      return { key: 'Victory' };
  }
}
