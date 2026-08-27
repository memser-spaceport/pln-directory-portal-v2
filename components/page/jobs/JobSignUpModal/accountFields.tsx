'use client';

import { useMemo } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import * as yup from 'yup';

import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { isJobSearchStatus, JOB_SEARCH_STATUS_OPTIONS, type JobSearchStatus } from '@/services/jobs/job-board-viewer';
import { JobSearchStatusInput } from '@/components/page/jobs/JobSearchStatusInput/JobSearchStatusInput';

// `FormField`'s own label/error pair, for the labels and the one error this
// group places by hand — `FormField` types `label` as a `string`, so neither a
// styled `(Optional)` nor a radio group can go through it.
import ff from '@/components/form/FormField/FormField.module.scss';

import s from './JobSignUpModal.module.scss';

/**
 * The account form's fields and schema, in one place, because it is about to
 * have two hosts.
 *
 * **Why now and not sooner.** The last pass on this dialog declined this
 * extraction and said exactly when to do it: "Production has one host, because
 * the second host *is* B. Extract when B arrives and supplies the second host —
 * at which point it is a pure move." B is the apply flow's step 2 for a visitor
 * with no account, and it is next. Two copies of a LinkedIn rule is two chances
 * for the board to disagree with itself about what a valid handle is.
 *
 * **The stylesheet stays `JobSignUpModal.module.scss`.** `.column`,
 * `.inputsLabel`, `.inputsWrapper`, `.separator` and `.optionalMark` were
 * written for exactly these rows and are already tuned to them; a second sheet
 * restating them here is the drift this file exists to prevent. Whatever mounts
 * this supplies its own surrounding chrome and nothing else.
 *
 * **No `layout` prop yet.** The prototype's version takes one, to pair the two
 * short fields onto a line in the taller pane. There is one host today and it is
 * a 440px dialog with no height to save, so the prop and its `.fieldPair` class
 * would serve nobody. It arrives with the pane that wants it — same rule that
 * governed this extraction.
 */

/** What the form holds. `company` is a react-select Option, not a string —
 *  `FormSelect` writes the whole option object into form state — so it is
 *  flattened to the team **uid** by `toAccountDetails` on the way out. */
export type AccountFormData = {
  email: string;
  teamEmail: string;
  name: string;
  linkedin: string;
  role: string;
  company?: { label: string; value: string } | null;
  /**
   * Where they are with job hunting.
   *
   * **Why the account form asks a profile question.** The board's
   * `isProfileComplete` is `role && jobSearchStatus`, and this form already
   * collects `role`. Without this field every account it opens comes back from
   * sign-in owing exactly one radio button, and pays a whole apply-flow step for
   * it. Asking here is what lets a new account arrive ready to apply.
   *
   * `''` rather than `null` for the empty state, so it is a string field like
   * every other member of this type and `required()` can speak for it.
   */
  jobSearchStatus: JobSearchStatus | '';
};

/** The flattened answers, as every consumer wants them: trimmed strings, and
 *  the company as the uid the sign-up endpoint takes. */
export interface AccountDetails {
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
  jobSearchStatus: JobSearchStatus;
  /** The network team they picked as their current company, if any. */
  teamUid: string | null;
}

export const EMPTY_ACCOUNT_FORM: AccountFormData = {
  email: '',
  teamEmail: '',
  name: '',
  linkedin: '',
  role: '',
  company: null,
  jobSearchStatus: '',
};

// Transcribed from ApplyForDemoDayModal's `applySchema` — same email domain-dot
// test, same LinkedIn handle-or-URL pair of patterns. `role` is plainly
// required here, because there is no branch in which it isn't.
export const accountSchema = yup.object({
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
  /* Required, and that is the whole point of asking it — an optional version
     buys a shorter form and pays for it with an apply-flow step. `oneOf` rather
     than a bare `required()` so a stale value from anywhere can't pass: the
     three strings have to match the backend's wire enum exactly. */
  jobSearchStatus: yup
    .string()
    .oneOf(
      JOB_SEARCH_STATUS_OPTIONS.map((option) => option.value),
      'Select where you are with job hunting',
    )
    .required('Select where you are with job hunting'),
});

/**
 * `(Optional)`, hugging the label it qualifies.
 *
 * Production's own idiom, not a new one: `SignupWizard` marks its free-text
 * field this way — a span set immediately after the label text at weight 400 in
 * the muted tone, against the label's own 500 — and that is the only other
 * place in the product that marks a field optional at all.
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
 * fold — the exact regression the copy block was cut down to fix. It is also
 * read only by the people who read lines, and someone typing their personal
 * address on autopilot is by definition not one of them. The ask is made where
 * everyone meets it — the placeholder — and the sentence kept for the one moment
 * it is news.
 */
const PERSONAL_EMAIL_NOTE = 'Add your team email below and the PL team can see you’re at the company you name.';

