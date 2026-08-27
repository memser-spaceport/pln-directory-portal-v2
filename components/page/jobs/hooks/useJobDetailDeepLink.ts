'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

import type { JobDetailTarget, useJobApplyFlow } from '@/components/page/jobs/hooks/useJobApplyFlow';
import { fetchJobByUid } from '@/services/jobs/jobs.service';
import { JOB_DETAIL_PARAM, findJobInGroups, writeJobDetailParam } from '@/services/jobs/job-detail-link';
import type { IJobTeamGroup } from '@/types/jobs.types';

/**
 * Keeps `?job=<uid>` in sync with the detail drawer, and opens that drawer
 * when the page is loaded (or shared) with the param already set.
 *
 * URL writes go through `replaceState` so the board does not refetch. The
 * param is present only while the drawer is open: leaving it for Apply /
 * sign-up / the profile drawer drops it, matching the flow's "close Apply
 * returns to the board" model rather than bouncing back into the description.
 */
export function useJobDetailDeepLink({
  enabled,
  groups,
  isLoading,
  flow,
}: {
  enabled: boolean;
  groups: IJobTeamGroup[];
  isLoading: boolean;
  flow: ReturnType<typeof useJobApplyFlow>;
}): ReturnType<typeof useJobApplyFlow> {
  const searchParams = useSearchParams();
  const openedFromUrl = useRef(false);
  const { onViewJob: openDetail, closeDetail: closeDetailFlow } = flow;

  const onViewJob = useCallback(
    (target: JobDetailTarget) => {
      writeJobDetailParam(target.role.uid);
      openDetail(target);
    },
    [openDetail],
  );

  const closeDetail = useCallback(() => {
    writeJobDetailParam(null);
    closeDetailFlow();
  }, [closeDetailFlow]);

  useEffect(() => {
    if (flow.state.step === 'detail' || flow.state.step === 'idle') return;
    writeJobDetailParam(null);
  }, [flow.state.step]);

  useEffect(() => {
    if (!enabled) return;
    if (openedFromUrl.current) return;

    const jobUid = searchParams.get(JOB_DETAIL_PARAM);
    if (!jobUid) return;
    if (isLoading) return;

    const fromList = findJobInGroups(groups, jobUid);
    openedFromUrl.current = true;
    if (fromList) {
      openDetail({
        role: fromList.role,
        teamId: fromList.team.uid,
        teamName: fromList.team.name,
        team: fromList.team,
      });
      return;
    }

    (async () => {
      try {
        const group = await fetchJobByUid(jobUid);
        const found = group ? findJobInGroups([group], jobUid) : null;
        if (found) {
          openDetail({
            role: found.role,
            teamId: found.team.uid,
            teamName: found.team.name,
            team: found.team,
          });
        } else {
          writeJobDetailParam(null);
        }
      } catch {
        writeJobDetailParam(null);
      }
    })();
    // Claimed before the fetch, so a later groups change must not re-open.
  }, [enabled, isLoading, groups, searchParams, openDetail]);

  return useMemo(() => ({ ...flow, onViewJob, closeDetail }), [flow, onViewJob, closeDetail]);
}
