import { describe, expect, it } from 'vitest';
import { computePixelRatio } from './screenshot';

describe('computePixelRatio', () => {
  it('uses the device pixel ratio, capped at 2', () => {
    expect(computePixelRatio(800, 2000, 1)).toBe(1);
    expect(computePixelRatio(800, 2000, 2)).toBe(2);
    expect(computePixelRatio(800, 2000, 3)).toBe(2);
  });

  it('never goes below 1 for normal reports', () => {
    expect(computePixelRatio(800, 2000, 0)).toBe(1);
    expect(computePixelRatio(800, 2000, 0.5)).toBe(1);
  });

  it('shrinks very tall reports to stay under mobile canvas limits', () => {
    const ratio = computePixelRatio(800, 10_000, 3);
    expect(ratio).toBeLessThan(2);
    expect(800 * ratio * 10_000 * ratio).toBeLessThanOrEqual(16_000_000 + 1);
  });
});
