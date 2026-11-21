import { describe, expect, it } from 'vitest';
import { dayHash, parseRoute } from './router';


describe('parseRoute', () => {
  it('parses the grid for empty/absent hashes', () => {
    expect(parseRoute('', 2026)).toEqual({ view: 'grid' });
    expect(parseRoute('#', 2026)).toEqual({ view: 'grid' });
  });

  it('parses day deep links with and without the year', () => {
    expect(parseRoute('#day=7&year=2026', 2026)).toEqual({ view: 'day', day: 7, year: 2026 });
    expect(parseRoute('#day=7', 2026)).toEqual({ view: 'day', day: 7, year: 2026 });
    expect(parseRoute('#day=1&year=2024', 2026)).toEqual({ view: 'day', day: 1, year: 2024 });
  });

  it('is lenient about parameter order', () => {
    expect(parseRoute('#year=2025&day=3', 2026)).toEqual({ view: 'day', day: 3, year: 2025 });
  });

  it('routes invalid days and years to the grid', () => {
    expect(parseRoute('#day=0', 2026)).toEqual({ view: 'grid' });
    expect(parseRoute('#day=25', 2026)).toEqual({ view: 'grid' });
    expect(parseRoute('#day=x', 2026)).toEqual({ view: 'grid' });
    expect(parseRoute('#year=2026', 2026)).toEqual({ view: 'grid' });
    expect(parseRoute('#day=7&year=abc', 2026)).toEqual({ view: 'grid' });
    expect(parseRoute('#day=7&year=12345', 2026)).toEqual({ view: 'grid' });
    expect(parseRoute('#foo=bar', 2026)).toEqual({ view: 'grid' });
  });

  it('serializes and re-parses deep links symmetrical', () => {
    for (const [day, year] of [
      [1, 2023],
      [24, 2025],
      [13, 2026],
    ] as const) {
      expect(parseRoute(dayHash(day, year), 2026)).toEqual({ view: 'day', day, year });
    }
    expect(dayHash(7, 2026)).toBe('#day=7&year=2026');
  });
});
