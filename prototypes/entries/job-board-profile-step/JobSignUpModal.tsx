'use client';

import { useEffect } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';

// Demo Day's profile-drawer chrome, for the mobile page's `← Back` header. The
// same stylesheet `JobProfilePane` wears, so the two steps of this flow show
// one header rather than two.
import drawer from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';

import { BackIcon } from './JobProfilePane';
import { VIEWER_EMAIL, VIEWER_NAME } from './profile/viewerIdentity';
// The schema, the four fields and the flattener — shared with the apply flow's
// own account step, which is the other place this exact form is now asked for.
// See `accountFields.tsx` for why it was lifted out of this file.
import {
  AccountFields,
  EMPTY_ACCOUNT_FORM,
  accountSchema,
  toAccountDetails,
  type AccountFormData,
} from './accountFields';
import s from './JobSignUpModal.module.scss';

/** The answers this modal reports. An alias rather than its own shape: the flow
 *  drawer's account step collects the identical set, and two names for one
 *  record is how the two ends of a handoff drift. */
export type JobSignUpDetails = import('./accountFields').AccountDetails;

interface JobSignUpModalProps {
  open: boolean;
  onClose: () => void;
  /* (`role` and `teamName` lived here. The modal used to have two doors and the
     role-carrying one named its job in the header — "Apply for {roleTitle}" —
     because the form was the continuation of an Apply click. That door is the
     apply flow's own details step now, so every press that opens this modal is
     the role-less one and there is no job to name. See the note above the
     header.) */
  /** Filling this in IS the sign-up. Parent creates the account and moves the
   *  board into the pending-approval state. */
  onSignUp: (details: JobSignUpDetails) => void;
  /** The escape for people who already have an account. */
  onSignIn: () => void;
  /**
   * DELETE WITH: the `design-canvas/` folder.
   *
   * Two review-only beats the design canvas needs frames of, and the only two on
   * this board that cannot be forced from outside the component: what the form
   * looks like with answers in it, and what it looks like when the press is
   * refused. Both live inside react-hook-form's own state, so a URL parameter
   * read by the parent cannot reach them.
   *
   * Neither is a feature: nothing on the board sets them, and each only forces a
   * state this form already produces on its own.
   */
  canvasFilled?: boolean;
  canvasRefused?: boolean;
}

/**
 * DELETE WITH: the `design-canvas/` folder.
 *
 * The same form with answers in it, so the canvas can hold the filled beat beside
 * the empty one — a form with placeholders in every field and a form someone has
 * worked through are two different designs, and only one of them was reviewable.
 *
 * The person is the board's own viewer (see `FILLED_PROFILE` and `VIEWER_NAME`),
 * not a second invented member: the sign-up form, the profile and the application
 * email should all describe one applicant.
 *
 * `company` stays null. It is a react-select option object rather than a string,
 * and the list it is chosen from is built at render from the board's own teams —
 * so a value hard-coded here could name a team the select does not offer.
 */
const CANVAS_FILLED_FORM: AccountFormData = {
  /* From `viewerIdentity`, not typed again here — the importer's review card now
     reads the same two constants to decide it must not ask for them, and two
     literals of one address is two chances for the applicant to become two
     people. */
  email: VIEWER_EMAIL,
  name: VIEWER_NAME,
  linkedin: 'polina-bublii',
  role: 'Senior Protocol Engineer',
  company: null,
};