/** Form state → the shape the sign-up endpoint's caller wants. */
export const toAccountDetails = (data: AccountFormData): AccountDetails => ({
  name: data.name.trim(),
  email: data.email.trim(),
  teamEmail: (data.teamEmail ?? '').trim(),
  linkedin: (data.linkedin ?? '').trim(),
  role: data.role.trim(),
  /* Narrowed rather than asserted. The schema makes this one of three before a
     submit can happen, so the fallback is unreachable in practice — but a cast
     here would be the one place a bad value could reach the wire silently, and
     this file is the boundary that exists to stop that. */
  jobSearchStatus: isJobSearchStatus(data.jobSearchStatus) ? data.jobSearchStatus : 'not-looking',
  teamUid: data.company?.value ?? null,
});

export function AccountFields() {
  const { control } = useFormContext<AccountFormData>();

  /* Watched here rather than inside `FormField`, which watches its own value
     only to drive a character counter — the *description* is the host's to
     compose, and this is the host. `useWatch` re-renders on the keystroke that
     completes a domain, which is when the note has something to say. */
  const email = useWatch({ control, name: 'email' }) ?? '';

  /* The radio group is not an `<input>` `register` can reach, so it takes the
     controlled route. `useController` also gives it the error slot every other
     field here gets for free. */
  const {
    field: status,
    fieldState: { error: statusError },
  } = useController({ control, name: 'jobSearchStatus' });

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

  return (
    <>
      {/* Email leads: it is the field the account is created on, and the one
          thing being asked for that the person may hesitate over.

          **The label stays "Email address".** "Work email" would be a rule the
          form does not keep — every address is accepted — and a label that needs
          a sentence underneath explaining when it doesn't apply is the label
          being wrong. The preference lives in the two places a preference can:
          the shape shown in the box, and the reason given under it.

          **The placeholder is an exemplar, not an instruction.** It read "Enter
          your email", which is this group's usual voice but also the one
          placeholder here doing no work, since nobody needs telling what an
          email field wants. `you@company.com` is seen by everyone, including the
          people who never read a description. The precedent is one field down:
          LinkedIn's placeholder is a worked example for exactly the same reason.

          **The note is `undefined` rather than a standing line** — see
          `PERSONAL_EMAIL_NOTE`. `description` also yields to the error slot in
          `FormField`, which is the right precedence: a malformed address is a
          problem, a personal one is a preference, and only one of them should be
          talking at a time. */}
      <FormField
        name="email"
        label="Email address"
        placeholder="you@company.com"
        isRequired
        description={isPersonalEmailDomain(email) ? PERSONAL_EMAIL_NOTE : undefined}
      />

      <FormField name="name" label="Full name" placeholder="Enter your full name" isRequired />

      {/* Marked, and it has to be. Adding `(Optional)` to Team email gave this
          form a *system* — required carries `*`, optional carries the mark — and
          a system with one member is just an exception. LinkedIn is the only
          other field here that can be left blank, so leaving it unmarked would
          make it the one input whose state you work out by noticing an absent
          asterisk.

          The label is hand-rolled because `FormField` types `label` as a
          `string`, so a styled `(Optional)` can't go through it — and
          `SignupWizard`, the one other place in the product that marks a field
          optional, does exactly this. One improvement on that source: it uses a
          `<div>`, so its label is decoration and clicking it focuses nothing.
          `FormField` renders its input with `id={name}`, so a real
          `<label htmlFor>` associates properly.

          The description says what the field is *for*: an optional field with no
          stated payoff is one people skip. */}
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

      {/* Last, and directly under the company — not beside `Email address`. It
          is not a second inbox and certainly not a second login: it is *evidence
          for the answer above it*, which is why it sits with that answer rather
          than with the address the account is created on. Putting the two email
          fields side by side would make them look like a choice, and the person
          would have to work out which one signs them in.

          The description doesn't open with "Optional." — the mark on the label
          says that, and a field announcing its own optionality twice in two
          lines spends the description's first word on something already visible.
          What is left is the payoff, which is the part that earns the field.
          `PERSONAL_EMAIL_NOTE` points down here when it fires.

          Nothing is verified. No code is sent and no domain is checked against
          the selected team — whether an unverified claim is worth anything is a
          question about the review process, not about the field. */}
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

      {/* The one question here that is not about the account. It earns its place
          by what it saves: with it answered, the profile this sign-up creates is
          already complete, and the apply flow that follows has one fewer stop.

          Wearing the required asterisk `FormField` gives its own labels, because
          it is required in exactly the same way `Email address` is — a system
          that marks two fields required and leaves a third unmarked while
          refusing to submit without it is worse than no system. */}
      <div className={s.column}>
        <div className={ff.labelWrapper}>
          <span className={`${ff.label} ${ff.required}`}>Job search status</span>
        </div>
        <JobSearchStatusInput
          name="signup-job-search-status"
          value={isJobSearchStatus(status.value) ? status.value : null}
          onChange={status.onChange}
        />
        {statusError && <p className={ff.errorMsg}>{statusError.message}</p>}
      </div>
    </>
  );
}
