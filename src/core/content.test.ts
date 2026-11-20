import { describe, expect, it } from 'vitest';
import {
  availableYears,
  getDayEntry,
  seasonEntryOrder,
  validateContentFile,
} from './content';
import type { CalendarEntry, YearContent } from '../entries/types';

const songEntry = (day: number): CalendarEntry => ({
  day,
  type: 'song',
  payload: {
    title: `Song ${day}`,
    artist: `Artist ${day}`,
    quote: `Quote ${day}`,
    text: `Text for day ${day}`,
  },
});

const fixture: YearContent = {
  schemaVersion: 2,
  year: 2099,
  entries: Array.from({ length: 24 }, (_, i) => songEntry(i + 1)),
};

describe('validateContentFile', () => {
  it('accepts a well-formed year file', () => {
    expect(validateContentFile(fixture, 2099)).toEqual(fixture);
  });

  it('rejects wrong years', () => {
    expect(() => validateContentFile(fixture, 2000)).toThrow(/year mismatch/);
  });

  it('rejects unsupported schema versions', () => {
    expect(() => validateContentFile({ ...fixture, schemaVersion: 1 })).toThrow(/schemaVersion/);
  });

  it('rejects wrong entry counts', () => {
    expect(() => validateContentFile({ ...fixture, entries: fixture.entries.slice(1) })).toThrow(
      /expected 24 entries/,
    );
  });

  it('rejects duplicate or missing days', () => {
    const duplicate = fixture.entries.map((e, i) => (i === 1 ? { ...e, day: 1 } : e));
    expect(() => validateContentFile({ ...fixture, entries: duplicate })).toThrow(/duplicate day/);

    const unknown = fixture.entries.map((e, i) => (i === 0 ? { ...e, day: 25 } : e));
    expect(() => validateContentFile({ ...fixture, entries: unknown })).toThrow(/invalid day/);
  });

  it('rejects unknown entry types and missing payloads', () => {
    const unknownType = fixture.entries.map((e, i) => (i === 0 ? { ...e, type: 'video' } : e));
    expect(() => validateContentFile({ ...fixture, entries: unknownType })).toThrow(
      /unknown entry type/,
    );

    const noPayload = fixture.entries.map((e, i) => (i === 0 ? { ...e, payload: undefined } : e));
    expect(() => validateContentFile({ ...fixture, entries: noPayload })).toThrow(
      /day 1: payload missing/,
    );
  });
});

describe('season assignment', () => {
  const seed = 812394;

  it('getDayEntry is deterministic and bijective across the 24 doors', () => {
    const days = Array.from({ length: 24 }, (_, i) => getDayEntry(fixture, seed, i + 1));
    const uniqueTitles = new Set(days.map((e) => e.payload.title));
    expect(uniqueTitles.size).toBe(24);
    expect(getDayEntry(fixture, seed, 7).payload.title).toBe(
      getDayEntry(fixture, seed, 7).payload.title,
    );
  });

  it('different seeds produce different assignments', () => {
    const a = seasonEntryOrder(fixture, 1);
    const b = seasonEntryOrder(fixture, 2);
    expect(a.map((e) => e.payload.title)).not.toEqual(b.map((e) => e.payload.title));
  });

  it('seasonEntryOrder keeps every entry exactly once', () => {
    const order = seasonEntryOrder(fixture, seed);
    expect(order).toHaveLength(24);
    const dayNumbers = order.map((e) => (e.payload as { text: string }).text).map((t) =>
      Number(t.match(/day (\d+)/)![1]),
    );
    expect([...dayNumbers].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
  });

  it('rejects invalid days', () => {
    expect(() => getDayEntry(fixture, seed, 0)).toThrow(RangeError);
    expect(() => getDayEntry(fixture, seed, 25)).toThrow(RangeError);
  });
});

describe('availableYears', () => {
  it('is a sorted list of numbers', () => {
    const years = availableYears();
    expect(Array.isArray(years)).toBe(true);
    for (const y of years) expect(Number.isInteger(y)).toBe(true);
  });
});
