'use client';

import { useMemo } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import * as yup from 'yup';

import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
// `FormField`'s own label/error pair, for the one field this group labels by
// hand. `FormField` types `label` as a string, so a radio group with a pill
// opposite its label cannot go through it.
import ff from '@/components/form/FormField/FormField.module.scss';
// The design system's checkbox. `SignupWizard` — the same production form this
// group takes its shape from — mounts this exact component inside a plain
// `<label>`, which is the pattern the team select's gate copies. (Its sibling
// `SecRulesCheckbox` builds the same row straight out of base-ui; the DS
// component is the same thing with the paint already on it.)
import { Checkbox } from '@/components/common/Checkbox';

// The prototypes' settled mark for a field only the PL team can see. The same
// component the flow's profile step and its account step already put on this
// same question — the promise does not change because the person asking has no
// account yet.
import { PlTeamOnlyPill } from '../profile-shared/PlTeamOnlyPill';

// One applicant across the sign-up form, the pre-filled account step and the
// profile behind them — see the note in `viewerIdentity`.
import { VIEWER_EMAIL, VIEWER_NAME, VIEWER_ROLE, VIEWER_LINKEDIN } from './profile/viewerIdentity';
// The radio group, and the two options it offers. Both already exist on this
// board — the profile step and the flow's account step render this exact
// control — so the sign-up modal asking the question a third way would be three
// designs of one field.
import { JobSearchStatusInput } from './JobProfilePane';
import type { JobSearchStatus } from './viewerState';

/* (`OptionalMark` and `FormField`'s own label pair were imported here, for two
    hand-rolled labels that carried the `(Optional)` mark. Neither field is
    optional any more — LinkedIn is required and the team select is behind a
    checkbox that asks the question the mark used to imply — so both labels are
    `FormField`'s own `label` prop again and the imports went with them.) */

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
  /* (`teamEmail` stood here — an optional work address, asked last and directly
     under the team select, so the PL team could see where you work.
     Removed.

     It existed to give `PERSONAL_EMAIL_NOTE` a control to point at: the form
     wanted to know where someone works, and the only email field was the one the
     account is created on. But the select two rows above already asks that
     question, and asks it better — it is a real list of network teams rather
     than an unverified string, and this prototype never checked the domain
     against the team anyway, so the field collected a claim and did nothing with
     it. Two fields for one answer is one field too many on the form standing
     between a visitor and a job.

     What survives is the reason, moved onto the control that still asks: see the
     select's own description. `PERSONAL_EMAIL_NOTE` went with the field it
     pointed at — a note whose whole job was "there is a box for this below"
     cannot outlive the box.) */
  name: string;
  linkedin: string;
  role: string;
  /**
   * Whether the person says they are already on a PL network team — and so
   * whether the team select is on screen at all.
   *
   * **A form field, not component state.** It lives here because it is an
   * answer: it decides what `company` is allowed to be, it has to survive the
   * pane unmounting when someone steps away and back, and a branch held in a
   * `useState` inside a group with two hosts is a branch that resets in one of
   * them and not the other.
   *
   * **It reaches `AccountDetails` now, and the note above is why it has to.**
   * This said the flag never travels — that the board only reads a team name, so
   * "no team" and "not on the network" are one answer. That held while the only
   * consumer was a profile field. It stopped holding the moment the answer
   * started deciding *which account gets made*: a claim to be on a PL team is
   * what the PL team reviews, and someone who ticks the box and then does not
   * pick a team has still made that claim. Reading it off `company` would file
   * them as a job aspirant — approved instantly, on the strength of a select they
   * left alone — which is the one place the two answers must not collapse.
   *
   * `company` still means what it meant: a team name, or none. The flag means
   * the claim.
   */
  atPlTeam: boolean;
  company?: { label: string; value: string } | null;
  /**
   * Where they are with job hunting — **asked on both doors now, and that is
   * the change.**
   *
   * It used to be collected one step later: the flow's account pane held it in
   * the profile draft and the standalone modal never asked at all, so someone
   * who signed up from the banner arrived with the one required answer missing
   * and no memory of having been asked for it. The two doors made two different
   * accounts out of the same form.
   *
   * It is a form field rather than a prop for the reason `atPlTeam` is one: it
   * is an answer. It has to survive the pane unmounting between steps, it has to
   * be validated by the same press that validates the fields above it, and a
   * requirement enforced in one host and not the other is the drift this module
   * exists to prevent.
   *
   * `''` rather than `null` for the empty state, so it is a string field like
   * every other member of this type and `required()` can speak for it.
   */
  jobSearchStatus: JobSearchStatus | '';
};

