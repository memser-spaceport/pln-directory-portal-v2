'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { IJobRole } from '@/types/jobs.types';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { CloseIcon } from '@/components/icons';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
// `FormField`'s own label pair, for the two labels this form places by hand
// because they carry a mark and the `label` prop only takes a string.
import ff from '@/components/form/FormField/FormField.module.scss';
// Demo Day's profile-drawer chrome, for the mobile page's `← Back` header — the
// same stylesheet `JobProfileDrawer` wears one step later in this flow, so a
// phone user meets one header rather than two designs of one.
import drawer from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';

import s from './JobSignUpModal.module.scss';

// `EditInvestorProfileDrawer`'s own glyph, copied rather than imported from
// `JobProfileDrawer` (which exports the same copy for the same reason). That
// module is `dynamic({ ssr: false })` in the controller precisely so a
// logged-out visitor never downloads it, and a static import from here would
// pull it into the sign-up chunk and undo the split.
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.5 9.99998C17.5 10.1657 17.4342 10.3247 17.3169 10.4419C17.1997 10.5591 17.0408 10.625 16.875 10.625H4.6336L9.19219 15.1828C9.25026 15.2409 9.29632 15.3098 9.32775 15.3857C9.35918 15.4615 9.37535 15.5429 9.37535 15.625C9.37535 15.7071 9.35918 15.7884 9.32775 15.8643C9.29632 15.9402 9.25026 16.0091 9.19219 16.0672C9.13412 16.1252 9.06518 16.1713 8.98931 16.2027C8.91344 16.2342 8.83213 16.2503 8.75 16.2503C8.66788 16.2503 8.58656 16.2342 8.51069 16.2027C8.43482 16.1713 8.36588 16.1252 8.30782 16.0672L2.68282 10.4422C2.62471 10.3841 2.57861 10.3152 2.54715 10.2393C2.5157 10.1634 2.49951 10.0821 2.49951 9.99998C2.49951 9.91785 2.5157 9.83652 2.54715 9.76064C2.57861 9.68477 2.62471 9.61584 2.68282 9.55779L8.30782 3.93279C8.42509 3.81552 8.58415 3.74963 8.75 3.74963C8.91586 3.74963 9.07492 3.81552 9.19219 3.93279C9.30947 4.05007 9.37535 4.20913 9.37535 4.37498C9.37535 4.54083 9.30947 4.69989 9.19219 4.81717L4.6336 9.37498H16.875C17.0408 9.37498 17.1997 9.44083 17.3169 9.55804C17.4342 9.67525 17.5 9.83422 17.5 9.99998Z"
      fill="currentColor"
    />
  </svg>
);

export interface JobSignUpDetails {
  name: string;
  email: string;
  /**
   * The address at the team they named — optional, and deliberately NOT a
   * second identity.
   *
   * A member has exactly one email in this product and it is who they are:
   * Privy signs them in on it, and Settings presents it as a verified address
   * you *change*, never one of several you add. This one is evidence for the
   * company they claim, for the PL team reviewing the account. Nothing
   * verifies it.
   */
  teamEmail: string;
  linkedin: string;
  role: string;
  /** The network team they picked as their current company, if any. */
  teamUid: string | null;
}

export type JobSignUpResult = { success: true } | { success: false; emailTaken?: boolean };

interface JobSignUpModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * The role they pressed Apply on, when that's how they got here — the modal
   * names it, because the form is the continuation of that click. Null when
   * opened by a plain Sign up press (header/banner); the header goes generic.
   */
  role: IJobRole | null;
  /** The hiring team, when `role` is set. Empty otherwise. */
  teamName: string;
  /**
   * Filling this in IS the sign-up (the Demo Day shape: a plain form that
   * enrols you, authentication deferred to Privy afterwards). The parent files
   * the participants-request; a failed result is reported back for inline
   * display, a success closes the modal and hands off to Privy.
   */
  onSignUp: (details: JobSignUpDetails) => Promise<JobSignUpResult>;
  /** The escape for people who already have an account. */
  onSignIn: () => void;
}

/** `company` is a react-select Option — `FormSelect` writes the whole option
 *  object into form state — flattened to its value (team uid) on the way out. */
type SignUpFormData = {
  email: string;
  teamEmail: string;
  name: string;
  linkedin: string;
  role: string;
  company?: { label: string; value: string } | null;
};

const EMPTY_FORM: SignUpFormData = {
  email: '',
  teamEmail: '',
  name: '',
  linkedin: '',
  role: '',
  company: null,
};

