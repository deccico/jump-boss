import { describe, expect, it } from 'vitest';
import { isBossScreen, nextScreen, SCREEN_ORDER, sceneKeyFor, type ScreenId } from './flow';

describe('screen flow', () => {
  it('follows the notebook order, with the RIP cutscene right after Huggie Wagye', () => {
    expect(SCREEN_ORDER).toEqual([
      'title',
      'select',
      'platform',
      'bossA',
      'bossB',
      'huggie',
      'rip',
      'mayhem',
      'victory',
    ]);
  });

  it('walks every screen to the next one', () => {
    expect(nextScreen('title')).toBe('select');
    expect(nextScreen('select')).toBe('platform');
    expect(nextScreen('platform')).toBe('bossA');
    expect(nextScreen('bossA')).toBe('bossB');
    expect(nextScreen('bossB')).toBe('huggie');
    expect(nextScreen('huggie')).toBe('rip');
    expect(nextScreen('rip')).toBe('mayhem');
    expect(nextScreen('mayhem')).toBe('victory');
  });

  it('wraps victory back to the title screen', () => {
    expect(nextScreen('victory')).toBe('title');
  });

  it('throws on unknown screens', () => {
    expect(() => nextScreen('nope' as ScreenId)).toThrow(/Unknown screen/);
  });

  it('maps boss screens to the parameterized Boss scene', () => {
    expect(sceneKeyFor('bossA')).toEqual({ key: 'Boss', data: { bossId: 'bossA' } });
    expect(sceneKeyFor('bossB')).toEqual({ key: 'Boss', data: { bossId: 'bossB' } });
    expect(sceneKeyFor('huggie')).toEqual({ key: 'Boss', data: { bossId: 'huggie' } });
    expect(sceneKeyFor('mayhem')).toEqual({ key: 'Boss', data: { bossId: 'mayhem' } });
  });

  it('maps the remaining screens to their own scenes', () => {
    expect(sceneKeyFor('title')).toEqual({ key: 'Title' });
    expect(sceneKeyFor('select')).toEqual({ key: 'Select' });
    expect(sceneKeyFor('platform')).toEqual({ key: 'Platform' });
    expect(sceneKeyFor('rip')).toEqual({ key: 'Rip' });
    expect(sceneKeyFor('victory')).toEqual({ key: 'Victory' });
  });

  it('identifies boss screens', () => {
    expect(isBossScreen('bossA')).toBe(true);
    expect(isBossScreen('rip')).toBe(false);
    expect(isBossScreen('title')).toBe(false);
  });
});