/** The flattened answers, as every consumer wants them: trimmed strings. */
export interface AccountDetails {
  /** The claim, not the team — see `AccountFormData.atPlTeam`. Decides whether
   *  the new account waits on a PL review or can apply straight away. */
  atPlTeam: boolean;
  name: string;
  email: string;
  linkedin: string;
  role: string;
  company: string;
  /**
   * Null when the door that collected these did not ask.
   *
   * No such door exists — both require the answer — so this is the unreachable
   * branch of `toAccountDetails`. It is nullable anyway, because the alternative
   * is a non-null type whose only enforcement is that every current caller
   * happens to ask: a third door that skipped the question would satisfy the
   * type by inventing a value. A fabricated status is a claim about someone's
   * job hunt that they never made, and it is the one answer here the board later
   * shows back to them as their own.
   */
  jobSearchStatus: JobSearchStatus | null;
}

export const EMPTY_ACCOUNT_FORM: AccountFormData = {
  email: '',
  name: '',
  linkedin: '',
  role: '',
  /* Unchecked by default, which is also the shorter form. Most people arriving
     at a job board are not already on a PL team; defaulting the other way would
     show every visitor a select they cannot answer and make the common case the
     one that has to be corrected. */
  atPlTeam: false,
  company: null,
  /* Unanswered. There is no defensible default: every value here is a claim
     about the person's own job hunt, and the field is required precisely
     because only they can make it. */
  jobSearchStatus: '',
};

/**
 * The same form, filled in — one fixture, used by every surface that needs to
 * show this form already answered.
 *
 * One of those is left: `JobSignUpModal`'s filled design-canvas frame. The other
 * was the `signed-up-modal` viewer's pre-filled account step, and that viewer is
 * gone — signing up through the modal produces an account, so what follows it is
 * `pending-approval`, not a second signed-out state. The fixture stays shared
 * rather than being inlined into the modal: it is still the answer to "who
 * signed up", and `viewerIdentity` is where that person is defined.
 */
export const FILLED_ACCOUNT_FORM: AccountFormData = {
  email: VIEWER_EMAIL,
  name: VIEWER_NAME,
  linkedin: VIEWER_LINKEDIN,
  role: VIEWER_ROLE,
  /* Not on a PL team: the shorter form, and the one the checkbox defaults to.
     A filled fixture that also happened to exercise the gated select would be
     showing the uncommon case as the representative one. */
  atPlTeam: false,
  company: null,
  /* The filled fixture answers it, because a form fixture that leaves the one
     required field blank is a fixture of a form that cannot be submitted. */
  jobSearchStatus: 'open-to-right-role',
};

