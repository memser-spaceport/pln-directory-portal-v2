'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { toast } from '@/components/core/ToastContainer';
import { Button } from '@/components/common/Button';
import { Drawer } from '@/components/common/Drawer';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { IMember } from '@/types/members.types';

import { useSubmitJobApplication } from '@/services/jobs/hooks/useJobApplications';
import {
  isAlreadyAppliedError,
  isJobGoneError,
  isNotApprovedError,
  isProfileIncompleteError,
  isUnreachableTeamError,
} from '@/services/jobs/job-applications.service';
import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import type { BoardViewerState } from '@/services/jobs/job-board-viewer';

import { ApplyFlowSteps, type ApplyFlowStep } from '@/components/page/jobs/ApplyFlowSteps/ApplyFlowSteps';
import { JobDetailPane } from '@/components/page/jobs/JobDetailPane/JobDetailPane';
import {
  JobProfilePane,
  BackIcon,
  missingHint,
  sentenceCase,
  type ProfileState,
} from '@/components/page/jobs/JobProfileDrawer/JobProfileDrawer';
import {
  JobApplicationPane,
  COVER_LETTER_MAX_LENGTH,
} from '@/components/page/jobs/JobApplicationPane/JobApplicationPane';
import {
  APPLY_FLOW_STEPS,
  type ApplyFlowStepId,
  type JobDetailTarget,
} from '@/components/page/jobs/hooks/useJobApplyFlow';
import { formatRelativeDays } from '@/utils/jobs.utils';
import { isProtocolLabsTeam } from '@/services/jobs/protocol-labs-team';
import { JobAccountPane } from '@/components/page/jobs/JobAccountPane/JobAccountPane';
import {
  accountSchema,
  toAccountDetails,
  signUpFailureMessage,
  EMPTY_ACCOUNT_FORM,
  type AccountFormData,
  type AccountDetails,
  type JobSignUpResult,
} from '@/components/page/jobs/JobSignUpModal/accountFields';

// Button's stylesheet, for the "Applied" report — an element wearing the DS
// button rather than a lookalike, exactly as the row does it.
import btn from '@/components/common/Button/Button.module.scss';
// Demo Day's profile-completion chrome: the sticky 64px header with its Back
// affordance, and the 720px-max centred content column. All three steps wear it,
// so the flow opens the same way wherever you are in it.
import s from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';
import d from './JobApplyFlowDrawer.module.scss';

/**
 * The rail's labels. Three positions, and they do not move.
 *
 * The shape being fixed is what makes the flow learnable: three places, the last
 * one always the letter. A rail that is two items for some people and three for
 * others is a rail nobody can learn the shape of.
 */
const STEP_TITLE: Record<ApplyFlowStepId, string> = {
  review: 'Review job',
  /* Not "Update profile", which is what this step is called when you arrive at
     it empty — and a lie for the people who arrive with it already filled in and
     never stop here. A rail names places, not instructions; the instruction is
     the footer's job, and it changes. */
  profile: 'Your profile',
  /* "Application", not "Application form". A form is what it is made of, not
     what it is, and every other label in the rail is a noun for a place. */
  application: 'Application',
};

/**
 * Where Back goes, said as a destination.
 *
 * A separate list rather than the rail's titles lower-cased, which is what this
 * was: "Back to review job" — an instruction bolted onto a preposition, and the
 * one rail label that is a verb phrase rather than a place. The rail can call
 * step 1 "Review job" because it is naming what you do there; a Back control has
 * to name where you land.
 */
const BACK_LABEL: Record<ApplyFlowStepId, string> = {
  review: 'Back to the job',
  profile: 'Back to your profile',
  application: 'Back to your application',
};

/**
 * The middle position's name changes with who is standing on it, and only that.
 *
 * A member fills in a profile they already have; a stranger fills in the details
 * that will become one. The rail names the *position*, so it says the thing that
 * is true of the person reading it — and the shape stays three-for-everyone,
 * which is the property that makes the rail learnable at all.
 */
