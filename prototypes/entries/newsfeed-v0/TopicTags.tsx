'use client';

import clsx from 'clsx';

// The label chips the Home feed already wears (DealCardCompact): DealCard's
// neutral chip, shrunk to the feed's 12px by the compact card's own class.
import dealStyles from '@/components/page/deals/DealCard/DealCard.module.scss';
import compact from '@/components/page/home/TeamNews/components/DealCardCompact/DealCardCompact.module.scss';
import local from './NewsfeedV0.module.scss';

// More than this reads as keyword soup on a feed card; the reader shows them all.
const MAX_TAGS = 3;

/**
 * A story's or post's topic hashtags, in the same vocabulary as News
 * preferences' Topics (`digest-topics`).
 *
 * With `onSelect` they're brand-blue text links that filter the feed to that
 * topic — the way every product that writes a `#` shows it (Bluesky,
 * Instagram, LinkedIn). Without it they stay grey label chips: a blue `#` that
 * does nothing would promise a click it can't keep.
 */
export function TopicTags({
  tags,
  max = MAX_TAGS,
  className,
  onSelect,
  active,
}: {
  tags: string[];
  max?: number;
  className?: string;
  onSelect?: (tag: string) => void;
  /** The feed's current topic filter: that tag reads as selected, and clicking it clears. */
  active?: string;
}) {
  if (tags.length === 0) return null;
  const shown = tags.slice(0, max);

  if (onSelect) {
    return (
      <div className={clsx(local.topicLinks, className)}>
        {shown.map((tag) => (
          <button
            key={tag}
            type="button"
            className={clsx(local.topicLink, tag === active && local.topicLinkActive)}
            aria-pressed={tag === active}
            aria-label={tag === active ? `Stop filtering by #${tag}` : `Show only #${tag} updates`}
            onClick={(e) => {
              // The card and the modal body both open/act on click; the tag is its own target.
              e.stopPropagation();
              onSelect(tag);
            }}
          >
            #{tag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx(dealStyles.tags, className)}>
      {shown.map((tag) => (
        <span key={tag} className={clsx(dealStyles.tag, dealStyles.tagDefault, compact.tag)}>
          #{tag}
        </span>
      ))}
    </div>
  );
}
