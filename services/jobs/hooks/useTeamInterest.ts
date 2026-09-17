'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import { JobsQueryKey } from '@/services/jobs/constants';
import { markTeamInterest, type TeamInterestStatus } from '@/services/jobs/job-interests.service';
import type { IJobsListResponse } from '@/types/jobs.types';

/**
 * The open-role signal: "I want to work here, and nothing on your card fits."
 *
 * **Why there is no read hook beside this one.** Every other interest state in
 * this folder is fetched — `useJobInterests` pulls the viewer's whole marked-role
 * list, because nothing on the board carries it. The team signal is different:
 * `IJobTeam.viewerIsInterestedInTeam` rides the board response itself, so the row
 * already has its answer by the time it renders. A second query for a fact
 * already in hand would be two sources for one truth, and they would drift.
 *
 * That also means there is no `isSettled` here. The per-role banner needs one
 * because its query can resolve after the drawer paints; this state arrives with
 * the team it describes, so the row is never mid-flight about it.
 *
 * **One-way.** No `useToggleTeamInterest`, no Undo: the server has no DELETE for
 * this, and the signal is filed in the team's ATS the moment it lands. See
 * `markTeamInterest`.
 */

/**
 * The cache patch itself, pure and exported so it can be tested without a
 * `QueryClient` — the logic worth pinning is "find the team across every page
 * and leave everything else identical", and that is a data transform.
 */
export function applyTeamInterestToBoardCache(
  cached: InfiniteData<IJobsListResponse> | undefined,
  status: TeamInterestStatus,
): InfiniteData<IJobsListResponse> | undefined {
  if (!cached) return cached;

  return {
    ...cached,
    pages: cached.pages.map((page) => ({
      ...page,
      groups: page.groups.map((group) =>
        group.team.uid === status.teamUid
          ? {
              ...group,
              team: {
                ...group.team,
                viewerIsInterestedInTeam: status.viewerIsInterested,
                interestedInTeamCount: status.interestedCount,
              },
            }
          : group,
      ),
    })),
  };
}

/**
 * Marks the team, then writes the server's answer back into the board cache.
 *
 * **Why patch rather than invalidate.** The board is an infinite query keyed by
 * the serialized filter params (`[JobsQueryKey.List, params.toString()]`), and it
 * keeps `placeholderData: keepPreviousData`. Invalidating refetches every loaded
 * page to change one boolean, and on a slow connection the row sits un-pressed
 * meanwhile. Patching flips it immediately and leaves the 30s staleness to
 * reconcile anything else.
 *
 * **Every List entry, not just the active one.** The key carries the filters, so
 * a member who presses and then changes a filter would land on a *different*
 * cache entry — one still holding `viewerIsInterestedInTeam: false` — and be
 * asked again for a signal they have already sent. The predicate form of
 * `setQueriesData` reaches every page of every filter combination currently
 * cached, which is what makes the flip survive a filter change.
 *
 * Written from the RESPONSE rather than from the press: the endpoint answers with
 * the authoritative post-write state, so an idempotent second press reports what
 * is true instead of what was clicked.
 */
export function useMarkTeamInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamUid: string) => markTeamInterest(teamUid),
    onSuccess: (status) => {
      queryClient.setQueriesData<InfiniteData<IJobsListResponse>>({ queryKey: [JobsQueryKey.List] }, (cached) =>
        applyTeamInterestToBoardCache(cached, status),
      );
    },
  });
}
