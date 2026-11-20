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
import { validateContentFile } from './content-shape';
import type { CalendarEntry, YearContent } from '../entries/types';

export { validateContentFile, CONTENT_SCHEMA_VERSION } from './content-shape';

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
