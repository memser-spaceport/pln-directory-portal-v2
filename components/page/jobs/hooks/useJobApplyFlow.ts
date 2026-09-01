'use client';

import { useCallback, useReducer, useRef } from 'react';

import { useJobsAnalytics, type JobApplyTrigger, type JobSurface } from '@/analytics/jobs.analytics';
import { openExternalApply } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import { isProtocolLabsTeam } from '@/services/jobs/protocol-labs-team';
import type { BoardViewerState, JobsAccessVerdict } from '@/services/jobs/job-board-viewer';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

/**
 * A role plus the team that posted it — what the apply flow carries between
 * pressing Apply and sending the letter.
 */
export interface ApplyTarget {
  role: IJobRole;
  teamId: string;
  teamName: string;
}

/**
 * An apply target plus the team record itself, for the review step's masthead
 * (logo, focus tags).
 *
 * **Every flow run carries one now.** This used to be a superset used by the
 * detail drawer alone, because Apply could start without ever passing through a
 * reading step and the id and the name were all an application needed. Reading
 * is step 1 of the flow, so the team is always in hand by the time anything else
 * happens — and a rail that shows three steps has to be able to render all three
 * of them.
 */
export interface JobDetailTarget extends ApplyTarget {
  team: IJobTeam;
}

/** The three places the flow stops, in order. */
export const APPLY_FLOW_STEPS = ['review', 'profile', 'application'] as const;
export type ApplyFlowStepId = (typeof APPLY_FLOW_STEPS)[number];

/**
 * Whether Apply leaves the site for this viewer and this role.
 *
 * Protocol Labs takes applications in-app for everyone who can still reach
 * Apply. Every other employer gets their own posting when there is no approved
 * account yet — a signed-out visitor, or one still awaiting review — because
 * handing them a stranger the PL team has not vetted is the board applying
 * *for* a team that did not ask it to.
 */
export const shouldApplyGoExternal = (args: {
  viewer: BoardViewerState;
  verdict: JobsAccessVerdict;
  team: IJobTeam | null | undefined;
}): boolean => !isProtocolLabsTeam(args.team) && (args.viewer === 'logged-out' || args.verdict === 'pending');

/**
 * The flow's whole state as ONE discriminated union: illegal combinations (two
 * overlays open, a cover letter with no flow in progress) are unrepresentable.
 *
 * **This used to be five steps and it is three.** `detail`, `drawer` and `apply`
 * were separate surfaces — a drawer, a drawer and a centred modal — and the
 * union had to carry `returnToApply` and a `pendingApply` role to stitch them
 * back together, because `Edit profile` meant tearing down the modal, building a
 * drawer, saving, tearing that down and rebuilding the modal. They are three
 * positions inside one container now, so where you are is a field (`at`) rather
 * than a different variant, and going back is moving that field.
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
   * The flow proper. `at` is which of the three is showing; the cover letter
   * lives here rather than in the pane that collects it, because stepping back
   * to re-read the posting unmounts that pane and a letter that died on a step
   * change would make the rail a trap.
   */
  | { step: 'flow'; target: JobDetailTarget; at: ApplyFlowStepId; coverLetterDraft: string }
  /**
   * The profile stack with no application behind it — the banner's "Update
   * profile", and where a post-login resume lands when the role it was holding
   * has since closed. Not a flow step: there is no role to review and nothing to
   * send, so a three-step rail would be promising two places that do not exist.
   */
  | { step: 'profile-only' };

type ApplyFlowAction =
  | { type: 'OPEN_SIGN_UP'; target: ApplyTarget | null }
  | { type: 'OPEN_FLOW'; target: JobDetailTarget; at: ApplyFlowStepId }
  | { type: 'GO_TO_STEP'; at: ApplyFlowStepId }
  | { type: 'SET_COVER_LETTER'; coverLetterDraft: string }
  | { type: 'OPEN_PROFILE_ONLY' }
  | { type: 'CLOSE' }
  | { type: 'SUBMITTED' };

const IDLE: ApplyFlowState = { step: 'idle' };

