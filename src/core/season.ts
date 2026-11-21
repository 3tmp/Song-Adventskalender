/**
 * Active-season resolution from the device date (see plan §4/§5).
 *
 * December belongs to the current year. Outside December the grid shows the
 * upcoming season of the current year with all doors locked and a friendly
 * "see you in December" teaser. Past seasons are not surfaced by any UI —
 * they stay reachable forever via year-scoped deep links
 * (`#day=7&year=2025`).
 */

export type SeasonPhase = 'upcoming' | 'active';

export interface SeasonInfo {
  year: number;
  phase: SeasonPhase;
}

/** Month index of December. */
const DECEMBER = 11;

export function resolveSeason(now: Date): SeasonInfo {
  return {
    year: now.getFullYear(),
    phase: now.getMonth() === DECEMBER ? 'active' : 'upcoming',
  };
}
