/**
 * Runtime configuration.
 *
 * The plan's hidden dev flag: `?dev=all` unlocks every door for testing.
 * Kept as a pure function so the same logic runs in the browser, in tests,
 * and in the build-time content validator.
 */

export interface AppConfig {
  /** Unlock all doors for testing (`?dev=all`). */
  devUnlockAll: boolean;
}

export function readConfig(urlSearch: string): AppConfig {
  const search = urlSearch.startsWith('?') ? urlSearch.slice(1) : urlSearch;
  const params = new URLSearchParams(search);
  return {
    devUnlockAll: params.get('dev') === 'all',
  };
}
