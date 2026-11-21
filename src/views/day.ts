/**
 * Day view (plan §6): a type-agnostic shell — header, back affordances,
 * open animation — whose body is rendered by the entry type's
 * `renderDay()` via the registry.
 *
 * All back affordances (top-left ✕, Esc key, mobile swipe) funnel through
 * the caller's single `onBack` → `history.back()` path. The shell returns
 * a `dispose()` because it listens on `document` while mounted.
 */

import { h } from '../dom';
import { doorPreviewFor, renderEntryDay, preloadEntry } from '../entries/registry';
import type { CalendarEntry } from '../entries/types';

export interface DayContext {
  day: number;
  year: number;
  entry: CalendarEntry;
  /** Whether a day is openable in this season (used for the previous-day link). */
  canOpen(day: number): boolean;
  onBack(): void;
  /** Navigates to another day within the same season. */
  onOpenDay(day: number): void;
}

export interface DayView {
  element: HTMLElement;
  dispose(): void;
}

const SWIPE_MIN_DISTANCE = 72;
const SWIPE_MAX_OFF_AXIS = 48;

export function renderDayView(ctx: DayContext): DayView {
  const label = doorPreviewFor(ctx.entry).label;

  const closeButton = h('button', {
    class: 'day-close',
    attrs: { 'aria-label': 'Zurück zum Kalender', type: 'button' },
  });
  closeButton.addEventListener('click', () => ctx.onBack());

  const body = renderEntryDay(ctx.entry, { day: ctx.day, year: ctx.year });
  // Wire the entry type's lazy loading (embed iframes on scroll).
  preloadEntry(ctx.entry, body);

  const children: (HTMLElement | null)[] = [
    body,
    ctx.day > 1 && ctx.canOpen(ctx.day - 1)
      ? h('button', { class: 'day-prev', attrs: { type: 'button' }, text: '← Voriges Türchen' })
      : null,
  ];
  const prevButton = children[1];
  prevButton?.addEventListener('click', () => ctx.onOpenDay(ctx.day - 1));

  const element = h(
    'div',
    { class: 'view view-day', data: { day: String(ctx.day), year: String(ctx.year) } },
    [
      h('header', { class: 'day-header' }, [
        closeButton,
        h('p', {
          class: 'day-kicker',
          text: `Türchen ${ctx.day} · Dezember ${ctx.year}${label ? ` · ${label}` : ''}`,
        }),
      ]),
      h('div', { class: 'day-body' }, children.filter((c): c is HTMLElement => c !== null)),
    ],
  );

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      ctx.onBack();
    }
  };
  document.addEventListener('keydown', onKeydown);

  // Mobile swipe: horizontal flick anywhere in the view goes back.
  let startX: number | null = null;
  let startY: number | null = null;
  const onTouchStart = (event: TouchEvent): void => {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  };
  const onTouchEnd = (event: TouchEvent): void => {
    if (startX === null || startY === null) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = Math.abs(touch.clientY - startY);
    startX = startY = null;
    if (dy < SWIPE_MAX_OFF_AXIS && Math.abs(dx) > SWIPE_MIN_DISTANCE) {
      ctx.onBack();
    }
  };
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });

  // Focus the close button so Esc/back is obvious and keyboard users are set.
  requestAnimationFrame(() => closeButton.focus());

  return {
    element,
    dispose() {
      document.removeEventListener('keydown', onKeydown);
    },
  };
}
