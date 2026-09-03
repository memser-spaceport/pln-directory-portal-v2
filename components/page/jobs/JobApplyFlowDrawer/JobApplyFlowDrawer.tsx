'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { toast } from '@/components/core/ToastContainer';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Drawer } from '@/components/common/Drawer';
import { ArrowUpRightIcon, CheckIcon, CloseIcon } from '@/components/icons';
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
import { JobUnlockBanner } from '@/components/page/jobs/JobUnlockBanner/JobUnlockBanner';
import { JobUnlockDisclosure } from '@/components/page/jobs/JobUnlockDisclosure/JobUnlockDisclosure';
import { JobProfilePane, BackIcon, type ProfileState } from '@/components/page/jobs/JobProfileDrawer/JobProfileDrawer';
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
import { getJobProfileReviewed, setJobProfileReviewed } from '@/services/jobs/job-profile-reviewed';
import { withPendingApply } from '@/services/jobs/job-apply-resume';
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
  /** `linkedinProfile` is read only to pick which receipt the send shows — see
   *  the toast in `submit`. It rides on the record the read-back already
   *  fetches, so this is a wider `Pick` rather than a second query. */
  member: Pick<IMember, 'id' | 'name' | 'role' | 'mainTeam' | 'skills' | 'currentCompany' | 'linkedinProfile'> | null;
  isLoggedIn: boolean;
  /** Signed up, waiting on the PL team. Says so in the profile lede; gates nothing. */
  pendingApproval: boolean;
  /** Whether the profile already satisfies what an application needs, as the
   *  board understands it on open. It seeds `profileState`, so the footer is
   *  right on the first frame rather than after the pane's fetch.
   *
   *  It no longer decides whether step 2 is on the path — nothing does, every
   *  in-app application stops there. See `useJobApplyFlow.onApply`. */
  profileComplete: boolean;
  applied: boolean;
  appliedAt?: string | null;
  /** Whether the review step offers the way out to the team's own posting —
   *  see `canSeeOriginalPosting`. */
  showOriginalPosting: boolean;
  /**
   * Pressing Apply will open the employer's own posting rather than advance the
   * rail: no approved account yet (signed out, or awaiting review), applying to
   * a role Protocol Labs did not post. The footer has to say so, and the rail
   * comes off — three named steps above a button that leaves the site is the
   * flow lying about itself.
   */
  applyGoesExternal: boolean;
  /**
   * This run resumed from the Privy round trip — the person pressed "Create your
   * profile" here and came back with an account.
   *
   * Read by exactly one footer branch, and it exists because that branch cannot
   * work the answer out. Logged in, on a non-PL role, at the review step is also
   * where a Job Aspirant and a member still awaiting approval land, and both have
   * had an account for months. Set by `onResumeAfterSignUp` and nothing else.
   */
  justSignedUp?: boolean;
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
    justSignedUp = false,
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
    /* The variant that *does* ask for a job search status — this door is reached
       by pressing Apply, so an application is waiting on the answer and asking
       here is what saves a stop later. The banner's modal uses the other one. */
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

  /* (`skipProfile` stood here — `isLoggedIn && profileComplete && at !==
     'profile'` — and dropped the middle step for a member who arrived with
     nothing left to fill in. It went with the routing rule it mirrored; see
     `useJobApplyFlow.onApply`. The short version: the step is no longer only for
     collecting, because it now asks for "I reviewed my profile", and a
     confirmation nobody is shown is not a confirmation.

     Its own reasoning is worth keeping in view if a skip is ever reintroduced.
     It was `useState` with an initialiser rather than a derived value on
     purpose: recomputing it from the live profile is wrong in both directions —
     a profile completed *during* the flow would drop the step out from under
     someone standing on it, and Back from the application would start landing
     somewhere different than it did a minute earlier. A rail that reshapes
     itself is a rail nobody can learn.) */

  const complete = profileState.complete;

  /* "I reviewed my profile" — the profile step's consent, and the second half
     of what unlocks the application.

     **Remembered across visits, keyed by member uid.** Asked once, not once per
     application: someone applying to their fourth role this week has confirmed
     the same profile three times already, and a gate that re-asks a question it
     has the answer to stops reading as a check and starts reading as a toll.

     This reverses what stood here, which argued the tick should die with the
     visit because "a profile reviewed in a session that has since ended, and
     possibly edited elsewhere since, is not a profile anyone reviewed." That
     cost is real and is now accepted: a confirmation made months ago survives
     edits made since, so this is a one-time acknowledgement rather than a
     per-application freshness check. If it ever needs to be the latter, the
     thing to key it on is the profile's own last-modified stamp, not the visit.

     `useState` still, and not read on every render: the stored answer is a
     mount-time snapshot, and re-reading localStorage mid-flow would let another
     tab's tick change this footer under the person using it. */
  const [reviewed, setReviewedState] = useState(() => getJobProfileReviewed(memberUid));

  /* Writes on every change, `false` included — see the store's note on why
     unticking has to be recorded rather than merely forgotten. */
  const setReviewed = (next: boolean) => {
    setReviewedState(next);
    setJobProfileReviewed(memberUid, next);
  };

  /* The steps this run stops at, in order — all three, for everyone applying in
     app. Back and the footer both walk this, which is what keeps them agreeing
     about where "the step before this one" is. */
  const path: ApplyFlowStepId[] = ['review', 'profile', 'application'];
  /* -1 when the current step is off the path — which `backTarget` handles
     explicitly rather than clamping to 0. Clamping was the bug: it made an
     off-path step look like the first one, so Back read "Back to roles" and
     closed the flow out from under a written letter. */
  const pathIndex = path.indexOf(at);

  /** Whether the last step is reachable at all. Two rules, and both are about
   *  the profile: it has to be complete enough to send, and you have to have said
   *  you looked at it. Nobody is refused — they are only ever *not finished yet*,
   *  which is what the middle step is for.
   *
   *  The rail obeys the same pair the footer does. A gate the rail can walk
   *  around is not a gate, and this one could: the Application stop is a live
   *  control sitting two inches from a step 2 nobody has touched. */
  const canApply = isLoggedIn && complete && reviewed;

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
        : /* (`id === 'profile' && skipProfile → 'completed'` stood here, so a
             profile that was already finished wore its check from the first
             frame. It went with `skipProfile`: every run now stops at step 2, so
             a check on a step ahead of you would be claiming you had been
             somewhere you have not — and with the review tick waiting there, it
             would be claiming you had done the one thing the step exists to
             ask.) */
          APPLY_FLOW_STEPS.indexOf(id) < APPLY_FLOW_STEPS.indexOf(at)
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
    /* From the letter, Back is the posting — not the step before it.
       The design puts "Back to the job" on this step, and it holds up here for a
       reason the other steps do not share: the pane already carries its own
       route to the profile ("Edit profile", beside the read-back), and the rail
       above offers it a second time. So the only destination Back could add is
       the one nothing else on the screen offers, and it is also the one someone
       writing a note actually reaches for — re-reading what they are applying to.

       Everywhere else this stays `path[i - 1]`. The label follows the target
       rather than being set beside it, so `BACK_LABEL.review` already says the
       right words and nothing here has to keep a second copy of them in sync. */
    if (at === 'application') return 'review';
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

  /**
   * Where LinkedIn's identity round trip comes back to — this role, on this
   * surface.
   *
   * Built at render rather than passed in, because it is a fact about the
   * browser (`origin`, `pathname`, the filters already in the query string) plus
   * one the drawer holds (`target.role.uid`). `withPendingApply` is the same
   * helper the sign-up round trip writes, so the resume that reads it is one
   * implementation and not two.
   *
   * `window` is guarded for the server pass: this component is
   * `dynamic({ ssr: false })` at its host, but the guard costs nothing and an
   * undefined return simply withholds the card rather than throwing.
   */
  const verifyReturnTo =
    typeof window === 'undefined'
      ? undefined
      : `${window.location.origin}${window.location.pathname}${withPendingApply(window.location.search, target.role.uid)}`;

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
          /**
           * Two receipts, and which one you get is the answer to the question
           * the profile step asked.
           *
           * A verified LinkedIn is what lets an application go straight to the
           * hiring team; without one it is read by the PL team first. So the
           * toast says which happened, in the words of the design's own pair
           * ("Toast — LinkedIn verified" / "Toast — LinkedIn not verified").
           *
           * This is also what makes the verification card honest: it offers to
           * "get your application reviewed faster", and this is the moment that
           * promise is either kept or explained. One sentence for the verified
           * — the thing is done — and two for the unverified, because the second
           * one is news: the note has not reached anybody yet.
           */
          toast.success(
            member?.linkedinProfile
              ? `Applied to ${target.role.roleTitle} at ${target.teamName}. Your profile went with your note.`
              : `Submitted for ${target.role.roleTitle} at ${target.teamName}. Your note went with your profile. Once we’ve reviewed it, we’ll send it to the recruiter.`,
          );
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

  /* The left half of the footer bar. `hint` is the usual occupant — a sentence
     in 12px tertiary — and `lead` is for the one step that puts a control there
     instead, which needs neither that wrapper nor that voice. A step sets one or
     the other, never both. */
  type FooterContent = {
    hint: string | null;
    lead?: React.ReactNode;
    action: React.ReactNode;
    /**
     * Drawn *beneath* the action, where `hint` is drawn beside it.
     *
     * The distinction is not decoration. `hint` says something about the screen
     * and sits in the screen's own reading order; this belongs to the press, and
     * a line about a button that is not next to that button is a line about
     * nothing in particular.
     *
     * **It was a `string` and is now a node**, because what goes here stopped
     * being a caption. The one branch that uses it puts a control there —
     * "What your profile unlocks?", which opens the case for a profile on demand
     * (`JobUnlockDisclosure`). A previous version of this comment required every
     * branch setting this to also put `aria-describedby` on its button, so the
     * caption would be read as the button's description. That is exactly wrong
     * for a control: a button is not described by another button, and announcing
     * a focusable thing as a description is how a screen reader user hears about
     * something they are then never offered. The wiring is gone with it.
     */
    actionNote?: React.ReactNode;
  };

  /* One footer, three steps: a button that names the act, and beside it a
     sentence only when there is something the screen does not already say.

     That second clause is newer than the first. This footer used to speak in
     every state, and most of what it said was the rail's job — which step comes
     next, what the one after that will ask for. The rail draws that. What is
     left are the states where the press does something the rail cannot show:
     that it is the last one, or that it ends somewhere off this site. The rest
     are silent, and `hint` is nullable for that reason. */
  const footer: FooterContent = (() => {
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
        /**
         * Applying leaves the site — and for a stranger, that used to be the
         * only thing this footer offered.
         *
         * **The gap this closes.** `onApply` sends a logged-out visitor on a
         * non-PL role straight to the employer's posting (`useJobApplyFlow`),
         * so the one door out of this drawer was a door off the board entirely.
         * A person reading a job here could not make an account from the screen
         * they were reading it on, even though the board's whole proposition is
         * that a profile is what gets founders to come to them.
         *
         * So the press is offered beside the outbound one rather than instead
         * of it. The outbound stays primary in position and the profile is the
         * filled button, because the design puts the emphasis on the thing the
         * board wants and the tint on the thing the visitor came for — and both
         * are honest, which is why neither is hidden behind the other.
         *
         * **Only for a stranger.** A signed-in member whose account is still
         * pending reaches this same branch, and they already have the profile
         * this offers to make. They keep the single outbound button.
         */
        const outbound = (
          /* "Apply on the team's site" — the design's wording, where this read
               "Apply on team site" until the copy was taken from the frame
               wholesale. The reasoning that used to sit here is
               worth keeping because it is what changed. The old label was
               "Continue to apply", on the argument that the hint beside it
               already said whose site and that a label repeating the destination
               spent its width on the sentence's job.

               That hint is gone — `hint: null` above — so nothing beside this
               button says where it goes any more, and the argument went with it.
               The label is now the only thing that can carry the destination, so
               it does. It also stops reading as the same press as the profile
               step's "Continue to apply" one stop along, which it never was:
               that one advances the rail, this one leaves. */
          <Button
            /* The brand tint rather than the solid primary, per the design.
                 It reads as the lower-emphasis press it is: this one hands the
                 person to somebody else's site, where every other primary in
                 this flow moves them along inside it. */
            variant="light"
            style="fill"
            size="m"
            /* `.footerAction`'s auto-margin only when this button is alone in
               the bar. Logged out it occupies the bar's left slot, where the
               row's own `space-between` does the work and an auto margin would
               shove the two apart.

               `.footerLeadDemoted` is the other half of that: below 960px the
               bar is a plain column and this button is its first child, so
               without an `order` flip it would draw *above* the profile press.
               The stack used to get that from `column-reverse` on a group that
               held both buttons; the group is gone, and the rule moved here
               with it rather than being lost. */
            className={clsx(isLoggedIn ? d.footerAction : d.footerLeadDemoted, d.externalButton)}
            onClick={onApply}
          >
            Apply on the team&apos;s site
            {/* The board's own external glyph — the same one the original
                posting links wear (`JobDetailPane`, `JobAlertBanner`). It is
                on this press and not the profile step's identically-worded one
                a stop later: that press advances the rail in-app, and an arrow
                there would claim a hand-off that does not happen. With the
                rail withheld in this state, the arrow is the only thing left
                on screen saying the flow ends somewhere else. */}
            <ArrowUpRightIcon aria-hidden="true" />
          </Button>
        );

        /**
         * **The one screen that gets quieter for having converted.**
         *
         * Pressing "Create your profile" hands off to Privy and comes back
         * here — a new account's verdict is `pending`, so this is still the
         * outbound branch, only now on the logged-in side of it. Everything the
         * previous screen offered is gone: the card making the case, the profile
         * press, its caption. What is left is the button that leaves the site.
         *
         * Without a word here, the person who did the thing the board asked for
         * gets strictly less than the person who ignored it, and no confirmation
         * that the account they just made exists.
         *
         * `justSignedUp` and not `isLoggedIn` because this branch is shared: a
         * Job Aspirant and a member awaiting approval reach the same code on the
         * same role, and telling either of them their profile was just created
         * would be a worse lie than saying nothing. It comes from the resume and
         * from nowhere else, and `CLOSE` clears it, so it belongs to this run.
         */
        if (isLoggedIn) {
          return {
            hint: justSignedUp ? 'Profile created. You can finish it any time from the job board.' : null,
            action: outbound,
          };
        }

        return {
          /* The outbound press in `lead`, which is what that slot is for — "the
             one step that puts a control there instead", as the type says, the
             way the profile step puts its consent checkbox there.

             What used to occupy it was a tinted note making the case for a
             profile, and both buttons were crowded into `action` beside each
             other. The case moved into the body of the step, where it is a card
             with room for two reasons instead of one clause (`JobUnlockBanner`).
             With the note gone, the two presses can take the ends of the bar the
             design always wanted them at: `.footerInner` is already
             `space-between`, so nothing new lays this out. */
          lead: outbound,
          hint: null,
          /* Into the drawer's own step 2, which is the account form — so
             "sign up from the job you are reading" is one press and no
             navigation. What happens after is already right: creating the
             account hands off to Privy, and the resume lands back on this
             role's review step, where the outbound button is waiting.
             No step 3 is ever promised, which is why the rail stays off. */
          action: (
            <Button variant="primary" style="fill" size="m" onClick={() => goTo('profile')}>
              {/* The design's label, verbatim (Figma node 682:10579). It read
                  "Create profile → signal interest" until the frame below it
                  grew a control that makes the "signal interest" case in two
                  sentences — at which point the arrow and the second clause were
                  a label doing the popover's job in a quarter of the words.
                  Shortening it locally would still be wrong; the frame shortened
                  it. */}
              Create profile
            </Button>
          ),
          /* Where "~2 min · team is notified you are interested" used to sit.
             That sentence promised a notification this branch does not send —
             the press opens an account and comes back here, and applying still
             happens on the employer's own site — and it spent the slot on a
             claim rather than on the argument the board actually has. The design
             replaced it with a control: the same two reasons the card upstairs
             makes, on demand, for someone who has scrolled past the card to get
             here. */
          actionNote: (
            <JobUnlockDisclosure
              className={d.footerNoteTrigger}
              onOpened={(surface) =>
                analytics.onJobUnlockInfoOpened({
                  job_id: target.role.uid,
                  team_id: target.teamId,
                  viewer_state: viewerState,
                  source,
                  surface,
                })
              }
            />
          ),
        };
      }

      return {
        /* Nothing beside the button now, down from three sentences. Two were
           narrating the rail — "the next step opens your account", "the next
           step is finishing it" — which is what the rail two inches above is
           drawn to say, and it says it without spending a sentence. The third
           claimed that for a finished profile this press is the last one, and
           went the same way.

           What was left behind was `isLoggedIn && complete ? null : null` — a
           ternary whose two arms were the same value, the shape of a condition
           kept after the thing it guarded was deleted. It is `null`. */
        hint: null,
        action: (
          /* Four words that carry what the deleted sentence was carrying: the
             press signs you up, and applying is what it is for. A stranger
             pressing a button labelled "Apply" would be told the truth one
             screen too late. */
          <Button variant="primary" style="fill" size="m" className={d.footerAction} onClick={onApply}>
            {isLoggedIn ? 'Apply' : 'Sign up to Apply'}
          </Button>
        ),
        /* No caption here, and the reason is that there is no frame for one.
           The design covers the outbound footer (631:23360); the in-app one it
           does not, and a caption written locally to match the other branch's
           treatment would be exactly the invented copy this pass removed. If
           this state should say something, it gets drawn first. */
      };
    }

    if (at === 'profile' && !isLoggedIn) {
      return {
        /**
         * Silent, per the design.
         *
         * **What stood here and why it can go.** A sentence for non-PL
         * employers: "Creating your account signs you in, then {team} takes your
         * application on their own site." It was written when the rail promised
         * three steps to a stranger whose application would leave at step two,
         * and its job was to make that promise accurately at the press rather
         * than let it be discovered on the way back.
         *
         * The rail no longer makes that promise. It is withheld for every step
         * of an outbound run, so there is no third stop drawn and nothing left
         * for this sentence to correct. What it warned about is now said by the
         * screen this person came from — the review step's own outbound button —
         * and said again by the one they return to after signing up, which is
         * that same review step with that same button waiting.
         *
         * A footer that repeats what the two screens either side of it already
         * say is spending the only line it has on a third telling.
         */
        hint: null,
        action: (
          /* Disabled only while submitting, never on `!isValid` — with
             `mode: "onBlur"` a validity gate leaves a dead button in front of a
             completed form.

             "Create Profile", per the design, and it is also the label that
             matches the door: a stranger reaches this step by pressing "Create
             Job Profile" on the job, and a button that then said "Create
             account" would be answering a question they did not ask. The drawer
             title above it says profile too. */
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={accountSubmitting}
            onClick={submitAccount}
          >
            {accountSubmitting ? 'Creating…' : 'Create Profile'}
          </Button>
        ),
      };
    }

    if (at === 'profile') {
      return {
        /* The sentence that stood here — "Experience, skills and bio are
           optional — you can add them any time." — gives the slot up to the
           consent below. It still runs in `JobProfileDrawer`, which has no
           application behind it and so has nothing to consent to; here the one
           thing the footer has to carry is the tick, and two claims in a bar
           this size is one too many. */
        hint: null,
        /* **The last thing before the application, and the reason step 2 is not
           a formality.** What goes to the hiring team is this profile, not the
           letter alone — so the press that leaves here is the press that decides
           what they read. A tick is cheap; sending a profile you last looked at
           eight months ago is not.

           A *second* gate, on top of role and job search status. Those are about
           whether the profile can be sent at all; this is about whether you meant
           to send this one. The amber "Required to continue" strips stay exactly
           where they are — see `JobProfileDrawer`. */
        lead: (
          <label className={d.consentRow}>
            <Checkbox checked={reviewed} onChange={setReviewed} />
            {/* The `*` is `.consentLabel`'s `:after`, exactly as `FormField`
                draws it on a required label. */}
            <span className={d.consentLabel}>I reviewed my profile</span>
          </label>
        ),
        action: (
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={!complete || !reviewed}
            onClick={() => goTo('application')}
          >
            Continue to apply
          </Button>
        ),
      };
    }

    /* Two states, down from three.
       Both of the ones that went were narration. "Add what you did in previous
       roles that makes you a good fit for this one." asked for the same
       paragraph the pane already asks for, at more length and nearer the box.
       "{team} can reply to you directly." described what happens after a press
       nobody had made yet — and the receipt that follows the press now says what
       actually happened, which is the honest place for it.

       What is left is the only state where the screen cannot speak for itself:
       over the limit the button is dead and a red number is the whole
       explanation, so the reason has to be in words next to the control it is
       about. */
    const overLimit = remaining < 0;
    return {
      hint: overLimit ? `Shorten your note to ${COVER_LETTER_MAX_LENGTH} characters to send it.` : null,
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
          {/* Withheld when Apply leaves the site: there is nothing to walk.
              Every step of such a run, not just the reading one — a stranger who
              presses the profile button above lands on the account form, and
              the journey from there is back to this posting and then out to the
              employer. There is no third stop to draw, so a rail promising one
              would be the flow lying about itself in the one state where the
              person has least reason to trust it. */}
          {!applyGoesExternal && (
            <div className={d.stepBand}>
              <ApplyFlowSteps steps={steps} onSelect={(id) => goTo(id as ApplyFlowStepId)} />
            </div>
          )}
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
              /* The case for a profile, made to the only people who can act on
                 it. Not narrowed to `applyGoesExternal` as the footer below is:
                 on a Protocol Labs role a stranger applies in-app, which is the
                 state where the argument is most true, and withholding it there
                 would leave it only on the roles the flow hands off anyway.

                 The cost is that on those PL roles the rail is *not* withheld,
                 so this sits under it — two objects about what happens next.
                 They say different things (which steps exist; why bother) and
                 the banner's numbers are half the size of the rail's, which is
                 what keeps them from reading as one journey drawn twice. */
              banner={!isLoggedIn ? <JobUnlockBanner /> : null}
            />
          )}

          {at === 'profile' && !isLoggedIn && <JobAccountPane onSignIn={onSignIn} serverError={accountError} />}

          {at === 'profile' && isLoggedIn && memberUid && (
            <JobProfilePane
              memberUid={memberUid}
              isLoggedIn={isLoggedIn}
              pendingRoleTitle={target.role.roleTitle}
              pendingApproval={pendingApproval}
              /* Back to this role, not to the board. Verifying navigates the
                 whole page to LinkedIn, so the return has to re-open what it
                 interrupted — and the flow already knows how to be re-opened on
                 a role: `applyTo` is the parameter the sign-up round trip
                 resumes through, read by `useJobApplySurface` against the list
                 as it loads back. The current path rather than a hard-coded
                 `/jobs`, so a team profile resumes on the team profile. */
              verifyReturnTo={verifyReturnTo}
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
            {/* Absent, not empty, when there is nothing to say. `.footerInner`
                is a 12px-gap column below tablet-landscape, and a zero-height
                paragraph still earns its gap — so an always-rendered `<p>`
                would push the button down 12px on every phone screen where the
                footer is now silent. */}
            {footer.lead ?? (footer.hint && <p className={d.footerHint}>{footer.hint}</p>)}
            {/* Wrapped only when there is something to wrap it with. An
                always-rendered column would put a 4px-gap flex box around every
                lone button in the flow for the sake of the one state that uses
                one, and `.footerAction`'s auto-margin — which is how a lone
                button finds the right edge — would then be applying to a child
                of the wrapper rather than to the row. */}
            {footer.actionNote ? (
              <div className={d.footerActionColumn}>
                {footer.action}
                {footer.actionNote}
              </div>
            ) : (
              footer.action
            )}
          </div>
        </div>
      </FormProvider>
    </Drawer>
  );
}
