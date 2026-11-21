import { describe, expect, it } from 'vitest';
import { DOOR_COUNT, isDayUnlocked, isSeasonEnded, todayDay } from './unlock';

describe('isDayUnlocked', () => {
  it('unlocks day N exactly at midnight of December N (local time)', () => {
    const season = 2026;
    expect(isDayUnlocked(1, season, new Date(2026, 11, 1, 0, 0, 0))).toBe(true);
    expect(isDayUnlocked(3, season, new Date(2026, 11, 3, 0, 0, 0))).toBe(true);
    expect(isDayUnlocked(3, season, new Date(2026, 11, 2, 23, 59, 59, 999))).toBe(false);
    expect(isDayUnlocked(24, season, new Date(2026, 11, 24))).toBe(true);
    expect(isDayUnlocked(24, season, new Date(2026, 11, 23, 23, 59, 59, 999))).toBe(false);
  });

  it('keeps a door unlocked for the rest of the season', () => {
    expect(isDayUnlocked(5, 2026, new Date(2026, 11, 17))).toBe(true);
    expect(isDayUnlocked(5, 2026, new Date(2026, 11, 31))).toBe(true);
  });

  it('unlocks all doors of a past season (hidden archive via deep links)', () => {
    expect(isDayUnlocked(1, 2023, new Date(2026, 5, 1))).toBe(true);
    expect(isDayUnlocked(24, 2025, new Date(2026, 10, 20))).toBe(true);
  });

  it('keeps a future season locked', () => {
    expect(isDayUnlocked(1, 2027, new Date(2026, 11, 31))).toBe(false);
  });

  it('rejects days outside the 1..24 range', () => {
    expect(isDayUnlocked(0, 2026, new Date(2026, 11, 31))).toBe(false);
    expect(isDayUnlocked(25, 2026, new Date(2026, 11, 31))).toBe(false);
    expect(isDayUnlocked(1.5, 2026, new Date(2026, 11, 31))).toBe(false);
  });

  it('unlocks every door when the dev flag is set', () => {
    expect(isDayUnlocked(24, 2026, new Date(2026, 10, 30), true)).toBe(true);
    expect(isDayUnlocked(24, 2100, new Date(2026, 0, 1), true)).toBe(true);
    expect(DOOR_COUNT).toBe(24);
  });
});

describe('todayDay', () => {
  it('returns the current date within December 1–24', () => {
    expect(todayDay(new Date(2026, 11, 1))).toBe(1);
    expect(todayDay(new Date(2026, 11, 7, 18, 30))).toBe(7);
    expect(todayDay(new Date(2026, 11, 24))).toBe(24);
  });

  it('returns null outside December 1–24', () => {
    expect(todayDay(new Date(2026, 11, 25))).toBeNull();
    expect(todayDay(new Date(2026, 10, 30))).toBeNull();
    expect(todayDay(new Date(2026, 0, 1))).toBeNull();
  });
});

describe('isSeasonEnded', () => {
  it('is false while door 24 still unlocks', () => {
    expect(isSeasonEnded(2026, new Date(2026, 11, 24, 23, 59, 59))).toBe(false);
  });

  it('is true from December 25 of the season year onward', () => {
    expect(isSeasonEnded(2026, new Date(2026, 11, 25))).toBe(true);
    expect(isSeasonEnded(2025, new Date(2026, 0, 1))).toBe(true);
  });
});
