'use client';

import { useEffect, useState } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import clsx from 'clsx';

import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import { formatRelativeDays } from '@/utils/jobs.utils';

import { Drawer } from '@/components/common/Drawer/Drawer';
import { Button } from '@/components/common/Button';
import { CheckIcon, CloseIcon } from '@/components/icons';
// Button's stylesheet, for the "Applied" report — an element wearing the DS
// button rather than a lookalike, exactly as the row does it.
import btn from '@/components/common/Button/Button.module.scss';
// Demo Day's profile-completion chrome: the sticky 64px header with its "Back"
// affordance, and the 720px-max centred content column. The whole flow wears it,
// so all three steps open the same way.
import s from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';
// 768. The one place production draws the line between "a panel beside the page"
// and "the page".
import { useIsMobile } from '@/hooks/useIsMobile';

import { ApplyFlowSteps, type ApplyFlowStep } from './ApplyFlowSteps';
import { JobDetailPane } from './JobDetailPane';
import { JobProfilePane, BackIcon, type EditTarget } from './JobProfilePane';
import { JobAccountPane } from './JobAccountPane';
import { JobApplicationPane } from './JobApplicationPane';
import {
  EMPTY_ACCOUNT_FORM,
  accountSchema,
  toAccountDetails,
  type AccountDetails,
  type AccountFormData,
} from './accountFields';
import type { ParsedProfile } from '../profile-shared/ExperienceImport/types';
import { isProfileComplete, type MemberProfile } from './viewerState';
import d from './JobApplyFlowDrawer.module.scss';

/**
 * The three places the flow stops, in order. Exported because the board pins
 * them (`?canvas=`) and resumes onto them after a sign-up.
 */
export const APPLY_FLOW_STEPS = ['review', 'profile', 'application'] as const;
export type ApplyFlowStepId = (typeof APPLY_FLOW_STEPS)[number];

/**
 * The rail's labels. Three positions for everyone — only the middle one is named
 * differently depending on who is walking it.
 *
 * **Why the middle label moves and the shape doesn't.** A visitor with no
 * account fills in the details that open one where a member confirms a profile
 * they already have. Same position, same job — "who you are" — but a rail label
 * names its own pane, and calling a *Create your account* form "Your profile"
 * would name something the person does not yet have. The shape stays fixed
 * because that is what makes the flow learnable: three places, the last one
 * always the letter, whoever you are.
 */
