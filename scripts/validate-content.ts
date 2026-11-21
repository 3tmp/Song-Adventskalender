/**
 * Build-time content validation (plan §3). Runs as part of `npm run build`
 * BEFORE vite build and fails the build on any content problem:
 *
 *  - exactly 24 entries per season file
 *  - days 1–24 unique
 *  - `year` inside the file matches the filename
 *  - `schemaVersion` is one the app knows
 *  - every payload validates against its type's zod schema
 *  - the active season's year file exists (prevents v1's
 *    "2025 constant but only 2023 data" crash class)
 *
 * Deep payload validation imports zod — the validator runs at build time
 * only and is never part of the shipped bundle.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContentFile } from '../src/core/content-shape';
import { resolveSeason } from '../src/core/season';
import { payloadSchemas } from '../src/entries/schemas';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(scriptDir, '../src/content');

interface Problem {
  file: string;
  message: string;
}

const problems: Problem[] = [];
const files = readdirSync(contentDir)
  .filter((name) => /^\d{4}\.json$/.test(name))
  .sort();

function fail(file: string, error: unknown): void {
  problems.push({ file, message: error instanceof Error ? error.message : String(error) });
}

if (files.length === 0) {
  fail('(none)', 'no season files found in src/content');
}

const yearsFound: number[] = [];
for (const file of files) {
  const fileNameYear = Number(file.slice(0, 4));
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(contentDir, file), 'utf8'));
  } catch (error) {
    fail(file, `invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }

  // 1) Structure: 24 unique days 1..24, schemaVersion, known entry types.
  try {
    const content = validateContentFile(raw, fileNameYear);
    yearsFound.push(content.year);

    // 2) Deep payload validation against the registry's zod schemas.
    for (const entry of content.entries) {
      const schema = payloadSchemas[entry.type];
      const result = schema.safeParse(entry.payload);
      if (!result.success) {
        const issues = result.error.issues
          .map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`)
          .join('; ');
        fail(file, `day ${entry.day} (${entry.type}): ${issues}`);
      }
    }
  } catch (error) {
    fail(file, error);
  }
}

// 3) The active season's year file must exist — resolved exactly like the
//    app does, from the device date.
const activeYear = resolveSeason(new Date()).year;
if (!yearsFound.includes(activeYear)) {
  problems.push({
    file: '(missing)',
    message: `no content file for the active season year ${activeYear} (expected ${activeYear}.json)`,
  });
}

if (problems.length > 0) {
  console.error(`✖ content validation failed (${problems.length} problem${problems.length === 1 ? '' : 's'}):`);
  for (const problem of problems) {
    console.error(`  ${problem.file}: ${problem.message}`);
  }
  process.exit(1);
}

const summary = yearsFound.sort((a, b) => a - b).join(', ');
console.log(`✔ content valid: ${files.length} season file(s) [${summary}], active year ${activeYear}`);
