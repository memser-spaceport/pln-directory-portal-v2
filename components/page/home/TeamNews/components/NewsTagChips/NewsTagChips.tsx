'use client';

import { Badge } from '@/components/common/Badge';
import { useNewsTopicSlugs } from '@/services/team-news/hooks/useNewsTopicSlugs';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { getNewsTagChips, NEWS_CARD_TOPIC_LIMIT } from '@/utils/news-tag-chips';

import s from './NewsTagChips.module.scss';

interface NewsTagChipsProps {
  tags: readonly string[] | null | undefined;
  /** `card`: up to 3 topics (Home feed rows, Top stories). `detail`: every topic, then the free-form extras. */
  variant: 'card' | 'detail';
}

/**
 * A news item's tags as `#slug` chips (LAB-3003), behind NEXT_PUBLIC_SHOW_NEWS_PREFERENCES.
 * Not clickable. Renders nothing until the focus areas load, and nothing when no tag
 * qualifies, so the layout stays as it was.
 */
export function NewsTagChips({ tags, variant }: NewsTagChipsProps) {
  const topicSlugs = useNewsTopicSlugs();
  if (!SHOW_NEWS_PREFERENCES || !topicSlugs) return null;

  const chips = getNewsTagChips(
    tags,
    topicSlugs,
    variant === 'card' ? { topicLimit: NEWS_CARD_TOPIC_LIMIT } : { withExtras: true },
  );
  if (chips.length === 0) return null;

  return (
    <ul className={s.list} aria-label="Tags">
      {chips.map((tag) => (
        <li key={tag} className={s.item}>
          <Badge className={s.chip}>#{tag}</Badge>
        </li>
      ))}
    </ul>
  );
}
