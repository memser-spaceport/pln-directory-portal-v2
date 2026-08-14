import { useQuery } from '@tanstack/react-query';

import { fetchJobsList } from '@/services/jobs/jobs.service';
import { JobsQueryKey } from '@/services/jobs/constants';
import { TEAM_NEWS_DEFAULT_WINDOW_DAYS } from '@/services/team-news/constants';
import type { IJobTeamGroup } from '@/types/jobs.types';

import { SHOW_HIRING_NEWS } from '../constants';

/** Groups requested. injectFeedSignals shows at most MAX_HIRING_ENTRIES of
 *  them; the surplus is headroom for the recency sort to choose from. */
const FEED_HIRING_LIMIT = 10;

/**
 * Teams hiring inside the news window, for the feed's hiring roll-ups.
 *
 * No grouping pass: `GET /v1/job-openings` already returns
 * `IJobTeamGroup { team, totalRoles, roles[] }`, which is exactly the shape the
 * card renders. `windowDays` reaches the backend untouched — the Next proxy at
 * `/api/jobs/list` copies every param except `workplaceType`
 * (utils/jobs-api-query.ts).
 *
 * Client-side and non-blocking: the feed renders without it and the cards pop
 * in, the same accepted arrival forum posts already have. A failure resolves to
 * `undefined`, which injectFeedSignals reads as "leave the feed alone".
 *
 * Disabled while `SHOW_HIRING_NEWS` is off: with the roll-ups out of the feed
 * there is nothing to render, so every home view was paying for a request whose
 * response was discarded. `enabled: false` yields `undefined` data — the same
 * shape the callers already handle.
 */
export function useFeedHiring(): { hiring: IJobTeamGroup[] | undefined } {
  const { data } = useQuery({
    queryKey: [JobsQueryKey.List, 'home-feed', TEAM_NEWS_DEFAULT_WINDOW_DAYS],
    queryFn: () =>
      fetchJobsList(
        new URLSearchParams({
          windowDays: String(TEAM_NEWS_DEFAULT_WINDOW_DAYS),
          limit: String(FEED_HIRING_LIMIT),
        }),
      ),
    enabled: SHOW_HIRING_NEWS,
    staleTime: 5 * 60 * 1000,
    select: (response) => response.groups,
  });

  // The declared return type is a promise this hook has to keep: `groups` is
  // whatever the response carried, and a shape change upstream must degrade to
  // "no hiring cards" rather than throw inside the feed's merge.
  return { hiring: Array.isArray(data) ? data : undefined };
}
