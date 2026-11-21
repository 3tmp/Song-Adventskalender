/**
 * Font subsetting (plan §5): vendored full TTFs in assets-src/fonts are
 * subsetted to self-hosted woff2 in public/fonts — Latin plus German
 * diacritics, typographic dashes/quotes/ellipsis. Run via `npm run fonts`.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '../assets-src/fonts');
const outDir = resolve(here, '../public/fonts');

/** Basic Latin, Latin-1 supplement (German umlauts, ß), currency, punctuation. */
const UNICODE_RANGES = [
  'U+0020-007E', // Basic Latin
  'U+00A0-00FF', // Latin-1 supplement (ÄÖÜäöüß etc.)
  'U+0131', // ı
  'U+2013-2014', // – —
  'U+2018-2019', // ‘ ’
  'U+201C-201E', // “ ” „
  'U+2020-2021', // † ‡
  'U+2026', // …
  'U+2032-2033', // ′ ″
  'U+2039-203A', // ‹ ›
  'U+20AC', // €
  'U+2122', // ™
  'U+2190-2193', // ← ↑ → ↓
];

const fonts = [
  { file: 'playfair-600.ttf', family: 'Playfair Display', range: [600, 600] },
  { file: 'playfair-italic.ttf', family: 'Playfair Display Italic', range: [400, 500] },
  { file: 'varta-400.ttf', family: 'Varta', range: [300, 500] },
  { file: 'varta-600.ttf', family: 'Varta', range: [600, 700] },
];

const chars = UnicodeRangesToChars(UNICODE_RANGES);

function UnicodeRangesToChars(ranges) {
  let chars = '';
  for (const range of ranges) {
    const match = range.match(/^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/);
    if (!match) throw new Error(`bad unicode range: ${range}`);
    const from = parseInt(match[1], 16);
    const to = match[2] ? parseInt(match[2], 16) : from;
    for (let code = from; code <= to; code++) chars += String.fromCodePoint(code);
  }
  return chars;
}

let totalIn = 0;
let totalOut = 0;
for (const font of fonts) {
  const inBuffer = await readFile(resolve(srcDir, font.file));
  const outBuffer = await subsetFont(inBuffer, chars, { targetFormat: 'woff2' });
  const dest = resolve(outDir, font.file.replace(/\.ttf$/, '.woff2'));
  await writeFile(dest, outBuffer);
  totalIn += inBuffer.length;
  totalOut += outBuffer.length;
  console.log(`${font.file} → ${(inBuffer.length / 1024).toFixed(0)} kB → ${(outBuffer.length / 1024).toFixed(1)} kB`);
}
console.log(`fonts subsetted: ${(totalIn / 1024).toFixed(0)} kB → ${(totalOut / 1024).toFixed(1)} kB woff2 total`);
