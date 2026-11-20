/**
 * A single shared toast — plan §6's "Abwarten und Tee trinken…" hint and
 * other gentle feedback, announced politely to screen readers.
 */

let toastEl: HTMLDivElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, durationMs = 2600): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.append(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add('toast--visible');
  clearTimeout(timer);
  timer = setTimeout(() => toastEl?.classList.remove('toast--visible'), durationMs);
}
