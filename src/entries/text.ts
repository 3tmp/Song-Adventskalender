import { h, textBlock } from '../dom';
import type { EntryRenderer } from './registry';
import type { TextPayload } from './types';

/**
 * The `text` type — v1's `impuls`, renamed (plan §3): a titled quote/text
 * impulse without embeds.
 */
export const textRenderer: EntryRenderer<'text'> = {
  doorPreview(payload) {
    return { label: 'Impuls', title: payload.title };
  },

  renderDay(payload: TextPayload) {
    return h('article', { class: ['day-entry', 'entry-text-only'], data: { type: 'text' } }, [
      ...(payload.quote ? [h('blockquote', { class: 'hero-quote', text: payload.quote })] : []),
      h('h2', { class: 'entry-title', text: payload.title }),
      textBlock(payload.text, { class: 'entry-text' }),
    ]);
  },
};