/**
 * The account, opened on its own — for someone who wants one before they have
 * picked a job.
 *
 * **This modal used to be the answer to Apply-while-logged-out**, and most of
 * what was written here argued for that: a logged-out person pressed Apply on
 * one role, the literal reading of the click was "send my details to this team",
 * and asking for those details *was* the sign-up rather than putting a login
 * wall in front of it. All still true — and all of it now describes
 * `JobAccountPane`, the apply flow's step 2, which took that door over so the
 * flow stopped forking into a modal for its least committed visitor.
 *
 * What is left here is the case that was always separate and never had a role to
 * name: **Sign up** in the header or the banner. Someone browsing who decides
 * they want an account. There is no job to continue from, nothing to resume, and
 * so no rail — a single form and a single press is the whole interaction.
 *
 * The reason it survives at all is that removing it would leave the board's
 * signed-out ask with one door where the navbar offers two (see
 * `prototypes/AUTH-COPY-AUDIT.md`): Sign up beside Sign in, in that order.
 *
 * **Faithful in shape, not in mechanism.** Production defers real authentication
 * to a later Privy step — submitting registers the person, and the credential
 * handshake happens afterwards, outside this dialog. The prototype reproduces
 * that shape: form in, `onSignUp` out, no password field, no OTP, no success
 * screen. Nothing here authenticates anyone, and it would misrepresent
 * production to imply otherwise by bolting on a credential step that the real
 * modal doesn't carry either.
 *
 * **Why the header no longer names a role.** It used to, on the door that has
 * gone: answering a click on "Senior Distributed Systems Engineer" with an
 * unlabelled "Create your account" form changes the subject, and the honest word
 * for that is bait-and-switch. The rule holds; it is just the flow's details
 * step that has to obey it now, and it does — the rail names the job and the
 * lede says what the details are for. Here the person pressed **Sign up**, so
 * naming a role would invent an intention rather than continue one.
 *
 * **Why the sign-in escape is a link at the bottom, not a button beside Submit.**
 * "I already have an account" is the rarer path — this dialog only opens for
 * someone the board believes is logged out. Rendering it as a second button on
 * the footer row makes peers out of a primary action and an exception, and then
 * the eye has to price both before it can commit to either. As a centred link
 * below the actions it is findable by anyone looking for it and silent for
 * everyone who isn't. Below the footer rather than above the fields, too:
 * someone who *doesn't* have an account should meet the first input, not a fork.
 *
 * **"Sign in" vs Demo Day's "Log in".** The demo-day source words its equivalent
 * escape `Already applied? Log in`. This says `Already have an account? Sign in`.
 * The divergence is deliberate: `prototypes/AUTH-COPY-AUDIT.md` fixes the house
 * standard at **Sign in · Sign up · Sign out**, sentence case, never log in /
 * login / logout — and this modal sits on the job board beside the sign-in banner
 * and sign-in prompt, which already use it. Matching the neighbours the person
 * can actually see beats matching a component they can't.
 */
