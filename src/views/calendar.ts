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
  const { season, state, now, config } = ctx;
  if (season.phase === 'upcoming') {
    // The dev flag keeps the grid usable outside December — don't tease.
    if (config.devUnlockAll) {
      return `Dev-Modus: alle ${DOOR_COUNT} Türchen sind testweise offen (${state.openedDays.length} geöffnet).`;
    }
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

  // Per-door artwork carried over from v1: photos behind scrims are what the
  // door states style (WebP with JPEG fallback, lazily loaded).
  const base = `img/doors/${opened ? 'door' : 'door_closed'}_${day}`;
  const preview = opened ? doorPreviewFor(entry) : null;
  const photo = h('picture', {}, [
    h('source', { attrs: { type: 'image/webp', srcset: `${base}.webp` } }),
    h('img', {
      class: 'door-img',
      attrs: {
        src: `${base}.jpg`,
        loading: 'lazy',
        decoding: 'async',
        alt: preview && (preview.title || preview.subtitle)
          ? `${preview.title}${preview.subtitle ? ` — ${preview.subtitle}` : ''}`
          : '',
      },
    }),
  ]);

  // Number overlays: the closed-door artwork carries the printed number, so
  // only opened doors get a corner number chip. Label and title live below
  // the image (see .door-preview), not on it.
  const children: (Node | null)[] = [photo];

  if (opened) {
    children.push(h('span', { class: 'door-number', text: String(day) }));
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

  // Caption below the image — label, title and (for songs) artist.
  const cellChildren: (Node | null)[] = [button];
  if (preview) {
    cellChildren.push(
      h('div', { class: 'door-preview' }, [
        ...(preview.label ? [h('span', { class: 'door-preview-label', text: preview.label })] : []),
        h('span', { class: 'door-preview-title', text: preview.title }),
        ...(preview.subtitle
          ? [h('span', { class: 'door-preview-subtitle', text: preview.subtitle })]
          : []),
      ]),
    );
  }

  return h('div', { class: 'door-cell' }, cellChildren);
}

/** Deterministic CSS-only snow — subtle, motion that respects reduced-motion. */
function snowLayer(): HTMLElement {
  const flakes = Array.from({ length: 14 }, (_, i) => {
    const flake = h('span', { class: 'flake', text: i % 3 === 0 ? '❅' : '❄' });
    flake.style.left = `${(i * 137) % 100}%`;
    flake.style.fontSize = `${(0.55 + (i % 5) * 0.25).toFixed(2)}rem`;
    flake.style.setProperty('--flake-duration', `${(9 + (i % 7) * 1.9).toFixed(1)}s`);
    flake.style.setProperty('--flake-delay', `-${(i * 1.9).toFixed(1)}s`);
    flake.style.setProperty('--flake-drift', `${(i % 2 ? -1 : 1) * (12 + (i % 6) * 9)}px`);
    return flake;
  });
  return h('div', { class: 'snow' }, flakes);
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
    snowLayer(),
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
