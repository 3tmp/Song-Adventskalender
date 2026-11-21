import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

describe('readConfig', () => {
  it('defaults to no dev flags', () => {
    expect(readConfig('')).toEqual({ devUnlockAll: false, devOpenAll: false });
    expect(readConfig('?foo=bar')).toEqual({ devUnlockAll: false, devOpenAll: false });
  });

  it('enables the hidden unlock flag via ?dev=all', () => {
    expect(readConfig('?dev=all')).toEqual({ devUnlockAll: true, devOpenAll: false });
    expect(readConfig('?dev=all&other=1')).toEqual({ devUnlockAll: true, devOpenAll: false });
  });

  it('enables unlock *and* open-all via ?dev=open (implies dev=all)', () => {
    expect(readConfig('?dev=open')).toEqual({ devUnlockAll: true, devOpenAll: true });
    expect(readConfig('?dev=open&other=1')).toEqual({ devUnlockAll: true, devOpenAll: true });
  });

  it('ignores other dev values', () => {
    expect(readConfig('?dev=some')).toEqual({ devUnlockAll: false, devOpenAll: false });
    expect(readConfig('?debug=all')).toEqual({ devUnlockAll: false, devOpenAll: false });
  });

  it('accepts a search string with or without the leading "?"', () => {
    expect(readConfig('?dev=all')).toEqual(readConfig('dev=all'));
  });
});
