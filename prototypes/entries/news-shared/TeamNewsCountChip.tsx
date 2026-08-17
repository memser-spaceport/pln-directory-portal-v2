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
  /**
   * Open the team's news where the reader already is — `TeamNewsModal`. Not a
   * destination the caller picks: this chip means one thing everywhere it
   * appears, and the surface that owns the modal state just has to hold it.
   */
  onOpen: () => void;
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
 * A count opens the team's news in place — `TeamNewsModal`, the same list the
 * teams grid's chip opens. Someone scanning a board of roles who asks how much
 * news is waiting hasn't asked to be taken off the board; the modal's own footer
 * carries the way on to the feed for whoever does want it.
 *
 * Teams keeps its own inline copy of this markup: its chip is a `<button>`
 * inside a card-wide link and its hover is armed by the card, both of which are
 * keyed to classes in that entry's stylesheet. Only the markup is duplicated —
 * the destination is this component's, and it's the same one.
 */
export function TeamNewsCountChip({ teamName, items, onOpen, noun = 'post' }: TeamNewsCountChipProps) {
  if (items.length === 0) return null;

  const nounForm = items.length === 1 ? `new ${noun}` : `new ${noun}s`;
  const text = `${items.length} ${nounForm}`;

  return (
    <button
      type="button"
      className={s.link}
      onClick={onOpen}
      // The chip sits beside the team's name, so the visible text reads right on
      // screen; the accessible name still has to stand on its own out of
      // context — and must start with what's visible (WCAG 2.5.3, Label in Name).
      aria-label={`${text} about ${teamName} — read them`}
      title={items[0].title}
    >
      <Badge variant="default" className={`${strip.sourceChip} ${s.chip}`}>
        <span className={s.dot} aria-hidden="true" />
        {text}
      </Badge>
    </button>
  );
}
