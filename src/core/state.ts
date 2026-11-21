/**
 * On-device state (plan §4): one JSON object per season, stored in
 * localStorage under `sak.{year}` (`sak` = Song-Adventskalender). Past
 * seasons' keys are never auto-deleted; the state references entries only by
 * day index — never by title/id — so the same logic works for any content
 * shape and any year.
 *
 * Everything is injectable (storage, RNG, clock) so tests run deterministically.
 */

import { DOOR_COUNT } from './unlock';

export const STATE_NAMESPACE = 'sak';
export const STATE_VERSION = 2;

export interface SeasonState {
  version: 2;
  year: number;
  /** 32-bit seed for the per-user entry permutation. */
  seed: number;
  /** Days (1–24) the user has already opened, ascending. */
  openedDays: number[];
  /** Last visit as local ISO date (YYYY-MM-DD). */
  lastVisit: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SeasonStoreOptions {
  storage?: StorageLike;
  randomSeed?: () => number;
  today?: () => Date;
}

export interface SeasonStore {
  /** Loads (and memoizes) the season state, migrating or re-initializing if needed. */
  load(year: number): SeasonState;
  isOpened(year: number, day: number): boolean;
  markOpened(year: number, day: number): SeasonState;
  /** Deletes the season key; the next load starts a fresh season (plan: reset = one-key operation). */
  reset(year: number): void;
}

export function seasonKey(year: number): string {
  return `${STATE_NAMESPACE}.${year}`;
}

/** A 32-bit random seed; prefers the Web Crypto API. */
export function randomSeed32(): number {
  const crypto = globalThis.crypto;
  if (crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0];
  }
  return Math.floor(Math.random() * 4294967296);
}

/** Local date as YYYY-MM-DD (avoids UTC shifts of toISOString). */
export function toISODate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function sanitizeOpenedDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const days = value
    .filter((d): d is number => Number.isInteger(d) && d >= 1 && d <= DOOR_COUNT)
    .map((d) => d as number);
  return [...new Set(days)].sort((a, b) => a - b);
}

/**
 * Parses a stored season value into a valid state. Unknown or corrupt data
 * falls back to a safe re-init that preserves `openedDays` where possible
 * (plan §4, versioned state schema).
 */
export function parseSeasonState(raw: string | null, year: number, seed: number): SeasonState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    const openedDays = sanitizeOpenedDays(record.openedDays);
    const seedCandidate = record.seed;
    if (
      record.version === STATE_VERSION &&
      record.year === year &&
      typeof seedCandidate === 'number' &&
      Number.isInteger(seedCandidate)
    ) {
      const lastVisit =
        typeof record.lastVisit === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.lastVisit)
          ? record.lastVisit
          : '';
      return { version: STATE_VERSION, year, seed: seedCandidate, openedDays, lastVisit };
    }
    // Older/corrupt versions: keep progress if we can, rotate the seed.
    if (openedDays.length > 0) {
      return { version: STATE_VERSION, year, seed, openedDays, lastVisit: '' };
    }
    return null;
  } catch {
    return null;
  }
}

/** Wraps localStorage with a graceful in-memory fallback (private mode, etc.). */
export function createSafeStorage(): StorageLike {
  const memory = new Map<string, string>();
  try {
    if (typeof localStorage !== 'undefined') {
      const probeKey = `${STATE_NAMESPACE}.probe`;
      localStorage.setItem(probeKey, '1');
      localStorage.removeItem(probeKey);
      return localStorage;
    }
  } catch {
    // fall through to memory
  }
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
  };
}

export function createSeasonStore(options: SeasonStoreOptions = {}): SeasonStore {
  const storage = options.storage ?? createSafeStorage();
  const randomSeed = options.randomSeed ?? randomSeed32;
  const today = options.today ?? (() => new Date());
  const cache = new Map<number, SeasonState>();

  function fresh(year: number): SeasonState {
    return {
      version: STATE_VERSION,
      year,
      seed: randomSeed(),
      openedDays: [],
      lastVisit: toISODate(today()),
    };
  }

  function persist(state: SeasonState): void {
    storage.setItem(seasonKey(state.year), JSON.stringify(state));
  }

  function load(year: number): SeasonState {
    const cached = cache.get(year);
    if (cached) return cached;

    const seedForRecovery = randomSeed();
    const state = parseSeasonState(storage.getItem(seasonKey(year)), year, seedForRecovery) ?? fresh(year);

    // Track the last visit; freshly migrated states always get today.
    const isoToday = toISODate(today());
    if (isoToday !== state.lastVisit) {
      state.lastVisit = isoToday;
    }
    persist(state);
    cache.set(year, state);
    return state;
  }

  return {
    load,
    isOpened: (year, day) => load(year).openedDays.includes(day),
    markOpened(year, day) {
      const state = load(year);
      if (!Number.isInteger(day) || day < 1 || day > DOOR_COUNT) {
        throw new RangeError(`invalid day: ${day}`);
      }
      if (!state.openedDays.includes(day)) {
        state.openedDays = [...state.openedDays, day].sort((a, b) => a - b);
        persist(state);
      }
      return state;
    },
    reset(year) {
      storage.removeItem(seasonKey(year));
      cache.delete(year);
    },
  };
}
