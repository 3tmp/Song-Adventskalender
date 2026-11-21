import { z } from 'zod';
import type { EntryType, PayloadOf } from './types';
/**
 * Build-time payload validation (plan §3). Imported ONLY by the content
 * validator script and tests — never by runtime code, so zod stays out of
 * the shipped bundle (< 15 kB gzip budget).
 *
 * The mapped type below forces this map to cover exactly the types the
 * registry knows; payload schemas and renderers can never drift apart.
 */

export const songPayloadSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  quote: z.string().min(1),
  text: z.string().min(1),
  spotifyId: z
    .string()
    .regex(/^[0-9A-Za-z]{22}$/, 'Spotify IDs are 22 base62 characters')
    .optional(),
  youtubeId: z
    .string()
    .regex(/^[\w-]{11}$/, 'YouTube IDs are 11 characters')
    .optional(),
});

export const textPayloadSchema = z.object({
  title: z.string().min(1),
  quote: z.string().optional(),
  text: z.string().min(1),
});

const schemaMap = {
  song: songPayloadSchema,
  text: textPayloadSchema,
};

type PayloadSchemaMap = {
  readonly [K in EntryType]: z.ZodType<PayloadOf<K>>;
};

export const payloadSchemas: PayloadSchemaMap = schemaMap;