// Transcribed from ApplyForDemoDayModal's `applySchema` — same email domain-dot
// test, same LinkedIn handle-or-URL pair of patterns. Dropped: `isInvestor`,
// `teamName`/`websiteAddress` (the add-a-team branch) and the conditional `role`
// rule that only fired while adding a team. `role` is not required here either:
// applying no longer waits on it (see `isProfileComplete`), and a schema that
// refuses the form for it would make it required in the one place it matters
// most — the step a stranger has to get through to apply at all.
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
  /* (`teamEmail`'s rule — the same shape test as `email` minus `required()` —
     went with the field. Deleted rather than left defined-but-unrendered: a
     schema key with no input is a validation nobody can fail, and the next
     reader has to open the form to find that out.) */
  name: yup.string().required('Name is required'),
  /* **Required, where it used to be optional.**
     The PL team reviews these accounts by hand and this is the one field that
     lets them do it: a name and an email say who typed the form, a LinkedIn
     says who the person is. Every other route to that — the CV importer, the
     LinkedIn OAuth — either isn't on this step or doesn't return work history
     at all, so leaving it blank meant a reviewer with nothing to go on.

     The format test is unchanged and still runs first on a non-empty value, so
     someone who types something wrong gets the specific complaint rather than
     "required". `required()` is what fires on an empty box. */
  linkedin: yup
    .string()
    .test('linkedin-url', 'Please enter a valid LinkedIn handle or URL', (value) => {
      if (!value || value.trim() === '') return true; // Let required() handle empty values

      const trimmedValue = value.trim();

      // Match LinkedIn profile URLs with or without protocol
      const linkedinUrlPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i;

      // Match LinkedIn handle (alphanumeric, hyphens, underscores, typically 3-100 chars)
      const linkedinHandlePattern = /^[\w-]{3,100}$/;

      return linkedinUrlPattern.test(trimmedValue) || linkedinHandlePattern.test(trimmedValue);
    })
    .required('LinkedIn profile is required'),
  /* **Required, in both states of the tick.**
     It was optional, on the argument that gating the application on it stopped
     people at the door. That argument was about `isProfileComplete` — whether
     the *board* refuses to send an application — and it still holds there. This
     is a different question: whether the *sign-up form* accepts a blank. The
     answer a Job Aspirant's application is built out of is the role, and someone
     with no network team needs it as much as someone with one, so the design
     marks it either way.

     A `test` rather than `.trim().required()`, because yup's `trim()` is a
     transform in non-strict mode and would quietly rewrite the submitted value;
     this only reads it. `defined()` keeps the inferred type a plain `string` so
     the form state and `AccountFormData` cannot drift. */
  role: yup
    .string()
    .defined()
    .test('role-required', 'Current role is required', (value) => !!value?.trim()),
  /* No rule of its own: unchecked is a valid answer and the only thing it
     governs is whether `company` is asked for. `defined()` rather than
     `required()` — `required()` on a boolean rejects `false`, which is the
     default and the common case. */
  atPlTeam: yup.boolean().defined(),
  company: yup.mixed<{ label: string; value: string }>().nullable(),
  /* The one field in this group that neither door may skip and neither door may
     answer on the person's behalf. `required()` fires on `''`, which is exactly
     the empty state — so the rule and the default agree, and the message names
     the field rather than the form. */
  jobSearchStatus: yup
    .mixed<JobSearchStatus>()
    /* The message is on `oneOf`, not only on `required`. The empty state is
       `''`, which is a defined value — so `required()` never sees it and the
       rule that actually fires is this one. A friendly message hung on the
       branch that cannot run would leave yup's own
       "this must be one of the following values" as what the person reads. */
    .oneOf(['actively-looking', 'open-to-right-role'], 'Pick the option that describes your search')
    .required('Pick the option that describes your search'),
});

/** Form state → the answers. One flattener, so the modal and the pane cannot
 *  disagree about whether `company` travels as a label or a uid. */
export const toAccountDetails = (data: AccountFormData): AccountDetails => ({
  atPlTeam: data.atPlTeam,
  name: data.name.trim(),
  email: data.email.trim(),
  linkedin: (data.linkedin ?? '').trim(),
  role: data.role.trim(),
  /* `atPlTeam` gates this answer as well as being one of its own. The group
     already clears `company` when the box is unticked, so this second check is
     belt and braces: a stale team picked before the box was unticked must not
     travel just because the field held the last thing it saw. */
  company: data.atPlTeam ? (data.company?.label ?? '') : '',
  /* Narrowed on the way out, so no consumer has to think about the `''` the
     empty form starts with. The schema guarantees it is answered by the time a
     submit reaches here; the fallback exists so the *type* says so too. */
  jobSearchStatus: data.jobSearchStatus === '' ? null : data.jobSearchStatus,
});

