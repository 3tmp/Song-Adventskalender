/**
 * Pure structural validation of a year content file — no Vite, no DOM.
 * Shared by the runtime loader (core/content.ts) and the build-time
 * validator (scripts/validate-content.ts) so the rules can never drift.
 */

import { DOOR_COUNT } from './unlock';
import { ENTRY_TYPES, type EntryType, type YearContent } from '../entries/types';

export const CONTENT_SCHEMA_VERSION = 2;

export interface WipEntry {
  day: number;
  type: EntryType;
  payload: unknown;
}

function isKnownType(type: unknown): type is EntryType {
  return typeof type === 'string' && (ENTRY_TYPES as readonly string[]).includes(type);
}

/**
 * Structural validation: exactly 24 entries, days 1–24 unique, known entry
 * types, payload objects present, `year` matching the filename. Deep payload
 * validation lives with the zod schemas (build-time only).
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
    throw new Error(`content ${year}: expected ${DOOR_COUNT} entries, got ${content.entries?.length}`);
  }
  const seenDays = new Set<number>();
  for (const entry of content.entries) {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`content ${year}: entry is not an object`);
    }
    const { day, type, payload } = entry as Partial<WipEntry>;
    if (typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > DOOR_COUNT) {
      throw new Error(`content ${year}: invalid day ${String(day)}`);
    }
    if (seenDays.has(day)) {
      throw new Error(`content ${year}: duplicate day ${day}`);
    }
    seenDays.add(day);
    if (!isKnownType(type)) {
      throw new Error(`content ${year} day ${day}: unknown entry type ${String(type)}`);
    }
    if (typeof payload !== 'object' || payload === null) {
      throw new Error(`content ${year} day ${day}: payload missing`);
    }
  }
  return content as YearContent;
}
