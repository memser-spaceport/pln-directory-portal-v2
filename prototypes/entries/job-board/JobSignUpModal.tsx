'use client';

import { useEffect, useMemo } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { IJobRole } from '@/types/jobs.types';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { CloseIcon } from '@/components/icons';

// Demo Day's profile-drawer chrome, for the mobile page's `← Back` header. The
// same stylesheet `JobProfileDrawer` wears, so the two steps of this flow show
// one header rather than two.
import drawer from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';

import { BackIcon } from './JobProfileDrawer';
import { MOCK_JOB_GROUPS } from './mocks';
import s from './JobSignUpModal.module.scss';

export interface JobSignUpDetails {
  name: string;
  email: string;
  linkedin: string;
  role: string;
  company: string;
}

interface JobSignUpModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * The role they pressed Apply on, when that's how they got here — the modal
   * names it, because the form is the continuation of that click.
   *
   * Null when the modal was opened by a plain **Sign up** press, from the header
   * or the banner. Those clicks aren't about any one role, and inventing a role
   * to name would be answering a question nobody asked; the header goes generic
   * instead. See the note on the title below.
   */
  role: IJobRole | null;
  /** The hiring team, when `role` is set. Empty otherwise. */
  teamName: string;
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

/** What the form holds. `company` is a react-select Option, not a string —
 *  `FormSelect` writes the whole option object into form state — so it is
 *  flattened to its label on the way out to `JobSignUpDetails`. */
type SignUpFormData = {
  email: string;
  name: string;
  linkedin: string;
  role: string;
  company?: { label: string; value: string } | null;
};

const EMPTY_FORM: SignUpFormData = {
  email: '',
  name: '',
  linkedin: '',
  role: '',
  company: null,
};

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
const CANVAS_FILLED_FORM: SignUpFormData = {
  email: 'polina@lattice.computer',
  name: 'Polina Bublii',
  linkedin: 'polina-bublii',
  role: 'Senior Protocol Engineer',
  company: null,
};

// Transcribed from ApplyForDemoDayModal's `applySchema` — same email domain-dot
// test, same LinkedIn handle-or-URL pair of patterns. Dropped: `isInvestor`,
// `teamName`/`websiteAddress` (the add-a-team branch) and the conditional `role`
// rule that only fired while adding a team. Here `role` is plainly required,
// because there is no branch in which it isn't.
const signUpSchema = yup.object({
  email: yup
    .string()
    .email('Must be a valid email')
    .test('domain-has-dot', 'Email domain must contain a dot (e.g., example.com)', (value) => {
      if (!value) return true; // Let required() handle empty values
      const emailParts = value.split('@');
      if (emailParts.length !== 2) return false;
      return emailParts[1].includes('.');
    })
    .required('Email is required'),
  name: yup.string().required('Name is required'),
  linkedin: yup
    .string()
    .defined()
    .test('linkedin-url', 'Please enter a valid LinkedIn handle or URL', (value) => {
      if (!value || value.trim() === '') return true; // Allow empty values

      const trimmedValue = value.trim();

      // Match LinkedIn profile URLs with or without protocol
      const linkedinUrlPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i;

      // Match LinkedIn handle (alphanumeric, hyphens, underscores, typically 3-100 chars)
      const linkedinHandlePattern = /^[\w-]{3,100}$/;

      return linkedinUrlPattern.test(trimmedValue) || linkedinHandlePattern.test(trimmedValue);
    }),
  role: yup.string().required('Role is required'),
  company: yup.mixed<{ label: string; value: string }>().nullable(),
});

