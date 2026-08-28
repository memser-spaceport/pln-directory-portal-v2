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
 * param is present only while the *reading step* is up: stepping on to the
 * profile or the letter drops it, as does sign-up — matching the flow's "close
 * returns to the board" model rather than bouncing back into the description.
 *
 * Reading used to be a drawer of its own (`step: 'detail'`). It is step 1 of
 * `JobApplyFlowDrawer` now, so "is the description showing" is
 * `step === 'flow' && at === 'review'` rather than a step of its own, and the
 * flow's single `close` replaces `closeDetail`.
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
  const { onViewJob: openDetail, close: closeFlow } = flow;

  const onViewJob = useCallback(
    (target: JobDetailTarget) => {
      writeJobDetailParam(target.role.uid);
      openDetail(target);
    },
    [openDetail],
  );

  const close = useCallback(
    (opts?: { completed?: boolean }) => {
      writeJobDetailParam(null);
      closeFlow(opts);
    },
    [closeFlow],
  );

  /* The param tracks the *reading step*, not the flow.
     `detail` used to be a step of its own; it is `flow` at `at: 'review'` now,
     and the three places the flow can stand are one state rather than three. So
     the rule the original wrote — present while the description is up, dropped
     the moment Apply / sign-up / the profile takes over — becomes: present on
     review, cleared on every other step. */
  const step = flow.state.step;
  const at = flow.state.step === 'flow' ? flow.state.at : null;
  useEffect(() => {
    if (step === 'idle' || (step === 'flow' && at === 'review')) return;
    writeJobDetailParam(null);
  }, [step, at]);

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

  return useMemo(() => ({ ...flow, onViewJob, close }), [flow, onViewJob, close]);
}
