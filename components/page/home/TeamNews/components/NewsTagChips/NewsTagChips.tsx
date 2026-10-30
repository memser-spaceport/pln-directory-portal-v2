'use client';

import clsx from 'clsx';

import { useNewsTopicSlugs } from '@/services/team-news/hooks/useNewsTopicSlugs';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { getNewsTagChips, NEWS_CARD_TOPIC_LIMIT } from '@/utils/news-tag-chips';

import s from './NewsTagChips.module.scss';

interface NewsTagChipsProps {
  tags: readonly string[] | null | undefined;
  /** `card`: up to 3 topics (Home feed rows, Top stories). `detail`: every topic, then the free-form extras. */
  variant: 'card' | 'detail';
  /** Makes the chips brand-blue `#tag` links that filter the Home feed (LAB-3010). Without it they stay grey labels. */
  onSelect?: (tag: string) => void;
  /** The feed's current tag filter: that chip reads as selected, and clicking it clears the filter. */
  active?: string;
}

/**
 * A news item's tags as `#slug` chips (LAB-3003), behind NEXT_PUBLIC_SHOW_NEWS_PREFERENCES.
 * Grey label chips (the filled tag the feed's deal cards wear), or with `onSelect`
 * brand-blue links that filter the Home feed by that tag (LAB-3010), both as in
 * Polina's newsfeed prototype (`prototypes/entries/newsfeed-v0/TopicTags.tsx`).
 * Renders nothing until the focus areas load, and nothing when no tag qualifies,
 * so the layout stays as it was.
 */
export function NewsTagChips({ tags, variant, onSelect, active }: NewsTagChipsProps) {
  const topicSlugs = useNewsTopicSlugs();
  if (!SHOW_NEWS_PREFERENCES || !topicSlugs) return null;

  const chips = getNewsTagChips(
    tags,
    topicSlugs,
    variant === 'card' ? { topicLimit: NEWS_CARD_TOPIC_LIMIT } : { withExtras: true },
  );
  if (chips.length === 0) return null;

  // With onSelect: brand text links, as `TopicTags` in the newsfeed prototype. A
  // blue `#` that did nothing would promise a click it can't keep, so without
  // it they stay grey labels.
  if (onSelect) {
    return (
      <ul className={clsx(s.list, s.links)} aria-label="Tags">
        {chips.map((tag) => (
          <li key={tag} className={s.item}>
            <button
              type="button"
              className={clsx(s.link, tag === active && s.linkActive)}
              aria-pressed={tag === active}
              aria-label={tag === active ? `Stop filtering by #${tag}` : `Show only #${tag} updates`}
              onClick={(e) => {
                // The row and the lead card open the story on click; the tag is its own target.
                e.stopPropagation();
                onSelect(tag);
              }}
            >
              #{tag}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={s.list} aria-label="Tags">
      {chips.map((tag) => (
        <li key={tag} className={s.item}>
          <span className={s.chip}>#{tag}</span>
        </li>
      ))}
    </ul>
  );
}
