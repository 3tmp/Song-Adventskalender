/** Content model (plan §3): a day is a thin `day` + `type` envelope. */

/**
 * Payload of the `song` type: quote + motivational text + optional
 * YouTube/Spotify embeds (v1's main entry type).
 */
export interface SongPayload {
  title: string;
  artist: string;
  quote: string;
  text: string;
  spotifyId?: string;
  youtubeId?: string;
}

/**
 * Payload of the `text` type (v1's `impuls`, renamed): quote + text only.
 * `quote` may be empty — some v1 impuls entries had none.
 */
export interface TextPayload {
  title: string;
  quote?: string;
  text: string;
}

export type EntryType = 'song' | 'text';

/** The registry entry for a given type. */
export type EntryOf<K extends EntryType> = Extract<CalendarEntry, { type: K }>;
/** The payload of a given entry type. */
export type PayloadOf<K extends EntryType> = EntryOf<K>['payload'];

export type CalendarEntry =
  | { day: number; type: 'song'; payload: SongPayload }
  | { day: number; type: 'text'; payload: TextPayload };

export interface YearContent {
  schemaVersion: 2;
  year: number;
  entries: CalendarEntry[];
}
