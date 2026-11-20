/**
 * Content loading (plan §3): bundled static JSON per year, lazily imported
 * at runtime via import.meta.glob — only the requested season's data is ever
 * fetched, and past year files stay in the repo forever.
 *
 * Deep payload validation happens at build time (scripts/validate-content);
 * this module re-checks the structure cheaply as a defense in depth and as
 * a shared, unit-testable set of rules.
 */

import { seededPermutation } from './random';
import { DOOR_COUNT } from './unlock';
import type { CalendarEntry, YearContent } from '../entries/types';

export const CONTENT_SCHEMA_VERSION = 2;

const contentFiles = import.meta.glob<YearContent>('../content/*.json', {
  import: 'default',
});

/** Years with content in the repo, ascending. */
export function availableYears(): number[] {
  return Object.keys(contentFiles)
    .map((key) => Number(key.match(/(\d{4})\.json$/)?.[1] ?? NaN))
    .filter((year) => Number.isInteger(year))
    .sort((a, b) => a - b);
}

/**
 * Structural validation of a year content file. Throws descriptive errors —
 * the same rules the build-time validator enforces before a deploy.
 */
export function validateContentFile(data: unknown, expectedYear?: number): YearContent {
  if (typeof data !== 'object' || data === null) {
    throw new Error('content: no object');
  }
  const content = data as Partial<YearContent>;
  if (content.schemaVersion !== CONTENT_SCHEMA_VERSION) {
    throw new Error(`content: unsupported schemaVersion ${String(content.schemaVersion)}`);
  }
  if (!Number.isInteger(content.year)) {
    throw new Error('content: missing year');
  }
  const year = content.year;
  if (expectedYear !== undefined && year !== expectedYear) {
    throw new Error(`content: year mismatch (got ${year}, expected ${expectedYear})`);
  }
  if (!Array.isArray(content.entries) || content.entries.length !== DOOR_COUNT) {
    throw new Error(`content ${year}: expected ${DOOR_COUNT} entries`);
  }
  const seenDays = new Set<number>();
  for (const entry of content.entries as CalendarEntry[]) {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`content ${year}: entry is not an object`);
    }
    const { day, type, payload } = entry as {
      day: number;
      type: string;
      payload: unknown;
    };
    if (!Number.isInteger(day) || day < 1 || day > DOOR_COUNT) {
      throw new Error(`content ${year}: invalid day ${String(day)}`);
    }
    if (seenDays.has(day)) {
      throw new Error(`content ${year}: duplicate day ${day}`);
    }
    seenDays.add(day);
    if (type !== 'song' && type !== 'text') {
      throw new Error(`content ${year} day ${day}: unknown entry type ${String(type)}`);
    }
    if (typeof payload !== 'object' || payload === null) {
      throw new Error(`content ${year} day ${day}: payload missing`);
    }
  }
  return content as YearContent;
}

/** Loads and structurally validates a season's content file. */
export async function getYearContent(year: number): Promise<YearContent> {
  const loader = contentFiles[`../content/${year}.json`];
  if (!loader) {
    throw new Error(`content: no data for year ${year}`);
  }
  return validateContentFile(await loader(), year);
}

/**
 * The per-user season assignment: a deterministic permutation (seeded by the
 * season state's `seed`) decides which content entry sits behind which door.
 */
export function seasonEntryOrder(content: YearContent, seed: number): CalendarEntry[] {
  const permutation = seededPermutation(seed, content.entries.length);
  return permutation.map((index) => content.entries[index]);
}

/** The entry behind door `day` for a given season seed. */
export function getDayEntry(content: YearContent, seed: number, day: number): CalendarEntry {
  if (!Number.isInteger(day) || day < 1 || day > DOOR_COUNT) {
    throw new RangeError(`invalid day: ${day}`);
  }
  return content.entries[seededPermutation(seed, content.entries.length)[day - 1]];
}
