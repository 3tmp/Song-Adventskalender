// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

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
  it('renders the full 24-door calendar for the active season', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    expect(document.querySelector('#app')).not.toBeNull();

    await import('./main');
    const ready = await waitFor(() => document.querySelector('.view-calendar') !== null);
    expect(ready).toBe(true);

    expect(document.querySelectorAll('.door')).toHaveLength(24);
    const status = document.querySelector('.cal-status')?.textContent ?? '';
    expect(status.length).toBeGreaterThan(10);
    expect(document.querySelector('.snow')?.querySelectorAll('.flake')).toHaveLength(14);
  });
});
