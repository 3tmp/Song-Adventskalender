// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderCalendar, type CalendarContext } from './calendar';
import type { CalendarEntry } from '../entries/types';
import type { SeasonState } from '../core/state';

function entry(day: number): CalendarEntry {
  return {
    day,
    type: day % 2 === 0 ? 'song' : 'text',
    payload:
      day % 2 === 0
        ? { title: `Song ${day}`, artist: `Artist ${day}`, quote: 'q', text: 't' }
        : { title: `Impuls ${day}`, text: 't' },
  } as CalendarEntry;
}

function context(overrides: Partial<CalendarContext> = {}): CalendarContext {
  return {
    season: { year: 2026, phase: 'active' },
    entries: Array.from({ length: 24 }, (_, i) => entry(i + 1)),
    state: {
      version: 2,
      year: 2026,
      seed: 1,
      openedDays: [1, 4],
      lastVisit: '2026-12-05',
    } satisfies SeasonState as SeasonState,
    now: new Date(2026, 11, 5),
    config: { devUnlockAll: false },
    onOpen: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
}

let consoleError: ReturnType<typeof vi.spyOn> | null = null;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => consoleError?.mockRestore());

describe('renderCalendar', () => {
  it('renders 24 doors with the right state classes', () => {
    const view = renderCalendar(context());
    const doors = [...view.querySelectorAll<HTMLElement>('.door')];
    expect(doors).toHaveLength(24);
    expect(doors[0].classList.contains('door--opened')).toBe(true);
    expect(doors[3].classList.contains('door--opened')).toBe(true);
    expect(doors[4].classList.contains('door--today')).toBe(true);
    expect(doors[10].classList.contains('door--locked')).toBe(true);
    expect(doors[10].classList.contains('door--sealed')).toBe(true);
  });

  it('leaves the number to the artwork on closed doors, chips it on opened ones', () => {
    const view = renderCalendar(context());
    const doors = [...view.querySelectorAll<HTMLElement>('.door')];
    // closed/today doors: no number overlay (photos carry the number)
    expect(doors[10].querySelector('.door-number')).toBeNull();
    expect(doors[4].querySelector('.door-number')).toBeNull();
    // opened doors: corner chip on the opened photo
    expect(doors[0].querySelector('.door-number')?.textContent).toBe('1');
    expect(doors[3].querySelector('.door-number')?.textContent).toBe('4');
  });

  it('shows door preview captions only for opened doors, below the image', () => {
    const view = renderCalendar(context());
    const cells = [...view.querySelectorAll<HTMLElement>('.door-cell')];
    const openedSong = cells[3];
    const openedText = cells[0];
    expect(openedSong.querySelector('.door-preview-title')?.textContent).toBe('Song 4');
    expect(openedSong.querySelector('.door-preview-subtitle')?.textContent).toBe('Artist 4');
    expect(openedText.querySelector('.door-preview-label')?.textContent).toBe('Impuls');
    expect(openedText.querySelector('.door-preview-title')?.textContent).toBe('Impuls 1');
    // caption sits below the image, never as an overlay on the door
    expect(openedSong.querySelector('.door .door-preview')).toBeNull();
    expect(view.querySelectorAll('.door-preview')).toHaveLength(2);
  });

  it('opens unlocked-but-unopened doors through onOpen', () => {
    const ctx = context();
    const view = renderCalendar(ctx);
    const today = view.querySelectorAll<HTMLElement>('.door')[4]; // Dec 5
    (today as HTMLButtonElement).click();
    expect(ctx.onOpen).toHaveBeenCalledExactlyOnceWith(5);
  });

  it('does not open sealed doors and shakes instead', () => {
    const ctx = context();
    const view = renderCalendar(ctx);
    const future = view.querySelectorAll<HTMLElement>('.door')[10]; // Dec 11
    (future as HTMLButtonElement).click();
    expect(ctx.onOpen).not.toHaveBeenCalled();
    expect(future.classList.contains('door--shake')).toBe(true);
  });

  it('marks everything openable under the dev flag', () => {
    const ctx = context({ config: { devUnlockAll: true } });
    const view = renderCalendar(ctx);
    const future = view.querySelectorAll<HTMLElement>('.door')[20];
    expect(future.classList.contains('door--sealed')).toBe(false);
    (future as HTMLButtonElement).click();
    expect(ctx.onOpen).toHaveBeenCalledExactlyOnceWith(21);
  });

  it('shows the teaser outside December', () => {
    const view = renderCalendar(
      context({ season: { year: 2026, phase: 'upcoming' }, now: new Date(2026, 10, 20) }),
    );
    const status = view.querySelector('.cal-status')?.textContent ?? '';
    expect(status).toContain('abwarten und Tee trinken');
  });

  it('replaces the teaser with a dev status under the dev flag outside December', () => {
    const view = renderCalendar(
      context({
        season: { year: 2026, phase: 'upcoming' },
        now: new Date(2026, 10, 20),
        config: { devUnlockAll: true },
        state: {
          version: 2,
          year: 2026,
          seed: 1,
          openedDays: [2, 7],
          lastVisit: '2026-11-20',
        } satisfies SeasonState as SeasonState,
      }),
    );
    const status = view.querySelector('.cal-status')?.textContent ?? '';
    expect(status).not.toContain('abwarten und Tee trinken');
    expect(status).toContain('Dev-Modus');
    expect(status).toContain('2 geöffnet');
  });

  it('wires the reset button through onReset after confirmation', () => {
    const ctx = context();
    const view = renderCalendar(ctx);
    const reset = view.querySelector<HTMLButtonElement>('.cal-reset')!;
    vi.stubGlobal('confirm', vi.fn(() => false));
    reset.click();
    expect(ctx.onReset).not.toHaveBeenCalled();
    (globalThis.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
    reset.click();
    expect(ctx.onReset).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