export function applyFlowReducer(state: ApplyFlowState, action: ApplyFlowAction): ApplyFlowState {
  switch (action.type) {
    case 'OPEN_SIGN_UP':
      return { step: 'sign-up', target: action.target };
    case 'OPEN_FLOW':
      return { step: 'flow', target: action.target, at: action.at, coverLetterDraft: '' };
    case 'GO_TO_STEP':
      /* Only from inside the flow. A stray step change arriving after something
         replaced the flow must not resurrect it around a target that is gone. */
      return state.step === 'flow' ? { ...state, at: action.at } : state;
    case 'SET_COVER_LETTER':
      return state.step === 'flow' ? { ...state, coverLetterDraft: action.coverLetterDraft } : state;
    case 'OPEN_PROFILE_ONLY':
      return { step: 'profile-only' };
    case 'CLOSE':
    case 'SUBMITTED':
      // Backed out or sent — either way the letter has nothing left to wait for.
      return IDLE;
  }
}

export interface JobApplyFlowArgs {
  viewer: BoardViewerState;
  verdict: JobsAccessVerdict;
  /* (`profileComplete` stood here. It had one reader — the branch in `onApply`
      that skipped the profile step for a member who had already filled one in —
      and went when that branch did. The routing no longer consults the profile
      at all: every in-app application stops at step 2, because that step now asks
      for a confirmation as well as collecting answers. The drawer still takes a
      `profileComplete` prop, from `useJobBoardViewer` directly; it seeds what the
      footer gates on, which is a different question from where Apply lands.) */
  refreshVerdict: () => Promise<JobsAccessVerdict>;
  source: JobSurface;
}

/**
 * The orchestration machine behind in-app Apply. Page-agnostic on purpose: the
 * board (`JobsContent`) is host #1, the team profile becomes host #2 by calling
 * this same hook and rendering the same controller.
 *
 * The dispatch handlers are also the analytics choke point — every funnel edge
 * is exactly one handler, so instrumentation cannot drift from behavior.
 */
