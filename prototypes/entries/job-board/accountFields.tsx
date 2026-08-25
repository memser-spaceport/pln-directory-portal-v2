'use client';

import { useMemo } from 'react';
import * as yup from 'yup';

import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';

import { MOCK_JOB_GROUPS } from './mocks';
import s from './JobSignUpModal.module.scss';

/**
 * The account form, in one place, because it now has two hosts.
 *
 * **Why this was lifted out.** `JobSignUpModal` used to be the only way to open
 * an account from this board, so its schema and its four fields lived inside it.
 * Folding sign-up into the apply flow gave the same form a second home — the
 * flow drawer's step 2, for a visitor with no account — and two copies of a
 * validation rule is two chances for the board to disagree with itself about
 * what a valid LinkedIn handle is.
 *
 * So: one schema, one field group, two mounts. The modal keeps the *role-less*
 * door (the header and banner `Sign up` presses, which name no job and so have
 * no flow to run), and the drawer's pane takes the door that starts at a role.
 *
 * **The stylesheet stays `JobSignUpModal.module.scss`.** `.column`,
 * `.inputsLabel`, `.inputsWrapper` and `.separator` were written for exactly
 * this row and are already tuned to it; a second sheet restating them here is
 * the drift this file exists to prevent. The pane that mounts these supplies its
 * own surrounding chrome and nothing else.
 */

/** What the form holds. `company` is a react-select Option, not a string —
 *  `FormSelect` writes the whole option object into form state — so it is
 *  flattened to its label by `toAccountDetails` on the way out. */
export type AccountFormData = {
  email: string;
  name: string;
  linkedin: string;
  role: string;
  company?: { label: string; value: string } | null;
};

/** The flattened answers, as every consumer wants them: trimmed strings. */
export interface AccountDetails {
  name: string;
  email: string;
  linkedin: string;
  role: string;
  company: string;
}

export const EMPTY_ACCOUNT_FORM: AccountFormData = {
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

/** Form state → the answers. One flattener, so the modal and the pane cannot
 *  disagree about whether `company` travels as a label or a uid. */
export const toAccountDetails = (data: AccountFormData): AccountDetails => ({
  name: data.name.trim(),
  email: data.email.trim(),
  linkedin: (data.linkedin ?? '').trim(),
  role: data.role.trim(),
  company: data.company?.label ?? '',
});

/**
 * The board's own teams, so the company list matches the companies on screen.
 * Production feeds this select from a members-form-options query; a prototype
 * that invented a second, different company list would put two answers to "who
 * is on this network" on one page.
 */
export function useCompanyOptions() {
  return useMemo(
    () =>
      MOCK_JOB_GROUPS.map((group) => ({ value: group.team.uid, label: group.team.name })).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    [],
  );
}

/**
 * The four fields, in production's order. Must be rendered inside a
 * `FormProvider` holding an `AccountFormData` form — both hosts own their own
 * `useForm`, because the modal submits on its own footer and the pane's answers
 * are submitted two steps later by the flow's.
 */
export function AccountFields() {
  const companyOptions = useCompanyOptions();

  return (
    /* The group carries its own 24px rhythm rather than inheriting one.
       It was a fragment relying on the host's gap, which held only while the
       sign-up modal was the only host — `DetailsSection`, the other one, ships
       with its gap commented out so callers space themselves. See `.fieldStack`. */
    <div className={s.fieldStack}>
      {/* Email leads, not name: it is the field the account is created on, and
          the one thing being asked for that the person may hesitate over.
          Burying it third would read as hiding it. */}
      <FormField name="email" label="Email address" placeholder="Enter your email" isRequired />

      <FormField name="name" label="Full name" placeholder="Enter your full name" isRequired />

      {/* The field always asked for this and the answer used to be thrown away —
          the board seeded only `role`. It now lands on the profile, and the
          description says what it is *for*, because an optional field with no
          stated payoff is one people skip.

          The description used to end "...bring your LinkedIn profile as a PDF in
          the next step", pointing at the importer's LinkedIn door. That door is
          gone, so the sentence went with it rather than surviving as an
          instruction for a control nobody will find. What is left is the whole
          truth about this field: it is a link on your profile, not a way to fill
          anything in. */}
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
          {/* "Select a company", not the source's "Search or add a team". Two
              reasons. It fits on one line at this width — the longer string
              wrapped and left the select taller than the role field beside it,
              so a paired row stopped looking paired. And "add" would be a
              promise this select doesn't keep: production backs that word with
              an inline add-a-team form behind the select's empty state, which
              this prototype doesn't carry. */}
          <FormSelect name="company" placeholder="Select a company" isClearable options={companyOptions} />
        </div>
      </div>
    </div>
  );
}
