'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

import type { IUserInfo } from '@/types/shared.types';
import type { IJobTeamGroup } from '@/types/jobs.types';
import type { JobSurface } from '@/analytics/jobs.analytics';
import {
  PENDING_APPLY_PARAM,
  PENDING_NEWEST_PARAM,
  pickNewestRole,
  stripPendingApplyFromUrl,
} from '@/services/jobs/job-apply-resume';
import { JobApplyFlowController } from '@/components/page/jobs/JobApplyFlowController/JobApplyFlowController';
import type { RowApplyProps } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow';

import { useJobBoardViewer, type JobBoardViewerResult } from './useJobBoardViewer';
import { useJobApplyFlow, type JobDetailTarget } from './useJobApplyFlow';
import { useJobDetailDeepLink } from './useJobDetailDeepLink';

export interface JobApplySurfaceArgs {
  /**
   * The feature flag, resolved by the host. Off ⇒ zero requests, zero storage
   * touches, and `applyProps` absent, so rows render byte-identical to
   * production today. The flag itself is imported by hosts only — never by this
   * hook and never by a leaf.
   */
  enabled: boolean;
  source: JobSurface;
  isLoggedIn: boolean;
  userInfo: IUserInfo | undefined;
  /** Everything a pending `applyTo` uid can be resolved against. */
  groups: IJobTeamGroup[];
  /** True while `groups` is still arriving. Server-rendered surfaces pass `false`. */
  isLoading: boolean;
  /**
   * Keep `?job=` in sync with the reading step. The board wants this — its share
   * links are `/jobs?job=<uid>`, so a description someone opened is a
   * description they can send. Surfaces whose share links point elsewhere pass
   * `false` and get an untouched URL.
   */
  deepLink: boolean;
}

export interface JobApplySurface {
  viewer: JobBoardViewerResult;
  flow: ReturnType<typeof useJobApplyFlow>;
  /** Hand to every `ReferRoleRow`. `undefined` is the off switch. */
  applyProps: RowApplyProps | undefined;
  /**
   * Render once per surface, and render it **outside** whatever gate hides the
   * role list. A list that empties mid-application must not take the drawer
   * with it — on the board that is a filter change, on a team profile it is the
   * `router.refresh()` a profile save triggers from inside the drawer itself.
   */
  controller: ReactNode;
}

/**
 * Everything a surface needs to offer the in-app job flow: who is looking, the
 * flow state machine, the props its rows want, and the drawer stack.
 *
 * This exists because the row was always shared and the wiring never was. The
 * team profile rendered the board's own `ReferRoleRow` for weeks while showing
 * a different product, purely because it never passed `apply` — a drift that
 * two copies of this wiring would simply reproduce. One implementation, adopted
 * by the board, so the second surface cannot silently fall behind it.
 */
export function useJobApplySurface({
  enabled,
  source,
  isLoggedIn,
  userInfo,
  groups,
  isLoading,
  deepLink,
}: JobApplySurfaceArgs): JobApplySurface {
  const searchParams = useSearchParams();

  const viewer = useJobBoardViewer({ isLoggedIn, userInfo, enabled });
  const applyFlow = useJobApplyFlow({
    viewer: viewer.viewer,
    verdict: viewer.verdict,
    refreshVerdict: viewer.refreshVerdict,
    source,
  });
  /* Disabled, this is a passthrough — it returns `applyFlow` untouched rather
     than a wrapper that writes the param anyway. */
  const flow = useJobDetailDeepLink({
    enabled: enabled && deepLink,
    groups,
    isLoading,
    flow: applyFlow,
  });

  const applyProps: RowApplyProps | undefined = useMemo(
    () =>
      enabled && viewer.viewer !== 'rejected'
        ? {
            onApply: flow.onApply,
            memberUid: viewer.memberUid,
            /* Reading the job is step 1 of the flow, so every row that gets an
               apply slot gets `onViewJob` with it. It is the *wrapped* callback
               wherever the deep link is on. */
            onViewJob: flow.onViewJob,
          }
        : undefined,
    [enabled, viewer.viewer, viewer.memberUid, flow.onApply, flow.onViewJob],
  );

  /* Coming back from the Privy round trip: pick the application back up where
     it was interrupted. The role uid travels in the URL (see
     `job-apply-resume`) because the login path clears localStorage on its way
     through and sessionStorage did not reliably survive it.

     Gated on the viewer having actually settled — resuming against a
     half-derived state would open the drawer at someone with nothing to fill
     in — and on the list having loaded, since the uid has to be re-resolved
     against what the surface is showing now. */
  const applyResumeHandled = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (applyResumeHandled.current) return;

    const roleUid = searchParams.get(PENDING_APPLY_PARAM);
    const viewNewest = searchParams.get(PENDING_NEWEST_PARAM) === '1';
    if (!roleUid && !viewNewest) return;
    if (!isLoggedIn || viewer.viewer === 'resolving') return;
    if (isLoading) return;

    // Claimed before anything async runs, so a StrictMode double-invoke or a
    // re-render mid-resume can't run the flow twice. The parameter goes with
    // it: a one-time instruction must not replay on reload.
    applyResumeHandled.current = true;
    stripPendingApplyFromUrl();

    /* The job-less sign-up's landing: the newest role the board is showing.
       Resolved here rather than at sign-up time because "newest" is a question
       about the list as it loads now — a fresher posting can arrive while Privy
       is on screen, and naming a uid up front would land on the wrong one.

       `getJobDate` is the board's own notion of a role's date
       (`postedDate ?? detectionDate ?? lastUpdated`), so this opens the same role
       the Newest sort puts at the top rather than a second definition of new. */
    if (viewNewest && !roleUid) {
      const newest = pickNewestRole(groups);

      /* An empty board — every role filtered out, or none live. There is no job
         to open, so fall back to the profile, which is the other thing a fresh
         account has to do and the landing this replaced. */
      if (newest) {
        flow.onViewJob({
          role: newest.role,
          teamId: newest.team.uid,
          teamName: newest.team.name,
          team: newest.team,
        });
      } else {
        flow.onUpdateProfile();
      }
      return;
    }

    /* The team travels with it: reading is step 1 of the flow, so a resumed run
       has to be able to render the review step it may step back to. */
    let resumed: JobDetailTarget | null = null;
    for (const group of groups) {
      const role = group.roles.find((r) => r.uid === roleUid);
      if (role) {
        resumed = { role, teamId: group.team.uid, teamName: group.team.name, team: group.team };
        break;
      }
    }

    if (resumed) {
      flow.onResumeAfterSignUp(resumed);
    } else {
      /* The role closed, or the filters no longer show it. The profile is
         still the thing standing between them and applying, so the drawer
         opens without naming a role rather than resuming nothing at all. */
      flow.onUpdateProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isLoggedIn, viewer.viewer, isLoading, groups]);

  const controller = enabled ? (
    <JobApplyFlowController flow={flow} viewer={viewer} isLoggedIn={isLoggedIn} userInfo={userInfo} source={source} />
  ) : null;

  return { viewer, flow, applyProps, controller };
}