export function JobSignUpModal({
  open,
  onClose,
  onSignUp,
  onSignIn,
  canvasFilled,
  canvasRefused,
}: JobSignUpModalProps) {
  const methods = useForm<AccountFormData>({
    defaultValues: EMPTY_ACCOUNT_FORM,
    resolver: yupResolver(accountSchema) as Resolver<AccountFormData>,
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    reset,
    trigger,
    formState: { isSubmitting },
  } = methods;

  // Reset on every open. This modal is mounted for the life of the board and can
  // be opened against a different role each time; carrying one attempt's
  // half-typed values into the next would look like the board had remembered
  // something about a person it holds no account for.
  useEffect(() => {
    if (open) {
      reset(canvasFilled ? CANVAS_FILLED_FORM : EMPTY_ACCOUNT_FORM);
    }
  }, [open, reset, canvasFilled]);

  /* DELETE WITH: the `design-canvas/` folder.
     The refused beat, for the canvas. Runs the real schema against the real
     empty form, so the frame shows the errors this form actually renders rather
     than copy written to look like them. After the reset above, so it validates
     the state the person would be in. */
  useEffect(() => {
    if (!open || !canvasRefused) return;
    const id = window.setTimeout(() => void trigger(), 0);
    return () => window.clearTimeout(id);
  }, [open, canvasRefused, trigger]);

  const onSubmit = (data: AccountFormData) => {
    // Submit only reports the details. The parent owns everything after —
    // creating the account, closing this, moving the board into
    // pending-approval — so there is deliberately no onClose() here and no
    // success screen. A modal that congratulated you and a board that then
    // changed state behind it would be two announcements of one event.
    onSignUp(toAccountDetails(data));
  };

  return (
    /* `lockScroll` was missing. It never showed while this was a card — the
       overlay covered the board and nobody scrolled past it — but a full-height
       page on a phone is a scroll container inside another scroll container, and
       flicking past the end of the form would drift the board underneath. */
    <Modal
      isOpen={open}
      onClose={onClose}
      overlayClassname={s.overlay}
      closeOnBackdropClick={false}
      closeOnEscape
      lockScroll
      className={s.modal}
    >
      <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>

      {/* The page's header, below 960 only.
          `EditInvestorProfileDrawer`'s own bar — the same sticky 64px white row
          with `← Back` that the profile drawer shows two steps later in this
          flow, so a phone user meets one header rather than two designs of one.
          Above 960 it is display:none and the floating ✕ takes over. */}
      <div className={`${drawer.drawerHeader} ${s.mobileHeader}`}>
        <div className={drawer.breadcrumbs}>
          <button type="button" className={drawer.backButton} onClick={onClose}>
            <BackIcon />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className={`${s.content} ${s.pageBody}`}>
        {/* One header now.

            There were two, because there were two ways in: from Apply the modal
            named the role, since the form was the continuation of a click on
            that role; from a plain Sign up press it went generic. The apply flow
            owns the first case, so what is left is the honest header for the
            only door that remains — what the account itself buys, which is the
            same claim the banner two rows above makes, so this reads as the door
            that banner was offering rather than a different pitch.

            Naming a role here would now be worse than generic: it would invent
            an intention the person hasn't expressed. They pressed Sign up, not
            Apply. */}
        <div className={s.text}>
          <h2 className={s.title}>Sign up to apply</h2>
          <div className={s.subtitle}>One profile applies to every open role across the Protocol Labs network.</div>
        </div>

        <FormProvider {...methods}>
          <form className={s.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            {/* Email → name → LinkedIn → role @ company. The fields and their
                rules live in `accountFields.tsx` now, because the apply flow's
                account step asks for exactly the same five answers and two
                copies of one schema is two chances to disagree about what a
                valid handle is. */}
            <AccountFields />

            <div className={s.bottomText}>
              {/* One line, and only the part nothing else on the card says.
                  This ran to four lines and pushed "Already have an account?
                  Sign in" off the bottom of any window shorter than ~730px —
                  which hides the escape from precisely the people who need it,
                  since someone who already has an account has no use for the
                  form above it.

                  What it lost was duplication and one falsehood. The account is
                  already named twice — the subtitle says creating it is the
                  first step, the submit button says "Create account" — so
                  "submitting this creates your LabOS account" was the third
                  telling. And "sends your details to <team>" was simply untrue:
                  submitting creates a *pending* account and opens the profile
                  drawer; the hiring team receives nothing until an approved
                  member actually applies. Copy that overstates what a button
                  does is worse than copy that is long.

                  The "applying unlocks once you're approved" clause has been off
                  and on this line once already. It came off when approval
                  stopped gating applying and the flow began opening an account
                  and sending a letter in one press; approval gates applying
                  again, so it is back. It has to be: this modal is where a new
                  member learns what the review is, and a review whose one
                  consequence goes unmentioned here is a wall they meet later
                  with no warning.

                  Stated, not warned about — it names what opens and when, rather
                  than telling someone what they cannot do. Browsing genuinely is
                  open, so the sentence leads with that.

                  No role/no-role branch any more: what the PL team does next
                  doesn't depend on which button opened this. */}
              <p className={s.body}>
                The PL team reviews new accounts — browse while that runs, and applying opens once you&apos;re approved.
              </p>
              <p className={s.bodySecondary}>
                By submitting this form, you agree to our{' '}
                <a
                  className={s.inlineLink}
                  href="https://drive.google.com/file/d/1RIAyMlyuLYnipa6W_YBzcJ6hDzfH7yW3/view"
                  target="_blank"
                  rel="noreferrer"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  className={s.inlineLink}
                  href="https://drive.google.com/file/d/1MjOF66asddB_hsg7Jc-7Oxk6L1EvYHxk/view"
                  target="_blank"
                  rel="noreferrer"
                >
                  Terms &amp; Conditions
                </a>
                .
              </p>
            </div>

            {/* The dock: the actions and the sign-in escape, sticky together on
                the mobile page.

                One wrapper rather than two sticky elements, because two would
                each stick to `bottom: 0` and land on top of each other. On the
                desktop card it is `display: contents`, so the footer and the
                sign-in row go back to being direct children of the form and lay
                out exactly as they did before this existed. See `.actionsDock`. */}
            <div className={s.actionsDock}>
              <div className={s.footer}>
                {/* Card only. On the mobile page the `← Back` header is the way
                  out, and a second one pinned above the primary would spend a
                  third of the sticky bar on leaving. See `.cancelButton`. */}
                <Button
                  type="button"
                  size="m"
                  variant="secondary"
                  style="border"
                  className={s.cancelButton}
                  onClick={onClose}
                >
                  Cancel
                </Button>
                {/* Disabled only while submitting, never on `!isValid` — production's
                  own apply modal does the same. With `mode: "onBlur"`, `isValid`
                  stays false until every field has been blurred, so gating on it
                  leaves a dead button in front of someone who has filled the form
                  in and cannot tell what is wrong. Pressing Submit runs the
                  schema and puts the error under the field it belongs to. */}
                {/* "Create account", both ways in.

                  The role variant used to say "Create account & apply", which
                  was wrong in the same way the old body copy was: this button
                  creates a pending account and opens the profile drawer, and
                  nothing is applied to until the PL team approves. With the
                  line directly above it now saying "applying unlocks once
                  you're approved", a button promising to apply would contradict
                  its own caption an inch away. The role isn't lost — the title
                  still names it and the flow resumes on it — so the button
                  names the one thing the press actually does. */}
                <Button type="submit" size="m" style="fill" variant="primary" disabled={isSubmitting}>
                  Create account
                </Button>
              </div>

              {/* Copy note: the demo-day source words this "Already applied? Log
                  in". We diverge to "Sign in" per prototypes/AUTH-COPY-AUDIT.md —
                  reasoning in the file header. */}
              <p className={s.signInRow}>
                Already have an account?{' '}
                <button type="button" className={s.signInLink} onClick={onSignIn}>
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}