// Transcribed from ApplyForDemoDayModal's `applySchema` — same email domain-dot
// test, same LinkedIn handle-or-URL pair of patterns. `role` is plainly
// required here, because there is no branch in which it isn't.
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
  /* The same shape tests as `email`, minus `required()` — an optional field must
     validate what it is given and stay silent when it is given nothing. Written
     out rather than factored into a shared rule with `email`: yup schemas are
     objects, not compositions, and the one thing that differs between these two
     is the thing a reader most needs to see side by side. */
  teamEmail: yup
    .string()
    .defined()
    .test('team-email-shape', 'Must be a valid email', (value) => {
      if (!value || value.trim() === '') return true;
      return yup.string().email().isValidSync(value.trim());
    })
    .test('team-email-domain-has-dot', 'Email domain must contain a dot (e.g., example.com)', (value) => {
      if (!value || value.trim() === '') return true;
      const parts = value.trim().split('@');
      if (parts.length !== 2) return false;
      return parts[1].includes('.');
    }),
  name: yup.string().required('Name is required'),
  linkedin: yup
    .string()
    .defined()
    .test('linkedin-url', 'Please enter a valid LinkedIn handle or URL', (value) => {
      if (!value || value.trim() === '') return true; // Allow empty values

      const trimmedValue = value.trim();
      const linkedinUrlPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i;
      const linkedinHandlePattern = /^[\w-]{3,100}$/;

      return linkedinUrlPattern.test(trimmedValue) || linkedinHandlePattern.test(trimmedValue);
    }),
  role: yup.string().required('Role is required'),
  company: yup.mixed<{ label: string; value: string }>().nullable(),
});

/**
 * `(Optional)`, hugging the label it qualifies.
 *
 * Production's own idiom, not a new one: `SignupWizard` marks its free-text
 * field this way — a span set immediately after the label text at weight 400 in
 * the muted tone, against the label's own 500 — and that is the only other
 * place in the product that marks a field optional at all. Local to this file
 * because two adjacent usages in one form don't earn a shared module; promote
 * it if a third site appears.
 */
const OptionalMark = () => <span className={s.optionalMark}>(Optional)</span>;

/**
 * Addresses a person has because they are a person, rather than because of
 * where they work. Deliberately a *closed list of the obvious ones* and not a
 * rule: it is used only to change a sentence, never to refuse a value, so a
 * domain it has never heard of costs nothing. The inverse test — "does this
 * domain look corporate?" — is unanswerable, which is why nothing here tries it.
 */
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'ymail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'gmx.com',
  'gmx.de',
  'web.de',
  'mail.com',
  'mail.ru',
  'yandex.ru',
  'zoho.com',
  'fastmail.com',
  'hey.com',
  'duck.com',
  'qq.com',
  '163.com',
]);

const isPersonalEmailDomain = (email: string): boolean => {
  const domain = email.trim().toLowerCase().split('@')[1];
  return !!domain && PERSONAL_EMAIL_DOMAINS.has(domain);
};

/**
 * What the email field says when the address given is a personal one.
 *
 * **Why anything is said at all.** The copy below the form already tells the
 * person the PL team reviews new accounts. A work address is what makes that
 * review answerable without a conversation — evidence for the claim the same
 * form makes two fields down, where they name their current company. That is
 * the one thing here the interface cannot show for itself.
 *
 * **Why it is a preference and not a rule.** Contractors, people between roles,
 * researchers and anyone at a company that hasn't got as far as email all belong
 * on this network, and a domain check would turn a preference into a wall in
 * front of exactly them. The schema is unchanged and every address still
 * submits.
 *
 * **Why there is no standing version of this line.** A line that is always there
 * spends its height explaining a preference to the people already complying with
 * it, and at a short window pushes "Already have an account? Sign in" under the
 * fold — the exact regression the copy block below was cut down to fix. It is
 * also read only by the people who read lines, and someone typing their personal
 * address on autopilot is by definition not one of them. The ask is made where
 * everyone meets it — the placeholder — and the sentence kept for the one moment
 * it is news.
 */
const PERSONAL_EMAIL_NOTE = 'Add your team email below and the PL team can see you’re at the company you name.';

