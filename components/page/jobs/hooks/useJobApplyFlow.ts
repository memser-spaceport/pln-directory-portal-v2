'use client';

import { useCallback, useReducer, useRef } from 'react';

import { useJobsAnalytics, type JobApplyTrigger, type JobSurface } from '@/analytics/jobs.analytics';
import type { BoardViewerState, JobsAccessVerdict } from '@/services/jobs/job-board-viewer';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

/**
 * A role plus the team that posted it — what the apply flow carries between
 * pressing Apply and sending the letter, possibly through the sign-up form and
 * the profile drawer.
 */
export interface ApplyTarget {
  role: IJobRole;
  teamId: string;
  teamName: string;
}

/**
 * What the detail drawer needs on top of an apply target: the team record
 * itself, for the masthead's logo and focus tags.
 *
 * A superset rather than a widening of `ApplyTarget`, so the team is REQUIRED
 * exactly where it is used and absent everywhere else. Apply never needed it —
 * the id and the name are all the application carries — and making it optional
 * on the shared type would let a caller open a drawer with no masthead and find
 * out at runtime.
 */
export interface JobDetailTarget extends ApplyTarget {
  team: IJobTeam;
}

/**
 * The flow's whole state as ONE discriminated union: illegal combinations (two
 * overlays open, a cover letter with no flow in progress) are unrepresentable,
 * and "drawer-cancel returns to the apply modal with the letter intact" is a
 * transition that cannot forget the letter, because the letter lives in the
 * state being transitioned from.
 *
 * Viewer state is deliberately NOT mirrored in here — it stays derived
 * (`useJobBoardViewer`) and is read at dispatch time. This union holds flow
 * state only.
 */
export type ApplyFlowState =
  | { step: 'idle' }
  /** `target: null` = a plain Sign up press (banner/header) — the form goes generic. */
  | { step: 'sign-up'; target: ApplyTarget | null }
  /**
   * `returnToApply` marks the drawer as an Edit-profile detour from the apply
   * modal: closing it — save or cancel — lands back on the modal with the
   * letter intact. A drawer reached from an Apply press gate (`returnToApply:
   * false`) closes to the board: the person backed out of the profile step, and
   * ambushing them with the modal later would be the gate refusing to take no.
   */
  | { step: 'drawer'; pendingApply: ApplyTarget | null; coverLetterDraft: string; returnToApply: boolean }
  | { step: 'apply'; target: ApplyTarget; coverLetterDraft: string }
  /**
   * Reading the job, before deciding anything.
   *
   * Carries no draft and no `returnToApply`: this step is upstream of the whole
   * apply flow rather than a detour inside it, so there is never anything half
   * written to preserve. Closing it goes back to the board, and pressing Apply
   * inside it goes wherever `onApply` decides — which is why no transition
   * returns *to* here.
   */
  | { step: 'detail'; target: JobDetailTarget };

type ApplyFlowAction =
  | { type: 'OPEN_SIGN_UP'; target: ApplyTarget | null }
  | { type: 'CLOSE_SIGN_UP' }
  | { type: 'OPEN_DRAWER'; pendingApply: ApplyTarget | null }
  | { type: 'EDIT_PROFILE_FROM_APPLY'; coverLetterDraft: string }
  | { type: 'DRAWER_SAVED'; canResume: boolean }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'OPEN_APPLY'; target: ApplyTarget }
  | { type: 'CLOSE_APPLY' }
  | { type: 'OPEN_DETAIL'; target: JobDetailTarget }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'SUBMITTED' };

const IDLE: ApplyFlowState = { step: 'idle' };

