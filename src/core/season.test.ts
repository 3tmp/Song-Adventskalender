import { describe, expect, it } from 'vitest';
import { resolveSeason } from './season';

describe('resolveSeason', () => {
  it('returns the current year as active season in December', () => {
    expect(resolveSeason(new Date(2026, 11, 1))).toEqual({ year: 2026, phase: 'active' });
    expect(resolveSeason(new Date(2026, 11, 24, 23, 59, 59))).toEqual({
      year: 2026,
      phase: 'active',
    });
    expect(resolveSeason(new Date(2026, 11, 31))).toEqual({ year: 2026, phase: 'active' });
  });

  it('marks the current-year season upcoming before December', () => {
    expect(resolveSeason(new Date(2026, 10, 30))).toEqual({ year: 2026, phase: 'upcoming' });
    expect(resolveSeason(new Date(2026, 0, 1))).toEqual({ year: 2026, phase: 'upcoming' });
    expect(resolveSeason(new Date(2026, 5, 15))).toEqual({ year: 2026, phase: 'upcoming' });
  });

  it('rolls over to the next season with the year', () => {
    expect(resolveSeason(new Date(2026, 11, 31, 23, 59, 59))).toEqual({
      year: 2026,
      phase: 'active',
    });
    expect(resolveSeason(new Date(2027, 0, 1))).toEqual({ year: 2027, phase: 'upcoming' });
  });
});
