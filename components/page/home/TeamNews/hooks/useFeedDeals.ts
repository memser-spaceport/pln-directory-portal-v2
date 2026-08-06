import { useQuery } from '@tanstack/react-query';

import { getRecentDeals } from '@/services/deals/deals.service';
import { DealsQueryKeys } from '@/services/deals/constants';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { TEAM_NEWS_DEFAULT_WINDOW_DAYS } from '@/services/team-news/constants';
import type { IDeal } from '@/types/deals.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Exported for the test: the window is applied here, not trusted from the API. */
export function isWithinWindow(createdAt: string, windowDays: number, now: number): boolean {
  const created = Date.parse(createdAt);
  // An unparseable date can't be shown to be recent, so it isn't.
  if (Number.isNaN(created)) return false;
  return now - created <= windowDays * MS_PER_DAY;
}

/**
 * Deals added inside the news window, for the feed's deal cards.
 *
 * Gated on `useDealsAccess()` — which already combines the whitelist endpoint
 * and the `deals.read` permission — so a member without access makes **no
 * request at all** rather than fetching and hiding the result. Production
 * already ships a `DealsNoAccessModal`; putting cards in a general feed that
 * lead straight to it is the thing to avoid.
 *
 * The `createdAt` filter is deliberate belt-and-braces: `?windowDays=` may or
 * may not be implemented yet, and the Directory API ignores params it doesn't
 * know. Filtering here makes the window correct either way, and a no-op once
 * the backend honours it.
 *
 * Client-side and non-blocking, like useFeedHiring — `undefined` means "not
 * loaded / no access / failed", which injectFeedSignals leaves the feed alone for.
 */
export function useFeedDeals(): { deals: IDeal[] | undefined } {
  const { hasAccess } = useDealsAccess();

  const { data } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_LIST, 'home-feed', TEAM_NEWS_DEFAULT_WINDOW_DAYS],
    queryFn: () => getRecentDeals(TEAM_NEWS_DEFAULT_WINDOW_DAYS),
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
    // Date.now() in `select` rather than at module scope: the latter would pin
    // the window to whenever the bundle first evaluated.
    select: (deals: IDeal[]) => {
      const now = Date.now();
      return deals.filter((deal) => isWithinWindow(deal.createdAt, TEAM_NEWS_DEFAULT_WINDOW_DAYS, now));
    },
  });

  // Same contract guard as useFeedHiring: an unexpected response shape must
  // degrade to "no deal cards", never throw inside the feed's merge.
  return { deals: hasAccess && Array.isArray(data) ? data : undefined };
}
