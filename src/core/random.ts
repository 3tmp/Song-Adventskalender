/**
 * Deterministic randomness (plan §4): a seeded PRNG (mulberry32) derives the
 * per-user permutation of the 24 entries. The whole assignment is
 * reproducible from the single 32-bit seed stored in the season state, so a
 * partial localStorage wipe or a future migration can never silently
 * reshuffle already-opened days.
 */

/** mulberry32 — tiny, fast 32-bit PRNG returning values in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic permutation of `[0, length)` using Fisher–Yates driven by
 * mulberry32. Same seed + length ⇒ same permutation, forever.
 */
export function seededPermutation(seed: number, length: number): number[] {
  const rand = mulberry32(seed);
  const result = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
