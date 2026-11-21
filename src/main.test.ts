// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveSeason } from './core/season';

/**
 * End-to-end boot smoke: main.ts wires season, content, state and router
 * for the real active season (the season resolved from the test machine's
 * date — the same rule the build validator enforces).
 */

async function waitFor(check: () => boolean, timeoutMs = 4000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return false;
}

describe('app boot', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.localStorage.clear();
    history.replaceState(null, '', location.pathname);
  });

  it('renders the full 24-door calendar for the active season', async () => {
    await import('./main');
    const ready = await waitFor(() => document.querySelector('.view-calendar') !== null);
    expect(ready).toBe(true);

    expect(document.querySelectorAll('.door')).toHaveLength(24);
    const status = document.querySelector('.cal-status')?.textContent ?? '';
    expect(status.length).toBeGreaterThan(10);
    expect(document.querySelector('.snow')?.querySelectorAll('.flake')).toHaveLength(14);
  });

  it('opens the day view through the dev flag and returns via Escape', async () => {
    history.replaceState(null, '', `${location.pathname}?dev=all`);
    vi.resetModules();

    await import('./main');
    const gridReady = await waitFor(() => document.querySelector('.view-calendar') !== null);
    expect(gridReady).toBe(true);

    const door = document.querySelector('[data-day="7"]') as HTMLButtonElement;
    expect(door.classList.contains('door--sealed')).toBe(false);
    door.click();

    const dayReady = await waitFor(() => document.querySelector('.view-day') !== null);
    expect(dayReady).toBe(true);
    const kicker = document.querySelector('.day-kicker')?.textContent ?? '';
    expect(kicker).toContain('Türchen 7');
    expect(document.querySelector('.hero-quote, .entry-text')).not.toBeNull();

    // The day was marked as opened in the season state.
    const year = resolveSeason(new Date()).year;
    const raw = window.localStorage.getItem(`sak.${year}`);
    expect(raw && JSON.parse(raw).openedDays).toContain(7);

    // Esc funnels back to the grid (the single back path).
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const backReady = await waitFor(
      () =>
        document.querySelector('.view-day') === null &&
        document.querySelector('.view-calendar') !== null,
      2000,
    );
    expect(backReady).toBe(true);
  });
});
