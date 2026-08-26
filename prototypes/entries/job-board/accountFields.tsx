'use client';

import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
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
 * Addresses a person has because they are a person, rather than because of where
 * they work. Deliberately a *closed list of the obvious ones* and not a rule: it
 * is used only to change a sentence, never to refuse a value, so a domain it has
 * never heard of costs nothing. The inverse test — "does this domain look
 * corporate?" — is unanswerable, which is why nothing here tries it.
 *
 * A shipping version would read this from a maintained list rather than a
 * literal; the twenty-odd that cover almost every real case are enough to review
 * the interaction.
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
 * **Why anything is said at all.** The card these inputs sit on already tells the
 * person that "the PL team reviews new accounts". A work address is what makes
 * that review answerable without a conversation — it is evidence for the claim
 * the *same form* makes two fields down, where they name their current company.
 * That is the one thing here the interface cannot show for itself, so it is the
 * only thing this sentence spends words on.
 *
 * **Why it is a preference and not a rule.** Contractors, people between roles,
 * researchers and anyone at a company that hasn't got as far as email all belong
 * on this network, and a domain check would turn a preference into a wall in
 * front of exactly them. Nothing here validates: the schema is unchanged, this is
 * grey 12px `description` copy in the slot that yields to real errors, and every
 * address still submits.
 *
 * **Why there is no standing version of this line.** There was one — the same
 * sentence phrased as an ask, shown to everybody from the moment the modal
 * opened. Two things were wrong with it. It spent 44px explaining a preference to
 * the people already complying with it, which at a 730px window pushed "Already
 * have an account? Sign in" 8px under the fold — the exact regression the copy
 * block below was once cut down to fix. And a line that is always there is read
 * by the people who read lines; someone typing their personal address on autopilot
 * is by definition not one of them. The ask is made where everyone actually meets
 * it — the placeholder — and the sentence is kept for the one moment it is news.
 *
 * It names the company field as "below", which it is in both hosts: this group
 * renders as one block, email first and `role @ company` last, in the modal and
 * in the flow's account step alike.
 */
const PERSONAL_EMAIL_NOTE = 'A work email shows the PL team you’re at the company you name below.';

/**
 * The four fields, in production's order. Must be rendered inside a
 * `FormProvider` holding an `AccountFormData` form — both hosts own their own
 * `useForm`, because the modal submits on its own footer and the pane's answers
 * are submitted two steps later by the flow's.
 *
 * **`layout` changes the arrangement and nothing else.** Same fields, same
 * order, same schema, same copy — `grid` only puts email and full name on one
 * line. The apply flow's details step asks for it because that pane is three
 * cards tall; the modal keeps the stack, where four fields in a 440px dialog
 * have no height to save. A second copy of this group with its own paired row is
 * precisely what this file was lifted out to prevent, so the difference is a
 * prop here rather than a fork in the pane.
 */
export function AccountFields({ layout = 'stack' }: { layout?: 'stack' | 'grid' } = {}) {
  const companyOptions = useCompanyOptions();

  /* Read here rather than inside `FormField`, which watches its own value only
     to drive a character counter — the *description* is the host's to compose,
     and this is the host. `useWatch` re-renders this group on the keystroke that
     completes a domain, which is when the note has something to say. */
  const email = useWatch<AccountFormData, 'email'>({ name: 'email' }) ?? '';

  return (
    /* The group carries its own 24px rhythm rather than inheriting one.
       It was a fragment relying on the host's gap, which held only while the
       sign-up modal was the only host — `DetailsSection`, the other one, ships
       with its gap commented out so callers space themselves. See `.fieldStack`. */
    <div className={s.fieldStack}>
      {/* The two short ones. Always wrapped, in both layouts: in `stack` the
          wrapper is another `.fieldStack`, so the rendered result is byte-for-byte
          what it was before the prop existed — no branch in the tree, and the
          modal cannot drift because of a variant it never asks for. */}
      <div className={layout === 'grid' ? s.fieldPair : s.fieldStack}>
        {/* Email leads, not name: it is the field the account is created on, and
          the one thing being asked for that the person may hesitate over.
          Burying it third would read as hiding it.

          **The label stays "Email address".** "Work email" would be a rule the
          form does not keep — every address is accepted — and a label that needs
          a sentence underneath explaining when it doesn't apply is the label
          being wrong. The preference belongs in the two places a preference can
          live: the shape shown in the box, and the reason given under it.

          **The placeholder is an exemplar, not an instruction.** It read "Enter
          your email", which is the group's usual voice — but it is also the one
          placeholder in this form doing no work, since nobody needs telling what
          an email field wants. `you@company.com` is seen by everyone, including
          the people who never read a description, and it makes the ask before
          the ask has to be spoken. The precedent is one field down: LinkedIn's
          placeholder is a worked example for exactly the same reason.

          **The note is `undefined` rather than a standing line**, so the field
          is exactly what it was until a personal domain is finished — see
          `PERSONAL_EMAIL_NOTE` for why the always-on version was removed.
          `description` also yields to the error slot in `FormField`, which is
          the right precedence: a malformed address is a problem, a personal one
          is a preference, and only one of them should be talking at a time. */}
        <FormField
          name="email"
          label="Email address"
          placeholder="you@company.com"
          isRequired
          description={isPersonalEmailDomain(email) ? PERSONAL_EMAIL_NOTE : undefined}
        />

        <FormField name="name" label="Full name" placeholder="Enter your full name" isRequired />
      </div>

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