/**
 * Sign up by applying: the form that creates the account is the application
 * form. Promoted from the job-board prototype; see its header for the full
 * design rationale (why filling in details IS the sign-up, why the modal names
 * the role, why the sign-in escape is a link below the footer).
 *
 * One deliberate copy change from the prototype: nothing here claims details
 * are sent to the hiring team or that an application happens — the request
 * goes to PL admins for review and no application exists yet. The button
 * always reads "Create account", and the body names the wait. Claiming
 * otherwise would violate the flow's own pending-never-claims-applied rule at
 * the exact moment trust is being asked for.
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
    control,
    formState: { isSubmitting },
  } = methods;

  /* Watched here rather than inside `FormField`, which watches its own value
     only to drive a character counter — the *description* is the host's to
     compose, and this is the host. `useWatch` re-renders on the keystroke that
     completes a domain, which is when the note has something to say. */
  const email = useWatch({ control, name: 'email' }) ?? '';

  const [serverError, setServerError] = useState<string | null>(null);

  // Reset on every open: the modal is mounted for the life of the board and can
  // be opened against a different role each time. The server error clears on
  // close (below) rather than here — setState in an effect body cascades.
  useEffect(() => {
    if (open) {
      reset(EMPTY_FORM);
    }
  }, [open, reset]);

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  // The same teams source production's sign-up wizard uses, minus projects —
  // the field asks for a current company, not a contribution.
  const { data: formOptions } = useMemberFormOptions();
  const companyOptions = useMemo(
    () =>
      (formOptions?.teams ?? [])
        .map((item: { teamUid: string; teamTitle: string }) => ({ value: item.teamUid, label: item.teamTitle }))
        .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label)),
    [formOptions],
  );

  const onSubmit = async (data: SignUpFormData) => {
    setServerError(null);
    const result = await onSignUp({
      name: data.name.trim(),
      email: data.email.trim(),
      teamEmail: (data.teamEmail ?? '').trim(),
      linkedin: (data.linkedin ?? '').trim(),
      role: data.role.trim(),
      teamUid: data.company?.value ?? null,
    });
    if (!result.success) {
      /* Named rather than vague. The earlier version deliberately blurred
         "email exists" into a generic message to avoid an account-enumeration
         oracle — but the endpoint answers 409 either way, so anyone probing
         reads it off the status code and the vagueness only confuses the
         person who genuinely forgot they had an account. (The oracle is worth
         raising about the endpoint itself, not papering over here.) */
      setServerError(
        result.emailTaken
          ? 'This email already has an account. Sign in instead — your application picks up from there.'
          : 'We couldn’t create your account just now. Please try again.',
      );
    }
  };

  return (
    /* `lockScroll` never showed while this was a card — the overlay covered the
       board and nobody scrolled past it — but a full-height page on a phone is a
       scroll container inside another scroll container, and flicking past the
       end of the form would drift the board underneath. */
    <Modal
      isOpen={open}
      onClose={handleClose}
      overlayClassname={s.overlay}
      closeOnBackdropClick={false}
      closeOnEscape
      lockScroll
      className={s.modal}
    >
      <button type="button" className={s.closeButton} onClick={handleClose} aria-label="Close">
        <CloseIcon />
      </button>

      {/* The page's header, below 960 only. Above it this is display:none and
          the floating ✕ above takes over. */}
      <div className={`${drawer.drawerHeader} ${s.mobileHeader}`}>
        <div className={drawer.breadcrumbs}>
          <button type="button" className={drawer.backButton} onClick={handleClose}>
            <BackIcon />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className={`${s.content} ${s.pageBody}`}>
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
            {/* Email leads: it is the field the account is created on, and the
                one thing being asked for that the person may hesitate over.

                **The label stays "Email address".** "Work email" would be a rule
                the form does not keep — every address is accepted — and a label
                that needs a sentence underneath explaining when it doesn't apply
                is the label being wrong. The preference lives in the two places
                a preference can: the shape shown in the box, and the reason
                given under it.

                **The placeholder is an exemplar, not an instruction.** It read
                "Enter your email", which is this group's usual voice but also
                the one placeholder here doing no work, since nobody needs
                telling what an email field wants. `you@company.com` is seen by
                everyone, including the people who never read a description. The
                precedent is one field down: LinkedIn's placeholder is a worked
                example for exactly the same reason.

                **The note is `undefined` rather than a standing line** — see
                `PERSONAL_EMAIL_NOTE`. `description` also yields to the error
                slot in `FormField`, which is the right precedence: a malformed
                address is a problem, a personal one is a preference, and only
                one of them should be talking at a time. */}
            <FormField
              name="email"
              label="Email address"
              placeholder="you@company.com"
              isRequired
              description={isPersonalEmailDomain(email) ? PERSONAL_EMAIL_NOTE : undefined}
            />

            <FormField name="name" label="Full name" placeholder="Enter your full name" isRequired />

            {/* Marked, and it has to be. Adding `(Optional)` to Team email gave
                this form a *system* — required carries `*`, optional carries the
                mark — and a system with one member is just an exception.
                LinkedIn is the only other field here that can be left blank, so
                leaving it unmarked would make it the one input whose state you
                work out by noticing an absent asterisk.

                The label is hand-rolled because `FormField` types `label` as a
                `string`, so a styled `(Optional)` can't go through it — and
                `SignupWizard`, the one other place in the product that marks a
                field optional, does exactly this. One improvement on that
                source: it uses a `<div>`, so its label is decoration and clicking
                it focuses nothing. `FormField` renders its input with
                `id={name}`, so a real `<label htmlFor>` associates properly.

                The description says what the field is *for*: an optional field
                with no stated payoff is one people skip. */}
            <div className={s.column}>
              <div className={ff.labelWrapper}>
                <label className={ff.label} htmlFor="linkedin">
                  LinkedIn profile
                  <OptionalMark />
                </label>
              </div>
              <FormField
                name="linkedin"
                placeholder="eg., johndoe or https://linkedin.com/in/johndoe"
                description="Shown on your profile, alongside your other links."
              />
            </div>

            <div className={s.column}>
              <div className={s.inputsLabel}>Current role &amp; company</div>
              <div className={s.inputsWrapper}>
                <FormField name="role" placeholder="Enter your current role" />
                <span className={s.separator}>@</span>
                <FormSelect name="company" placeholder="Select a company" isClearable options={companyOptions} />
              </div>
            </div>

            {/* Last, and directly under the company — not beside `Email
                address`. It is not a second inbox and certainly not a second
                login: it is *evidence for the answer above it*, which is why it
                sits with that answer rather than with the address the account is
                created on. Putting the two email fields side by side would make
                them look like a choice, and the person would have to work out
                which one signs them in.

                The description doesn't open with "Optional." — the mark on the
                label says that, and a field announcing its own optionality twice
                in two lines spends the description's first word on something
                already visible. What is left is the payoff, which is the part
                that earns the field. `PERSONAL_EMAIL_NOTE` points down here when
                it fires.

                Nothing is verified. No code is sent and no domain is checked
                against the selected team — whether an unverified claim is worth
                anything is a question about the review process, not about the
                field. */}
            <div className={s.column}>
              <div className={ff.labelWrapper}>
                <label className={ff.label} htmlFor="teamEmail">
                  Team email
                  <OptionalMark />
                </label>
              </div>
              <FormField
                name="teamEmail"
                placeholder="you@yourteam.xyz"
                description="Your address at the company above, so the PL team can see where you work."
              />
            </div>

            <div className={s.bottomText}>
              {/* One line, and only the part nothing else on the card says.
                  Nothing is sent to any team by this press, and no application
                  exists yet — approval is what unlocks applying, and the
                  sentence says so.

                  This ran to two sentences and four rendered lines, which pushed
                  "Already have an account? Sign in" off the bottom of any window
                  shorter than ~730px — hiding the escape from precisely the
                  people who need it, since someone who already has an account
                  has no use for the form above it. What it lost was duplication:
                  "Submitting this creates your LabOS account" was the third
                  telling, after the subtitle and the submit button.

                  **Deliberately not the prototype's line.** The prototype says
                  "you can browse and apply while that runs", which is true only
                  after the flow change that lets a new account apply the moment
                  it exists. Here approval still gates applying — that is what
                  the 403 in `job-applications.service.ts` is for — so copy
                  promising otherwise would describe a wall the board has not
                  removed. */}
              <p className={s.body}>
                The PL team reviews new accounts first — you can browse every role while you wait, and applying opens up
                once you&apos;re approved.
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
              {serverError && <p className={s.serverError}>{serverError}</p>}
            </div>

            {/* The dock: the actions and the sign-in escape, sticky together on
                the mobile page. On the card it is `display: contents`, so both
                go back to being direct children of the form and lay out exactly
                as they did before this wrapper existed. See `.actionsDock`. */}
            <div className={s.actionsDock}>
              <div className={s.footer}>
                {/* Card only — on the page the `← Back` header is the way out.
                    See `.cancelButton`. */}
                <Button
                  type="button"
                  size="m"
                  variant="secondary"
                  style="border"
                  className={s.cancelButton}
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                {/* Disabled only while submitting, never on `!isValid` — with
                    `mode: "onBlur"` a validity gate leaves a dead button in front
                    of a completed form. Always "Create account": no application is
                    filed by this press, and a button claiming "& apply" would
                    promise one. */}
                <Button type="submit" size="m" style="fill" variant="primary" disabled={isSubmitting}>
                  Create account
                </Button>
              </div>

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
