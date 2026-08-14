'use client';

import { useRouter } from 'next/navigation';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';

import { NewsIcon } from './icons';
import { NEWS_WINDOW_DAYS } from './mockTeamNews';
import s from './TeamUpdatesLink.module.scss';

interface TeamUpdatesLinkProps {
  teamName: string;
  items: ITeamNewsItem[];
  /** `small` (12px) for dense rows — teams grid tags row, profile team lists. */
  size?: 'default' | 'small';
  /**
   * Render as a button instead of an anchor, for cards that are themselves one
   * big link (the teams grid). An `<a>` inside an `<a>` is invalid HTML — the
   * browser unnests it — so the destination has to be reached by handler there.
   */
  nested?: boolean;
  /**
   * How the badge labels itself. Same link in every case:
   *  - `count`   — "3 new updates": how much happened.
   *  - `recency` — "Updated 2d ago": how recently. In a directory one update
   *    yesterday beats five from three weeks ago — Attio's companies table
   *    labels its rows this way.
   *  - `new`     — "3 new": the count with the noun dropped. On a grid where
   *    every badge says the same noun, the noun is the part carrying no
   *    information. Note this reads "new" the way the rest of the prototypes do
   *    — unread by *you*, not recent in itself — so it doesn't take the
   *    freshness gate `count` needs.
   */
  label?: 'count' | 'recency' | 'new';
  /**
   * The trailing ↗. On by default: it marks the badge as an exit, which matters
   * where it stands alone. The teams grid turns it off — twelve cards means
   * twelve arrows, and repeated across a grid the mark stops reading as "this
   * leaves" and starts reading as texture.
   */
  arrow?: boolean;
  /**
   * Override the destination. The default scopes the feed to the team, which is
   * right where a badge is the *only* news on screen (teams grid, profile rows).
   * The job board sends people to the team's card in the feed instead — same
   * rule its update strip follows, so both versions of that surface agree.
   */
  href?: string;
  /**
   * Take over the click entirely. The teams grid uses it to route by the age of
   * the news — fresh stories go to the feed, stale ones open a list in place,
   * because sending someone to a feed for a story it buried six weeks down is a
   * wasted trip. Requires `nested`: an anchor that runs a handler instead of
   * navigating is a link that lies.
   */
  onActivate?: () => void;
}

/** Whole days since an ISO date, floored — "2d ago", "3w ago". */
function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/**
 * "N new updates" badge next to a team, anywhere a team appears: says the team is
 * doing things, and hands the reader off to the newsfeed to read them.
 *
 * It never opens the stories in place. The surfaces that carry this badge (job
 * board, teams grid, profile rows) are scanning surfaces — the feed is the place
 * built for reading news, and sending people there beats rebuilding it three times.
 *
 * TARGET: `/prototypes/newsfeed?team=<uid>` — the feed filtered to this team, so
 * the count and the destination agree. Production has no such param today (the
 * only deep link `/home` understands is `?news=<uid>`, one story's modal — see
 * `useNewsDeepLink`); demonstrating `?team=` here is the ask.
 *
 * REUSE: the badge is the news page's own count badge — the `newsPageBadge` /
 * `newsPageBadgeText` values from TeamNewsRail.module.scss (2px 8px, pill radius,
 * `--border-brand-subtle` hairline, 14px/20 brand text) — plus a hover state and
 * the production ArrowUpRightIcon, because this one is a link (`arrow={false}`
 * drops it where the badge repeats down a grid).
 */
export function TeamUpdatesLink({
  teamName,
  items,
  size = 'default',
  label = 'count',
  nested = false,
  arrow = true,
  href: hrefOverride,
  onActivate,
}: TeamUpdatesLinkProps) {
  const router = useRouter();

  if (items.length === 0) return null;

  const [latest] = items;
  // "New" has to be earned: a team whose newest story is two months old has
  // updates, not new ones. Without this the badge reads "5 new updates" over a
  // list dated 6 weeks ago, which is the kind of small lie that costs a feed its
  // credibility.
  const isRecent = Date.now() - new Date(latest.eventDate).getTime() <= NEWS_WINDOW_DAYS * 86_400_000;
  const noun = items.length === 1 ? 'update' : 'updates';
  const countLabel = isRecent ? `${items.length} new ${noun}` : `${items.length} ${noun}`;
  const text =
    label === 'recency' ? `Updated ${timeAgo(latest.eventDate)}` : label === 'new' ? `${items.length} new` : countLabel;
  const href = hrefOverride ?? `/prototypes/newsfeed?team=${latest.teamUid}`;

  const className = `${s.badge} ${size === 'small' ? s.small : ''}`;
  // The badge sits beside the team's name, so the label alone reads right on
  // screen; the accessible name still has to stand on its own out of context.
  //
  // It must also *start with the visible text*, or voice control can't act on
  // what the user can read (WCAG 2.5.3, Label in Name). `new` mode is the case
  // that catches: it shows "5 new" unconditionally — reading "new" as unread by
  // you, not as recent — while `countLabel` still applies the freshness gate, so
  // borrowing countLabel there would announce "5 updates" over a badge saying
  // "5 new". Spell the noun out instead and the visible text is a prefix again.
  const spokenCount = label === 'new' ? `${items.length} new ${noun}` : countLabel;
  const ariaLabel = `${spokenCount} about ${teamName} — read on the newsfeed`;
  const body = (
    <>
      <span className={s.icon}>
        <NewsIcon />
      </span>
      <span className={s.text}>{text}</span>
      {arrow && <ArrowUpRightIcon className={s.arrow} aria-hidden="true" />}
    </>
  );

  if (nested) {
    return (
      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        title={latest.title}
        onClick={(e) => {
          // Beat the enclosing card link to the click.
          e.preventDefault();
          e.stopPropagation();
          if (onActivate) onActivate();
          else router.push(href);
        }}
      >
        {body}
      </button>
    );
  }

  return (
    <a className={className} href={href} aria-label={ariaLabel} title={latest.title}>
      {body}
    </a>
  );
}
