/**
 * Door artwork processing (plan §6): square originals in assets-src/doors are
 * converted to the shipped pair in public/img/doors — WebP (primary) plus a
 * progressive JPEG fallback, both 400×400. The 4:5 crop happens at display
 * time via CSS `object-fit: cover`, so no cropping here.
 *
 * Run via `npm run doors` (all originals) or `npm run doors -- door_7`
 * (single door, name without extension). PNG works as input too — if a door
 * exists as both JPG and PNG, the PNG wins (lossless source).
 * Idempotent — re-run any time after dropping in new or updated originals.
 * Outputs are committed, so the build and deploy pipeline never need sharp.
 */

import { readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '../assets-src/doors');
const outDir = resolve(here, '../public/img/doors');

/** 400px covers the 8-column grid at ~3× device pixel ratio. */
const SIZE = 400;
const QUALITY_WEBP = 86;
const QUALITY_JPEG = 88;

const DOOR_FILE = /^door(_closed)?_\d{1,2}\.(jpg|jpeg|png)$/i;

const kb = (bytes) => `${Math.round(bytes / 1024)} kB`;

async function main() {
  const only = process.argv[2]; // optional: single name, e.g. door_7 / door_closed_12
  const allFiles = (await readdir(srcDir)).filter((f) => DOOR_FILE.test(f)).sort();

  // Group by door name (extension stripped); PNG wins over JPG if both exist.
  const byName = new Map();
  for (const file of allFiles) {
    const name = basename(file, file.slice(file.lastIndexOf('.')));
    if (byName.has(name) && !file.toLowerCase().endsWith('.png')) continue;
    if (byName.has(name)) console.warn(`⚠ ${name}: PNG überschreibt JPG-Original`);
    byName.set(name, file);
  }

  const selected = only
    ? [...byName].filter(([name]) => name === only)
    : [...byName];

  if (selected.length === 0) {
    console.error(`keine Original-Dateien gefunden${only ? ` für "${only}"` : ''} in ${srcDir}`);
    process.exitCode = 1;
    return;
  }

  for (const [name, file] of selected) {
    const image = sharp(join(srcDir, file)).resize({
      width: SIZE,
      height: SIZE,
      fit: 'cover',
      withoutEnlargement: true,
    });

    const webp = await image.clone().webp({ quality: QUALITY_WEBP }).toBuffer();
    const jpeg = await image.clone().jpeg({ quality: QUALITY_JPEG, progressive: true, mozjpeg: true }).toBuffer();

    await writeFile(join(outDir, `${name}.webp`), webp);
    await writeFile(join(outDir, `${name}.jpg`), jpeg);
    console.log(`✔ ${name}: webp ${kb(webp.length)} · jpeg ${kb(jpeg.length)}`);
  }

  console.log(`\n${selected.length} Türchen verarbeitet → ${outDir}`);
}

void main();
