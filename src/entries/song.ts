import { h, textBlock } from '../dom';
import type { RenderContext, EntryRenderer } from './registry';
import type { SongPayload } from './types';

function embedCard(
  kind: 'youtube' | 'spotify',
  id: string,
  songTitle: string,
): HTMLElement {
  const labels = {
    youtube: '▶ Video bei YouTube ansehen',
    spotify: '🎧 Song bei Spotify anhören',
  } as const;
  return h(
    'div',
    {
      class: ['embed', `embed-${kind}`],
      data: { [kind]: id },
      title: songTitle,
    },
    [h('button', { class: 'embed-load', attrs: { type: 'button' }, text: labels[kind] })],
  );
}

/**
 * Lazy-loads the embed iframes once they scroll into view (plan §5) so the
 * text paints instantly — the `preload()` obligation of the entry type.
 * Falls back to immediate injection where IntersectionObserver is missing.
 */
function wireLazyEmbeds(type: SongPayload, container: HTMLElement): void {
  const embeds = Array.from(container.querySelectorAll<HTMLElement>('[data-youtube],[data-spotify]'));
  if (embeds.length === 0) return;

  const inject = (embed: HTMLElement): void => {
    const youtubeId = embed.dataset.youtube;
    const spotifyId = embed.dataset.spotify;
    embed.replaceChildren();
    if (youtubeId) {
      embed.append(
        h('iframe', {
          class: 'embed-frame',
          attrs: {
            src: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`,
            title: `Video: ${type.title} – ${type.artist}`,
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowfullscreen: '',
            loading: 'lazy',
          },
        }),
      );
    }
    if (spotifyId) {
      embed.append(
        h('iframe', {
          class: 'embed-frame',
          attrs: {
            src: `https://open.spotify.com/embed/track/${spotifyId}?theme=0`,
            title: `Spotify-Player: ${type.title} – ${type.artist}`,
            allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
            loading: 'lazy',
          },
        }),
      );
    }
  };

  if (typeof IntersectionObserver === 'undefined') {
    for (const embed of embeds) inject(embed);
    return;
  }
  const observer = new IntersectionObserver(
    (observed) => {
      for (const entry of observed) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          inject(entry.target as HTMLElement);
        }
      }
    },
    { rootMargin: '200px' },
  );
  for (const embed of embeds) observer.observe(embed);
}

export const songRenderer: EntryRenderer<'song'> = {
  doorPreview(payload) {
    return { label: 'Song', title: payload.title, subtitle: payload.artist };
  },

  renderDay(payload: SongPayload, ctx: RenderContext) {
    const article = h('article', { class: ['day-entry', 'entry-song'], data: { type: 'song' } }, [
      h('blockquote', { class: 'hero-quote', text: payload.quote }),
      h('header', { class: 'song-meta' }, [
        h('h2', { class: 'song-title', text: payload.title }),
        h('p', { class: 'song-artist', text: payload.artist }),
      ]),
      textBlock(payload.text, { class: 'entry-text' }),
    ]);

    const canEmbed = Boolean(payload.youtubeId || payload.spotifyId);
    if (canEmbed) {
      article.append(
        h(
          'section',
          { class: 'embeds' },
          [
            payload.youtubeId ? embedCard('youtube', payload.youtubeId, payload.title) : null,
            payload.spotifyId ? embedCard('spotify', payload.spotifyId, payload.title) : null,
          ].filter((x): x is HTMLElement => x !== null),
        ),
      );
    }
    article.dataset.day = String(ctx.day);
    return article;
  },

  preload(payload, container) {
    // Wire the scroll-triggered embed injection for pre-rendered day content.
    const embeds = container.querySelector<HTMLElement>('.embeds');
    if (embeds) wireLazyEmbeds(payload, embeds);
  },
};
