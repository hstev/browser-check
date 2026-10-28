import { describe, expect, it } from 'vitest';
import { computePixelRatio } from './screenshot';

describe('computePixelRatio', () => {
  it('renders at least 2× even on standard-density screens', () => {
    expect(computePixelRatio(800, 2000, 1)).toBe(2);
    expect(computePixelRatio(800, 2000, 0)).toBe(2);
    expect(computePixelRatio(800, 2000, 0.5)).toBe(2);
  });

  it('follows higher device pixel ratios, capped at 3', () => {
    expect(computePixelRatio(800, 2000, 2.5)).toBe(2.5);
    expect(computePixelRatio(800, 2000, 3)).toBe(3);
    expect(computePixelRatio(800, 2000, 4)).toBe(3);
  });

  it('shrinks very tall reports to stay under mobile canvas limits', () => {
    const ratio = computePixelRatio(800, 10_000, 3);
    expect(ratio).toBeLessThan(2);
    expect(800 * ratio * 10_000 * ratio).toBeLessThanOrEqual(16_000_000 + 1);
  });
});
