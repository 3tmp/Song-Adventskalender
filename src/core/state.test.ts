import { describe, expect, it } from 'vitest';
import {
  createSeasonStore,
  createSafeStorage,
  parseSeasonState,
  randomSeed32,
  seasonKey,
  toISODate,
  type StorageLike,
} from './state';

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

const fixedToday = () => new Date(2026, 11, 5);
const seedSource = () => 987654321;

describe('season store', () => {
  it('creates a fresh season state on first load and persists it', () => {
    const storage = memoryStorage();
    const store = createSeasonStore({ storage, randomSeed: seedSource, today: fixedToday });

    const state = store.load(2026);
    expect(state).toEqual({
      version: 2,
      year: 2026,
      seed: 987654321,
      openedDays: [],
      lastVisit: '2026-12-05',
    });
    expect(JSON.parse(storage.getItem('sak.2026')!)).toEqual(state);
  });

  it('reads back the same state (seed and progress) on a later visit', () => {
    const storage = memoryStorage();
    const store = createSeasonStore({ storage, randomSeed: seedSource, today: fixedToday });
    store.markOpened(2026, 1);
    store.markOpened(2026, 3);

    // A later visit (fresh store over the same storage) keeps seed + progress.
    const later = createSeasonStore({
      storage,
      randomSeed: () => 111, // must not overwrite the stored seed
      today: () => new Date(2026, 11, 9),
    });
    const state = later.load(2026);
    expect(state.seed).toBe(987654321);
    expect(state.openedDays).toEqual([1, 3]);
    expect(state.lastVisit).toBe('2026-12-09');
  });

  it('keeps seasons isolated per year', () => {
    const storage = memoryStorage();
    const store = createSeasonStore({ storage, randomSeed: seedSource, today: fixedToday });
    store.markOpened(2026, 1);
    expect(store.isOpened(2026, 1)).toBe(true);
    // Touching the 2026 season must never bleed into 2025's progress.
    expect(store.load(2025).openedDays).toEqual([]);
    expect(store.isOpened(2025, 1)).toBe(false);
  });

  it('deduplicates and sorts markOpened', () => {
    const storage = memoryStorage();
    const store = createSeasonStore({ storage, randomSeed: seedSource, today: fixedToday });
    store.markOpened(2026, 7);
    store.markOpened(2026, 2);
    store.markOpened(2026, 7);
    expect(store.load(2026).openedDays).toEqual([2, 7]);
  });

  it('rejects invalid days in markOpened', () => {
    const store = createSeasonStore({ storage: memoryStorage(), randomSeed: seedSource, today: fixedToday });
    expect(() => store.markOpened(2026, 0)).toThrow(RangeError);
    expect(() => store.markOpened(2026, 25)).toThrow(RangeError);
    expect(() => store.markOpened(2026, 1.5)).toThrow(RangeError);
  });

  it('resets a season to a fresh one-key operation', () => {
    const storage = memoryStorage();
    const store = createSeasonStore({ storage, randomSeed: seedSource, today: fixedToday });
    store.markOpened(2026, 4);
    store.reset(2026);
    expect(storage.getItem('sak.2026')).toBeNull();

    const next = createSeasonStore({ storage, randomSeed: () => 222, today: fixedToday });
    const state = next.load(2026);
    expect(state.seed).toBe(222);
    expect(state.openedDays).toEqual([]);
  });

  it('migrates a foreign version by preserving valid openedDays', () => {
    const legacy = JSON.stringify({ version: 1, year: 2026, openedDays: [3, 25, 'x', 1.5, 4] });
    const storage = memoryStorage({ 'sak.2026': legacy });
    const store = createSeasonStore({
      storage,
      randomSeed: () => 777,
      today: () => new Date(2026, 11, 2),
    });
    const state = store.load(2026);
    expect(state.version).toBe(2);
    expect(state.openedDays).toEqual([3, 4]);
    expect(state.seed).toBe(777);
  });

  it('re-initializes on garbage data', () => {
    const storage = memoryStorage({ 'sak.2026': '{{{ not json' });
    const store = createSeasonStore({ storage, randomSeed: seedSource, today: fixedToday });
    expect(store.load(2026).seed).toBe(987654321);
    expect(store.load(2026).openedDays).toEqual([]);
  });

  it('re-initializes foreign-year states but preserves valid progress', () => {
    const foreign = JSON.stringify({ version: 2, year: 2025, seed: 1, openedDays: [1], lastVisit: '2025-12-01' });
    const storage = memoryStorage({ 'sak.2026': foreign });
    const store = createSeasonStore({ storage, randomSeed: seedSource, today: fixedToday });
    const state = store.load(2026);
    expect(state.year).toBe(2026);
    expect(state.openedDays).toEqual([1]);
    expect(state.seed).toBe(seedSource());
  });
});

describe('parseSeasonState', () => {
  const valid = JSON.stringify({
    version: 2,
    year: 2026,
    seed: 812394,
    openedDays: [1, 2],
    lastVisit: '2026-12-02',
  });

  it('accepts a well-formed v2 state', () => {
    const state = parseSeasonState(valid, 2026, 0)!;
    expect(state).toEqual({
      version: 2,
      year: 2026,
      seed: 812394,
      openedDays: [1, 2],
      lastVisit: '2026-12-02',
    });
  });

  it('sanitizes openedDays on load', () => {
    const state = parseSeasonState(
      JSON.stringify({ version: 2, year: 2026, seed: 1, openedDays: [9, 99, 0] }),
      2026,
      0,
    )!;
    expect(state.openedDays).toEqual([9]);
  });

  it('returns null for null/invalid input', () => {
    expect(parseSeasonState(null, 2026, 0)).toBeNull();
    expect(parseSeasonState('', 2026, 0)).toBeNull();
    expect(parseSeasonState('[]', 2026, 0)).toBeNull();
    expect(parseSeasonState('"x"', 2026, 0)).toBeNull();
  });
});

describe('helpers', () => {
  it('randomSeed32 returns a 32-bit unsigned int', () => {
    const seed = randomSeed32();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(4294967296);
  });

  it('toISODate formats local dates in YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 11, 5))).toBe('2026-12-05');
    expect(toISODate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('seasonKey uses the sak namespace per year', () => {
    expect(seasonKey(2026)).toBe('sak.2026');
  });

  it('falls back to in-memory storage when localStorage is unusable', () => {
    expect(() => {
      const storage = createSafeStorage();
      storage.setItem(seasonKey(2026), 'x');
      storage.removeItem(seasonKey(2026));
    }).not.toThrow();
  });
});
