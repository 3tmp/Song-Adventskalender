import { describe, expect, it } from 'vitest';
import { mulberry32, seededPermutation } from './random';

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(812394);
    const b = mulberry32(812394);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('returns values in [0, 1)', () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 8 }, () => mulberry32(1)());
    const b = Array.from({ length: 8 }, () => mulberry32(2)());
    expect(a).not.toEqual(b);
  });
});

describe('seededPermutation', () => {
  it('returns a valid permutation of [0, length)', () => {
    const perm = seededPermutation(123456, 24);
    expect(perm).toHaveLength(24);
    expect([...perm].sort((a, b) => a - b)).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });

  it('is deterministic — same seed and length forever', () => {
    expect(seededPermutation(812394, 24)).toEqual(seededPermutation(812394, 24));
    // Regression pin: a stable permutation for a given seed is what keeps
    // already-opened doors pointing at the same entry across releases.
    expect(seededPermutation(812394, 24)).toEqual([
      17, 14, 16, 7, 21, 18, 22, 3, 12, 5, 9, 6, 11, 2, 15, 8, 20, 0, 10,
      23, 1, 19, 4, 13,
    ]);
  });

  it('differs between seeds', () => {
    expect(seededPermutation(1, 24)).not.toEqual(seededPermutation(2, 24));
  });

  it('handles degenerate lengths', () => {
    expect(seededPermutation(7, 0)).toEqual([]);
    expect(seededPermutation(7, 1)).toEqual([0]);
  });
});
