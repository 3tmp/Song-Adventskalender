/** Tiny DOM helper — no framework, no vdom, just readable tree building. */

export interface ElementOptions {
  class?: string | string[];
  text?: string;
  attrs?: Record<string, string>;
  data?: Record<string, string>;
  title?: string;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: (Node | string | null | undefined)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (options.class !== undefined) {
    el.className = Array.isArray(options.class) ? options.class.join(' ') : options.class;
  }
  if (options.title !== undefined) el.title = options.title;
  for (const [key, value] of Object.entries(options.attrs ?? {})) {
    el.setAttribute(key, value);
  }
  for (const [key, value] of Object.entries(options.data ?? {})) {
    el.dataset[key] = value;
  }
  if (options.text !== undefined) el.textContent = options.text;
  for (const child of children) {
    if (child === null || child === undefined) continue;
    el.append(child);
  }
  return el;
}

/** Text with paragraph breaks — CSS `white-space: pre-line` keeps single newlines. */
export function textBlock(text: string, options: ElementOptions = {}): HTMLParagraphElement {
  const classes = options.class === undefined ? [] : Array.isArray(options.class) ? options.class : [options.class];
  return h('p', { class: ['pre-line', ...classes], text });
}
