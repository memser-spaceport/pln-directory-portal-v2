'use client';

import clsx from 'clsx';

import { useNewsTopicSlugs } from '@/services/team-news/hooks/useNewsTopicSlugs';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { getNewsTagChips, NEWS_CARD_TOPIC_LIMIT } from '@/utils/news-tag-chips';
import type { TeamNewsEventType } from '@/types/team-news.types';
import { NEWS_CATEGORY_TAG_VALUES } from '@/components/page/news-preferences/newsTagThemes';

/** No topic list to sort by: every tag but the verbs is a chip (the new Home with News preferences off). */
const NO_TOPIC_SLUGS: ReadonlySet<string> = new Set();

import s from './NewsTagChips.module.scss';

interface NewsTagChipsProps {
  tags: readonly string[] | null | undefined;
  /** `card`: up to 3 topics (Home feed rows, Top stories). `detail`: every topic, then the free-form extras. */
  variant: 'card' | 'detail';
  /** Makes the chips brand-blue `#tag` links that filter the Home feed (LAB-3010). Without it they stay grey labels. */
  onSelect?: (tag: string) => void;
  /** The feed's current tag filter: that chip reads as selected, and clicking it clears the filter. A list on the new
   *  Home, where tags stack (LAB-3125): each listed tag reads as selected, and the others add to the scope. */
  active?: string | readonly string[];
  /**
   * The new Home (LAB-3125) shows a story's tags whatever the News preferences flag says. With the flag off there is
   * no topic list, so every tag but the legacy verbs is a chip, up to the card's limit.
   */
  ungated?: boolean;
  /**
   * The story's category (LAB-3266). A category that a member can pick as a tag on News preferences (Funding, Launch,
   * Announcement, LAB-3140) shows as the first chip, `#funding`. It is a grey label, not a filter link: the feed tag
   * filter matches `tags`, not the category.
   */
  eventType?: TeamNewsEventType | null;
  className?: string;
}

/** The category chip text for a story, or null when its category is not a News preferences category tag. */
export function getNewsCategoryChip(eventType: TeamNewsEventType | null | undefined): string | null {
  if (!eventType) return null;
  return (NEWS_CATEGORY_TAG_VALUES as readonly string[]).includes(eventType) ? eventType.toLowerCase() : null;
}

/**
 * A news item's tags as `#slug` chips (LAB-3003), behind NEXT_PUBLIC_SHOW_NEWS_PREFERENCES.
 * Grey label chips (the filled tag the feed's deal cards wear), or with `onSelect`
 * brand-blue links that filter the Home feed by that tag (LAB-3010), both as in
 * Polina's newsfeed prototype (`prototypes/entries/newsfeed-v0/TopicTags.tsx`).
 * Renders nothing until the focus areas load, and nothing when no tag qualifies,
 * so the layout stays as it was.
 */
export function NewsTagChips({
  tags,
  variant,
  onSelect,
  active,
  ungated = false,
  eventType,
  className,
}: NewsTagChipsProps) {
  const topicSlugs = useNewsTopicSlugs();
  const chips = selectChips(tags, variant, topicSlugs, ungated, active);
  const category = chips ? getNewsCategoryChip(eventType) : null;
  if (!chips || (chips.length === 0 && !category)) return null;

  const categoryItem = category ? (
    <li key={`category-${category}`} className={s.item} data-testid="news-category-chip">
      <span className={s.chip}>#{category}</span>
    </li>
  ) : null;

  const isActive = (tag: string) => (typeof active === 'string' ? tag === active : (active?.includes(tag) ?? false));
  const isStacking = Array.isArray(active) && active.length > 0;

  // With onSelect: brand text links, as `TopicTags` in the newsfeed prototype. A
  // blue `#` that did nothing would promise a click it can't keep, so without
  // it they stay grey labels.
  if (onSelect) {
    return (
      <ul className={clsx(s.list, s.links, className)} aria-label="Tags">
        {categoryItem}
        {chips.map((tag) => (
          <li key={tag} className={s.item}>
            <button
              type="button"
              className={clsx(s.link, isActive(tag) && s.linkActive)}
              aria-pressed={isActive(tag)}
              aria-label={
                isActive(tag)
                  ? `Stop filtering by #${tag}`
                  : isStacking
                    ? `Also filter by #${tag}`
                    : `Show only #${tag} updates`
              }
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
    <ul className={clsx(s.list, className)} aria-label="Tags">
      {categoryItem}
      {chips.map((tag) => (
        <li key={tag} className={s.item}>
          <span className={s.chip}>#{tag}</span>
        </li>
      ))}
    </ul>
  );
}

/** The chips to draw, or null while there is nothing to draw them from. */
function selectChips(
  tags: readonly string[] | null | undefined,
  variant: NewsTagChipsProps['variant'],
  topicSlugs: ReadonlySet<string> | null,
  ungated: boolean,
  active?: string | readonly string[],
): string[] | null {
  if (SHOW_NEWS_PREFERENCES) {
    if (!topicSlugs) return null;
    if (variant !== 'card') return getNewsTagChips(tags, topicSlugs, { withExtras: true });
    return pinActiveTags(
      getNewsTagChips(tags, topicSlugs),
      getNewsTagChips(tags, topicSlugs, { withExtras: true }),
      active,
    );
  }
  if (!ungated) return null;
  // No topics to tell apart: every tag is an "extra", so the card's limit applies to the extras.
  const chips = getNewsTagChips(tags, NO_TOPIC_SLUGS, { withExtras: true });
  return variant === 'card' ? pinActiveTags(chips, chips, active) : chips;
}

/**
 * A card's chips, at most `NEWS_CARD_TOPIC_LIMIT`, with the feed's selected tags the story carries first (LAB-3125):
 * a story that matched `#frontier-tech` as its 4th tag shows that tag, so the card says why it is in the filtered
 * stream. `shown` is what the card draws with no filter; `all` is every tag it could draw.
 */
export function pinActiveTags(
  shown: readonly string[],
  all: readonly string[],
  active?: string | readonly string[],
): string[] {
  const selected = typeof active === 'string' ? [active] : (active ?? []);
  const pinned = selected.map((tag) => tag.trim().toLowerCase()).filter((tag) => all.includes(tag));
  const rest = shown.filter((tag) => !pinned.includes(tag));
  return [...pinned, ...rest].slice(0, Math.max(NEWS_CARD_TOPIC_LIMIT, pinned.length));
}
