import type { CalendarEntry, EntryType, PayloadOf } from './types';
import { songRenderer } from './song';
import { textRenderer } from './text';

/**
 * Entry-type registry (plan §3). Every door type registers its renderer
 * here; grid, router, state, and unlock logic stay type-agnostic.
 *
 * Adding a future type (e.g. `image`) is one renderer file plus one line
 * here plus one `CalendarEntry` variant — nothing else in the app changes.
 * Adding a renderer here without extending `CalendarEntry` — or vice
 * versa — fails to compile (`{ [K in EntryType]: EntryRenderer<K> }`).
 */

export type { EntryOf, PayloadOf } from './types';

/** What an opened door tile shows for an entry. */
export interface DoorPreview {
  /** Small label, e.g. "Song" or "Impuls". */
  label?: string;
  title: string;
  subtitle?: string;
}

export interface RenderContext {
  day: number;
  year: number;
}

export interface EntryRenderer<K extends EntryType = EntryType> {
  doorPreview(payload: PayloadOf<K>): DoorPreview;
  renderDay(payload: PayloadOf<K>, ctx: RenderContext): HTMLElement;
  /** Optional: lazy asset handling for the already-rendered day body. */
  preload?(payload: PayloadOf<K>, container: HTMLElement): void;
}

export const registry: { readonly [K in EntryType]: EntryRenderer<K> } = {
  song: songRenderer,
  text: textRenderer,
};

function assertNever(value: never): never {
  throw new Error(`Unhandled entry type: ${String(value)}`);
}

/** Renders any entry's day body via the registry (exhaustive at compile time). */
export function renderEntryDay(entry: CalendarEntry, ctx: RenderContext): HTMLElement {
  switch (entry.type) {
    case 'song':
      return registry.song.renderDay(entry.payload, ctx);
    case 'text':
      return registry.text.renderDay(entry.payload, ctx);
    default:
      return assertNever(entry);
  }
}

/** Lazy-load hooks for any entry (exhaustive at compile time). */
export function preloadEntry(entry: CalendarEntry, container: HTMLElement): void {
  switch (entry.type) {
    case 'song':
      registry.song.preload?.(entry.payload, container);
      return;
    case 'text':
      registry.text.preload?.(entry.payload, container);
      return;
    default:
      assertNever(entry);
  }
}

/** Door preview for any entry via the registry (exhaustive at compile time). */
export function doorPreviewFor(entry: CalendarEntry): DoorPreview {
  switch (entry.type) {
    case 'song':
      return registry.song.doorPreview(entry.payload);
    case 'text':
      return registry.text.doorPreview(entry.payload);
    default:
      return assertNever(entry);
  }
}