const stepTitle = (id: ApplyFlowStepId, loggedIn: boolean): string => {
  switch (id) {
    case 'review':
      return 'Review job';
    /* Not "Update profile", which is what this step is called when you arrive at
       it empty — and a lie for the people who arrive with it already filled in
       and never stop here. A rail names places, not instructions; the
       instruction is the footer's job, and it changes. */
    case 'profile':
      return loggedIn ? 'Your profile' : 'Your details';
    /* "Application", not "Application form". A form is what it is made of, not
       what it is, and every other label in the rail is a noun for a place. */
    default:
      return 'Application';
  }
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
const backLabelFor = (id: ApplyFlowStepId, loggedIn: boolean): string => {
  switch (id) {
    case 'review':
      return 'Back to the job';
    /* Follows the rail, for the same reason: this control names the pane it
       lands on, and step 2 is a profile for a member and an account form for a
       visitor who has neither. */
    case 'profile':
      return loggedIn ? 'Back to your profile' : 'Back to your details';
    /* Not dead: this is what a *detour* returns to. Visiting the profile step
       when it isn't on the path — `Edit profile` on a profile that was already
       finished — leaves the application waiting, and Back is how you get back to
       it. */
    default:
      return 'Back to your application';
  }
};

/**
 * What's still owed, as a verb phrase the footer can drop into either of its two
 * sentences. Lower-case and un-punctuated so it composes; `sentenceCase` lifts
 * it when it starts the sentence.
 *
 * Both missing gets one clause, not two — "add your current role and choose a
 * job search status" is a single instruction to fill in the first two cards, and
 * splitting it into two sentences would imply an order that doesn't exist.
 */
function missingHint(hasRole: boolean, hasStatus: boolean): string {
  if (!hasRole && !hasStatus) return 'add your current role and choose a job search status';
  if (!hasRole) return 'add your current role';
  return 'choose a job search status';
}

const sentenceCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

interface JobApplyFlowDrawerProps {
  open: boolean;
  onClose: () => void;
  role: IJobRole | null;
  team: IJobTeam | null;
  /** Which step is showing. Held by the board rather than here, because the board
   *  is what resumes the flow after a sign-up and what pins a step for the design
   *  canvas — two things that happen while this component is closed. */
  step: ApplyFlowStepId;
  onStepChange: (step: ApplyFlowStepId) => void;
  /** What is saved. The draft below is this, copied, for the length of one flow. */
  profile: MemberProfile;
  /** Commits the draft. Called on the way out of the profile step and on close,
   *  never per section — see the note on the footer. */
  onSaveProfile: (next: MemberProfile) => void;
  /**
   * Sends it. `newAccount` is present exactly when the applicant had none when
   * the flow opened — the board then opens the account and records the
   * application as one act, which is what makes the last press honest for a
   * stranger.
   *
   * It carries the whole starting `profile`, not just the typed `details`,
   * because the details step collects one answer the account form has no field
   * for: the job search status. Handing over the draft the flow actually
   * assembled means the board seeds the profile from the thing that was on
   * screen rather than rebuilding it from parts and losing the half that didn't
   * come from an input.
   *
   * There is no separate "sign up" callback any more. There used to be
   * (`onRequireAccount`, which opened `JobSignUpModal` over this drawer); the
   * account is a step now, and a step that registered you halfway through would
   * leave an orphan account behind anyone who changed their mind at the letter.
   */
  onSubmitApplication: (coverLetter: string, newAccount?: { details: AccountDetails; profile: MemberProfile }) => void;
  loggedIn: boolean;
  /**
   * The details step's escape, for a visitor who turns out to have an account
   * already. Signs in and leaves the flow exactly where it stands: same job,
   * same step — which then renders the member's profile instead of the account
   * form, and the rail's middle label changes from "Your details" to "Your
   * profile" under them. Nothing about the run is reset, so the person lands on
   * the role they came for rather than back on the board hunting for it.
   *
   * The rail keeps its shape across the change: `skipProfile` is decided when
   * the flow opens and left alone (see below), so signing in mid-run can't drop
   * a step out from under someone standing on it.
   */
  onSignIn: () => void;
  /** Signed up, waiting on the PL team. Says so, but no longer stops anything —
   *  see the note on `canApply`. */
  pendingApproval: boolean;
  /** Already sent from this session, and when. */
  applied: boolean;
  appliedAt?: string;
  /** DELETE WITH: the `design-canvas/` folder. Passed through to the profile
   *  step; see `canvasStates.ts`. */
  canvasImport?: {
    parsed?: ParsedProfile;
    panel?: { open?: boolean; status?: 'idle' | 'reading' | 'nothing-found'; fileName?: string };
  };
  /**
   * DELETE WITH: the `design-canvas/` folder.
   *
   * Seeds the letter, for the frame that shows a written one. The board used to
   * hold this string for real — it was the only way a half-written letter could
   * survive the apply modal being torn down — so the canvas could pin it by
   * seeding board state. The letter lives in this drawer now and nothing outside
   * needs it, which is the improvement; the canvas is the one caller that still
   * has to reach in, so it gets a door of its own rather than the board keeping a
   * copy for its sake.
   */
  canvasCoverLetter?: string;
}

/**
 * Applying, as one flow in one container.
 *
 * **What this replaced.** Three surfaces: `JobDetailDrawer` (read the posting),
 * `JobProfileDrawer` (fill in what an application needs) and `JobApplyModal`
 * (the read-back and the letter) — a drawer, a drawer and a centred modal, each
 * with its own header, its own footer and its own idea of how you leave it. The
 * board held four pieces of state to hand off between them and to carry a
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
 * The rail is computed once per flow run (`skipProfile` below), so it cannot
 * change shape under someone who is halfway along it.
 *
 * **Drawer on desktop, page on mobile.** Production's `Drawer` is already
 * `100vw`/`100dvh` under 640px, so the mobile treatment was most of the way
 * there — what it kept was a sheet's slide-in-from-the-right and an overlay that
 * nothing could reach. Under 768 this passes `fullScreen` (so it fades in like a
 * page rather than sliding in like a panel, and so the 640–767px band stops
 * rendering a 720px drawer on a 700px screen) and `noBlur` (there is no page
 * behind it to blur). The close control in the header is what that costs: with
 * no overlay left to press, a flow with only a Back arrow would be inescapable
 * from its last step.
 *
 * Mocked end to end: no network, no auth, no analytics.
 */
export function JobApplyFlowDrawer(props: JobApplyFlowDrawerProps) {
  const {
    open,
    onClose,
    role,
    team,
    step,
    onStepChange,
    profile,
    onSaveProfile,
    onSubmitApplication,
    loggedIn,
    onSignIn,
    pendingApproval,
    applied,
    appliedAt,
    canvasImport,
    canvasCoverLetter,
  } = props;

  const isMobile = useIsMobile();

  /* The flow's working copy of the profile. Section Saves inside the profile
     pane write here; the footer is what hands it to the board. It lives at this
     level rather than in the pane because the pane unmounts every time someone
     steps away from it — to check the letter, to re-read the posting — and a
     draft that died on a step change would make the rail a trap. */
  const [draft, setDraft] = useState<MemberProfile>(profile);
  const [editing, setEditing] = useState<EditTarget>(null);

  /* The letter, held here for the same reason and one more: the button that
     sends it is this footer, not the pane that collects it. */
  const [coverLetter, setCoverLetter] = useState('');

  /* The account form, lifted for exactly the reason the draft is: `JobAccountPane`
     unmounts every time someone steps to the letter, and a stranger who went to
     write it and came back to fix their email would otherwise find five empty
     fields.

     It lives here rather than in the pane for a second reason too — the control
     that validates it is the footer's `Continue to apply`, which is outside the
     pane. `mode: 'onBlur'` matches `JobSignUpModal`, the board's other mount of
     this same form: errors appear when you leave a field, not while you type
     into it. */
  const accountMethods = useForm<AccountFormData>({
    defaultValues: EMPTY_ACCOUNT_FORM,
    resolver: yupResolver(accountSchema) as Resolver<AccountFormData>,
    mode: 'onBlur',
  });

  /* The validated answers, once. Null until `Continue to apply` accepts them,
     which is also what makes the last step reachable for a stranger. */
  const [account, setAccount] = useState<AccountDetails | null>(null);

  /* Whether this flow run stops at the profile step, decided when the flow opens
     and then left alone.

     Recomputing it from `draft` would be the obvious thing and it is wrong in
     both directions: a profile completed *during* the flow would silently drop
     the step out from under someone standing on it, and Back from the
     application would start landing somewhere different than it did a minute
     earlier. A rail that reshapes itself is a rail nobody can learn. */
  const [skipProfile, setSkipProfile] = useState(false);

  /* Everything the flow accumulates is reset when it opens, not when it closes:
     resetting on close would wipe the panes while the drawer is still animating
     out, and the last frame anyone sees would be an empty form. */
  useEffect(() => {
    if (!open) return;
    setDraft(profile);
    setEditing(null);
    setCoverLetter(canvasCoverLetter ?? '');
    setAccount(null);
    accountMethods.reset(EMPTY_ACCOUNT_FORM);
    /* `loggedIn &&` is belt and braces — a logged-out viewer's profile is the
       empty one, so `isProfileComplete` is already false — but the step is about
       *having an account*, not about the record being full, and stating that
       here keeps the two from being confused if the mock ever seeds a profile
       for someone signed out. */
    setSkipProfile(loggedIn && isProfileComplete(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const complete = isProfileComplete(draft);
  /* The two halves of that rule, for the footer's hint. Read off the draft with
     the same tests `isProfileComplete` uses — deliberately not a second
     definition of "required", just a finer-grained look at the one that exists. */
  const hasRole = draft.role.trim() !== '';
  const hasStatus = draft.jobSearchStatus !== '';

  /**
   * Whether the last step is reachable at all.
   *
   * **This used to be `loggedIn && !pendingApproval`, and both halves have gone.**
   * Approval no longer gates applying — a new account can apply the moment it
   * exists, and the PL review runs alongside rather than in front. And having an
   * account is no longer a precondition either, because opening one is now step
   * 2 of this flow: a visitor with no account walks the same three places and
   * the account is created by the same press that sends the letter.
   *
   * So the only thing left is the rule that was always the real one — an
   * application must carry a complete profile. A stranger satisfies it in the
   * account pane (role, and a job search status); a member satisfies it in the
   * profile stack. Nobody is refused, they are only ever *not finished yet*,
   * which is what the middle step is for.
   */
  const canApply = complete && (loggedIn || account !== null);

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
  const pathIndex = path.indexOf(step);

  /** Where a finished step can be revisited from the rail. The current step is
   *  never reachable — a control that goes where you already are is a control
   *  that does nothing — and nothing is reachable mid-edit, for the same reason
   *  the footer is disabled there: leaving past an open card drops what is in
   *  it. */
  const canVisit = (id: ApplyFlowStepId): boolean => {
    if (id === step || editing) return false;
    if (id === 'review') return true;
    /* Always reachable now. It used to be `loggedIn`, because a visitor without
       an account had nothing to see there — the step opened a modal instead. It
       is their own account form now, so it is exactly as revisitable as a
       member's profile. */
    if (id === 'profile') return true;
    return canApply;
  };

  const steps: ApplyFlowStep[] = APPLY_FLOW_STEPS.map((id) => {
    const status: ApplyFlowStep['status'] =
      id === step
        ? 'current'
        : /* A profile that was already finished shows its check from the first
             frame, on every step. That mark is the offer's evidence, not a record
             of something you did in this session. */
          id === 'profile' && skipProfile
          ? 'completed'
          : APPLY_FLOW_STEPS.indexOf(id) < APPLY_FLOW_STEPS.indexOf(step)
            ? 'completed'
            : 'upcoming';
    return { id, title: stepTitle(id, loggedIn), status, reachable: canVisit(id) };
  });

  /** Commit whatever the profile step collected. Called on every exit from it —
   *  forwards, backwards, and through the rail — because a section Save has
   *  already told the person their work is kept, and a step change that quietly
   *  dropped it would make that receipt a lie.
   *
   *  `loggedIn` guards it because a visitor with no account has nothing to
   *  commit *to*: writing their half-typed details into the board's profile
   *  would give a logged-out board a filled-in member. Their answers live in the
   *  flow until the final press creates the account to hold them. */
  const commitDraft = () => {
    if (step === 'profile' && loggedIn) onSaveProfile(draft);
  };

  const goTo = (next: ApplyFlowStepId) => {
    commitDraft();
    onStepChange(next);
  };

  /**
   * Where the header's Back goes — a step, or `null` for out of the flow.
   *
   * **The case that makes this more than `path[i - 1]`.** With a finished profile
   * the path is Review → Application, and step 2 is a place you can still *visit*
   * (`Edit profile`, or the rail) without it being on the way anywhere. Standing
   * on a step that isn't in the path, `indexOf` returns -1, so a naive
   * `Math.max(0, …)` reads it as the first step and Back becomes **close the
   * flow** — one press, on a screen you reached from a half-written letter, and
   * the letter is gone. It also hides the ✕, because that only shows past the
   * first step, so the only visible control was the one that discarded the work.
   *
   * A detour returns to the flow, not out of it: from off-path, Back is the next
   * step along the rail that IS on the path — which for the profile detour is the
   * application you left. That is where the person actually was.
   */
  const backTarget: ApplyFlowStepId | null = (() => {
    if (path.includes(step)) return pathIndex === 0 ? null : path[pathIndex - 1];
    const after = APPLY_FLOW_STEPS.slice(APPLY_FLOW_STEPS.indexOf(step) + 1).find((id) => path.includes(id));
    return after ?? path[path.length - 1];
  })();

  const onBack = () => {
    if (!backTarget) {
      commitDraft();
      onClose();
      return;
    }
    goTo(backTarget);
  };

  const backLabel = backTarget ? backLabelFor(backTarget, loggedIn) : 'Back to roles';

  /**
   * The footer on the reading step. Two outcomes now, where the board's old
   * `onApply` had four.
   *
   * The branch that opened a sign-up modal is gone, and so is the one that
   * refused a pending member. What is left is the only question that was ever
   * really being asked: is there a complete profile to send? If not, the middle
   * step collects it — a form for a stranger, a card stack for a member — and
   * either way the answer to pressing Apply is "here is what's needed", never a
   * different dialog and never a no.
   */
  const onApplyPressed = () => {
    if (!canApply) {
      onStepChange('profile');
      return;
    }
    onStepChange('application');
  };

  /**
   * `Continue to apply`, for a visitor with no account.
   *
   * Runs the schema and either surfaces errors under the fields or accepts the
   * answers and moves on. Nothing is registered — the details are held until the
   * final `Apply`, which opens the account and files the application together.
   *
   * The role and LinkedIn land on the draft because they are profile facts the
   * application's read-back quotes; name and email stay on the account record,
   * which is the only thing that needs them.
   */
  const submitAccount = accountMethods.handleSubmit((data) => {
    const details = toAccountDetails(data);
    setAccount(details);
    setDraft((prev) => ({ ...prev, role: details.role, linkedin: details.linkedin }));
    onStepChange('application');
  });

  /* One footer, three steps, and the sentence beside the button changes with
     both the step and what the press will actually do. A footer that promised
     "one click" to someone with no account would be describing a different
     person's experience of the same button. */
  const footer = (() => {
    if (step === 'review') {
      if (applied) {
        return {
          hint: appliedAt
            ? `Applied ${formatRelativeDays(appliedAt)}. Your profile went with your note.`
            : 'Your profile went with your note.',
          action: (
            /* The row's applied control, in the row's shell — a report, not an
               offer. */
            <button
              type="button"
              disabled
              className={clsx(btn.root, btn.medium, btn.border, btn.neutral, d.appliedButton, d.footerAction)}
            >
              <CheckIcon width={14} height={14} aria-hidden="true" />
              Applied
            </button>
          ),
        };
      }
      return {
        /* The pending-approval variant is gone with the gate it described
           ("Applying unlocks once it lands"). A pending member now reads
           whichever of the three below fits their profile, like anyone else —
           because on this board they *are* like anyone else now. */
        hint: !loggedIn
          ? 'Applying sends a profile — the next step opens your account and builds one.'
          : complete
            ? 'One press sends your PL profile with a short note. Nothing to refill.'
            : 'Applying sends your PL profile — the next step is finishing it.',
        action: (
          <Button variant="primary" style="fill" size="m" className={d.footerAction} onClick={onApplyPressed}>
            Apply
          </Button>
        ),
      };
    }

    if (step === 'profile') {
      /* A visitor with no account. Same position, same button label, different
         requirement — the four text fields are validated by the press rather
         than gating it. */
      if (!loggedIn) {
        return {
          hint: hasStatus
            ? 'Your account opens when you send the application — nothing to confirm by email first.'
            : 'Choose a job search status to continue. It is only ever shown to the PL team.',
          action: (
            /* Disabled on the status and nothing else.

               The split is deliberate. A missing status is a *visible* gap: the
               amber strip is on screen pointing at it, so a dead button has a
               sign next to it. Field validity is invisible until something
               checks it — so the press is what checks, and errors land under the
               fields they belong to. `JobSignUpModal` makes exactly this call on
               exactly this form: "Disabled only while submitting, never on
               !isValid … a dead button in front of someone who has filled the
               form in and cannot tell what is wrong." */
            <Button
              variant="primary"
              style="fill"
              size="m"
              className={d.footerAction}
              disabled={!hasStatus}
              onClick={submitAccount}
            >
              Continue to apply
            </Button>
          ),
        };
      }

      return {
        /* Names what is actually outstanding, rather than "complete your
           profile". Two required answers means three ways to be incomplete, and
           a hint that says "add your current role" to someone who has already
           added it is the fastest way to make a footer look broken. */
        hint: !complete
          ? editing
            ? `Save this card, then ${missingHint(hasRole, hasStatus)} to continue.`
            : `${sentenceCase(missingHint(hasRole, hasStatus))} to continue. Everything else is optional.`
          : 'Experience, skills and bio are optional — you can add them any time.',
        action: (
          /* Disabled while a card is open as well as while the profile is
             incomplete: mid-edit there is unsaved work in front of the person,
             and letting them leave past it would silently drop it.

             One label now. It used to fall back to `Save profile` for a pending
             member, because applying was the one thing they could not do; with
             the gate gone there is no viewer for whom this press stops short of
             the letter, so naming a second destination would be describing a
             branch that no longer exists. */
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={!complete || !!editing}
            onClick={() => {
              onSaveProfile(draft);
              onStepChange('application');
            }}
          >
            Continue to apply
          </Button>
        ),
      };
    }

    const canSend = coverLetter.trim().length > 0;
    return {
      /* Empty: not "why we're asking" but *what to write*. An earlier line
         explained the field's existence — "the only part that isn't already on
         your profile" — which answers a question nobody staring at an empty box
         has. This one hands them a first sentence. Filled: stops instructing and
         says where the reply goes. */
      hint: canSend
        ? `${team?.name ?? 'The team'} can reply to you directly.`
        : 'Add what you did in previous roles that makes you a good fit for this one.',
      action: (
        /* "Apply", and this is the press that applies — there is no fourth step
           and no confirmation pane. The rail's last stop is where it happens.

           For a stranger this one press does two things: opens the account and
           files the application. That is deliberate rather than convenient — the
           alternative was registering them at the end of step 2, which is how
           the old modal worked and why abandoning at the letter used to leave an
           account behind with no application attached to it. The board does both
           or neither. */
        <Button
          variant="primary"
          style="fill"
          size="m"
          className={d.footerAction}
          disabled={!canSend}
          onClick={() =>
            onSubmitApplication(coverLetter.trim(), account ? { details: account, profile: draft } : undefined)
          }
        >
          Apply
        </Button>
      ),
    };
  })();

  return (
    <Drawer isOpen={open} onClose={onClose} fullScreen={isMobile} noBlur={isMobile}>
      {/* `d.drawerHeaderLift` is what this header adds to production's: a
          stacking order that survives positioned content scrolling past it, and
          the room for a second row. See the notes in the stylesheet. */}
      <div className={clsx(s.drawerHeader, d.drawerHeaderLift)}>
        <div className={clsx(s.breadcrumbs, d.headerRow)}>
          <button type="button" className={s.backButton} onClick={onBack}>
            <BackIcon />
            <span>{backLabel}</span>
          </button>
          {/* Shown exactly when Back does NOT leave the flow — anywhere Back goes
              to another step, there has to be a second control that goes out, or
              the flow has no exit on mobile where the overlay is gone. On the
              first step Back *is* the way out, and a ✕ beside it would be two
              controls doing one thing. */}
          {backTarget && (
            <button
              type="button"
              className={d.closeButton}
              onClick={() => {
                commitDraft();
                onClose();
              }}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          )}
        </div>
        <div className={d.stepBand}>
          <ApplyFlowSteps steps={steps} onSelect={(id) => goTo(id as ApplyFlowStepId)} />
        </div>
      </div>

      <div className={s.drawerContent}>
        {step === 'review' && (
          <JobDetailPane role={role} team={team} applied={applied} appliedAt={appliedAt} loggedIn={loggedIn} />
        )}

        {/* One position, two panes. A visitor with no account fills in the
            details that open one; a member confirms the profile they have. */}
        {step === 'profile' &&
          (loggedIn ? (
            <JobProfilePane
              draft={draft}
              setDraft={setDraft}
              editing={editing}
              setEditing={setEditing}
              pendingRoleTitle={role?.roleTitle ?? null}
              pendingApproval={pendingApproval}
              canvasImport={canvasImport}
            />
          ) : (
            /* The provider is here rather than inside the pane because the form
               it carries outlives the pane — see `accountMethods`. */
            <FormProvider {...accountMethods}>
              {/* (`draft` and `setDraft` were passed to this pane too, for the CV
                  importer it used to offer. The offer is gone and the pane no
                  longer touches the draft — the one profile answer it still
                  collects travels as `jobSearchStatus`.) */}
              <JobAccountPane
                jobSearchStatus={draft.jobSearchStatus}
                onJobSearchStatusChange={(value) => setDraft((prev) => ({ ...prev, jobSearchStatus: value }))}
                onSignIn={onSignIn}
              />
            </FormProvider>
          ))}

        {step === 'application' && role && (
          <JobApplicationPane
            role={role}
            teamName={team?.name ?? ''}
            /* The draft, not the saved profile. For a member the two agree —
               `commitDraft` runs on every exit from the profile step — but a
               stranger has nothing saved at all, and a read-back is supposed to
               quote what is about to be sent rather than what is on file. */
            profile={draft}
            applicantName={account?.name}
            editLabel={loggedIn ? undefined : 'Edit details'}
            onEditProfile={() => onStepChange('profile')}
            coverLetter={coverLetter}
            onCoverLetterChange={setCoverLetter}
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
    </Drawer>
  );
}
