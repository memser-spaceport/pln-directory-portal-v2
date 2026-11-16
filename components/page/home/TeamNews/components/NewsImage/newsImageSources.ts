import type { ITeamNewsImage } from '@/types/team-news.types';

import type { NewsImageVariant } from './NewsImage';

/**
 * `sizes` for each place, from the rendered CSS widths (NewsImage.module.scss, NewsCard.module.scss). Below 640px
 * (`media.mobile-only`) every place takes the full width.
 * - `thumb`: the stream card's fixed 168px column.
 * - `wide`: the News page card, capped at 592px (`.cardMedia`).
 * - `hero`: the story dialog's header, capped at 632px.
 */
export const NEWS_IMAGE_SIZES: Record<NewsImageVariant, string> = {
  thumb: '(min-width: 640px) 168px, 100vw',
  wide: '(min-width: 640px) 592px, 100vw',
  hero: '(min-width: 640px) 632px, 100vw',
};

export interface NewsImageSources {
  src: string;
  srcSet?: string;
}

/**
 * LAB-3135: the `<img>` sources for a story. With resized copies, `srcSet` lists them and `src` is the largest
 * copy. Without copies (`image` null, e.g. an old story before the backfill), `src` is the stored `imageUrl` and
 * there is no `srcSet`. Returns null when the story has no image at all.
 */
export function getNewsImageSources(
  imageUrl: string | null | undefined,
  image: ITeamNewsImage | null | undefined,
): NewsImageSources | null {
  const variants = (image?.variants ?? [])
    .filter((v) => v.url && Number.isFinite(v.width) && v.width >= 1)
    .sort((a, b) => a.width - b.width);

  if (variants.length > 0) {
    return {
      src: variants[variants.length - 1].url,
      srcSet: variants.map((v) => `${v.url} ${Math.round(v.width)}w`).join(', '),
    };
  }

  return imageUrl ? { src: imageUrl } : null;
}
