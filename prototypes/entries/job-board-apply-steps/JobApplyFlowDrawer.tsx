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
// The `?utm…` suffix the board appends to every outbound posting link, so the
// team's own analytics sees where the applicant came from. Same import
// `JobDetailPane` uses for its `Original posting` link — one definition, so the
// two exits out of this board cannot start tagging themselves differently.
import { jobApplyQueryParams } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
// The board's "this leaves the site" mark. Same glyph `JobDetailPane` puts in
// front of its `Original posting` link, so the two exits out of this board are
// marked the same way as well as named the same way.
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';

import { ApplyFlowSteps, type ApplyFlowStep } from './ApplyFlowSteps';
import { JobDetailPane } from './JobDetailPane';
import { JobProfilePane, BackIcon, type EditTarget } from './JobProfilePane';
import { JobAccountPane } from './JobAccountPane';
import { JobApplicationPane } from './JobApplicationPane';
import {
  EMPTY_ACCOUNT_FORM,
  FILLED_ACCOUNT_FORM,
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
export const APPLY_FLOW_STEPS = ['review', 'cv', 'details', 'experience', 'application'] as const;
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
    /* FORK ONLY. The old step 2 — one pane holding the whole profile — is three
       positions here: the CV offer, the required answers, and the history.
       Each is named for what is collected there, because that is now the only
       thing telling you which of the three you are standing on. */
    case 'cv':
      return 'Your CV';
    /* Not "Your profile" any more, which is what the single step was called. It
       named a whole record; this position holds two answers and a private
       status, and a label promising the profile in front of a two-field pane
       reads as a step that lost its contents. Same word for a member and for a
       visitor with no account, whose account form stands in this position. */
    case 'details':
      return 'Your details';
    /* Bare noun, like the rest. "Add experience" would be an instruction, and
       an instruction is wrong on a step most people walk past without typing. */
    case 'experience':
      return 'Experience';
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
    /* FORK ONLY. Three destinations where there was one, and each names its own
       pane — a Back control has to say where it lands, and with five stops the
       one thing a person cannot work out from the rail alone is which way is
       backwards. */
    case 'cv':
      return 'Back to your CV';
    case 'details':
      return 'Back to your details';
    case 'experience':
      return 'Back to your experience';
    /* Not dead: this is what a *detour* returns to. Visiting an earlier step
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
  /** True for the `signed-up-modal` viewer: the account form opens filled with
   *  what the modal collected, and the completeness tick appears beside the
   *  footer button. Both follow from the same fact — there is nothing here for
   *  this person to type, so the step becomes something to confirm rather than
   *  something to fill in, and that is the only state where confirming is a
   *  sensible thing to ask for. */
  accountPrefilled?: boolean;
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
   *  profile is editable while it runs. See `canApply`. */
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
    onCreateAccount,
    loggedIn,
  accountPrefilled = false,
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

  /* The logged-out details step's confirmedComplete tick.

     Held here beside the draft, not on it, and not in the account form. Not on
     `MemberProfile`, because it is not a profile field — nothing about it
     survives this flow or belongs on a card a hiring team reads; it is a
     permission granted for one press. Not in `accountMethods` either, because
     the account form is validated *by* the press and this gates the press: a
     value that decides whether the button is alive has to be readable without
     asking a resolver, the same way `jobSearchStatus` is. Its own `useState` at
     this level is the honest home — the pane that shows it unmounts, the footer
     that reads it does not. */
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
    defaultValues: accountPrefilled ? FILLED_ACCOUNT_FORM : EMPTY_ACCOUNT_FORM,
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
    accountMethods.reset(accountPrefilled ? FILLED_ACCOUNT_FORM : EMPTY_ACCOUNT_FORM);
    /* Cleared with everything else. A confirmedComplete that persisted across flow runs
       would be permission for *this* application carried over from a different
       one — which is the only kind of confirmedComplete that isn't confirmedComplete. */
    setConfirmedComplete(false);
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
  /* FORK ONLY. Three paths where there were two, and the spread between the
     shortest and the longest is the whole thing this fork is for looking at.

       - finished profile → two stops, exactly as before. The rail still draws
         five, so this person opens the flow to *three* pre-ticked steps they
         never visit.
       - visitor with no account → two stops, and the three after `details` are
         unreachable: an account under review cannot send, so the flow ends on
         the account form. The rail draws five for them too.
       - member with an unfinished profile → all five, which is the only case
         the split was designed for. */
  const path: ApplyFlowStepId[] = skipProfile
    ? ['review', 'application']
    : loggedIn
      ? ['review', 'cv', 'details', 'experience', 'application']
      : ['review', 'details'];
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
    /* FORK ONLY. `details` is the account form for a visitor with no account, so
       it is theirs to revisit exactly as a member's is. The CV and Experience
       stops are not: they edit a profile record, and a person who has no account
       has nothing for them to edit — pressing them would open two panes with
       nowhere to save. */
    if (id === 'details') return true;
    if (id === 'cv' || id === 'experience') return loggedIn;
    return canApply;
  };

  /**
   * FORK ONLY. What the rail draws — which is not always the whole step list.
   *
   * **A visitor with no account is not offered a CV.** That decision was already
   * made one pane over: `JobAccountPane` used to carry the importer above its
   * fields and no longer does, because a stranger's first act should be opening
   * an account, not handing us a document. Splitting the profile into steps put
   * the offer back in front of them by the back door — not as a card they could
   * ignore, but as a *position on the rail*, which is a louder offer than the
   * card ever was and one they cannot even reach.
   *
   * So it comes out of their rail entirely rather than being drawn and refused.
   * Everywhere else this flow draws unreachable steps on purpose — the rail is a
   * promise about what applying involves, and a step you have not got to yet is
   * still on your way. This one is different in kind: the CV step is not ahead
   * of a logged-out visitor, it is *not for them*, and greying out a thing that
   * will never apply to you is not a preview, it is a locked door with your name
   * off it.
   *
   * **And it is not only the CV.** Dropping that one step and leaving
   * `Experience` and `Application` drawn was the same mistake with the fix
   * applied to the one instance someone pointed at. A visitor reaches neither:
   * the flow ends on this form, and what they get afterwards is the employer's
   * own posting, not a letter sent from here. So their rail is the two places
   * they actually stand — Review job, Your details — and the numbering follows,
   * because `ApplyFlowSteps` numbers by index: their rail reads 1–2, ours 1–5.
   *
   * That is a real divergence from this flow's own rule that the rail keeps one
   * shape for everybody, and it is worth stating rather than smuggling: the
   * shape is what makes the flow learnable, but a rail is a description of YOUR
   * journey, and three of five stops being permanently unreachable stops being a
   * promise and starts being a misdescription.
   */
  const railSteps: ApplyFlowStepId[] = loggedIn ? [...APPLY_FLOW_STEPS] : ['review', 'details'];

  const steps: ApplyFlowStep[] = railSteps.map((id) => {
    const status: ApplyFlowStep['status'] =
      id === step
        ? 'current'
        : /* A profile that was already finished shows its check from the first
             frame, on every step. That mark is the offer's evidence, not a record
             of something you did in this session.

             FORK ONLY, and this is the line to look at. In the three-step flow
             that was ONE pre-ticked step out of three. Here it is three out of
             five: a member with a finished profile opens the drawer to a rail
             whose middle sixty percent is already done and will never be
             visited. `skipProfile` is frozen at open, so it stays that way for
             the whole run. */
          skipProfile && (id === 'cv' || id === 'details' || id === 'experience')
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
    /* FORK ONLY: three steps write to the draft now, not one, so the commit has
       to fire on the way out of any of them. Splitting the pane multiplied the
       number of exits that can drop work — the same receipt has to hold at three
       boundaries instead of one. */
    if ((step === 'cv' || step === 'details' || step === 'experience') && loggedIn) onSaveProfile(draft);
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
      /* FORK ONLY. `path[1]` rather than a named step: with five positions and
         three different paths, "the next stop after reading" is a different
         answer for a member (`cv`) and for a visitor (`details`), and naming
         either one here would send half the people to a step that is not on
         their path. The path already knows. */
      onStepChange(path[1]);
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
   * handing them busywork dressed as progress. The press is withheld instead and
   * the hint beside it says what is running and what ends it.
   */
  const blockedByReview = loggedIn && pendingApproval;

  /**
   * `Create account`, and the last press a visitor with no account makes here.
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
    /* FORK ONLY. The half the button is named after, and it goes first: once
       `onCreateAccount` runs, the board closes the flow and this component is on
       its way out.

       `noopener` because it is a third-party site being handed a reference to
       our window otherwise, and `jobApplyQueryParams` so the team's own
       analytics sees where the applicant came from — the same suffix the
       `Original posting` link in the detail pane appends.

       Caveat worth knowing before this shape gets built for real: the tab opens
       after an async validation, so it is not inside the click's user gesture
       and a strict popup blocker can eat it. A production version would either
       validate synchronously or render this as an `<a>` and let the browser do
       the navigating. */
    if (role?.applyUrl) {
      window.open(`${role.applyUrl}?${jobApplyQueryParams('job-board')}`, '_blank', 'noopener,noreferrer');
    }
    /* Ends here. This used to be `onStepChange('application')` — the account was
       held unregistered until the final Apply so that abandoning at the letter
       cost nothing. There is no letter behind this press any more, so holding
       the details would mean collecting a form and doing nothing with it. */
    onCreateAccount({ details, profile });
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
        /* The pending-approval variant is back, with the gate it describes.
           It names the thing that ends the wait — an email — because "under
           review" on its own leaves the person with nothing to expect and no
           idea whether to keep checking.

           **Nothing at all when logged out.** There was a sentence here —
           "Applying sends a profile — the next step opens your account, and
           applying opens once it is approved" — and it spent three clauses
           warning a stranger about two things they had not asked about yet. The
           button beside it now says `Sign up to Apply`, which carries the only
           part of that they need before pressing: this costs an account. The
           rest is step 2's to say, at the moment it is true. `undefined` rather
           than `''`, so the footer drops the paragraph instead of reserving a
           blank line for it — see where `footer.hint` is rendered. */
        hint: blockedByReview
          ? "Applying opens once the PL team approves your account. We'll email you."
          : !loggedIn
            ? undefined
            : complete
              ? 'One press sends your PL profile with a short note. Nothing to refill.'
              : /* **Nothing here either.** This said that applying sends a profile
                   and that finishing it comes next — both of which the step rail
                   directly above already carries: it draws step 2 as the next
                   stop and names it. A footer that narrates the rail is a
                   second voice describing one journey.

                   `undefined`, not `''`, so the footer drops the paragraph
                   rather than reserving space for it. */
                undefined,
        action: (
          /* Dead on purpose, and only in the one state where the reason is on
             screen beside it. The rule this file follows elsewhere — never
             disable a control whose blocker is invisible — is satisfied here the
             same way the `Applied` report satisfies it: the hint says what is
             true, so the button is reporting rather than failing silently. */
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={blockedByReview}
            onClick={onApplyPressed}
          >
            {/* The label carries the toll, because nothing else does any more.
                A logged-out visitor gets no hint under this button, so `Apply`
                alone would promise a send and deliver a form — the classic
                bait, and the exact thing a person resents finding out one press
                in. `Sign up to Apply` states the order of events in four words
                and keeps `Apply` as the object of the sentence, so the button is
                still named after what the person came to do. Members see the
                plain verb: there is no toll to name. */}
            {loggedIn ? 'Apply' : 'Sign up to Apply'}
          </Button>
        ),
      };
    }

    /**
     * FORK ONLY — the CV step.
     *
     * **The two-button footer, and why it is the honest way to build this.** A
     * step whose whole content is one offer needs a way past it, and the way
     * past has to be a control rather than "just press Continue with nothing
     * uploaded" — because a person who has no CV to hand cannot tell whether
     * Continue will refuse them. So the offer costs everyone a decision: the
     * ~80% with no file still have to look at two buttons and pick one.
     *
     * That is the price the three-step flow does not pay. There the same
     * importer is a card sitting above the required fields, and ignoring it
     * means not dropping a file — no control, no decision, no screen.
     *
     * `Skip` is a border button rather than a text link on purpose: it is not
     * the rarer path here, it is the *majority* path, and dressing the common
     * answer as an exception would be the flow lying about who its users are.
     */
    if (step === 'cv') {
      const hasHistory = draft.experiences.length > 0;
      return {
        hint: hasHistory
          ? 'Your experience is on file — drop a newer CV to update it, or carry on.'
          : "Drop a CV and we'll fill in your role, skills and experience. Nothing here is required.",
        action: (
          /* One button, two labels — not the `Skip` + `Continue` pair this
             started as.

             That pair was two controls doing one thing: both called
             `goTo('details')`, because there is nothing on this screen for
             Continue to validate. A choice with no consequence dressed as a
             decision, which is the two-doors mistake exactly.

             The alternative that keeps two buttons honest is to disable Continue
             until a file has been read — and that puts a dead button in front of
             everyone who has no CV to hand, which is most people. So: one
             control, and its label names what the press actually does from
             where the person is standing. Nothing imported, `Skip`; something on
             file, `Continue`. The same two-labels-one-button idiom the details
             step already uses for `Save profile` / `Continue`.

             **The skip is a press, never a rule.** The step is drawn for every
             signed-in person walking this path, whatever is already on their
             profile — it is not hidden from people we guess don't need it. Who
             skips is their answer, not ours. */
          <Button variant="primary" style="fill" size="m" className={d.footerAction} onClick={() => goTo('details')}>
            {hasHistory ? 'Continue' : 'Skip'}
          </Button>
        ),
      };
    }

    /**
     * FORK ONLY — the Experience step, which is optional end to end.
     *
     * Its footer is the clearest evidence of what splitting bought: a whole
     * screen, a position on the rail and a Back destination for a section that
     * gates nothing. `Continue to apply` is live whatever is on it, because
     * nothing here is required — so the step is a screen you are shown and then
     * walk past, which is the definition of a step that should have been a card.
     */
    if (step === 'experience') {
      return {
        hint: blockedByReview
          ? "Applying opens once the PL team approves your account — we'll email you."
          : draft.experiences.length > 0
            ? 'This is what the hiring team reads first.'
            : 'Optional — you can add this any time, and applying does not wait for it.',
        action: (
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={!!editing}
            onClick={() => {
              onSaveProfile(draft);
              if (blockedByReview) {
                onClose();
                return;
              }
              onStepChange('application');
            }}
          >
            {blockedByReview ? 'Save profile' : 'Continue to apply'}
          </Button>
        ),
      };
    }

    if (step === 'details') {
      /* A visitor with no account. Same position, same button label, different
         requirement — the four text fields are validated by the press rather
         than gating it. */
      if (!loggedIn) {
        /* The two visible gates on this step, together. Both are answers on
           cards the person is looking at, both carry the amber `DataIncomplete`
           treatment while they are open, and neither can be satisfied by typing
           — so the button may safely be dead on either. See the note on
           `disabled` for why the *text fields* are not in here. */
        /* The tick only exists for the pre-filled step, so it can only gate that
           one. A plain visitor is typing these answers as they go, and asking
           someone to confirm that what they just typed is complete is asking
           them to read their own form back — the press is already that. */
        const canContinue = hasStatus && (!accountPrefilled || confirmedComplete);
        return {
          /* Says where this ends, because it no longer ends where the rail
             implies. The step used to hand straight on to the letter; now it is
             the last thing a visitor does here, so the sentence has to carry the
             review and the return trip rather than let the person press
             `Create account` expecting step 3. */
          /* FORK ONLY. It said "Your account opens now — the PL team reviews it,
             and you can apply once it's approved", which described a return trip
             and nothing to do in the meantime: the person came to apply, and the
             most the sentence could offer was a wait.

             The press hands them the employer's own posting instead, so the hint
             names that first — it is the part they can act on — and the account
             second, because it is the part that happens to them rather than the
             part they do. Production reached the same answer from the other
             direction: an unapproved account applying to a non-PL role is sent
             to the team's site, and this is that rule one viewer earlier. */
          /* **And nothing while the gaps are open.** There was a second arm
             here — "Choose a job search status to continue. It is only ever
             shown to the PL team." — restating, in the footer, both halves of
             what the amber strip and the PL-team-only pill already say one inch
             above, on the card they are about to point at. A hint that repeats
             the sign it is standing next to teaches the reader that the footer
             says nothing new, which is exactly the habit the *other* arm of this
             ternary needs them not to have. So the footer stays quiet until the
             requirements are met and it has something of its own to report. */
          hint: !canContinue
            ? undefined
            : /* The account clause is dropped for someone who signed up through the
                 modal: theirs already exists, and reporting its creation here would
                 date-stamp an event that happened before they pressed Apply. The
                 rest of the sentence is the part they can act on and is unchanged. */
              `${team?.name ?? 'The team'} takes applications on their own site — it opens in a new tab.${
                accountPrefilled ? '' : ' Your PL account is created too.'
              }`,
          action: (
            /* Disabled on the status and, where it exists, the completeness tick.

               The split is deliberate. A missing status is a *visible* gap: the
               amber strip is on screen pointing at it, so a dead button has a
               sign next to it. The tick is a peer of it and is visible for a simpler
               reason — it sits in this same bar, an inch from the button it
               blocks, wearing the required asterisk. It only appears for the
               pre-filled step; on a step the person is typing, the status strip
               is the only gap there is. Field validity is invisible until something
               checks it — so the press is what checks, and errors land under the
               fields they belong to. `JobSignUpModal` makes exactly this call on
               exactly this form: "Disabled only while submitting, never on
               !isValid … a dead button in front of someone who has filled the
               form in and cannot tell what is wrong." */
            <Button
              variant="primary"
              style="fill"
              size="m"
              className={clsx(d.footerAction, d.footerActionIcon)}
              disabled={!canContinue}
              onClick={submitAccount}
            >
              {/* FORK ONLY. `Create account` named the only thing this press did
                  and named it honestly — but it described the half the person did
                  not come for. They came to apply, and what they get when they
                  press is the team's own ad; the account is the by-product.

                  **This wore production's `Apply on their site` first, and it read
                  wrong here — for a reason worth keeping.** That string is
                  correct where production uses it: on the *review* step, under a
                  masthead carrying the team's name and logo, where "their" has
                  something to attach to. This is a form of the person's own
                  fields, so by the time the eye reaches the footer the nearest
                  antecedent for "their" is the applicant. A pronoun is context
                  the label does not carry with it — the string travelled, its
                  referent did not.

                  It went through `Open original posting` on the way here, which
                  fixed the pronoun by naming the destination — and named it so
                  flatly that the button stopped being about applying at all. The
                  person filling this form is not browsing for the ad; they are
                  mid-application, and a footer that offers to open a document
                  reads like a detour off the thing they are doing.

                  So: the flow's own forward label, and the arrow carrying the one
                  fact that label cannot — that continuing means leaving. `↗` is
                  this board's mark for exactly that, the same glyph step 1 puts
                  in front of `Original posting`, so the difference between
                  continuing *here* and continuing *out* is stated in the place
                  the eye already checks. The team and the new tab stay in the
                  hint, where "their own site" has the team's name in front of it
                  and resolves.

                  Note the collision this accepts: the Experience step's footer
                  also says `Continue to apply`, and there it means the letter on
                  step 5. No one meets both — a visitor's rail is two stops and
                  never reaches Experience, a member never sees this branch — so
                  the phrase means one thing inside any one person's journey. It
                  is still two meanings in one file, which is why the arrow is
                  load-bearing rather than decorative. */}
              Continue to apply
              {/* After the label, not before it. A leading mark is what the
                  detail pane's `Original posting` link wants — there the arrow is
                  a *type* mark, telling you what kind of thing the line is before
                  you read it. On a CTA the words are the act and the arrow is
                  what happens next, so it trails, the way the forum's "How to
                  write a good post" link already puts it. */}
              <ArrowUpRightIcon aria-hidden="true" />
            </Button>
          ),
        };
      }

      return {
        /* Names what is actually outstanding, rather than "complete your
           profile". Two required answers means three ways to be incomplete, and
           a hint that says "add your current role" to someone who has already
           added it is the fastest way to make a footer look broken. */
        hint: blockedByReview
          ? /* Not "Saved as you go" first — the button beside this says `Save
               profile`, so that clause was a sentence promising what a visible
               control already promises. The hint spends its words on the part
               the footer can't show. */
            "Applying opens once the PL team approves your account — we'll email you."
          : !complete
            ? editing
              ? 'Save this card to continue.'
              : /* Nothing at rest. The instruction that stood here — name the two
                   required answers, then reassure that the rest is optional — was
                   already on screen twice over: each required card carries its own
                   amber `Required to continue.` strip, and every optional section
                   is labelled `(Optional)`. */
                undefined
            : /* FORK ONLY. It said "Experience, skills and bio are optional — you
                 can add them any time", which was true when the sections sat
                 below this footer on the same step. Experience is its own screen
                 now and this press is what walks onto it, so a sentence calling
                 it optional in front of a button labelled `Continue` describes a
                 step it is about to take you to anyway. */
              'Next is your experience — optional, and you can walk past it.',
        action: (
          /* Disabled while a card is open as well as while the profile is
             incomplete: mid-edit there is unsaved work in front of the person,
             and letting them leave past it would silently drop it.

             **Two labels again.** `Save profile` came back with the gate: for a
             member under review this press cannot reach the letter, and a button
             saying `Continue to apply` that lands them back on the board would
             be naming a destination it does not go to. Editing is still never
             withheld while a review runs — the profile is the one useful thing
             they can do meanwhile — so the press stays live and only its promise
             changes. */
          <Button
            variant="primary"
            style="fill"
            size="m"
            className={d.footerAction}
            disabled={(!blockedByReview && !complete) || !!editing}
            onClick={() => {
              onSaveProfile(draft);
              if (blockedByReview) {
                onClose();
                return;
              }
              /* FORK ONLY: `experience`, not `application` — this step no longer
                 ends at the letter. */
              onStepChange('experience');
            }}
          >
            {/* Not `Continue to apply` any more: this press does not reach the
                letter, and a button naming a destination one step further on than
                it goes is the flow lying about its own shape — the same rule that
                renamed the visitor's button `Create account`. */}
            {blockedByReview ? 'Save profile' : 'Continue'}
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

        {/* FORK ONLY. The profile pane, three times, showing a third of itself
            each time. One component rather than three, because the cards, their
            editors and the draft they write to are unchanged — what the split
            changes is only which of them is on screen, which is a prop, not a
            new pane. */}
        {step === 'cv' && loggedIn && (
          <JobProfilePane
            section="cv"
            draft={draft}
            setDraft={setDraft}
            editing={editing}
            setEditing={setEditing}
            pendingRoleTitle={role?.roleTitle ?? null}
            pendingApproval={pendingApproval}
            canvasImport={canvasImport}
          />
        )}

        {step === 'experience' && loggedIn && (
          <JobProfilePane
            section="experience"
            draft={draft}
            setDraft={setDraft}
            editing={editing}
            setEditing={setEditing}
            pendingRoleTitle={role?.roleTitle ?? null}
            pendingApproval={pendingApproval}
            canvasImport={canvasImport}
          />
        )}

        {/* One position, two panes. A visitor with no account fills in the
            details that open one; a member confirms the profile they have. */}
        {step === 'details' &&
          (loggedIn ? (
            <JobProfilePane
              section="details"
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
            onEditProfile={() => onStepChange('details')}
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
          {/* Rendered only when there is something to say. Two footers are
              deliberately silent now — the logged-out review step and the
              logged-out details step while its two required answers are still
              open — and an empty `<p>` in a flex column is not silence: it is a
              line of leading plus the container's 12px gap, i.e. a hole where a
              sentence used to be. Dropping the node lets the bar close up to the
              button, which is what a footer with one control should look like. */}
          {/* The step's second gate, in the bar with the press it gates.

              It was a card up in the scroll, wearing the amber `missingData`
              treatment so that a dead button always had its reason visible
              somewhere. Beside the button that compensation is unnecessary:
              the tick and the press are one object, and nothing about why the
              button is dead can be scrolled away from.

              **First in the bar, and held at the left end.** It reads before
              the button rather than crowding it: the two are a condition and
              its consequence, and that is their order. It also stops the tick
              from moving — with the hint between them the pair sit at opposite
              ends whether or not there is a sentence, so nothing shifts under
              the cursor when one appears. See `.footerCheck`.

              The asterisk is the DS mark, transcribed rather than typed — the
              same red `*` the required text fields on this flow already wear,
              so one screen has one way of saying "required".

              Only on this step, and only for a visitor — a member's profile
              already exists, so there is nothing here for them to confirm. */}
          {step === 'details' && accountPrefilled && (
            <label className={d.footerCheck}>
              <Checkbox checked={confirmedComplete} onChange={setConfirmedComplete} />
              <span className={d.footerCheckLabel}>My profile is complete</span>
            </label>
          )}
          {footer.hint && <p className={d.footerHint}>{footer.hint}</p>}
          {footer.action}
        </div>
      </div>
    </Drawer>
  );
}
