'use client';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { Badge } from '@/components/common/Badge';

// The shell is TeamUpdateStrip's own source chip — the literal class, not a copy
// of its values — so the two can't drift apart. Only the interaction layer and
// the dot are added here.
import strip from './TeamUpdateStrip.module.scss';
import s from './TeamNewsCountChip.module.scss';

interface TeamNewsCountChipProps {
  teamName: string;
  items: ITeamNewsItem[];
  /** Where the count leads. Callers pass the feed href their surface uses. */
  href: string;
  /**
   * What the chip counts, in words. `post` names the unit the destination holds
   * — the feed's posts about this team — which is what a board of job posts
   * needs, since "updates" beside a team there could be read as its openings.
   */
  noun?: 'post' | 'update';
}

/**
 * The neutral count chip: production's unread dot, then "N new posts", in the
 * Badge's `default` grey. The teams grid's `dot` mode as a component, so the
 * same mark can ride a job-board card without being rebuilt there.
 *
 * REUSE: `Badge` (`default` variant) + `TeamUpdateStrip.sourceChip` for the
 * shell — 11px/16 in `0 6px`, 18px tall. The dot is production's unread dot
 * verbatim (NotificationItem.unreadDot: 5px, #4174ff), which the design
 * system's Badge `dotIndicator` independently agrees on at this size.
 *
 * Grey rather than the brand-blue badge is the point: blue asks to be clicked,
 * and down a list of cards that's one competing call per card. Grey states a
 * fact and leaves the team's name the loudest thing on the row; the dot carries
 * "you haven't seen it", which frees the words to name what is waiting.
 *
 * Teams keeps its own inline copy of this markup: its chip is a `<button>`
 * inside a card-wide link and its hover is armed by the card, both of which are
 * keyed to classes in that entry's stylesheet. Here the card isn't a link, so
 * the chip is a plain anchor that answers its own hover.
 */
export function TeamNewsCountChip({ teamName, items, href, noun = 'post' }: TeamNewsCountChipProps) {
  if (items.length === 0) return null;

  const nounForm = items.length === 1 ? `new ${noun}` : `new ${noun}s`;
  const text = `${items.length} ${nounForm}`;

  return (
    <a
      className={s.link}
      href={href}
      // The chip sits beside the team's name, so the visible text reads right on
      // screen; the accessible name still has to stand on its own out of
      // context — and must start with what's visible (WCAG 2.5.3, Label in Name).
      aria-label={`${text} about ${teamName} — read on the newsfeed`}
      title={items[0].title}
    >
      <Badge variant="default" className={`${strip.sourceChip} ${s.chip}`}>
        <span className={s.dot} aria-hidden="true" />
        {text}
      </Badge>
    </a>
  );
}
