'use client';

import { useMemo } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import * as yup from 'yup';

import { Checkbox } from '@/components/common/Checkbox';
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
 * **`layout` changes the arrangement and nothing else.** The pane pairs the two
 * short fields onto a line (`grid`); the modal stacks them, having no height to
 * save in a 440px dialog. A layout prop rather than a second copy of the group.
 *
 * **The job search status is exported separately**, as `JobSearchStatusField`,
 * because the two hosts frame it differently: the modal sets it below the
 * account questions as one more labelled field, while the pane gives it its own
 * card with the amber required treatment the profile step uses. It is still a
 * field of `accountSchema` and still lives in the same form — only where it is
 * drawn is the host's business.
 */

/** What the form holds. `company` is a react-select Option, not a string —
 *  `FormSelect` writes the whole option object into form state — so it is
 *  flattened to the team **uid** by `toAccountDetails` on the way out. */
export type AccountFormData = {
  email: string;
  name: string;
  linkedin: string;
  role: string;
  /**
   * "I'm already a member of a PL Network team" — the switch that reveals the
   * team select beside the role input.
   *
   * Form state rather than component state because it is an *answer*: it decides
   * whether `company` is a question this person was asked at all, and a value
   * that governs another value has to live where that value lives, or the two
   * disagree the moment the group unmounts and remounts — which it does, since
   * the modal and the drawer's step 2 are two hosts of one form.
   *
   * It is not sent anywhere. `toAccountDetails` flattens `company` to a team uid
   * and this stays behind, which is correct twice over: the endpoint has no such
   * field, and the sign-up payload is validated strictly enough that an extra key
   * is a refusal rather than an ignored extra.
   */
  onPlTeam: boolean;
  company?: { label: string; value: string } | null;
  /**
   * Where they are with job hunting.
   *
   * Asked here so a new account arrives with one of the two answers
   * `isProfileComplete` needs. Role is optional on this form, so they still
   * land on the profile step after sign-in to finish it.
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
  linkedin: string;
  role: string;
  jobSearchStatus: JobSearchStatus;
  /** The network team they picked as their current company, if any. */
  teamUid: string | null;
}

export const EMPTY_ACCOUNT_FORM: AccountFormData = {
  email: '',
  name: '',
  linkedin: '',
  role: '',
  /* Unticked, and that is the honest default: most people arriving at a public
     job board are not already on a PL network team, so the form opens in the
     shape that fits them and the select is something you ask for rather than
     something you dismiss. */
  onPlTeam: false,
  company: null,
  jobSearchStatus: '',
};

