'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchJobsList } from '@/services/jobs/jobs.service';
import { JobsQueryKey } from '@/services/jobs/constants';
import { getJobDate } from '@/utils/jobs.utils';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

/** One role flattened out of its team group, for a flat "latest openings" list. */
export interface ILatestJobOpening {
  role: IJobRole;
  team: IJobTeam;
}

/** Individual openings shown in the home page section. */
export const LATEST_JOBS_LIMIT = 10;

/**
 * Team groups requested from the backend. `GET /v1/job-openings` paginates by
 * team (see `IJobsListResponse.limit`/`totalGroups`), not by individual role,
 * so asking for exactly `LATEST_JOBS_LIMIT` groups would under-count whenever
 * a team has more than one open role. This over-fetches groups and the hook
 * flattens + re-sorts the roles client-side to find the true N most recent
 * individual openings — the same headroom approach `useFeedHiring` uses for
 * the feed's hiring roll-ups.
 */
const GROUPS_REQUESTED = 30;

/**
 * The `LATEST_JOBS_LIMIT` most recently posted individual job openings across
 * every team, for the home page's "Latest job openings" section.
 *
 * Uses the same service call the job board itself uses (`fetchJobsList`,
 * which proxies through `/api/jobs/list` to `GET /v1/job-openings`), just
 * sorted newest-first and flattened out of its team groups.
 */
export function useLatestJobOpenings() {
  const query = useQuery({
    queryKey: [JobsQueryKey.List, 'home-latest-jobs', GROUPS_REQUESTED],
    queryFn: () =>
      fetchJobsList(
        new URLSearchParams({
          sort: 'newest',
          limit: String(GROUPS_REQUESTED),
        }),
      ),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const openings: ILatestJobOpening[] = useMemo(() => {
    const groups = query.data?.groups ?? [];
    const flattened: ILatestJobOpening[] = groups.flatMap((group) =>
      group.roles.map((role) => ({ role, team: group.team })),
    );
    return flattened
      .sort((a, b) => new Date(getJobDate(b.role)).getTime() - new Date(getJobDate(a.role)).getTime())
      .slice(0, LATEST_JOBS_LIMIT);
  }, [query.data]);

  return { ...query, openings };
}
