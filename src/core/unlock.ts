/**
 * Unlock rule (plan §5): door N of season year Y is openable from
 * December N of Y onward, in *local device time*. Any season that has ended
 * is therefore fully unlocked — past seasons stay accessible via deep links.
 * Clock manipulation is accepted; this is a feel-good app, not DRM.
 */

/** Number of doors — the calendar is a strict 1..24 grid. */
export const DOOR_COUNT = 24;

/** Month index of December. */
const DECEMBER = 11;

export function isDayUnlocked(
  day: number,
  seasonYear: number,
  now: Date,
  devUnlockAll = false,
): boolean {
  if (devUnlockAll) return true;
  if (!Number.isInteger(day) || day < 1 || day > DOOR_COUNT) return false;
  const unlocksAt = new Date(seasonYear, DECEMBER, day).getTime();
  return now.getTime() >= unlocksAt;
}

/**
 * The door that opens *today*: the current date if we are on December 1–24,
 * `null` otherwise (no highlight, see the teaser instead).
 */
export function todayDay(now: Date): number | null {
  if (now.getMonth() !== DECEMBER) return null;
  const date = now.getDate();
  return date >= 1 && date <= DOOR_COUNT ? date : null;
}

/**
 * Whether a season is fully over — true from December 25 of the season year
 * onward (door 24 has unlocked on the 24th, so every door is open).
 */
export function isSeasonEnded(seasonYear: number, now: Date): boolean {
  return now.getTime() >= new Date(seasonYear, DECEMBER, 25).getTime();
}
