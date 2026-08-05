import { describe, expect, it } from 'vitest';
import { wobblyRectPoints } from './wobble';

describe('wobblyRectPoints', () => {
  it('is deterministic for the same seed and differs across seeds', () => {
    expect(wobblyRectPoints(0, 0, 100, 80, 7)).toEqual(wobblyRectPoints(0, 0, 100, 80, 7));
    expect(wobblyRectPoints(0, 0, 100, 80, 7)).not.toEqual(wobblyRectPoints(0, 0, 100, 80, 8));
  });

  it('stays within jitter distance of the rectangle', () => {
    const jitter = 2.5;
    for (const point of wobblyRectPoints(10, 20, 100, 80, 3, 14, jitter)) {
      expect(point.x).toBeGreaterThanOrEqual(10 - jitter);
      expect(point.x).toBeLessThanOrEqual(10 + 100 + jitter);
      expect(point.y).toBeGreaterThanOrEqual(20 - jitter);
      expect(point.y).toBeLessThanOrEqual(20 + 80 + jitter);
    }
  });

  it('traces all four edges', () => {
    const points = wobblyRectPoints(0, 0, 140, 140, 1);
    expect(points.length).toBeGreaterThanOrEqual(8);
    const jitter = 3;
    expect(points.some((p) => p.y < jitter)).toBe(true); // top
    expect(points.some((p) => p.y > 140 - jitter)).toBe(true); // bottom
    expect(points.some((p) => p.x < jitter)).toBe(true); // left
    expect(points.some((p) => p.x > 140 - jitter)).toBe(true); // right
  });
});
