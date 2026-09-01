'use client';

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { useMember } from '@/services/members/hooks/useMember';
import { useMemberExperience } from '@/services/members/hooks/useMemberExperience';
import {
  areAllJobProfileSectionsFilled,
  BoardViewerState,
  deriveBoardViewer,
  getJobsAccessVerdict,
  isJobAspirant,
  isJobProfileComplete,
  isJobSearchStatus,
  JobsAccessVerdict,
  JobSearchStatus,
} from '@/services/jobs/job-board-viewer';
import { IUserInfo } from '@/types/shared.types';

/** How long an on-Apply access recheck stays fresh — stops a double-tapped Apply
 *  from firing two refetches without letting a 5-minute stale cache hide an
 *  approval that landed mid-session. */
const VERDICT_RECHECK_WINDOW_MS = 15_000;

export interface JobBoardViewerResult {
  viewer: BoardViewerState;
  verdict: JobsAccessVerdict;
  memberUid: string | undefined;
  jobSearchStatus: JobSearchStatus | null;
  profileComplete: boolean;
  jobAspirant: boolean;
  /**
   * Every fillable profile section has a value. The JA banner uses this, not
   * `profileComplete` — Apply only needs role + status; the nudge stays until
   * skills, bio and experience are filled too.
   */
  allSectionsFilled: boolean;
  /**
   * Refetch the member record and return the fresh verdict. Used on an Apply
   * press by a non-approved account, where the cookie-derived status can lag the
   * record (cookie and API diverge both ways).
   *
   * It used to be about catching an approval that landed mid-session, so the
   * member got the in-app letter rather than the hiring team's own posting.
   * Approval no longer gates applying, so what this now guards is rejection —
   * and it matters more than it did, because the press it precedes sends a real
   * application.
   */
  refreshVerdict: () => Promise<JobsAccessVerdict>;
}

/**
 * The ONE place the board derives who is looking at it.
 *
 * SSR (cookie props) authoritatively answers only logged-out vs logged-in; the
 * logged-in sub-states are client-query-derived — member record (role,
 * completeness, fresher access state) + the job search status. While those
 * queries are in flight the viewer is `resolving`, in which the banner slot
 * renders nothing. All decision logic lives in the pure functions in
 * `services/jobs/job-board-viewer.ts`; this hook only wires queries to them.
 */
export function useJobBoardViewer(args: {
  isLoggedIn: boolean;
  userInfo: IUserInfo | undefined;
  /** The feature flag reaches this hook as `enabled` — off, it issues zero requests. */
  enabled: boolean;
}): JobBoardViewerResult {
  const { isLoggedIn, userInfo, enabled } = args;
  const queryClient = useQueryClient();
  const memberUid = userInfo?.uid;

  /* `Boolean(...)`, not `&&`: this reaches react-query's `enabled`, which rejects
     anything that is not a boolean. `isLoggedIn` is typed `boolean` here but
     arrives from `getCookiesFromHeaders()`, which parses a header and is typed
     `any` — logged out it is an empty string, and `'' && x` is `''`, not `false`.
     `useMemberExperience` then defaults it with `??`, which passes `''` through
     untouched, and the observer throws. Coerce once, here, so no caller can
     poison it again. */
  const active = Boolean(enabled && isLoggedIn && memberUid);
  const memberQuery = useMember(active ? memberUid : undefined);

  const member = memberQuery.data && 'memberInfo' in memberQuery.data ? memberQuery.data.memberInfo : null;

  /* The member record is the freshest read of access state (its rbac.status is
     the live memberState); the cookie-derived userInfo is the fallback while it
     loads or errors. */
  const effectiveUserInfo: IUserInfo | null = member
    ? {
        ...userInfo,
        signUpSource: member.signUpSource ?? userInfo?.signUpSource,
        accessLevel: member.accessLevel ?? userInfo?.accessLevel,
        rbac: member.rbac ?? userInfo?.rbac,
      }
    : (userInfo ?? null);

  // One query settles the whole viewer now: the job search status rides on the
  // member record (PL-Team-only, so the API omits it for anyone else), rather
  // than the separate endpoint the mocked version needed.
  const isResolved = !active || memberQuery.isSuccess || memberQuery.isError;

  const jobSearchStatus = isJobSearchStatus(member?.jobSearchStatus) ? member.jobSearchStatus : null;
  const profileComplete = isJobProfileComplete(member, jobSearchStatus);
  const jobAspirant = isJobAspirant(effectiveUserInfo);

  const experienceQuery = useMemberExperience(memberUid ?? '', { enabled: active && jobAspirant });
  const experienceCount = Array.isArray(experienceQuery.data) ? experienceQuery.data.length : 0;
  const experienceKnown = !jobAspirant || experienceQuery.isSuccess || experienceQuery.isError;
  const allSectionsFilled = experienceKnown && areAllJobProfileSectionsFilled(member, jobSearchStatus, experienceCount);

  const viewer = deriveBoardViewer({ isLoggedIn, userInfo: effectiveUserInfo, isResolved, profileComplete });
  const verdict = getJobsAccessVerdict(effectiveUserInfo);

  const lastRecheckAt = useRef(0);
  const refreshVerdict = useCallback(async (): Promise<JobsAccessVerdict> => {
    if (!memberUid) return 'pending';
    if (Date.now() - lastRecheckAt.current > VERDICT_RECHECK_WINDOW_MS) {
      lastRecheckAt.current = Date.now();
      // Refetch through the mounted observer (reuses useMember's fetcher), then
      // read the cache — an explicit refetch bypasses any staleTime politeness.
      await queryClient.refetchQueries({ queryKey: [MembersQueryKeys.GET_MEMBER, memberUid] });
    }
    const data = queryClient.getQueryData<{
      memberInfo?: { accessLevel?: IUserInfo['accessLevel']; rbac?: IUserInfo['rbac'] };
    }>([MembersQueryKeys.GET_MEMBER, memberUid]);
    const fresh = data?.memberInfo;
    return getJobsAccessVerdict(
      fresh
        ? { ...userInfo, accessLevel: fresh.accessLevel ?? userInfo?.accessLevel, rbac: fresh.rbac ?? userInfo?.rbac }
        : (userInfo ?? null),
    );
  }, [memberUid, queryClient, userInfo]);

  return {
    viewer,
    verdict,
    memberUid,
    jobSearchStatus,
    profileComplete,
    jobAspirant,
    allSectionsFilled,
    refreshVerdict,
  };
}