// Transcribed from ApplyForDemoDayModal's `applySchema` — same email domain-dot
// test, same LinkedIn handle-or-URL pair of patterns.
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
  name: yup.string().required('Name is required'),
  linkedin: yup
    .string()
    .required('LinkedIn is required')
    .test('linkedin-url', 'Please enter a valid LinkedIn handle or URL', (value) => {
      if (!value || value.trim() === '') return false;

      const trimmedValue = value.trim();
      const linkedinUrlPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i;
      const linkedinHandlePattern = /^[\w-]{3,100}$/;

      return linkedinUrlPattern.test(trimmedValue) || linkedinHandlePattern.test(trimmedValue);
    }),
  role: yup.string().defined(),
  /* No rule of its own: it is a switch, not an answer to validate, and both of
     its states are valid. It is in the schema so `AccountFormData` and the
     resolver agree on the shape of the form — a key react-hook-form holds and
     yup has never heard of is exactly the drift this file exists to prevent. */
  onPlTeam: yup.boolean().default(false),
  /* Nullable, and with no `when('onPlTeam')` rule. The select is optional
     whether or not it is on screen: someone can be at a network team this closed
     list doesn't carry, tick the box honestly, and find nothing to pick.
     Requiring it would turn an honest tick into a dead end. */
  company: yup.mixed<{ label: string; value: string }>().nullable(),
  /* Required, and that is the whole point of asking it — an optional version
     buys a shorter form and pays for it with an apply-flow step. `oneOf` rather
     than a bare `required()` so a stale value from anywhere can't pass: the
     three strings have to match the backend's wire enum exactly. */
  jobSearchStatus: yup
    .string()
    .oneOf(
      JOB_SEARCH_STATUS_OPTIONS.filter((option) => option.value !== 'not-looking').map((option) => option.value),
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

/** What the caller reports back after trying to create the account. */
export type JobSignUpResult = { success: true } | { success: false; emailTaken?: boolean };

/**
 * What to show someone whose sign-up the server refused.
 *
 * Here rather than in either host, because there are two hosts now and a refusal
 * should read the same whichever door it came through.
 *
 * Named rather than vague. An earlier version deliberately blurred "email
 * exists" into a generic message to avoid an account-enumeration oracle — but
 * the endpoint answers 409 either way, so anyone probing reads it off the status
 * code and the vagueness only confuses the person who genuinely forgot they had
 * an account. (The oracle is worth raising about the endpoint itself, not
 * papering over here.)
 */
export const signUpFailureMessage = (result: Extract<JobSignUpResult, { success: false }>): string =>
  result.emailTaken
    ? 'This email already has an account. Sign in instead — your application picks up from there.'
    : 'We couldn’t create your account just now. Please try again.';

/** Form state → the shape the sign-up endpoint's caller wants. */
export const toAccountDetails = (data: AccountFormData): AccountDetails => ({
  name: data.name.trim(),
  email: data.email.trim(),
  linkedin: (data.linkedin ?? '').trim(),
  role: data.role.trim(),
  /* Narrowed rather than asserted. The schema makes this one of the offered
     statuses before a submit can happen, so the fallback is unreachable in
     practice — but a cast here would be the one place a bad value could reach
     the wire silently, and this file is the boundary that exists to stop that. */
  jobSearchStatus: isJobSearchStatus(data.jobSearchStatus) ? data.jobSearchStatus : 'open-to-right-role',
  teamUid: data.company?.value ?? null,
});

/**
 * The account questions. `layout` changes the arrangement and nothing else —
 * same fields, same order, same schema; a layout prop rather than a second copy
 * of the group.
 */
export function AccountFields({ layout = 'stack' }: { layout?: 'stack' | 'grid' } = {}) {
  const { setValue } = useFormContext<AccountFormData>();
  /* `useWatch` and not `getValues`: this has to re-render on the tick, because
     the tick is what puts the select on screen. */
  const onPlTeam = useWatch<AccountFormData, 'onPlTeam'>({ name: 'onPlTeam' }) ?? false;

  /* Unticking clears the team rather than merely hiding it.
     A hidden select still holding "Filecoin Foundation" would submit an employer
     the person has just told the form they don't have — an answer that is
     invisible, kept, and wrong, which is the worst of the three outcomes. The
     switch owns the field it reveals, in both directions. */
  const toggleOnPlTeam = (next: boolean) => {
    setValue('onPlTeam', next, { shouldDirty: true });
    if (!next) setValue('company', null, { shouldDirty: true });
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

  return (
    <>
      {/* The two short ones, always wrapped so the arrangement is the wrapper's
          business in both layouts: `stack` gives them the same 24px column the
          rest of the group sits in, `grid` puts them on one line. */}
      <div className={layout === 'grid' ? s.fieldPair : s.fieldStack}>
        <FormField name="email" label="Email address" placeholder="you@company.com" isRequired />

        <FormField name="name" label="Full name" placeholder="Enter your full name" isRequired />
      </div>

      <FormField
        name="linkedin"
        label="LinkedIn profile"
        placeholder="eg., johndoe or https://linkedin.com/in/johndoe"
        isRequired
        description="Shown on your profile, alongside your other links."
      />

      {/* The switch, and what it is for.

          The row below used to put the team select in front of everyone, and for
          almost everyone the only correct answer was to leave it alone — a closed
          list of network teams reads as a wall to every visitor not on one. Now
          the default form is the one that fits them: a role input and nothing
          else. Ticking the box is what asks for the select, which turns "leave it
          blank if this isn't you" into "say so, and we'll ask".

          First person ("I'm already a member…") rather than the form's usual
          noun-phrase labels, and deliberately: every other line in this group
          names a thing to fill in, and this one is a claim the person is making
          about themselves. Same voice the design system uses for its other
          checkbox, "I'm an accredited investor under SEC rules".

          The `<label>` wraps both, so the sentence is the hit area — a 20px box
          is a small target and the words beside it are the obvious one. */}
      <div className={s.checkboxGroup}>
        <label className={s.checkboxRow}>
          <Checkbox checked={onPlTeam} onChange={toggleOnPlTeam} />
          I&apos;m already a member of a PL Network team
        </label>

        <div className={s.column}>
          {/* The label names what is under it, which changes with the tick. It
              stays `(Optional)` in both states: the tick reveals a question, it
              does not create a requirement — see the schema's note on why
              requiring the team would turn an honest tick into a dead end. */}
          <div className={s.inputsLabel}>
            {onPlTeam ? 'Current role & PL network team' : 'Current role'}
            <OptionalMark />
          </div>
          <div className={s.inputsWrapper}>
            <FormField name="role" placeholder="Enter your current role" />
            {/* The `@` and the select appear together or not at all. The
                separator is punctuation *between* two fields; on its own beside a
                single input it is a dangling preposition — a row that looks like
                it lost something. So the reveal is the whole right-hand half. */}
            {onPlTeam && (
              <>
                <span className={s.separator}>@</span>
                {/* "Select a team", not "Select a company" — the label above now
                    says PL network team, and this list is exactly that: network
                    teams, not employers at large. */}
                <FormSelect name="company" placeholder="Select a team" isClearable options={companyOptions} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * The status, bound to the account form, for a host that wants to frame it
 * itself — the apply flow's step 2 draws it inside a card with the amber
 * required strip, where a plain label would be a second way of saying required.
 */
export function useJobSearchStatus() {
  const { control } = useFormContext<AccountFormData>();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name: 'jobSearchStatus' });

  return {
    /* Narrowed on the way out so a host never has to think about the `''` the
       empty form starts with. */
    value: isJobSearchStatus(field.value) ? field.value : null,
    onChange: field.onChange as (next: JobSearchStatus) => void,
    error: error?.message ?? null,
    answered: isJobSearchStatus(field.value),
  };
}

/**
 * The status as one more labelled field — the modal's framing, where the form is
 * a flat column and every other question wears a `FormField` label.
 *
 * It carries the required asterisk `Email address` does: a form that refuses to
 * submit without a field it has not marked required is worse than one with no
 * marking system at all.
 */
export function JobSearchStatusField() {
  const { value, onChange, error } = useJobSearchStatus();

  return (
    <div className={s.column}>
      <div className={ff.labelWrapper}>
        <span className={`${ff.label} ${ff.required}`}>Job search status</span>
      </div>
      <JobSearchStatusInput
        name="signup-job-search-status"
        value={value}
        onChange={onChange}
        hiddenValues={['not-looking']}
      />
      {error && <p className={ff.errorMsg}>{error}</p>}
    </div>
  );
}
