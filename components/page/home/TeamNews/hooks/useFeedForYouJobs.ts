import { useQuery } from '@tanstack/react-query';

import { fetchForYouJobs } from '@/services/jobs/jobs.service';
import { JobsQueryKey } from '@/services/jobs/constants';
import type { IJobTeamGroup } from '@/types/jobs.types';

/** Scoped by member uid, like the board's own per-viewer lists: the answer is
 *  ABOUT one member, and a sign-out/sign-in without a reload keeps the same
 *  React Query cache alive. */
export const forYouJobsQueryKey = (memberUid: string) => [JobsQueryKey.ForYou, memberUid] as const;

/**
 * Jobs matched to this member, for the For You pill's hiring roll-ups.
 *
 * Everything about the match lives server-side (`GET /v1/job-openings/for-you`):
 * the two-week window, the skills/role/experience match, and the ranking. This
 * hook only asks.
 *
 * Client-side and non-blocking, like `useFeedHiring` — the feed renders without
 * it and the cards pop in. No data resolves to `undefined`, which
 * `injectFeedSignals` reads as "leave the feed alone".
 *
 * `enabled` gates the WORK, not the render, and the caller owns the whole gate
 * — a guest, and a member with no For You pill to put them under, must not pay
 * for a request whose answer would be discarded.
 */
export function useFeedForYouJobs(
  enabled: boolean,
  memberUid: string | undefined,
): { forYouJobs: IJobTeamGroup[] | undefined } {
  const { data } = useQuery({
    queryKey: forYouJobsQueryKey(memberUid ?? ''),
    queryFn: fetchForYouJobs,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return { forYouJobs: Array.isArray(data) ? data : undefined };
}