/**
 * The asterisk, drawn locally rather than borrowed.
 *
 * `JobSearchStatusField` below reaches for `${ff.label} ${ff.required}` and that
 * is right, where the label is otherwise unstyled. It is not available here: the
 * asterisk lives on `.label.required:after`, so `ff.required` does nothing
 * without `ff.label`, and `ff.label` would set colour, size, weight, line-height
 * and margin a second time on a row where `.inputsLabel` already says all five —
 * leaving which one wins to stylesheet order.
 */
const RequiredMark = () => (
  <span className={s.requiredMark} aria-hidden="true">
    *
  </span>
);

/**
 * The status, bound to the account form, for a host that wants to frame it
 * itself.
 *
 * The flow's account pane draws this question inside a `DetailsSection` with the
 * amber required strip, where a plain label would be a second way of saying
 * required. It needs the value and the setter, not the framing — so it takes
 * them from here and keeps its card.
 */
export function useJobSearchStatus() {
  const { control } = useFormContext<AccountFormData>();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name: 'jobSearchStatus' });

  return {
    value: (field.value ?? '') as JobSearchStatus | '',
    onChange: field.onChange as (next: JobSearchStatus) => void,
    error: error?.message ?? null,
    answered: field.value !== '' && field.value != null,
  };
}

/**
 * The status as one more labelled field — the modal's framing, where the form is
 * a flat column and every other question wears a `FormField` label.
 *
 * **Why the modal asks this at all, when it did not before.** The board has two
 * sign-up doors and they were collecting different things: the flow's account
 * step asked for the status, the banner's modal did not. So the same form made
 * two different accounts, and the person who took the banner door landed on a
 * board that immediately wanted an answer it had had every opportunity to ask
 * for. One form, one set of answers, whichever door it is standing in.
 *
 * It carries the required asterisk `Email address` does: a form that refuses to
 * submit over a field it has not marked is worse than one with no marking system
 * at all.
 */
export function JobSearchStatusField() {
  const { value, onChange, error } = useJobSearchStatus();

  return (
    <div className={s.column}>
      {/* `ff.labelWrapper` is already flex / space-between / full-width — it
          exists so `FormField` can put a hint opposite a label — so the pill
          needs no rule of its own.

          The pill answers the first question anyone asks of a field about their
          own job hunt, and it has to be answered *beside* the question rather
          than under it: read as a footnote, it arrives after the decision
          whether to answer honestly has already been made. Same mark the flow's
          account step puts on the same question, so the two doors make one
          promise rather than two. */}
      <div className={ff.labelWrapper}>
        <span className={`${ff.label} ${ff.required}`}>Job search status</span>
        <PlTeamOnlyPill />
      </div>
      {/* The purpose sentence — "Used to decide whether to surface your profile
          to founders who are hiring — never to your current team." — is not
          written here. It is inside `JobSearchStatusInput`, where the profile
          step and the flow's account step already get it. Restating it beside
          this instance is how the modal ends up promising something slightly
          different from the other two screens that ask the same question. */}
      <JobSearchStatusInput value={value} onChange={onChange} name="signup-job-search-status" />
      {error && <p className={ff.errorMsg}>{error}</p>}
    </div>
  );
}

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
 * they work. A *closed list of the obvious ones* and not a rule: it is used only
 * to change a sentence, never to refuse a value, so a domain it has never heard
 * of costs nothing. The inverse test — "does this domain look corporate?" — is
 * unanswerable, which is why nothing here tries it.
 *
 * A shipping version would read this from a maintained list rather than a
 * literal; the twenty-odd that cover almost every real case are enough to review
 * the interaction.
 *
 * **This came back after being deleted.** It went out with `teamEmail`, on the
 * reading that the note it drove existed to point at that field. It did — and it
 * was also the only place this form encouraged a work address at all, which is a
 * separate job that outlived the box. See `WORK_EMAIL_NOTE`.
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
 * The nudge, and the whole of it: one sentence.
 *
 * **Encouragement, never a gate.** `accountSchema` is untouched — any valid
 * address opens an account, a personal one included, and nothing here refuses,
 * warns, or marks the field. A sign-up that argued with the address someone had
 * just typed would be spending its one required field on a preference.
 *
 * **Two layers, and this is the second.** The placeholder (`you@company.com`) is
 * the encouragement that arrives *before* anyone types, which is where most of
 * the work happens and where it costs nothing — a worked example rather than an
 * instruction. This one arrives after, and only when it is news: see the
 * `description` on the field.
 *
 * **It no longer points at a control.** The old wording ended "…add your team
 * email below", naming a box that is gone. What is left is the reason that was
 * always underneath it: the PL team reads these by hand, and a work address is
 * the one thing that makes that read easy.
 *
 * The second clause does as much work as the first. Someone who has only a
 * personal address has to learn in the same breath that they are not being
 * turned away — otherwise a line meant as help reads as a requirement they have
 * already failed.
 */
