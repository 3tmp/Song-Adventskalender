/**
 * Calendar grid view (plan §6), type-agnostic by design: it only knows days
 * and their unlock/open state; what an opened door *shows* comes from the
 * entry's `doorPreview()` via the registry.
 */

import { h } from '../dom';
import { doorPreviewFor } from '../entries/registry';
import type { CalendarEntry } from '../entries/types';
import type { SeasonInfo } from '../core/season';
import { isDayUnlocked, isSeasonEnded, todayDay, DOOR_COUNT } from '../core/unlock';
import type { SeasonState } from '../core/state';
import type { AppConfig } from '../config';
import { showToast } from './toast';

export interface CalendarContext {
  season: SeasonInfo;
  /** Entries assigned to the doors (already permuted per season seed). */
  entries: CalendarEntry[];
  state: SeasonState;
  now: Date;
  config: AppConfig;
  onOpen(day: number): void;
  onReset(): void;
}

function seasonStatus(ctx: CalendarContext): string {
  const { season, state, now } = ctx;
  if (season.phase === 'upcoming') {
    return 'Alle 24 Türchen sind noch zu — abwarten und Tee trinken… ☕';
  }
  if (isSeasonEnded(season.year, now)) {
    return `Alle Türchen der Saison ${season.year} sind offen. Frohe Weihnachten! 🎄`;
  }
  const today = todayDay(now);
  const openedCount = state.openedDays.length;
  if (today !== null && !state.openedDays.includes(today)) {
    return `Türchen ${today} ist offen — viel Freude! ✨ (${openedCount}/24 geöffnet)`;
  }
  return `${openedCount} von ${DOOR_COUNT} Türchen geöffnet. Schau heute wieder vorbei!`;
}

function doorStatus(ctx: CalendarContext, day: number): 'locked' | 'opened' | 'today' {
  const { state, now, config } = ctx;
  if (state.openedDays.includes(day)) return 'opened';
  // "today" only wins while the door really is openable (the daily hook).
  if (todayDay(now) === day && isDayUnlocked(day, ctx.season.year, now, config.devUnlockAll)) {
    return 'today';
  }
  return 'locked';
}

function renderDoor(ctx: CalendarContext, day: number): HTMLElement {
  const entry = ctx.entries[day - 1];
  if (!entry) throw new Error(`no entry behind door ${day}`);
  const status = doorStatus(ctx, day);
  const opened = status === 'opened';
  const unlocked = isDayUnlocked(day, ctx.season.year, ctx.now, ctx.config.devUnlockAll);

  const classes = ['door', `door--${status}`];
  if (!unlocked) classes.push('door--sealed');

  const children: HTMLElement[] = [h('span', { class: 'door-number', text: String(day) })];

  if (opened) {
    const preview = doorPreviewFor(entry);
    children.push(
      h('div', { class: 'door-preview' }, [
        ...(preview.label ? [h('span', { class: 'door-preview-label', text: preview.label })] : []),
        h('span', { class: 'door-preview-title', text: preview.title }),
        ...(preview.subtitle
          ? [h('span', { class: 'door-preview-subtitle', text: preview.subtitle })]
          : []),
      ]),
    );
  } else if (status === 'today') {
    children.push(h('span', { class: 'door-today-badge', text: '✨ heute' }));
  }

  const ariaLabel = opened
    ? `Tür ${day} öffnen: ${doorPreviewFor(entry).title}`
    : unlocked
      ? `Tür ${day} öffnen`
      : `Tür ${day} — noch verschlossen`;

  const button = h(
    'button',
    { class: classes.join(' '), attrs: { 'aria-label': ariaLabel }, data: { day: String(day) } },
    children,
  );

  button.addEventListener('click', () => {
    if (unlocked) {
      ctx.onOpen(day);
    } else {
      button.classList.add('door--shake');
      button.addEventListener('animationend', () => button.classList.remove('door--shake'), {
        once: true,
      });
      showToast('Noch zu — abwarten und Tee trinken… ☕');
    }
  });

  return button;
}

export function renderCalendar(ctx: CalendarContext): HTMLElement {
  const doors = Array.from({ length: DOOR_COUNT }, (_, i) => renderDoor(ctx, i + 1));

  const resetButton = h('button', {
    class: 'cal-reset',
    attrs: { 'aria-label': `Adventskalender ${ctx.season.year} auf diesem Gerät zurücksetzen` },
    text: `Kalender ${ctx.season.year} zurücksetzen`,
  });
  resetButton.addEventListener('click', () => {
    if (window.confirm(`Wirklich alle geöffneten Türchen von ${ctx.season.year} auf diesem Gerät zurücksetzen?`)) {
      ctx.onReset();
    }
  });

  return h('div', { class: 'view view-calendar' }, [
    h('header', { class: 'cal-header' }, [
      h('p', { class: 'cal-brand', text: 'Song-Adventskalender' }),
      h('h1', { class: 'cal-year', text: `Advent ${ctx.season.year}` }),
      h('p', { class: 'cal-status', text: seasonStatus(ctx) }),
    ]),
    h('main', { class: 'cal-grid' }, doors),
    h('footer', { class: 'cal-footer' }, [
      h('p', {
        class: 'cal-privacy',
        text: '100 % ohne Server: deine Türchen und Fortschritte bleiben auf diesem Gerät.',
      }),
      resetButton,
    ]),
  ]);
}
