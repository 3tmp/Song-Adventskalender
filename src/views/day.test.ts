// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDayView, type DayContext } from './day';
import type { CalendarEntry } from '../entries/types';

const songEntry: CalendarEntry = {
  day: 7,
  type: 'song',
  payload: {
    title: 'Running on Air',
    artist: 'Nathan Trent',
    quote: '…running on air',
    text: 'Deutscher Motivationstext.',
    spotifyId: '1WpQu8U3quBeGnhpZn0r7N',
    youtubeId: 'SpPM1V3dqZE',
  },
};

const textEntry: CalendarEntry = {
  day: 2,
  type: 'text',
  payload: { title: 'Meine Werte', text: 'Guter Impuls.' },
};

function context(overrides: Partial<DayContext> = {}): DayContext {
  return {
    day: 7,
    year: 2026,
    entry: songEntry,
    canOpen: vi.fn(() => true),
    onBack: vi.fn(),
    onOpenDay: vi.fn(),
    ...overrides,
  };
}

let view: ReturnType<typeof renderDayView> | null = null;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});
afterEach(() => {
  view?.dispose();
  view = null;
  document.body.innerHTML = '';
});

describe('renderDayView', () => {
  it('renders the type-agnostic shell around the song body', () => {
    view = renderDayView(context());
    document.querySelector('#app')!.append(view.element);
    const kicker = view.element.querySelector('.day-kicker')?.textContent ?? '';
    expect(kicker).toContain('Türchen 7');
    expect(kicker).toContain('Dezember 2026');
    expect(kicker).toContain('Song');
    expect(view.element.querySelector('.song-title')?.textContent).toBe('Running on Air');
    expect(view.element.querySelectorAll('.embed')).toHaveLength(2);
  });

  it('renders text-type entries without embeds', () => {
    view = renderDayView(context({ day: 2, entry: textEntry }));
    expect(view.element.querySelector('.entry-title')?.textContent).toBe('Meine Werte');
    expect(view.element.querySelector('.embeds')).toBeNull();
    expect(view.element.querySelector('.day-kicker')?.textContent).toContain('Impuls');
  });

  it('funnels the close button through onBack', () => {
    const ctx = context();
    view = renderDayView(ctx);
    (view.element.querySelector('.day-close') as HTMLButtonElement).click();
    expect(ctx.onBack).toHaveBeenCalledOnce();
  });

  it('funnels Escape through onBack and stops after dispose', () => {
    const ctx = context();
    view = renderDayView(ctx);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(ctx.onBack).toHaveBeenCalledOnce();
    view.dispose();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(ctx.onBack).toHaveBeenCalledOnce();
  });

  it('shows the previous-day link only for openable earlier days', () => {
    view = renderDayView(context());
    expect(view.element.querySelector('.day-prev')).not.toBeNull();

    const ctxFirst = context({ day: 1 });
    view.dispose();
    view = renderDayView(ctxFirst);
    expect(view.element.querySelector('.day-prev')).toBeNull();

    const ctxLocked = context({ day: 4, canOpen: vi.fn(() => false) });
    view.dispose();
    view = renderDayView(ctxLocked);
    expect(view.element.querySelector('.day-prev')).toBeNull();
  });

  it('navigates to the previous day when its link is tapped', () => {
    const ctx = context({ day: 4, entry: { ...songEntry, day: 4 } });
    view = renderDayView(ctx);
    (view.element.querySelector('.day-prev') as HTMLButtonElement).click();
    expect(ctx.onOpenDay).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('injects embeds immediately when IntersectionObserver is unavailable', () => {
    view = renderDayView(context());
    // jsdom has no IntersectionObserver → the fallback must have injected
    // the iframes instead of the buttons.
    expect(view.element.querySelectorAll('iframe.embed-frame')).toHaveLength(2);
    expect(view.element.querySelector('button.embed-load')).toBeNull();
  });

  it('lazy-loads embeds via IntersectionObserver when available', () => {
    const instances: { cb: (entries: { isIntersecting: boolean; target: Element }[]) => void }[] = [];
    class MockIO {
      constructor(cb: (entries: { isIntersecting: boolean; target: Element }[]) => void) {
        instances.push({ cb });
      }
      observe() {}
      unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', MockIO as unknown as typeof IntersectionObserver);
    view = renderDayView(context());
    expect(view.element.querySelectorAll('iframe')).toHaveLength(0);
    expect(view.element.querySelectorAll('button.embed-load')).toHaveLength(2);

    const cards = [...view.element.querySelectorAll('[data-youtube],[data-spotify]')];
    instances[0]!.cb(cards.map((target) => ({ isIntersecting: true, target })));
    expect(view.element.querySelectorAll('iframe.embed-frame')).toHaveLength(2);
    expect(view.element.querySelector('button.embed-load')).toBeNull();
    vi.unstubAllGlobals();
  });
});