const stepTitle = (id: ApplyFlowStepId, isLoggedIn: boolean): string =>
  id === 'profile' && !isLoggedIn ? 'Your details' : STEP_TITLE[id];

const backLabel = (id: ApplyFlowStepId, isLoggedIn: boolean): string =>
  id === 'profile' && !isLoggedIn ? 'Back to your details' : BACK_LABEL[id];

/**
 * What to tell someone whose application the server refused. Every one of these
 * is a gate the UI already enforces, so reaching one means the client's picture
 * and the record have drifted apart — which is exactly when a generic "try
 * again" is worst, because for most of these trying again cannot help.
 */
function applyFailureMessage(error: unknown): string {
  /* Approval no longer gates applying, so a live backend cannot produce this any
     more. Kept deliberately: it is the graceful answer during a deploy where
     this frontend is out ahead of the API that still refuses unapproved
     accounts. Delete once no such backend is running. */
  if (isNotApprovedError(error)) {
    return 'Your account is still being reviewed, so applications are on hold. Your note is saved here — we’ll email you the moment it’s approved.';
  }
  if (isJobGoneError(error)) {
    return 'This role is no longer open, so there is nowhere to send this. Nothing was sent.';
  }
  if (isUnreachableTeamError(error)) {
    return 'This team has no contact address on file, so applications can’t reach them yet. Nothing was sent — the posting link is still your way in.';
  }
  if (isProfileIncompleteError(error)) {
    return 'Your profile is missing something we need before applying. Open Edit profile above, then send again.';
  }
  return 'Something went wrong and the application was not sent. Your note is still here — try again.';
}

interface JobApplyFlowDrawerProps {
  open: boolean;
  onClose: () => void;
  target: JobDetailTarget;
  /** Which of the three is showing. Held by the flow, not here — the flow is
   *  what resumes onto a step after the Privy round trip, which happens while
   *  this component does not exist. */
  at: ApplyFlowStepId;
  onStepChange: (at: ApplyFlowStepId) => void;
  /** The letter, for the same reason: stepping away unmounts the pane that
   *  collects it. */
  coverLetter: string;
  onCoverLetterChange: (value: string) => void;
  memberUid: string | undefined;
  member: Pick<IMember, 'id' | 'name' | 'role' | 'mainTeam' | 'skills' | 'currentCompany'> | null;
  isLoggedIn: boolean;
  /** Signed up, waiting on the PL team. Says so in the profile lede; gates nothing. */
  pendingApproval: boolean;
  /** Whether the profile already satisfies what an application needs, as the
   *  board understands it on open — this is what decides whether step 2 is on
   *  the path. */
  profileComplete: boolean;
  applied: boolean;
  appliedAt?: string | null;
  /** Whether the review step offers the way out to the team's own posting —
   *  see `canSeeOriginalPosting`. */
  showOriginalPosting: boolean;
  /**
   * Pressing Apply will open the employer's own posting rather than advance the
   * rail: an account awaiting approval, applying to a role Protocol Labs did not
   * post. The footer has to say so — a rail promising three steps above a button
   * that leaves the site is the flow lying about itself.
   */
  applyGoesExternal: boolean;
  /** Pressing Apply on the review step, which the flow answers by routing. */
  onApply: () => void;
  /**
   * Creating the account from step 2 — the same handler the modal gets, because
   * it is the same act through a different door.
   *
   * A success does not advance the rail: the person has an account but no
   * session, so the controller closes the flow and hands off to Privy, and the
   * resume brings them back onto this role. That is why nothing here waits on
   * the result except to show a refusal.
   */
  onSignUp: (details: AccountDetails) => Promise<JobSignUpResult>;
  /** Step 2's "Already a member?" escape. */
  onSignIn: () => void;
  onProfileSaved: (args: { profileComplete: boolean }) => void;
  onSubmitted: () => void;
  viewerState: BoardViewerState;
  source: JobSurface;
}

