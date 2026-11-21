import { describe, expect, it } from 'vitest';
import { payloadSchemas, songPayloadSchema, textPayloadSchema } from './schemas';
import type { EntryType } from './types';

const validSong = {
  title: 'Running on Air',
  artist: 'Nathan Trent',
  quote: 'I’m running on air',
  text: 'Deutscher Motivationstext …',
  spotifyId: '1WpQu8U3quBeGnhpZn0r7N',
  youtubeId: 'SpPM1V3dqZE',
};

const validText = {
  title: 'Meine Werte',
  quote: '',
  text: 'Ich finde es total spannend …',
};

describe('songPayloadSchema', () => {
  it('accepts a well-formed song payload', () => {
    expect(songPayloadSchema.parse(validSong)).toEqual(validSong);
    expect(songPayloadSchema.parse({ ...validSong, spotifyId: undefined })).toEqual({
      ...validSong,
      spotifyId: undefined,
    });
  });

  it('requires title, artist, quote and text', () => {
    for (const key of ['title', 'artist', 'quote', 'text']) {
      const broken = { ...validSong, [key]: '' };
      expect(() => songPayloadSchema.parse(broken)).toThrow();
    }
  });

  it('rejects malformed embed ids', () => {
    expect(() => songPayloadSchema.parse({ ...validSong, spotifyId: 'too-short' })).toThrow();
    expect(() => songPayloadSchema.parse({ ...validSong, youtubeId: '.way too long' })).toThrow();
  });
});

describe('textPayloadSchema', () => {
  it('accepts a well-formed text payload', () => {
    expect(textPayloadSchema.parse(validText)).toEqual(validText);
    // quote is optional (some v1 impuls entries had none)
    expect(textPayloadSchema.parse({ title: 'X', text: 'Y' })).toEqual({ title: 'X', text: 'Y' });
  });

  it('requires title and text', () => {
    expect(() => textPayloadSchema.parse({ ...validText, text: '' })).toThrow();
    expect(() => textPayloadSchema.parse({ ...validText, title: '' })).toThrow();
    expect(() => textPayloadSchema.parse({ text: 'no title' })).toThrow();
  });
});

describe('payloadSchemas registry', () => {
  it('covers exactly the registered entry types', () => {
    const types = [...Object.keys(payloadSchemas)] as EntryType[];
    expect(new Set(types)).toEqual(new Set(['song', 'text']));
  });

  it('parses sample payloads without changing them', () => {
    expect(payloadSchemas.song.parse(validSong)).toEqual(validSong);
    expect(payloadSchemas.text.parse(validText)).toEqual(validText);
  });
});