export function useJobApplyFlow({ viewer, verdict, refreshVerdict, source }: JobApplyFlowArgs) {
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

  const viewStep = useCallback(
    (step: ApplyFlowStepId | 'sign-up', target: ApplyTarget | null) => {
      analytics.onJobApplyStepViewed({ ...applyBase(target), step });
    },
    [analytics, applyBase],
  );

  /**
   * Pressing **View job**, or the role title: the flow opens on its first step.
   *
   * Deliberately gate-free. Reading a posting is not an act anyone needs an
   * account for, so this asks nothing and checks nothing — the whole point of
   * putting reading first is that the decision happens *after* it, and every
   * gate `onApply` runs still runs when Apply is pressed at the bottom.
   *
   * What is new is that the rail comes with it: someone who only came to read
   * sees what they saw before, plus three named places telling them what the
   * button at the bottom will cost. That is a promise about the future, not a
   * claim about the present.
   */
  const onViewJob = useCallback(
    (target: JobDetailTarget) => {
      analytics.onJobDetailOpened(applyBase(target));
      viewStep('review', target);
      dispatch({ type: 'OPEN_FLOW', target, at: 'review' });
    },
    [analytics, applyBase, viewStep],
  );

  /**
   * Pressing Apply — from the review step's footer, or directly from a row on a
   * surface that has no reading step.
   *
   * One entry point, and the role is carried through whatever it opens: whatever
   * is missing gets asked for, and then the application resumes.
   */
  const onApply = useCallback(
    async (target: JobDetailTarget, trigger: JobApplyTrigger = 'row') => {
      analytics.onJobApplyClicked({ ...applyBase(target), trigger });

      if (viewer === 'logged-out') {
        /* Non-PL roles leave the site even without an account — the footer
           already says "Apply on their site", and sending them through sign-up
           first would make that label a lie. Protocol Labs still collects the
           account: it is the one employer whose hiring this board runs. */
        if (shouldApplyGoExternal({ viewer, verdict, team: target.team })) {
          analytics.onJobApplyExternalRedirected(applyBase(target));
          openExternalApply(target.role.applyUrl, source);
          return;
        }

        /* Not a sign-in prompt: the sign-up form IS the ask at the moment of
           intent, and it carries the role so the flow can resume on it.

           It is now the flow's own step 2 rather than a modal over the top —
           the account takes the position a member's profile occupies, so the
           rail stays visible and keeps saying how much further there is. Landing
           ON the step rather than opening at `review` is deliberate: pressing
           Apply is a decision already made, and Back still goes to the posting.

           A press from a row (no drawer open yet) takes the same path, which is
           why this is one branch and not two — `OPEN_FLOW` starts the flow and
           is idempotent on the target either way. */
        dispatch({ type: 'OPEN_FLOW', target, at: 'profile' });
        viewStep('profile', target);
        return;
      }

      // The sub-state queries haven't settled — the press landed inside the
      // first-paint window. Ignore rather than guess: acting on a half-derived
      // viewer risks opening the profile step at someone with nothing to fill in.
      if (viewer === 'resolving') return;

      // A rejected account has no apply path. The row doesn't render the button
      // for them, but `resumeAfterLogin` calls this directly — without the
      // guard a rejected member with a complete profile would fall through as
      // `approved` and be handed the letter.
      if (viewer === 'rejected' || verdict === 'rejected') return;

      let access: JobsAccessVerdict = verdict;
      if (access !== 'approved') {
        /* Still rechecked, for a different reason than before.
           It used to be about catching an approval that landed mid-session, so
           the member got in-app Apply rather than the team's own posting. That
           distinction is gone — pending and approved take the same path now. What
           is left is rejection, and it matters *more* than it used to: a pending
           member's press sends a real application to a hiring team, so it is
           worth one round trip to be sure they haven't been turned down since
           the cookie was written. */
        if (applyPressInFlight.current) return;
        applyPressInFlight.current = true;
        try {
          access = await refreshVerdict();
        } finally {
          applyPressInFlight.current = false;
        }
      }

      if (access === 'rejected') return;

      /**
       * An account still awaiting approval applies on the employer's own site —
       * except to Protocol Labs, which takes it through the wizard. Same rule as
       * the logged-out branch above; the helper is what keeps them from drifting.
       *
       * **This is the board's original rule with one carve-out.** It was removed
       * outright when approval stopped gating applying; the carve-out is what
       * that removal should have been. PL is the one employer on this board whose
       * hiring the network runs, so an application it receives from an unapproved
       * account is an application it can decide about itself. Every other team is
       * being handed a stranger the PL team has not vetted, and their own posting
       * is the honest place for that.
       *
       * Note what is *not* consulted for a signed-in member: the viewer state. A
       * Job Aspirant derives as `profile-ready` even while unapproved (see
       * `deriveBoardViewer`, which keeps the pending banner away from people who
       * are not in that review) — so reading the banner state here would let
       * them apply anywhere. The verdict is the access answer; the viewer state
       * is a presentation one. Logged-out is the exception, because there is no
       * verdict yet and the visitor still has to leave for a non-PL role.
       */
      if (shouldApplyGoExternal({ viewer, verdict: access, team: target.team })) {
        analytics.onJobApplyExternalRedirected(applyBase(target));
        openExternalApply(target.role.applyUrl, source);
        return;
      }

      /* Past that, everyone lands on the profile step — including a member whose
         profile is already complete.

         **This used to skip straight to the application for them** (`if
         (profileComplete) … at: 'application'`), on the reasoning that a step
         with nothing left to collect is a step worth saving. That reasoning was
         about *collecting*, and the step is no longer only for that: it now asks
         for "I reviewed my profile", and what the hiring team reads is the
         profile rather than the letter alone. A confirmation nobody is shown is
         not a confirmation, and the people most likely to be sending something
         stale are exactly the ones the skip was routing around.

         So the rail is three stops for every in-app application, and its middle
         one is a read rather than a form for anyone who has already filled it in.

         `OPEN_FLOW` rather than `GO_TO_STEP` even when the flow is already open
         on the review step: it is idempotent on the target and it is the one
         action that can also start the flow from a row that never opened one. */
      dispatch({ type: 'OPEN_FLOW', target, at: 'profile' });
      analytics.onJobApplyDrawerOpened(applyBase(target));
      viewStep('profile', target);
    },
    [analytics, applyBase, refreshVerdict, source, verdict, viewer, viewStep],
  );

  /** Moving along the rail, or the header's Back. Analytics for arriving at the
   *  profile step is fired here too, so the funnel counts a visit however it
   *  was reached rather than only when Apply routed someone there. */
  const goToStep = useCallback(
    (at: ApplyFlowStepId) => {
      if (state.step === 'flow' && at !== state.at) {
        if (at === 'profile') {
          analytics.onJobApplyDrawerOpened(applyBase(state.target));
        }
        viewStep(at, state.target);
      }
      dispatch({ type: 'GO_TO_STEP', at });
    },
    [analytics, applyBase, state, viewStep],
  );

  /** The letter, lifted out of the pane that collects it — see `ApplyFlowState`. */
  const setCoverLetter = useCallback(
    (coverLetterDraft: string) => dispatch({ type: 'SET_COVER_LETTER', coverLetterDraft }),
    [],
  );

  /** Sign up from the banner or header — no role, the form goes generic. */
  const onSignUp = useCallback(
    (trigger: Exclude<JobApplyTrigger, 'row'>) => {
      analytics.onJobApplyClicked({ ...applyBase(null), trigger });
      viewStep('sign-up', null);
      dispatch({ type: 'OPEN_SIGN_UP', target: null });
    },
    [analytics, applyBase, viewStep],
  );

  /**
   * A rejected account has no apply path, and this feature's answer to that is
   * plain browsing: no banner, because the pending copy would promise an
   * approval that will not come (`job-board-viewer.ts:16-18`,
   * `JobBoardBanner.tsx:47-48`). `onApply` has always refused them; rows never
   * offer the slot, since the host withholds `applyProps` for this viewer.
   *
   * The two callbacks below are the doors that do not go through a row — the
   * banner CTA and the resume — so they are where the same refusal has to be
   * said again.
   */
  const applyRejected = viewer === 'rejected' || verdict === 'rejected';

  /** The banner's update/complete-profile CTA, and the resume fallback. */
  const onUpdateProfile = useCallback(() => {
    /* "Update your profile to apply" is the one sentence this drawer is for, and
       for a rejected account it is not true. Unreachable from the banner, which
       renders nothing for them — reachable from the resume, which is why it is
       guarded here rather than at the caller. */
    if (applyRejected) return;
    dispatch({ type: 'OPEN_PROFILE_ONLY' });
    analytics.onJobApplyDrawerOpened(applyBase(null));
  }, [analytics, applyBase, applyRejected]);

  const close = useCallback(
    (opts?: { completed?: boolean }) => {
      if (!opts?.completed && (state.step === 'flow' || state.step === 'sign-up')) {
        analytics.onJobApplyFlowClosed({
          ...applyBase(state.target),
          step: state.step === 'sign-up' ? 'sign-up' : state.at,
          cover_letter_started: state.step === 'flow' && state.coverLetterDraft.trim().length > 0,
        });
      }
      dispatch({ type: 'CLOSE' });
    },
    [analytics, applyBase, state],
  );
  const closeSignUp = close;

  /** A profile save reported from whichever surface collected it. */
  const onProfileSaved = useCallback(
    (args: { profileComplete: boolean }) => {
      const target = state.step === 'flow' ? state.target : null;
      analytics.onJobApplyDrawerSaved({ ...applyBase(target), profile_complete: args.profileComplete });
    },
    [analytics, applyBase, state],
  );

  const onSubmitted = useCallback(() => dispatch({ type: 'SUBMITTED' }), []);

  /**
   * After sign-up + Privy, land on the job they started from — even if the form
   * already answered enough to skip the profile step. The rest of the profile
   * (contact details, role if they skipped it) is still to fill.
   *
   * **Which step depends on where this application is actually going.** A new
   * account's verdict is `pending`, so for any non-PL team `shouldApplyGoExternal`
   * was already true when they pressed Apply — and the footer told them so:
   * "Continue to apply", on the employer's own site. Resuming straight onto the
   * profile step put the in-app letter in front of someone who had been promised
   * the opposite, and let them finish it. The rule this consults is the one
   * `onApply` consults; it was simply never asked here.
   *
   * It resumes on the *reading* step rather than redirecting, because a redirect
   * here would be a `window.open` with no user gesture behind it — the browser
   * blocks that, and a silently blocked redirect is worse than the wrong step.
   * The review step already carries the external press as a button
   * (`JobApplyFlowDrawer`'s footer, where the rail is hidden and the action is
   * "Continue to apply"), so this hands them the promise instead of breaking it.
   */
  const onResumeAfterSignUp = useCallback(
    (target: JobDetailTarget) => {
      /* `onApply`'s guard, said again on the path that does not go through it.
         Nothing downstream would stop them: the drawer's `canApply` asks about
         login, completeness and the review tick, not access, so a resumed
         rejected account could reach the letter and press send. */
      if (applyRejected) return;

      const at: ApplyFlowStepId = shouldApplyGoExternal({ viewer, verdict, team: target.team })
        ? 'review'
        : 'profile';
      dispatch({ type: 'OPEN_FLOW', target, at });
      analytics.onJobApplyDrawerOpened(applyBase(target));
      viewStep(at, target);
    },
    [analytics, applyBase, applyRejected, verdict, viewer, viewStep],
  );

  return {
    state,
    onApply,
    onViewJob,
    goToStep,
    setCoverLetter,
    onSignUp,
    onUpdateProfile,
    onResumeAfterSignUp,
    closeSignUp,
    close,
    onProfileSaved,
    onSubmitted,
  };
}