/**
 * Applying, as one flow in one container.
 *
 * **What this replaced.** Three surfaces: `JobDetailDrawer` (read the posting),
 * `JobProfileDrawer` (fill in what an application needs) and `JobApplyModal`
 * (the read-back and the letter) — a drawer, a drawer and a centred modal, each
 * with its own header, its own footer and its own idea of how you leave it. The
 * flow held four pieces of state to hand off between them and to carry a
 * half-written cover letter across the seams, and `Edit profile` from the modal
 * meant tearing down the modal, rebuilding a drawer, saving, tearing that down
 * and rebuilding the modal.
 *
 * None of that was visible to the person, which was the problem: pressing Apply
 * opened an unknown number of dialogs in an unknown order, and no screen ever
 * said how many were left. **A stepper is the cheapest possible answer** — three
 * named places, one of them already ticked if your profile is done, so the
 * promise the whole flow is built on ("nothing to refill") is legible before you
 * commit to it rather than discovered afterwards.
 *
 * **Why the flow opens on reading, and why that doesn't trap anyone.** Step 1 is
 * the job description, which is browsing, not applying — so its footer says
 * `Apply`, not `Next`. Someone who only came to read sees what they saw before
 * plus a rail telling them what the button costs. The rail is a promise about
 * the future, not a claim about the present.
 *
 * **The profile step is skipped, not hidden.** A finished profile means pressing
 * Apply on step 1 goes straight to step 3, and step 2 shows in the rail with a
 * check on it from the first frame. Dropping it from the rail entirely was the
 * obvious reading of "skip it", and it is worse in two ways: the rail would be
 * two items for some people and three for others, so nobody could learn its
 * shape; and that check is the *evidence* for the offer — "we already have this"
 * is exactly what makes one-click applying true. It also gives `Edit profile` a
 * destination that is on screen rather than a modal round trip.
 *
 * **Drawer on desktop, page on mobile.** Production's `Drawer` is already
 * `100vw`/`100dvh` under 640px. Under 768 this passes `fullScreen` (so it fades
 * in like a page rather than sliding in like a panel, and so the 640–767px band
 * stops rendering a 720px drawer on a 700px screen) and `noBlur` (there is no
 * page behind it to blur). The close control in the header is what that costs:
 * with no overlay left to press, a flow with only a Back arrow would be
 * inescapable from its last step.
 *
 * **Logged out fills step 2 in.** Pressing Apply used to hand back to the flow,
 * which opened `JobSignUpModal` on top of this — a modal over a drawer, and
 * knowingly so at the time. The account is a step now: `JobAccountPane` takes
 * the middle position for a visitor with no account, the rail stays three deep
 * for everyone, and only the middle label changes ("Your details"). The modal
 * still exists for the role-less door — the header and banner `Sign up`
 * presses, which name no job and so have no flow to run.
 */