const WORK_EMAIL_NOTE = 'A work address helps the PL team review your account — this one works too.';

/**
 * The fields, in production's order: email, name, LinkedIn, then role — with
 * the PL-team checkbox and, when it is ticked, the team select. Must be
 * rendered inside a `FormProvider` holding an `AccountFormData` form — both
 * hosts own their own `useForm`, because the modal submits on its own footer
 * and the pane's answers are submitted two steps later by the flow's.
 *
 * (It was "the four fields" for a long time and the count kept going stale —
 * Team email came and went, the team select is now conditional. Named rather
 * than counted.)
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
     completes a domain, which is the one moment the note has something to say. */
  const email = useWatch<AccountFormData, 'email'>({ name: 'email' }) ?? '';

  /* The team gate, read the same way and for the same reason: it decides what
     this group renders, so the group is what has to re-render when it changes.
     `setValue` rather than a `Controller` — the checkbox is one boolean with no
     error slot of its own, and registering it as a field would give it a label,
     a description and a validation message it has no use for. */
  const atPlTeam = useWatch<AccountFormData, 'atPlTeam'>({ name: 'atPlTeam' }) ?? false;
  const { setValue } = useFormContext<AccountFormData>();

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
          /* The first of the two nudges, and the cheaper one: a worked example
             rather than an instruction, doing its work before anyone types and
             costing no vertical space to do it. */
          placeholder="you@company.com"
          isRequired
          /* **Conditional, not standing.** An always-on version of this line was
             tried and cut: it spent 44px explaining a preference to the people
             already complying with it, and at a 730px window it pushed the
             "Already have an account? Sign in" escape under the fold. A line
             that is always there is also read by the people who read lines —
             and someone typing a personal address on autopilot is by definition
             not one of them. So it appears on the keystroke that finishes a
             personal domain, which is the one moment it is news.

             `description` also yields to the error slot in `FormField`, which is
             the right precedence: a malformed address is a problem, a personal
             one is a preference, and only one of them should be talking at a
             time. That ordering is what keeps this a nudge — it can never be the
             thing standing between someone and their account. */
          description={isPersonalEmailDomain(email) ? WORK_EMAIL_NOTE : undefined}
        />

        <FormField name="name" label="Full name" placeholder="Enter your full name" isRequired />
      </div>

      {/* The field always asked for this and the answer used to be thrown away —
          the board seeded only `role`. It now lands on the profile, and the
          description says what it is *for*.

          The description used to end "...bring your LinkedIn profile as a PDF in
          the next step", pointing at the importer's LinkedIn door. That door is
          gone, so the sentence went with it rather than surviving as an
          instruction for a control nobody will find. What is left is the whole
          truth about this field: it is a link on your profile, not a way to fill
          anything in.

          **Required now, and the `(Optional)` system it used to anchor is
          gone.** This label was hand-rolled — a `<div className={ff.labelWrapper}>`
          around an `<label>` and an `OptionalMark` — because `FormField`'s
          `label` prop takes a string and cannot carry a mark. The argument for
          the mark was that Team email had one, so the form had a *system* in
          which optional fields were labelled and a system with one member is
          just an exception. Team email was deleted; LinkedIn was then the only
          member left, and now it is required too. A system with no members is
          not a system, so what is left is the plain one every other field here
          already uses: required fields carry `*`, and nothing else needs a mark
          because there is nothing else.

          So it goes back through `label` + `isRequired` — the same two props as
          Email and Full name. That is worth more than the mark ever was: three
          identical labels are a form you can read at a glance, where one
          bespoke label is a field you have to look at twice to find out why it
          is different. (`s.column` goes with the hand-rolled wrapper; `FormField`
          places its own label above its own control.)

          **And those three are now the whole of what this form insists on.** The
          role below is optional (see the schema) and the team select always was,
          so the `*` is what separates them and no `(Optional)` mark is needed to
          say the other half of it — the convention is one mark, on the fields
          that stop you. */}
      <FormField
        name="linkedin"
        label="LinkedIn profile"
        isRequired
        placeholder="eg., johndoe or https://linkedin.com/in/johndoe"
        description="Shown on your profile, alongside your other links."
      />

      {/* **The question the team select was always asking, asked out loud.**

          The select used to be on screen for everybody, with a line of fine
          print under it explaining that a blank was fine. That made the common
          case — someone who has never worked at a PL team — the case that has
          to read a sentence and then do nothing, in front of a closed list of
          six names that reads as a wall. And it made "am I one of these people?"
          a question you answered by inspecting a dropdown.

          A checkbox asks it directly and costs one glance to say no. Checked, it
          reveals the pair it has always been; unchecked, the row is one input
          and the form is shorter for the majority who need it to be.

          **Progressive disclosure and not a disabled select**, because there is
          nothing to explain here — the answer is one press away and reversible,
          so a greyed control would only be a promise the person can already
          keep. The revealed half is one row directly underneath, which is the
          only placement that reads as *this checkbox's* consequence.

          `<label>` around the DS `Checkbox`, which is `SignupWizard`'s exact
          shape for its own two consent ticks — the same production form this
          group takes its field order from. See `.checkRow`. */}
      <label className={s.checkRow}>
        <Checkbox
          checked={atPlTeam}
          onChange={(next) => {
            setValue('atPlTeam', next, { shouldValidate: true });
            /* Cleared on the way out, not merely hidden. A `company` left in
               form state behind an unticked box is an answer nobody can see and
               nobody can remove — it would travel with the account and put a
               team on a profile whose owner has just said they are not on one.
               `toAccountDetails` guards the same thing again; this is the half
               that keeps the form state itself honest. */
            if (!next) setValue('company', null, { shouldValidate: true });
          }}
        />
        {/* **"I work at a PL network startup"**, which is the design's wording
            and the wording production ships. It replaced "I'm already a member
            of a PL Network team", and the difference is not cosmetic: "member of
            a team" is directory vocabulary — it names a record the person may
            not know they have — where "I work at" is a fact about their week
            that they can answer without knowing anything about this product. The
            box decides which of the two accounts gets made, so it has to be
            answerable by someone who has never seen the directory. */}
        <span className={s.checkText}>I work at a PL network startup</span>
      </label>

      {/* **The label names the network, because the list is the network.**
          This read "Current role & company" and the select said "Select a
          company", which describes a generic employment question — so someone
          at a company that isn't on the network opens a list of six PL teams,
          doesn't find their employer, and has no way to tell whether that is a
          bug, a search that needs different words, or a question that was never
          meant for them. `useCompanyOptions` returns `MOCK_JOB_GROUPS` and
          nothing else; production feeds the same select from a members-form
          query. The list has always been network teams. Only the words were
          generic.

          "PL network team" rather than "company" or "team" alone: it is the
          board's own phrase — `SignInBanner`'s headline counts "N PL network
          teams" one screen above this modal — so the label and the thing it
          points at use one vocabulary. Naming it for what the list *holds*
          rather than for what the reader has (an employer) is lesson 6's rule:
          a field labelled from the asker's side undersells and mis-describes
          what is actually in it.

          **The label follows the row, because the row is now two rows.** It read
          "Current role & PL network team" unconditionally, which was written for
          a pair that was always on screen. With the select behind a checkbox the
          unchecked case is a single unlabelled input under a label naming a
          control that isn't there — so the label states what is actually below
          it, and only names the team when the team is being asked for.

          **Why the label is not the question itself.** "Are you already at a PL
          network team?" is what the pair used to ask implicitly, and it was
          always the better question — it just had nowhere to live, because a
          question-shaped label over a `role` that was then required and an
          optional team would make the required half read as skippable. The
          checkbox above is that question, given its own control. The label is
          free to be a label again.

          (The pair is no longer mixed — neither half is required now — so that
          objection has lapsed. The label stays a label anyway: the checkbox is
          still the better home for the question, and a second question-shaped
          line under it would be the same ask twice.) */}
      <div className={s.column}>
        {/* **The label is constant now, and so is the mark.**

            It used to grow a second noun with the tick ("Current role & PL
            network team") so one label could name both inputs under it. Each
            input carries its own accessible name below, so the visible label no
            longer has to do the naming for two fields at once — and a label that
            changes under you as you tick a box is a label you have to re-read.

            The mark is new and does not move. The role is required in both
            states now (see the schema), so a mark that arrived with the tick
            would be describing a rule that no longer does. One mark for the row
            rather than one per field: it reads as covering both, and once ticked
            both are asked for. */}
        <div className={s.inputsLabel}>
          Current role
          <RequiredMark />
        </div>
        <div className={s.inputsWrapper}>
          {/* `aria-label` because this input has no `label` of its own and the
              `.inputsLabel` above is a plain div associated with neither half of
              the row. It was already unnamed to a screen reader; shortening the
              visible label is what makes fixing it non-optional. */}
          <FormField name="role" placeholder="Enter your current role" aria-label="Current role" />
          {/* The `@` is part of the pair, not part of the role field. It joins
              two controls, so it renders only when there are two to join —
              left standing on its own it is a preposition with nothing after
              it, pointing at a select that isn't there. */}
          {atPlTeam && (
            <>
              <span className={s.separator}>@</span>
              {/* "Select a team", not the source's "Search or add a team". Two
                  reasons, both still true now the word is "team". It fits on one
                  line at this width — the longer string wrapped and left the
                  select taller than the role field beside it, so a paired row
                  stopped looking paired. And "add" would be a promise this
                  select doesn't keep: production backs that word with an inline
                  add-a-team form behind the select's empty state, which this
                  prototype doesn't carry.

                  It no longer needs a hint saying a blank is a correct answer.
                  That sentence existed because the select was on screen for
                  everybody, including the people it was never for — the closed
                  list read as a wall to anyone whose employer wasn't on it. Only
                  people who have said they are on a network team see it now, so
                  the empty case it was reassuring has stopped happening here. */}
              <FormSelect
                name="company"
                placeholder="Select a team"
                isClearable
                options={companyOptions}
                aria-label="PL network team"
              />
            </>
          )}
        </div>
        {/* (A one-line description sat under this row — "Fill in if you are
            already at a PL network team." — hand-rolled with `FormField`'s own
            `.fieldDescription` rather than passed to `FormSelect`, because the
            two components' description slots disagree on size, weight, leading
            and colour, and `FormSelect`'s raw `#878b94` is not in the PL
            palette.

            The sentence is gone because the checkbox above **is** that
            sentence, promoted from fine print to a control. It was doing the
            work of a condition ("fill in if…") in a voice that can only advise,
            under a select that was on screen whether or not the condition held.
            The checkbox states the same condition and then acts on it, which is
            the difference between telling someone a field may not be for them
            and not showing them the field.

            The `FormField`-vs-`FormSelect` description finding outlives the
            sentence and is worth keeping: if a description is ever needed under
            a select on this form, hand-roll it with `ff.fieldDescription` — the
            two slots are not interchangeable.) */}
      </div>

      {/* (The `Team email` field stood here — a hand-rolled `(Optional)` label
          over a `FormField`, last in the group and directly under the team select.
          Gone; see the note on `AccountFormData`. The hand-rolled-label pattern
          it demonstrated is still in use one field up, on `LinkedIn profile`, so
          nothing about how this form places a marked label is lost with it.) */}
    </div>
  );
}
