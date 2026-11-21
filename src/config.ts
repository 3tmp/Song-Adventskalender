/**
 * Runtime configuration.
 *
 * The plan's hidden dev flags: `?dev=all` unlocks every door for testing
 * (`?dev=open` additionally marks them all as opened, view-only).
 * Kept as a pure function so the same logic runs in the browser, in tests,
 * and in the build-time content validator.
 */

export interface AppConfig {
  /** Unlock all doors for testing (`?dev=all`). */
  devUnlockAll: boolean;
  /** Unlock *and* show all doors as opened (`?dev=open`). Implies devUnlockAll. */
  devOpenAll: boolean;
}

export function readConfig(urlSearch: string): AppConfig {
  const search = urlSearch.startsWith('?') ? urlSearch.slice(1) : urlSearch;
  const params = new URLSearchParams(search);
  const devOpenAll = params.get('dev') === 'open';
  return {
    devUnlockAll: devOpenAll || params.get('dev') === 'all',
    devOpenAll,
  };
}