export function applyFlowReducer(state: ApplyFlowState, action: ApplyFlowAction): ApplyFlowState {
  switch (action.type) {
    case 'OPEN_SIGN_UP':
      return { step: 'sign-up', target: action.target };
    case 'CLOSE_SIGN_UP':
      return IDLE;
    case 'OPEN_DRAWER':
      return { step: 'drawer', pendingApply: action.pendingApply, coverLetterDraft: '', returnToApply: false };
    case 'EDIT_PROFILE_FROM_APPLY':
      return state.step === 'apply'
        ? { step: 'drawer', pendingApply: state.target, coverLetterDraft: action.coverLetterDraft, returnToApply: true }
        : state;
    case 'DRAWER_SAVED':
      if (state.step !== 'drawer') return state;
      // Resume: the drawer was a detour, so its exit is the thing the person was
      // doing when interrupted — but only once the account can actually apply.
      if (action.canResume && state.pendingApply) {
        return { step: 'apply', target: state.pendingApply, coverLetterDraft: state.coverLetterDraft };
      }
      return IDLE;
    case 'CLOSE_DRAWER':
      if (state.step !== 'drawer') return state;
      if (state.returnToApply && state.pendingApply) {
        // The Edit-profile detour ends where it started: cancelling the drawer
        // must not delete a half-written letter the person was sent away from.
        return { step: 'apply', target: state.pendingApply, coverLetterDraft: state.coverLetterDraft };
      }
      return IDLE;
    case 'OPEN_APPLY':
      return { step: 'apply', target: action.target, coverLetterDraft: '' };
    case 'OPEN_DETAIL':
      return { step: 'detail', target: action.target };
    case 'CLOSE_DETAIL':
      /* Only from `detail`. Pressing Apply inside the drawer dispatches one of
         the OPEN_* cases, which replace this step wholesale — so a stray close
         arriving after that must not knock the sign-up form or the profile
         drawer back to idle. */
      return state.step === 'detail' ? IDLE : state;
    case 'CLOSE_APPLY':
    case 'SUBMITTED':
      // Cancelled outright or sent — either way the letter has nothing left to wait for.
      return IDLE;
  }
}

export interface JobApplyFlowArgs {
  viewer: BoardViewerState;
  profileComplete: boolean;
  refreshVerdict: () => Promise<JobsAccessVerdict>;
  source: JobSurface;
}

/**
 * The orchestration machine behind in-app Apply. Page-agnostic on purpose: the
 * board (`JobsContent`) is host #1, the team profile becomes host #2 in the
 * feature's phase 2 by calling this same hook and rendering the same controller.
 *
 * The dispatch handlers are also the analytics choke point — every funnel edge
 * is exactly one handler, so instrumentation cannot drift from behavior.
 */
