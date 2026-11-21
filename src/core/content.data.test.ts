import { describe, expect, it } from 'vitest';
import { availableYears, getYearContent, seasonEntryOrder, validateContentFile } from './content';
import { resolveSeason } from './season';
import { payloadSchemas } from '../entries/schemas';
import { doorPreviewFor } from '../entries/registry';
import type { CalendarEntry } from '../entries/types';

/**
 * Integration test over the real season files (plan §6: "per-type payload
 * schemas"). Everything the build-time validator enforces is asserted here
 * against the actual bundled content.
 */
describe('season content files', () => {
  it('has content for the active season and all v1 archive years', async () => {
    const years = availableYears();
    expect(years).toContain(2023);
    expect(years).toContain(2024);
    expect(years).toContain(2025);
    expect(years).toContain(resolveSeason(new Date()).year);
  });

  it('loads and structurally validates every year', async () => {
    for (const year of availableYears()) {
      const content = await getYearContent(year);
      expect(content.year).toBe(year);
      expect(content.entries).toHaveLength(24);
      expect(content.entries.map((e) => e.day).sort((a, b) => a - b)).toEqual(
        Array.from({ length: 24 }, (_, i) => i + 1),
      );
    }
  });

  it('deep-validates every payload against its type schema', async () => {
    for (const year of availableYears()) {
      const content = await getYearContent(year);
      for (const entry of content.entries) {
        const result = payloadSchemas[entry.type].safeParse(entry.payload);
        if (!result.success) {
          throw new Error(
            `${year} day ${entry.day} (${entry.type}): ${result.error.issues.map((i) => i.message).join('; ')}`,
          );
        }
      }
    }
  });

  it('ported the v1 2023 season faithfully', async () => {
    const content = await getYearContent(2023);
    expect(content.entries[0]).toMatchObject({
      day: 1,
      type: 'song',
      payload: { title: 'Running on air', artist: 'Nathan Trent' },
    });
  });

  it('maps v1 impuls entries to the text type and preserves their film link', async () => {
    const content = await getYearContent(2025);
    const impulsDays = content.entries.filter((e) => e.type === 'text').map((e) => e.day);
    expect(impulsDays).toEqual([19, 20, 21, 22, 23, 24]);

    const film = content.entries.find((e) => e.day === 23) as Extract<CalendarEntry, { type: 'text' }>;
    expect(film.payload.title).toBe('Una vita in una scatola');
    expect(film.payload.text).toContain('https://youtu.be/q1mHbGvhjps');
  });

  it('renders a door preview for every entry of every year', async () => {
    for (const year of availableYears()) {
      const content = await getYearContent(year);
      for (const entry of seasonEntryOrder(content, 20260101)) {
        const preview = doorPreviewFor(entry);
        expect(preview.title.length).toBeGreaterThan(0);
      }
    }
  });

  it('rejects content files whose year mismatches the filename', async () => {
    const content = await getYearContent(2023);
    expect(() => validateContentFile(content, 9999)).toThrow(/year mismatch/);
  });
});
