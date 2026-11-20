/**
 * App entry (plan §2): init state, load the active season, render the grid.
 * The two logical views (grid, day) are driven by the router.
 */

import './styles/main.css';
import { readConfig } from './config';
import { getYearContent, seasonEntryOrder } from './core/content';
import { createSeasonStore } from './core/state';
import { resolveSeason } from './core/season';
import { createRouter, type Route } from './core/router';
import { h } from './dom';
import { renderCalendar } from './views/calendar';

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

  let content;
  try {
    content = await getYearContent(season.year);
  } catch {
    app.replaceChildren(seasonErrorMessage(season.year));
    return;
  }

  const router = createRouter(season.year);
  const state = store.load(season.year);

  const renderGrid = (): void => {
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

  const renderRoute = (_route: Route): void => {
    // (Day view ships next; until then every route renders the grid.)
    renderGrid();
  };
  router.subscribe(renderRoute);
  renderRoute(router.route);
}

void boot();
