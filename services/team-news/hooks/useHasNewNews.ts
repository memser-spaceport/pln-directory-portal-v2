'use client';

import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  getHomeLastVisitedAt,
  getHomeLastVisitedServerSnapshot,
  subscribeHomeLastVisited,
} from '@/utils/homeLastVisited';
import { TeamNewsQueryKeys } from '../constants';
import { getTeamNewsLatestAt } from '../team-news.service';

// Five minutes: the header asks on every page in the app, and news does not
// land often enough to be worth more. refetchOnWindowFocus stays ON — coming
// back to the tab is exactly the moment a member wants to know something
// arrived, and the response is one timestamp.
const LATEST_NEWS_STALE_TIME = 5 * 60_000;

export function useTeamNewsLatestAt() {
  return useQuery<string | null, Error>({
    queryKey: [TeamNewsQueryKeys.LATEST_AT],
    queryFn: getTeamNewsLatestAt,
    staleTime: LATEST_NEWS_STALE_TIME,
    // The fetcher already swallows failures into null; a retry storm behind a
    // decorative dot helps nobody.
    retry: false,
  });
}

/**
 * Has news arrived since this browser last looked at /home?
 *
 * Drives the dot on the header's Home button. Deliberately conservative: every
 * unknown resolves to `false`, because a dot that turns out to mean nothing is
 * worse than no dot at all — members stop believing it after two or three, and
 * then it can't be used for anything.
 *
 * The one case that resolves to `true` on a missing value is a browser that has
 * never recorded a visit: for them all news genuinely is new, and the dot is
 * how they find a feed they have never opened.
 */
export function useHasNewNews(): boolean {
  const lastVisitedAt = useSyncExternalStore(
    subscribeHomeLastVisited,
    getHomeLastVisitedAt,
    getHomeLastVisitedServerSnapshot,
  );
  const { data: latestAt } = useTeamNewsLatestAt();

  // Not loaded, request failed, or no news exists at all.
  if (!latestAt) return false;

  const latest = Date.parse(latestAt);
  if (Number.isNaN(latest)) return false;

  // Never visited /home — everything is new.
  if (lastVisitedAt === null) return true;

  return latest > lastVisitedAt;
}
