import { mulberry32 } from './rng';

export interface Point {
  x: number;
  y: number;
}

/**
 * Points tracing a rectangle with hand-drawn jitter, used for the marker-style
 * outlines everywhere (player body, platforms, buttons, HP bars). Deterministic
 * for a given seed so the same shape doesn't shimmer between redraws.
 */
export function wobblyRectPoints(
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  step = 14,
  jitter = 2.5,
): Point[] {
  const rng = mulberry32(seed);
  const points: Point[] = [];
  const wobble = () => (rng() * 2 - 1) * jitter;

  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const segments = Math.max(1, Math.round(length / step));
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      points.push({ x: x0 + (x1 - x0) * t + wobble(), y: y0 + (y1 - y0) * t + wobble() });
    }
  };

  edge(x, y, x + w, y);
  edge(x + w, y, x + w, y + h);
  edge(x + w, y + h, x, y + h);
  edge(x, y + h, x, y);
  return points;
}