export function useJobApplyFlow({ viewer, profileComplete, refreshVerdict, source }: JobApplyFlowArgs) {
  const [state, dispatch] = useReducer(applyFlowReducer, IDLE);
  const analytics = useJobsAnalytics();
  const applyPressInFlight = useRef(false);

  const applyBase = useCallback(
    (target: ApplyTarget | null) => ({
      job_id: target?.role.uid ?? null,
      team_id: target?.teamId ?? null,
      viewer_state: viewer,
      source,
    }),
    [viewer, source],
  );

  /**
   * Pressing Apply on a row. One entry point, three outcomes, and the role is
   * carried through all of them — whatever is missing gets asked for, and then
   * the application resumes.
   */
  const onApply = useCallback(
    async (target: ApplyTarget, trigger: JobApplyTrigger = 'row') => {
      analytics.onJobApplyClicked({ ...applyBase(target), trigger });

      if (viewer === 'logged-out') {
        // Not a sign-in prompt: the sign-up form IS the ask at the moment of
        // intent, and it carries the role so the flow can resume on it.
        dispatch({ type: 'OPEN_SIGN_UP', target });
        return;
      }

      // The sub-state queries haven't settled — the press landed inside the
      // first-paint window. Ignore rather than guess: acting on a half-derived
      // viewer risks opening the drawer at someone with nothing to fill in.
      if (viewer === 'resolving') return;

      // A rejected account has no apply path. The row doesn't render the button
      // for them, but `resumeAfterLogin` calls this directly — without the
      // guard a rejected member with a complete profile would fall through the
      // ternary below as `approved` and be handed the apply modal.
      if (viewer === 'rejected') return;

      let verdict: JobsAccessVerdict = viewer === 'pending-approval' ? 'pending' : 'approved';
      if (viewer === 'pending-approval') {
        // The one moment the pending copy could lie: an approval that landed
        // mid-session. Recheck before explaining a wait that may be over.
        if (applyPressInFlight.current) return;
        applyPressInFlight.current = true;
        try {
          verdict = await refreshVerdict();
        } finally {
          applyPressInFlight.current = false;
        }
      }

      if (verdict === 'approved' && profileComplete) {
        dispatch({ type: 'OPEN_APPLY', target });
        return;
      }

      // Pending members land in the drawer because for them the drawer is the
      // explanation (the stepper says where they are); incomplete profiles land
      // in it because it collects the two required answers. Either way the role
      // stays pending so saving resumes the application.
      dispatch({ type: 'OPEN_DRAWER', pendingApply: target });
      analytics.onJobApplyDrawerOpened(applyBase(target));
    },
    [analytics, applyBase, profileComplete, refreshVerdict, viewer],
  );

  /**
   * Pressing **View job**, or the role title.
   *
   * Deliberately gate-free. Reading a posting is not an act anyone needs an
   * account for, so this asks nothing and checks nothing — the whole point of
   * moving Apply behind it is that the decision happens *after* the reading,
   * and every gate `onApply` runs still runs when Apply is pressed at the
   * bottom of the panel.
   */
  const onViewJob = useCallback(
    (target: JobDetailTarget) => {
      analytics.onJobDetailOpened(applyBase(target));
      dispatch({ type: 'OPEN_DETAIL', target });
    },
    [analytics, applyBase],
  );

  const closeDetail = useCallback(() => dispatch({ type: 'CLOSE_DETAIL' }), []);

  /** Sign up from the banner or header — no role, the form goes generic. */
  const onSignUp = useCallback(
    (trigger: Exclude<JobApplyTrigger, 'row'>) => {
      analytics.onJobApplyClicked({ ...applyBase(null), trigger });
      dispatch({ type: 'OPEN_SIGN_UP', target: null });
    },
    [analytics, applyBase],
  );

  /** The banner's update/complete-profile CTA. */
  const onUpdateProfile = useCallback(() => {
    dispatch({ type: 'OPEN_DRAWER', pendingApply: null });
    analytics.onJobApplyDrawerOpened(applyBase(null));
  }, [analytics, applyBase]);

  const closeSignUp = useCallback(() => dispatch({ type: 'CLOSE_SIGN_UP' }), []);
  const closeDrawer = useCallback(() => dispatch({ type: 'CLOSE_DRAWER' }), []);
  const closeApply = useCallback(() => dispatch({ type: 'CLOSE_APPLY' }), []);

  const onEditProfileFromApply = useCallback(
    (coverLetterDraft: string) => dispatch({ type: 'EDIT_PROFILE_FROM_APPLY', coverLetterDraft }),
    [],
  );

  const onDrawerSaved = useCallback(
    (args: { profileComplete: boolean; canApply: boolean }) => {
      const pending = state.step === 'drawer' ? state.pendingApply : null;
      analytics.onJobApplyDrawerSaved({ ...applyBase(pending), profile_complete: args.profileComplete });
      dispatch({ type: 'DRAWER_SAVED', canResume: args.canApply && args.profileComplete });
    },
    [analytics, applyBase, state],
  );

  const onSubmitted = useCallback(() => dispatch({ type: 'SUBMITTED' }), []);

  return {
    state,
    onApply,
    onViewJob,
    closeDetail,
    onSignUp,
    onUpdateProfile,
    closeSignUp,
    closeDrawer,
    closeApply,
    onEditProfileFromApply,
    onDrawerSaved,
    onSubmitted,
  };
}