export function JobApplyFlowDrawer(props: JobApplyFlowDrawerProps) {
  const {
    open,
    onClose,
    target,
    at,
    onStepChange,
    coverLetter,
    onCoverLetterChange,
    memberUid,
    member,
    isLoggedIn,
    pendingApproval,
    profileComplete,
    applied,
    appliedAt,
    showOriginalPosting,
    applyGoesExternal,
    onApply,
    onSignUp,
    onSignIn,
    onProfileSaved,
    onSubmitted,
    viewerState,
    source,
  } = props;

  const isMobile = useIsMobile();
  const analytics = useJobsAnalytics();

  /* Every step starts at the top.
     The drawer scrolls as one element — header, pane and footer together — so a
     step change swaps the content underneath a scroll position that belonged to
     the step before it. Reading to the bottom of a long description and pressing
     Apply landed you in the middle of the profile, past the card the footer was
     about to complain about.

     `scrollTop` rather than `scrollTo({ behavior })`: arriving somewhere new is
     not a scroll the person asked for, so it should not look like one. It also
     keeps this working in jsdom, where `scrollTo` is not implemented.

     Back gets the same treatment as forward. Restoring the old position when
     stepping back would be kinder in the one case where someone returns to
     re-read, and wrong in the rest — a rail you can enter from three directions
     has no single "where you were". One rule, and it is the predictable one. */
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [at]);
  const submitMutation = useSubmitJobApplication(memberUid);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Step 2's account form, held HERE rather than inside `JobAccountPane`.
   *
   * The panes are unmounted on every step change (`{at === 'profile' && …}`), so
   * a form owned by the pane would lose everything typed the moment someone
   * stepped back to re-read the posting — and a rail whose Back is a trap is
   * worse than no rail. This is the same reason `coverLetterDraft` lives one
   * level further out again, in `ApplyFlowState`: the letter outlives its pane
   * too. One level is enough here, because unlike the letter this form does not
   * have to survive the Privy round trip — by then the account exists.
   *
   * Built unconditionally, because hooks are, and used only when logged out.
   * The resolver rides a chunk this component already defers.
   */
  const accountForm = useForm<AccountFormData>({
    defaultValues: EMPTY_ACCOUNT_FORM,
    resolver: yupResolver(accountSchema) as Resolver<AccountFormData>,
    mode: 'onBlur',
  });
  const [accountError, setAccountError] = useState<string | null>(null);
  const {
    formState: { isSubmitting: accountSubmitting },
  } = accountForm;

  const submitAccount = accountForm.handleSubmit(async (data) => {
    setAccountError(null);
    const result = await onSignUp(toAccountDetails(data));
    if (!result.success) {
      setAccountError(signUpFailureMessage(result));
    }
    /* Nothing on success: the controller closes this flow and pushes `#login`.
       Advancing the rail here would put someone on the letter step with no
       session to send it with. */
  });

  /* The profile step's own read of what is still owed, reported up by the pane
     because the footer that says it is out here. Seeded from the board's view so
     the footer is right on the first frame rather than after a fetch. */
  const [profileState, setProfileState] = useState<ProfileState>({
    complete: profileComplete,
    hasRole: profileComplete,
    hasStatus: profileComplete,
  });

  /* Whether this run stops at the profile step, decided when the flow opens and
     then left alone.

     Recomputing it from the live profile would be the obvious thing and it is
     wrong in both directions: a profile completed *during* the flow would
     silently drop the step out from under someone standing on it, and Back from
     the application would start landing somewhere different than it did a minute
     earlier. A rail that reshapes itself is a rail nobody can learn. */
  const [skipProfile] = useState(() => isLoggedIn && profileComplete);

  const complete = profileState.complete;

  /* The steps this run actually stops at, in order. The rail always draws all
     three — see the note at the top of the file — but Back and the footer walk
     this, so a skipped profile step is skipped in both directions. Symmetry is
     the point: a flow whose Next skips a step and whose Back does not is a flow
     that puts you somewhere you have never been. */
  const path: ApplyFlowStepId[] = skipProfile ? ['review', 'application'] : ['review', 'profile', 'application'];
  /* -1 when the current step is off the path — which `backTarget` handles
     explicitly rather than clamping to 0. Clamping was the bug: it made an
     off-path step look like the first one, so Back read "Back to roles" and
     closed the flow out from under a written letter. */
  const pathIndex = path.indexOf(at);

  /** Whether the last step is reachable at all. The only rule left is the one
   *  that was always the real one — an application must carry a complete
   *  profile. Nobody is refused, they are only ever *not finished yet*, which is
   *  what the middle step is for. */
  const canApply = isLoggedIn && complete;

  /** Where a finished step can be revisited from the rail. The current step is
   *  never reachable — a control that goes where you already are is a control
   *  that does nothing. */
  const canVisit = (id: ApplyFlowStepId): boolean => {
    if (id === at) return false;
    if (id === 'review') return true;
    if (id === 'profile') return isLoggedIn;
    return canApply;
  };

  const steps: ApplyFlowStep[] = APPLY_FLOW_STEPS.map((id) => {
    const status: ApplyFlowStep['status'] =
      id === at
        ? 'current'
        : /* A profile that was already finished shows its check from the first
             frame, on every step. That mark is the offer's evidence, not a record
             of something you did in this session. */
          id === 'profile' && skipProfile
          ? 'completed'
          : APPLY_FLOW_STEPS.indexOf(id) < APPLY_FLOW_STEPS.indexOf(at)
            ? 'completed'
            : 'upcoming';
    return { id, title: stepTitle(id, isLoggedIn), status, reachable: canVisit(id) };
  });

  /** Report a profile save on the way out of the step that collects it — a
   *  section Save has already told the person their work is kept, and the funnel
   *  should count the visit however it ended. */
  const leaveProfileStep = () => {
    if (at === 'profile' && isLoggedIn) onProfileSaved({ profileComplete: complete });
  };

  const goTo = (next: ApplyFlowStepId) => {
    leaveProfileStep();
    onStepChange(next);
  };

  /**
   * Where the header's Back goes — a step, or `null` for out of the flow.
   *
   * **The case that makes this more than `path[i - 1]`.** With a finished
   * profile the path is Review → Application, and step 2 is a place you can
   * still *visit* (`Edit profile`, or the rail) without it being on the way
   * anywhere. Standing on a step that isn't in the path, `indexOf` returns -1,
   * so a naive `Math.max(0, …)` reads it as the first step and Back becomes
   * **close the flow** — one press, on a screen you reached from a half-written
   * letter, and the letter is gone.
   *
   * A detour returns to the flow, not out of it: from off-path, Back is the next
   * step along the rail that IS on the path — which for the profile detour is
   * the application you left. That is where the person actually was.
   */
  const backTarget: ApplyFlowStepId | null = (() => {
    if (path.includes(at)) return pathIndex === 0 ? null : path[pathIndex - 1];
    const after = APPLY_FLOW_STEPS.slice(APPLY_FLOW_STEPS.indexOf(at) + 1).find((id) => path.includes(id));
    return after ?? path[path.length - 1];
  })();

  const closeFlow = () => {
    leaveProfileStep();
    onClose();
  };

  const onBack = () => {
    if (!backTarget) {
      closeFlow();
      return;
    }
    goTo(backTarget);
  };

  const remaining = COVER_LETTER_MAX_LENGTH - coverLetter.length;
  const canSend = coverLetter.trim().length > 0 && remaining >= 0;

  const submit = () => {
    // isPending inside the handler, not just the button: a stray Enter must not
    // send twice.
    if (!canSend || submitMutation.isPending) return;
    setSubmitError(null);

    const analyticsBase = {
      job_id: target.role.uid,
      team_id: target.teamId,
      viewer_state: viewerState,
      source,
    };
    analytics.onJobApplySubmitted({ ...analyticsBase, cover_letter_length: coverLetter.trim().length });

    submitMutation.mutate(
      { roleUid: target.role.uid, coverLetter: coverLetter.trim() },
      {
        onSuccess: () => {
          onSubmitted();
          toast.success(`Applied to ${target.role.roleTitle} at ${target.teamName}. Your profile went with your note.`);
        },
        onError: (error) => {
          if (isAlreadyAppliedError(error)) {
            /* The server already holds this application — the row flips to
               Applied (the hook refetches the map) and the flow closes on the
               true state rather than arguing with the person's own history. */
            analytics.onJobApplyFailed({ ...analyticsBase, failure_category: 'already-applied' });
            onSubmitted();
            toast.success(`You had already applied to ${target.role.roleTitle} at ${target.teamName}.`);
            return;
          }
          analytics.onJobApplyFailed({ ...analyticsBase, failure_category: 'request-failed' });
          setSubmitError(applyFailureMessage(error));
        },
      },
    );
  };

  /* One footer, three steps, and the sentence beside the button changes with
     both the step and what the press will actually do. A footer that promised
     "one press" to someone with no account would be describing a different
     person's experience of the same button. */
  const footer = (() => {
    if (at === 'review') {
      if (applied) {
        return {
          hint: appliedAt
            ? `Applied ${formatRelativeDays(appliedAt)}. Your profile went with your note.`
            : 'Your profile went with your note.',
          action: (
            <button
              type="button"
              disabled
              className={clsx(btn.root, btn.medium, btn.border, btn.neutral, d.footerAction, d.appliedButton)}
            >
              <CheckIcon width={14} height={14} aria-hidden="true" />
              Applied
            </button>
          ),
        };
      }
      if (applyGoesExternal) {
        return {
          hint: `${target.teamName} takes applications on their own site — it opens in a new tab.`,
          action: (
            <Button variant="primary" style="fill" size="m" className={d.footerAction} onClick={onApply}>
              Apply on their site
            </Button>
          ),
        };
      }

      return {
        /* Whichever of the three fits the profile. The pending-approval variant
           that used to live here is gone: a pending member who reaches this
           branch is applying to Protocol Labs, and for that role they are like
           anyone else. */
        hint: !isLoggedIn
          ? 'Applying sends a profile — the next step opens your account and builds one.'
          : complete
            ? 'One press sends your PL profile with a short note. Nothing to refill.'
            : 'Applying sends your PL profile — the next step is finishing it.',
        action: (
          <Button variant="primary" style="fill" size="m" className={d.footerAction} onClick={onApply}>
            Apply
          </Button>
        ),
      };
    }

    if (at === 'profile' && !isLoggedIn) {
      /**
       * The one place this flow admits it may end early.
       *
       * `useJobApplyFlow.onApply` sends a **pending** account applying to a role
       * Protocol Labs did not post to the employer's own site — and an account
       * created by the press below is pending. So for a non-PL role the rail
       * will have shown three steps and delivered two.
       *
       * That rule is not new. What is new is putting the account form *in* the
       * rail, which turns an existing rule into a visible broken promise — so
       * the promise gets made accurately here, at the press, rather than
       * discovered on the way back. The review step's hint is left alone: it
       * says the next step opens your account, which stays true.
       */
      return {
        hint: isProtocolLabsTeam(target.team)
          ? 'Creating your account signs you in — you’ll come back here to finish your application.'
          : `Creating your account signs you in, then ${target.teamName} takes your application on their own site.`,
        action: (
          /* Disabled only while submitting, never on `!isValid` — with
             `mode: "onBlur"` a validity gate leaves a dead button in front of a
             completed form. "Create account" and not "Continue", because this
             press is the one that creates it; nothing about it is a step along. */
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={accountSubmitting}
            onClick={submitAccount}
          >
            {accountSubmitting ? 'Creating…' : 'Create account'}
          </Button>
        ),
      };
    }

    if (at === 'profile') {
      return {
        hint: !complete
          ? `${sentenceCase(missingHint(profileState.hasRole, profileState.hasStatus))} to continue. Everything else is optional.`
          : 'Experience, skills and bio are optional — you can add them any time.',
        action: (
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={!complete}
            onClick={() => goTo('application')}
          >
            Continue to apply
          </Button>
        ),
      };
    }

    /* The step's one instruction, and the only place it appears — the pane used
       to print a copy of this under the field. Three states, because "shorten
       it" and "write something" are different problems and only one of them is
       about what to say. */
    const overLimit = remaining < 0;
    return {
      hint: overLimit
        ? `Shorten your note to ${COVER_LETTER_MAX_LENGTH} characters to send it.`
        : canSend
          ? `${target.teamName} can reply to you directly.`
          : 'Add what you did in previous roles that makes you a good fit for this one.',
      action: (
        /* "Apply", and this is the press that applies — there is no fourth step
           and no confirmation pane. The rail's last stop is where it happens. */
        <Button
          variant="primary"
          style="fill"
          size="m"
          className={d.footerAction}
          disabled={!canSend || submitMutation.isPending}
          onClick={submit}
        >
          {submitMutation.isPending ? 'Submitting…' : 'Apply'}
        </Button>
      ),
    };
  })();

  return (
    <Drawer isOpen={open} onClose={closeFlow} fullScreen={isMobile} noBlur={isMobile} containerRef={scrollRef}>
      {/* Wraps the whole drawer rather than just step 2, because the fields are
          in the pane and the button that submits them is in the sticky footer —
          two different children of this element. Inert for a signed-in member:
          nothing under it reads the context. There is no `<form>` element, so
          the footer press goes through `handleSubmit` directly; a real form
          would have had to span the same two children and would put a submit
          button inside the letter step's textarea flow. */}
      <FormProvider {...accountForm}>
        {/* `d.drawerHeaderLift` is what this header adds to the source's: a
          stacking order that survives positioned content scrolling past it, and
          the room for a second row. */}
        <div className={clsx(s.drawerHeader, d.drawerHeaderLift)}>
          <div className={clsx(s.breadcrumbs, d.headerRow)}>
            <button type="button" className={s.backButton} onClick={onBack}>
              <BackIcon />
              <span>{backTarget ? backLabel(backTarget, isLoggedIn) : 'Back to roles'}</span>
            </button>
            {/* Shown exactly when Back does NOT leave the flow — anywhere Back
              goes to another step, there has to be a second control that goes
              out, or the flow has no exit on mobile where the overlay is gone.
              On the first step Back *is* the way out, and a ✕ beside it would be
              two controls doing one thing. */}
            {backTarget && (
              <button type="button" className={d.closeButton} onClick={closeFlow} aria-label="Close">
                <CloseIcon />
              </button>
            )}
          </div>
          <div className={d.stepBand}>
            <ApplyFlowSteps steps={steps} onSelect={(id) => goTo(id as ApplyFlowStepId)} />
          </div>
        </div>

        <div className={s.drawerContent}>
          {at === 'review' && (
            <JobDetailPane
              role={target.role}
              team={target.team}
              applied={applied}
              appliedAt={appliedAt}
              source={source}
              showOriginalPosting={showOriginalPosting}
            />
          )}

          {at === 'profile' && !isLoggedIn && <JobAccountPane onSignIn={onSignIn} serverError={accountError} />}

          {at === 'profile' && isLoggedIn && memberUid && (
            <JobProfilePane
              memberUid={memberUid}
              isLoggedIn={isLoggedIn}
              pendingRoleTitle={target.role.roleTitle}
              pendingApproval={pendingApproval}
              onProfileState={setProfileState}
            />
          )}

          {at === 'application' && (
            <JobApplicationPane
              role={target.role}
              teamId={target.teamId}
              teamName={target.teamName}
              member={member}
              memberUid={memberUid}
              coverLetter={coverLetter}
              onCoverLetterChange={onCoverLetterChange}
              onEditProfile={() => onStepChange('profile')}
              submitError={submitError}
            />
          )}
        </div>

        {/* One bar, every step. Sticky, because a job description is long enough
          that an action at the end of it is an action most people never reach —
          and because the same bar in the same place on all three steps is what
          makes them read as one screen rather than three. */}
        <div className={d.footer}>
          <div className={d.footerInner}>
            <p className={d.footerHint}>{footer.hint}</p>
            {footer.action}
          </div>
        </div>
      </FormProvider>
    </Drawer>
  );
}
