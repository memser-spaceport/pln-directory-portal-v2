'use client';

import { useEffect, useState } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import clsx from 'clsx';

import type { IJobRole, IJobTeam } from '@/types/jobs.types';

import { Drawer } from '@/components/common/Drawer/Drawer';
import { Button } from '@/components/common/Button';
import { CheckIcon, CloseIcon } from '@/components/icons';
// The DS checkbox, for the completeness tick in the footer bar.
import { Checkbox } from '@/components/common/Checkbox';
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
// The outbound-posting suffix and the board's "this leaves the site" mark —
// both already used by `JobDetailPane` for its `Original posting` link, so the
// two exits out of this board are tagged and marked the same way.
import { jobApplyQueryParams } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';

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

/* `missingHint` and `sentenceCase` stood here. They existed to compose a
   single footer sentence out of the three ways the profile step can be
   incomplete — naming the missing answer, then reassuring that the rest was
   optional. That sentence is gone: each required card already carries its own
   amber strip naming what it wants, in the place where it can be given, and
   every optional section is labelled as one. */

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
   * Sends it. Only ever called from an approved account — see `canApply`.
   *
   * **It used to take a `newAccount` and do two things at once**: open the
   * account and file the application in one press, so a stranger's whole visit
   * either completed or cost nothing. That press is no longer possible. An
   * application may not leave a account that is under review, and a
   * brand-new account is under review from the moment it exists, so the one
   * press was the rule's most common violation rather than its exception.
   */
  onSubmitApplication: (coverLetter: string) => void;
  /**
   * Opens the account, and *only* the account. This is where the details step
   * now ends for a visitor who arrived without one.
   *
   * It carries the whole assembled `profile`, not just the typed `details`,
   * because the step collects one answer the account form has no field for: the
   * job search status. Handing over the draft that was on screen means the board
   * seeds the profile from the thing the person filled in rather than rebuilding
   * it from parts and losing the half that didn't come from an input.
   *
   * The role they came for is not carried across. That is the cost of this rule
   * and it is a real one — they will have to find the row again after approval —
   * but the alternatives are worse: holding a letter for days, or sending one
   * from an account nobody has checked yet.
   */
  onCreateAccount: (payload: { details: AccountDetails; profile: MemberProfile }) => void;
  loggedIn: boolean;
  /* (`accountPrefilled` stood here, for a `signed-up-modal` viewer whose account
     form opened already filled and whose only remaining act was the completeness
     tick. Both the viewer and the prop are gone. The tick moved to the state a
     real modal sign-up actually produces — see `pendingApproval`.) */
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
  /** Signed up, waiting on the PL team — and that wait stops the one thing this
   *  drawer exists for. Everything else stays open: the job is readable and the
   *  profile is editable while it runs. See `canApply`.
   *
   *  It is also the one state that carries the completeness tick beside the
   *  footer button, because it is the one state where the press leaves for
   *  somewhere this product cannot follow: the team's own site. The profile
   *  cannot be re-read and fixed after the fact the way an in-flow application
   *  can, so the last thing asked before the person goes is whether what they
   *  have is what they meant to leave behind. */
  pendingApproval: boolean;
  /** Signed up to look for work rather than to join a team. Nothing here waits
   *  on the PL team, so this changes no gate in the flow — it is the profile
   *  step's ask that differs, and this hands the pane the one fact it needs to
   *  make it. See `BoardViewer` in `viewerState`. */
  jobAspirant?: boolean;
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
    onCreateAccount,
    loggedIn,
    onSignIn,
    pendingApproval,
    jobAspirant = false,
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

  /* The pending member's completeness tick: that the profile they are leaving
     behind is the one they meant to leave, before the press hands them to the
     team's own site.

     **Alongside `draft`, not inside it.** Every field on the profile draft is a
     fact about the person that outlives this drawer and lands on their record.
     This is neither — it is an agreement to one act, given in one session, and
     `MemberProfile` is the wrong place to keep it precisely because storing it
     there would imply it travels with the profile and can be read back later as
     a standing permission. Held at flow level for the same reason the letter and
     the account form are: the pane that collects it unmounts on every step
     change, and a tick that had to be given twice would be a worse promise than
     no tick at all.

     Reset with everything else when the drawer opens — a fresh run asks again,
     which is the only version of confirmedComplete worth collecting. */
  const [confirmedComplete, setConfirmedComplete] = useState(false);

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

  /* (`account` — the validated details, held here until the final Apply — is
     gone. It existed so a stranger's answers could survive step 2 and be handed
     over with the letter; the details are registered by the press that collects
     them now, so nothing has to be carried, and state read by nobody is the
     next pass's evidence for a path that no longer exists.) */

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
    setConfirmedComplete(false);
    accountMethods.reset(EMPTY_ACCOUNT_FORM);
    /* `loggedIn &&` is belt and braces — a logged-out viewer's profile is the
       empty one, so `isProfileComplete` is already false — but the step is about
       *having an account*, not about the record being full, and stating that
       here keeps the two from being confused if the mock ever seeds a profile
       for someone signed out. */
    /* `!jobAspirant`, because that viewer's required answers arrive already
       given and this test would otherwise collapse the rail to two stops for the
       one person whose middle step is the point of the run. Stated here as well
       as in `onApplyPressed` on purpose: that one picks the step, this one picks
       the *shape*, and a rail promising three stops while the press goes to the
       second is worse than either mistake alone. */
    setSkipProfile(loggedIn && !jobAspirant && isProfileComplete(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const complete = isProfileComplete(draft);
  /* The two halves of that rule. Read off the draft with the same tests
     `isProfileComplete` uses — deliberately not a second definition of
     "required", just a finer-grained look at the one that exists. */
  const hasRole = draft.role.trim() !== '';
  const hasStatus = draft.jobSearchStatus !== '';

  /* What the logged-out step 2 waits on: the one answer the account form has no
     field for.

     It used to be two — the status and the completeness tick — while a
     pre-filled account step existed. It is one again, and deliberately: a
     visitor is typing these answers as they go, and asking someone to confirm
     that what they just typed is complete is asking them to read their own form
     back. The press is already that confirmation. The tick now belongs to the
     step where the press *leaves*; see `confirmedComplete`. */
  const gatesAnswered = hasStatus;

  /**
   * Whether the last step is reachable at all. Three conditions, and each one is
   * a different kind of thing.
   *
   * **`complete`** is the rule that was always the real one: an application must
   * carry a complete profile, because a one-click application sends the team
   * your profile instead of a form. Not being finished yet is not a refusal —
   * the middle step is where it gets finished.
   *
   * **`loggedIn && !pendingApproval`** is the rule that came back. An
   * application may not be sent from an account under review. Both halves of
   * that had been removed on the argument that the PL review "runs alongside"
   * and governs the rest of the network rather than this board — and the two
   * removals were argued separately, which is what hid the hole between them: a
   * visitor could open an account at the end of step 2 and send from it in the
   * same press, so the account that skipped the review most reliably was the
   * brand-new one. Restoring the gate means restoring both halves, or the
   * stranger's path walks straight through it again.
   *
   * What this costs, said plainly: a visitor who arrives on a role can no longer
   * apply in one visit. They open an account here and come back once it is
   * approved. The rule is worth that; pretending it isn't a cost is not.
   */
  const canApply = complete && loggedIn && !pendingApproval;

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
    /* **`|| jobAspirant`, and it is not a completeness test.** For everyone else
       the middle step is what "you can't apply yet" resolves to, so a finished
       profile skips it — showing someone a form they have already filled in is
       the flow charging them a step for nothing.

       An aspirant's step 2 is not that form. Their required answers arrive
       already given (see `JOB_ASPIRANT_PROFILE`), so on the usual rule they would
       be handed straight to the letter and never see the profile a hiring team
       is about to read them by — nor the CV card that is the point of the
       account, nor the tick that says they have looked. Skipping a step nobody
       has seen is not saving them a step. */
    if (!canApply || jobAspirant) {
      onStepChange('profile');
      return;
    }
    onStepChange('application');
  };

  /**
   * The one state this flow answers with a no rather than with a next step.
   *
   * Everywhere else, "you can't apply yet" means "not finished yet" and the
   * middle step is the answer. A review is different in kind: nothing the person
   * can do on this screen ends it, so sending them to the profile step would be
   * handing them busywork dressed as progress. The press goes outwards instead,
   * to the team's own site, and the arrow on it says so.
   */
  const blockedByReview = loggedIn && pendingApproval;

  /**
   * The way out to the team's own ad, for a member whose account is still under
   * review.
   *
   * **What changed, and why the gate did not.** An application still may not be
   * *sent from here* by an unreviewed account — that rule is untouched. What was
   * wrong was the conclusion drawn from it: that the person therefore has
   * nothing to do but wait. They can apply; just not through this board. So the
   * two footers that used to report the wait now hand over the link instead, and
   * the one that used to say `Save profile` says what the press is actually for.
   *
   * Production reaches the same place from the other side — `applyGoesExternal`
   * in `JobApplyFlowController`, for exactly this viewer — so this is the
   * prototype catching up to a decision already made rather than a new one.
   *
   * `noopener` because the destination is a third party, and the board's own
   * tracking suffix so the team sees where the applicant came from — the same
   * one `JobDetailPane` appends to its `Original posting` link.
   */
  const openExternalPosting = () => {
    if (!role?.applyUrl) return;
    window.open(`${role.applyUrl}?${jobApplyQueryParams('job-board')}`, '_blank', 'noopener,noreferrer');
  };

  /**
   * `Create profile`, and the last press a visitor with no account makes here.
   *
   * Runs the schema and either surfaces errors under the fields or opens the
   * account. It used to accept the answers and move on to the letter, holding
   * the details unregistered until the final `Apply` so that abandoning cost
   * nothing; with the letter out of reach for a new account, the press that
   * validates the form is the press that registers it.
   *
   * The role and LinkedIn land on the profile because they are profile facts;
   * name and email stay on the account record, which is the only thing that
   * needs them.
   */
  const submitAccount = accountMethods.handleSubmit((data) => {
    const details = toAccountDetails(data);
    const profile = { ...draft, role: details.role, linkedin: details.linkedin };
    setDraft(profile);
    /* **The board decides what happens next, not this handler.** Whether the run
       continues turns on which kind of account the form just described — see
       `onCreateAccount` — and that is the board's fact: it owns the viewer and
       the step. This used to call `onStepChange('application')` itself, from
       when the account was held unregistered until the final Apply; the press
       registers it now, so the details are never collected and dropped. */
    onCreateAccount({ details, profile });
  });

  /* One footer, three steps, and the sentence beside the button changes with
     both the step and what the press will actually do. A footer that promised
     "one click" to someone with no account would be describing a different
     person's experience of the same button. */
  const footer = (() => {
    if (step === 'review') {
      if (applied) {
        return (
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
        );
      }
      return (
        /* No longer dead. The button was disabled for a pending member, with a
             sentence beside it explaining the wait — which satisfied this file's
             rule about never disabling a control whose blocker is invisible. The
             better answer to "you cannot do this here" turned out to be
             somewhere they can. */
        <Button
          variant="primary"
          style="fill"
          size="m"
          className={clsx(d.footerAction, blockedByReview && d.footerActionIcon)}
          onClick={
            blockedByReview
              ? () => {
                  openExternalPosting();
                  onClose();
                }
              : onApplyPressed
          }
        >
          {blockedByReview ? (
            <>
              Continue to apply
              <ArrowUpRightIcon aria-hidden="true" />
            </>
          ) : /* **Three labels, and the third is for a stranger.** A
                   logged-out visitor pressing a button that says `Apply` would
                   land in a sign-up form one press later, which is the flow
                   taking a press under a promise it doesn't keep. `Sign up to
                   Apply` names both halves in the order they happen, and it is
                   the only place on this step that has to: the sentence that
                   used to say it stood beside this button, and a labelled button
                   says the thing that sentence was saying.

                   It is still the primary button in the primary position —
                   naming the toll does not demote the action, and Apply is
                   still what the press is *for*. */
          loggedIn ? (
            'Apply'
          ) : (
            'Sign up to Apply'
          )}
        </Button>
      );
    }

    if (step === 'profile') {
      /* A visitor with no account. Same position, different requirement — the
         text fields are validated by the press rather than gating it; the one
         marked answer (the job search status) gates it. */
      if (!loggedIn) {
        return (
          /* Disabled on the one marked answer, and nothing else.

               The split is deliberate: a control is only ever dead for a reason
               already on screen, and this one qualifies — the status card wears
               the amber strip when unanswered, so a dead button always has a
               sign beside it pointing at what to do. Field validity is invisible
               until something checks it, so it stays out of this: the press is
               what checks, and errors land under the fields they belong to.
               `JobSignUpModal` makes exactly this call on exactly this form:
               "Disabled only while submitting, never on !isValid … a dead button
               in front of someone who has filled the form in and cannot tell
               what is wrong." */
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={!gatesAnswered}
            onClick={submitAccount}
          >
            {/* Names the press, and only the press. This briefly said
                  `Continue to apply` — the errand rather than the step — and it
                  named a destination the press does not reach: a visitor's run
                  ends here, because an application cannot leave an account that
                  is still under review. A sentence beside it was left carrying
                  the correction on its own ("your account opens now… you can
                  apply once it's approved"), which is a footnote arguing with a
                  button — and the footer has no sentences left to argue with.

                  `Create profile`, not `Create account`, because that is what the
                  step calls the thing being made — `Create Lab OS Job profile` is
                  the heading directly above. (`Your account` labels one section
                  inside it.) One name for one object, top and bottom of the step.

                  No arrow either: `ArrowUpRightIcon` is this file's outward mark
                  — on `Continue to apply` it says the press leaves for the team's
                  own site — and this press stays. */}
            Create profile
          </Button>
        );
      }

      return (
        /* Disabled while a card is open as well as while the profile is
             incomplete: mid-edit there is unsaved work in front of the person,
             and letting them leave past it would silently drop it.

             **And, under review, on the tick.** The rule this file keeps is that
             a control is only ever dead for a reason already on screen; the tick
             sits in this same bar, wearing the required asterisk, so it
             qualifies. Completeness itself is deliberately *not* a gate for a
             pending member — the press goes outwards, where nothing this board
             requires applies — which is exactly why the confirmation is a tick
             they give rather than a rule the flow enforces. */
        <Button
          variant="primary"
          style="fill"
          size="m"
          className={clsx(d.footerAction, blockedByReview && d.footerActionIcon)}
          /* The tick joins the gates for both viewers that are shown one. It
               is allowed to: the drawer's standing rule is that a control is
               only ever dead for a reason already on screen, and this reason is
               in the same bar as the button, which is the whole argument for
               putting it there. Completeness stays out of the pending member's
               gate — that press goes outwards, where nothing this board requires
               applies — and stays in the aspirant's, whose press goes to step 3. */
          disabled={
            blockedByReview
              ? !confirmedComplete || !!editing
              : !complete || !!editing || (jobAspirant && !confirmedComplete)
          }
          onClick={() => {
            onSaveProfile(draft);
            if (blockedByReview) {
              /* The profile is committed first — they came here to edit it and
                   a press that left without saving would lose the visit — then
                   the posting opens and the flow closes behind them. */
              openExternalPosting();
              onClose();
              return;
            }
            onStepChange('application');
          }}
        >
          {/* `Save profile` is gone. It was an honest name for the only thing
                the press did — and the reason it only did that was a wait the
                person could do nothing about. There is somewhere to send them
                now: the team takes applications on its own site, so a pending
                member continues, outwards, and the arrow says which. */}
          {blockedByReview ? (
            <>
              Continue to apply
              <ArrowUpRightIcon aria-hidden="true" />
            </>
          ) : (
            'Continue to apply'
          )}
        </Button>
      );
    }

    const canSend = coverLetter.trim().length > 0;
    return (
      /* "Apply", and this is the press that applies — there is no fourth step
           and no confirmation pane. The rail's last stop is where it happens.

           One act now, not two. This press used to open a stranger's account and
           file the application together; only an approved account reaches this
           step, so everyone standing here already has one and the letter is all
           that is left to send. */
      <Button
        variant="primary"
        style="fill"
        size="m"
        className={d.footerAction}
        disabled={!canSend}
        onClick={() => onSubmitApplication(coverLetter.trim())}
      >
        Apply
      </Button>
    );
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
              jobAspirant={jobAspirant}
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
                /* Controlled from here for the same reason the status is: the
                   footer is what reads it, and the pane that shows it unmounts
                   on every step change. */
                onSignIn={onSignIn}
              />
            </FormProvider>
          ))}

        {step === 'application' && role && (
          <JobApplicationPane
            role={role}
            teamName={team?.name ?? ''}
            /* The draft, not the saved profile. The two agree by the time anyone
               stands here — `commitDraft` runs on every exit from the profile
               step — but a read-back is supposed to quote what is about to be
               sent rather than what is on file, and those can differ for one
               render after an edit.

               `applicantName` and the `Edit details` label are gone with the
               person they were for. They existed because a stranger reached this
               step with a typed name and no profile record; only an approved
               member reaches it now, so both branches described someone who
               cannot be here. The pane falls back to the profile's own name. */
            profile={draft}
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
          {/* The step's second gate, in the bar with the press it gates.

              It was a card up in the scroll, wearing the amber `missingData`
              treatment so that a dead button always had its reason visible
              somewhere. Beside the button that compensation is unnecessary:
              the tick and the press are one object, and nothing about why the
              button is dead can be scrolled away from.

              **First in the bar, and held at the left end.** It reads before
              the button rather than crowding it: the two are a condition and
              its consequence, and that is their order. The bar has nothing
              between them any more, so `.footerCheck`'s own `margin-right: auto`
              is what holds that end — see it.

              The asterisk is the DS mark, transcribed rather than typed — the
              same red `*` the required text fields on this flow already wear,
              so one screen has one way of saying "required".

              **Only on this step, and only for the two viewers who are asked.**
              A pending member has no step 3 — the press hands them to the team's
              own site, and the profile they leave behind is left as it stands —
              so this is the last place that can ask, and it does. A job aspirant
              is asked because the profile is the whole of what a hiring team
              gets from a stranger: the CV and the cards are the introduction,
              not a supporting document behind one they already have.

              **Worth knowing, because it is the exception this file used to
              rule out.** Everyone else is skipped here on the grounds that step 3
              reads the profile back before anything is sent, and a tick in front
              of a read-back is a confirmation asked twice. An aspirant does have
              a step 3, so that argument applies to them too — the tick was asked
              for on this step, and it is the one viewer where it sits in front
              of a read-back. If it turns out to be the second ask, this
              condition is where it comes back out.

              **Two labels, because they confirm two different things.** The
              pending member is asked whether the profile is *finished*, since
              nothing can be added to it after the press leaves the product. The
              aspirant is asked whether they have *read* it — everything on it is
              still editable, and the question is whether what is there is what
              they meant to send. */}
          {step === 'profile' && (blockedByReview || jobAspirant) && (
            <label className={d.footerCheck}>
              <Checkbox checked={confirmedComplete} onChange={setConfirmedComplete} />
              <span className={d.footerCheckLabel}>
                {blockedByReview ? 'My profile is complete' : "I've reviewed my profile"}
              </span>
            </label>
          )}
          {footer}
        </div>
      </div>
    </Drawer>
  );
}