/**
 * Sign up by applying: the form that creates the account is the application form.
 *
 * **Why filling in details *is* the sign-up.** A logged-out person on the board
 * pressed Apply on one specific role. The literal reading of that click is "send
 * my details to this team"; the account is only the thing the product needs in
 * order to honour it. So the modal asks for the details and creates the account
 * out of them, rather than putting a sign-in wall in front and asking for the
 * same five facts a screen later. Anything else charges the person twice for one
 * intention — once to get in, once to apply — and the second charge is the one
 * they abandon. This is exactly the shape Demo Day's investor application takes:
 * a plain form that quietly enrols you, with authentication deferred.
 *
 * **Faithful in shape, not in mechanism.** Production defers real authentication
 * to a later Privy step — submitting registers the person, and the credential
 * handshake happens afterwards, outside this dialog. The prototype reproduces
 * that shape: form in, `onSignUp` out, no password field, no OTP, no success
 * screen. Nothing here authenticates anyone, and it would misrepresent
 * production to imply otherwise by bolting on a credential step that the real
 * modal doesn't carry either.
 *
 * **Why the modal names the role.** The header reads `Apply for {roleTitle}` and
 * the sub-line names the team. A dialog that answers a click on "Senior
 * Distributed Systems Engineer" with an unlabelled "Create your account" form has
 * changed the subject — the person is now filling in a registration for reasons
 * they must take on trust, and the honest word for that is bait-and-switch.
 * Naming the role costs one line and keeps the form the *continuation* of the
 * click rather than a toll on it. The sub-line then says what the account is for
 * before the first field, so the account is never a surprise discovered at the
 * submit button.
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
  role,
  teamName,
  onSignUp,
  onSignIn,
  canvasFilled,
  canvasRefused,
}: JobSignUpModalProps) {
  const methods = useForm<SignUpFormData>({
    defaultValues: EMPTY_FORM,
    resolver: yupResolver(signUpSchema) as Resolver<SignUpFormData>,
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
      reset(canvasFilled ? CANVAS_FILLED_FORM : EMPTY_FORM);
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

  // The board's own teams, so the company list matches the companies on screen.
  // Production feeds this select from a members-form-options query; a prototype
  // that invented a second, different company list would put two answers to
  // "who is on this network" on one page.
  const companyOptions = useMemo(
    () =>
      MOCK_JOB_GROUPS.map((group) => ({ value: group.team.uid, label: group.team.name })).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    [],
  );

  const onSubmit = (data: SignUpFormData) => {
    // Submit only reports the details. The parent owns everything after —
    // creating the account, closing this, moving the board into
    // pending-approval — so there is deliberately no onClose() here and no
    // success screen. A modal that congratulated you and a board that then
    // changed state behind it would be two announcements of one event.
    onSignUp({
      name: data.name.trim(),
      email: data.email.trim(),
      linkedin: (data.linkedin ?? '').trim(),
      role: data.role.trim(),
      company: data.company?.label ?? '',
    });
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
        {/* Two headers, because there are two ways in and they are different
            promises.

            From Apply, the modal is the continuation of a click on one role, so
            it names it — see the note above on why an unlabelled "Create your
            account" there would be a bait-and-switch.

            From a plain Sign up press there is no role, and the honest header is
            what the account itself buys: the same claim the banner makes two
            rows above, so the modal reads as the door that banner was offering
            rather than as a different pitch. Naming a role here would be worse
            than generic — it would be inventing an intention the person hasn't
            expressed yet. */}
        <div className={s.text}>
          <h2 className={s.title}>{role ? `Apply for ${role.roleTitle}` : 'Sign up to apply'}</h2>
          <div className={s.subtitle}>
            {role
              ? `${teamName} · Creating your LabOS account is the first step.`
              : 'One profile applies to every open role across the Protocol Labs network.'}
          </div>
        </div>

        <FormProvider {...methods}>
          <form className={s.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            {/* Email leads, not name: it is the field the account is created on,
                and the one thing being asked for that the person may hesitate
                over. Burying it third would read as hiding it. */}
            <FormField name="email" label="Email address" placeholder="Enter your email" isRequired />

            <FormField name="name" label="Full name" placeholder="Enter your full name" isRequired />

            {/* The field always asked for this and the answer used to be thrown
                away — `onSignUpSubmit` seeded only `role`. It now lands on the
                profile, and the description says what it is *for*, because an
                optional field with no stated payoff is one people skip.

                The description used to end "...bring your LinkedIn profile as a
                PDF in the next step", pointing at the importer's LinkedIn door.
                That door is gone, so the sentence went with it rather than
                surviving as an instruction for a control nobody will find. What
                is left is the whole truth about this field: it is a link on your
                profile, not a way to fill anything in. */}
            <FormField
              name="linkedin"
              label="LinkedIn profile"
              placeholder="eg., johndoe or https://linkedin.com/in/johndoe"
              description="Shown on your profile, alongside your other links."
            />

            <div className={s.column}>
              <div className={s.inputsLabel}>Current role &amp; company</div>
              <div className={s.inputsWrapper}>
                <FormField name="role" placeholder="Enter your current role" />
                <span className={s.separator}>@</span>
                {/* "Select a company", not the source's "Search or add a team".
                    Two reasons. It fits on one line at this width — the longer
                    string wrapped and left the select taller than the role field
                    beside it, so a paired row stopped looking paired. And "add"
                    would be a promise this select doesn't keep: production backs
                    that word with an inline add-a-team form behind the select's
                    empty state, which this prototype doesn't carry. */}
                <FormSelect name="company" placeholder="Select a company" isClearable options={companyOptions} />
              </div>
            </div>

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

                  What survives is the fact the person cannot infer and would
                  resent discovering later — that approval, not this button, is
                  what unlocks applying. An earlier draft added "you can keep
                  browsing in the meantime"; true, but the board is visible
                  behind this card and the pending banner repeats it a second
                  later, so it was reassurance charged against the one line that
                  had to be read.

                  No role/no-role branch any more: what the PL team does next
                  doesn't depend on which button opened this. */}
              <p className={s.body}>
                The PL team reviews new accounts first — applying unlocks once you&apos;re approved.
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
