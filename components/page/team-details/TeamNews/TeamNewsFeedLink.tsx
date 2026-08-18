'use client';

import Link from 'next/link';

import { ArrowUpRightIcon } from '@/components/icons';
import { useTeamNewsAnalytics, type TeamNewsFeedLinkSource } from '@/analytics/team-news.analytics';

import s from './TeamNewsRail.module.scss';

interface TeamNewsFeedLinkProps {
  teamUid: string;
  teamName: string;
  /** Which list the member is leaving — the rail preview, the full archive, or
   *  that same archive opened over a listing page by a "N new posts" chip. */
  source: TeamNewsFeedLinkSource;
  /**
   * 'paired' — the rail, where this link sits beside "View all news" and takes
   * the quieter half: two exits, and leaving is the rarer intent.
   * 'solo' — the archive footer, where it's the only thing there and the reader
   * has already read the list, so "and what else happened" is the one move left
   * and gets marked as such.
   */
  variant?: 'paired' | 'solo';
  /**
   * Replaces the variant class outright, for surfaces whose card supplies its
   * own button chrome — the member profile's rail card wears BookWithOther's
   * button, which neither variant here is. The copy and the analytics stay
   * single-sourced; only the skin differs.
   */
  className?: string;
}

/**
 * The leaving exit from a team-scoped news list.
 *
 * Deliberately not interchangeable with "View all news": that one stays inside
 * this team (the archive is its own list), while this widens to the home feed,
 * which carries forum posts and events too — not just team news. "All" marks
 * the widening and "network" names what it widens to (the destination page's own
 * heading), because the ↗ only says "elsewhere", not which elsewhere. Hence the
 * quieter neutral label against its blue neighbour: leaving is the rarer intent.
 *
 * One component for both lists so the two can't drift into different words for
 * the same trip.
 */
export function TeamNewsFeedLink({ teamUid, teamName, source, variant = 'paired', className }: TeamNewsFeedLinkProps) {
  const { onTeamNewsAllNetworkUpdatesClicked } = useTeamNewsAnalytics();

  return (
    <Link
      href="/home"
      prefetch={false}
      className={className ?? (variant === 'solo' ? s.viewFeedSolo : s.viewFeed)}
      onClick={() => onTeamNewsAllNetworkUpdatesClicked(teamUid, teamName, source)}
    >
      All network updates
      <ArrowUpRightIcon aria-hidden="true" />
    </Link>
  );
}
