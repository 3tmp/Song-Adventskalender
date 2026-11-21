import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

describe('readConfig', () => {
  it('defaults to no dev unlock', () => {
    expect(readConfig('')).toEqual({ devUnlockAll: false });
    expect(readConfig('?foo=bar')).toEqual({ devUnlockAll: false });
  });

  it('enables the hidden dev flag via ?dev=all', () => {
    expect(readConfig('?dev=all')).toEqual({ devUnlockAll: true });
    expect(readConfig('?dev=all&other=1')).toEqual({ devUnlockAll: true });
  });

  it('ignores other dev values', () => {
    expect(readConfig('?dev=some')).toEqual({ devUnlockAll: false });
    expect(readConfig('?debug=all')).toEqual({ devUnlockAll: false });
  });

  it('accepts a search string with or without the leading "?"', () => {
    expect(readConfig('?dev=all')).toEqual(readConfig('dev=all'));
  });
});
