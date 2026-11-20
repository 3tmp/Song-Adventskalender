/**
 * App entry (plan §2): init state, load the active season, render the grid.
 * The two logical views (grid, day) are driven by the router.
 */

import './styles/main.css';
import { readConfig } from './config';
import { availableYears, getDayEntry, getYearContent, seasonEntryOrder } from './core/content';
import { createSeasonStore, type SeasonState } from './core/state';
import { resolveSeason } from './core/season';
import { createRouter, type Route } from './core/router';
import { isDayUnlocked } from './core/unlock';
import { h } from './dom';
import type { YearContent } from './entries/types';
import { renderCalendar } from './views/calendar';
import { renderDayView, type DayView } from './views/day';
import { showToast } from './views/toast';

function seasonErrorMessage(year: number): HTMLElement {
  return h('div', { class: 'view view-empty' }, [
    h('h1', { text: 'Bis bald im Dezember!' }),
    h('p', {
      text: `Für die Saison ${year} sind die Inhalte noch nicht fertig. Komme im Dezember wieder — abwarten und Tee trinken… ☕`,
    }),
  ]);
}

async function boot(): Promise<void> {
  const app = document.querySelector<HTMLElement>('#app');
  if (!app) return;

  const now = new Date();
  const config = readConfig(location.search);
  const season = resolveSeason(now);
  const store = createSeasonStore();
  const knownYears = new Set(availableYears());

  let content: YearContent;
  try {
    content = await getYearContent(season.year);
  } catch {
    app.replaceChildren(seasonErrorMessage(season.year));
    return;
  }

  const router = createRouter(season.year);
  const state = store.load(season.year);
  let currentDayView: DayView | null = null;

  const unmountDayView = (): void => {
    currentDayView?.dispose();
    currentDayView = null;
  };

  const renderGrid = (): void => {
    unmountDayView();
    const entries = seasonEntryOrder(content, state.seed);
    app.replaceChildren(
      renderCalendar({
        season,
        entries,
        state,
        now,
        config,
        onOpen(day) {
          store.markOpened(season.year, day);
          router.navigateToDay(day, season.year);
        },
        onReset() {
          store.reset(season.year);
          state.openedDays = [];
          renderGrid();
        },
      }),
    );
  };

  const renderDay = async (day: number, year: number): Promise<void> => {
    // Deep-linked year: lazily load that season's archive content + state.
    let yearContent = content;
    let yearState: SeasonState = state;
    if (year !== season.year) {
      if (!knownYears.has(year)) {
        showToast(`Für das Jahr ${year} gibt es hier keinen Kalender.`);
        router.navigateToGrid();
        return;
      }
      try {
        yearContent = await getYearContent(year);
      } catch {
        showToast(`Die Inhalte für ${year} lassen sich nicht laden.`);
        router.navigateToGrid();
        return;
      }
      yearState = store.load(year);
    }

    // Deep links are guarded by the unlock rule; ended seasons stay open.
    if (!isDayUnlocked(day, year, now, config.devUnlockAll)) {
      showToast('Dieses Türchen ist noch zu — abwarten und Tee trinken… ☕');
      router.navigateToGrid();
      return;
    }

    if (!yearState.openedDays.includes(day)) {
      store.markOpened(year, day);
    }

    // The user may have navigated on while the archive content loaded.
    const route = router.route;
    if (route.view !== 'day' || route.day !== day || route.year !== year) return;

    const entry = getDayEntry(yearContent, yearState.seed, day);
    unmountDayView();
    currentDayView = renderDayView({
      day,
      year,
      entry,
      canOpen(candidate) {
        return isDayUnlocked(candidate, year, now, config.devUnlockAll);
      },
      onBack() {
        router.goBack();
      },
      onOpenDay(candidateDay) {
        router.navigateToDay(candidateDay, year);
      },
    });
    app.replaceChildren(currentDayView.element);
  };

  const renderRoute = (route: Route): void => {
    if (route.view === 'grid') {
      renderGrid();
    } else {
      void renderDay(route.day, route.year);
    }
  };

  router.subscribe(renderRoute);
  renderRoute(router.route);
}

void boot();
