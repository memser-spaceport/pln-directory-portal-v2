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
export function JobSignUpModal({ open, onClose, role, teamName, onSignUp, onSignIn }: JobSignUpModalProps) {
  const methods = useForm<SignUpFormData>({
    defaultValues: EMPTY_FORM,
    resolver: yupResolver(signUpSchema) as Resolver<SignUpFormData>,
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Reset on every open. This modal is mounted for the life of the board and can
  // be opened against a different role each time; carrying one attempt's
  // half-typed values into the next would look like the board had remembered
  // something about a person it holds no account for.
  useEffect(() => {
    if (open) {
      reset(EMPTY_FORM);
    }
  }, [open, reset]);

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
    <Modal
      isOpen={open}
      onClose={onClose}
      overlayClassname={s.overlay}
      closeOnBackdropClick={false}
      closeOnEscape
      className={s.modal}
    >
      <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>

      <div className={s.content}>
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

            <FormField
              name="linkedin"
              label="LinkedIn profile"
              placeholder="eg., johndoe or https://linkedin.com/in/johndoe"
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
              {/* Says what actually happens next, including the part nobody wants
                  to read. An earlier draft ended "you can keep browsing and
                  applying in the meantime" — browsing is true, applying is not:
                  approval is precisely what unlocks it. Promising it here and
                  then blocking it on the next screen would make the account feel
                  like a bait-and-switch at the exact moment trust is being
                  asked for. */}
              {/* The first clause follows the entry point for the same reason
                  the title does: "sends your details to Filecoin Foundation" is
                  the truth when a role is pending and a fabrication when the
                  person just pressed Sign up — nothing is being sent to anyone
                  yet. The rest is identical, because what the PL team does next
                  doesn't depend on which button was pressed. */}
              <p className={s.body}>
                {role
                  ? `Submitting this creates your LabOS account and sends your details to ${teamName}.`
                  : 'Submitting this creates your LabOS account.'}{' '}
                The PL team reviews new accounts first — you can keep browsing every role while you wait, and applying
                opens up once you&apos;re approved.
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

            <div className={s.footer}>
              <Button type="button" size="m" variant="secondary" style="border" onClick={onClose}>
                Cancel
              </Button>
              {/* Disabled only while submitting, never on `!isValid` — production's
                  own apply modal does the same. With `mode: "onBlur"`, `isValid`
                  stays false until every field has been blurred, so gating on it
                  leaves a dead button in front of someone who has filled the form
                  in and cannot tell what is wrong. Pressing Submit runs the
                  schema and puts the error under the field it belongs to. */}
              {/* "& apply" only when an application is actually waiting behind
                  this press. Opened from Sign up there is no role to apply to,
                  and a button promising to apply would leave the person looking
                  for the application it just filed. */}
              <Button type="submit" size="m" style="fill" variant="primary" disabled={isSubmitting}>
                {role ? 'Create account & apply' : 'Create account'}
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
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}
