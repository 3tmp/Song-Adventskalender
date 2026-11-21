/**
 * Hash-based SPA routing (plan §2/§5): History API (`pushState` +
 * `popstate`) with year-scoped hash deep links (`#day=7&year=2026`).
 *
 * Deep links are plain hashes so they work on static hosting without
 * server rewrites — shareable, refresh-safe, guarded by the unlock rule
 * where they are consumed.
 *
 * All back affordances (top-left ✕, Esc, swipe) funnel through
 * `router.goBack()` and therefore through `history.back()` — except when
 * the day view was deep-linked directly: then there is no in-app parent
 * entry, and the router replaces the URL with the clean grid URL instead.
 */

export type Route =
  | { view: 'grid' }
  | { view: 'day'; day: number; year: number };

interface HistoryTag {
  sak: { view: 'grid' | 'day'; year: number };
}

/** Serializes a day route to `#day=N&year=Y`. */
export function dayHash(day: number, year: number): string {
  return `#day=${day}&year=${year}`;
}

/** Pure hash → route parsing; `year` is optional and defaults per season. */
export function parseRoute(hash: string, defaultYear: number): Route {
  const query = hash.replace(/^#/, '');
  if (!query) return { view: 'grid' };

  const params = new URLSearchParams(query);
  const dayRaw = params.get('day');
  if (dayRaw === null) return { view: 'grid' };

  const day = Number(dayRaw);
  if (!Number.isInteger(day) || day < 1 || day > 24) return { view: 'grid' };

  const yearRaw = params.get('year');
  const year = yearRaw === null ? defaultYear : Number(yearRaw);
  if (!Number.isInteger(year) || year < 1970 || year > 2999) return { view: 'grid' };

  return { view: 'day', day, year };
}

export interface Router {
  readonly route: Route;
  subscribe(listener: (route: Route) => void): () => void;
  /** Opens the day view (grid entry is pushed beneath it for back()). */
  navigateToDay(day: number, year: number): void;
  /** Places the clean grid URL at the current position. */
  navigateToGrid(): void;
  /** The one back path: pops the in-app grid entry or replaces when deep-linked. */
  goBack(): void;
}

export function createRouter(defaultYear: number): Router {
  const listeners = new Set<(route: Route) => void>();

  const currentRoute = (): Route => parseRoute(location.hash, defaultYear);

  function notify(): void {
    for (const listener of listeners) listener(currentRoute());
  }

  const gridUrl = (): string => location.pathname + location.search;

  const pushGridEntry = (year: number): void => {
    const tag: HistoryTag = { sak: { view: 'grid', year } };
    history.pushState(tag, '', gridUrl());
  };

  const router: Router = {
    get route() {
      return currentRoute();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },

    navigateToDay(day, year) {
      pushGridEntry(year);
      const tag: HistoryTag = { sak: { view: 'day', year } };
      const url = `${location.pathname}${location.search}${dayHash(day, year)}`;
      history.pushState(tag, '', url);
      notify();
    },

    navigateToGrid() {
      const tag: HistoryTag = { sak: { view: 'grid', year: defaultYear } };
      history.replaceState(tag, '', gridUrl());
      notify();
    },

    goBack() {
      const isOurs = Boolean(history.state && (history.state as HistoryTag).sak);
      if (isOurs) {
        history.back(); // popstate → notify
      } else {
        router.navigateToGrid(); // deep-linked day view: replace URL to grid
      }
    },
  };

  window.addEventListener('popstate', notify);
  window.addEventListener('hashchange', notify);

  return router;
}
