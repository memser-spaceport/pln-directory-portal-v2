'use client';

import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import * as yup from 'yup';

import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
// The design system's checkbox, so the one control on this form that isn't a
// text input is still the product's own. Shape of the labelled row is copied
// from `SecRulesCheckbox` (a `<label>` around the control and its words); the
// import is this one rather than its raw base-ui root.
import { Checkbox } from '@/components/common/Checkbox';

// One applicant across the sign-up form, the pre-filled account step and the
// profile behind them — see the note in `viewerIdentity`.
import { VIEWER_EMAIL, VIEWER_NAME, VIEWER_ROLE, VIEWER_LINKEDIN } from './profile/viewerIdentity';
// `FormField`'s own description class, for the one line this group places by
// hand under a whole row rather than under a single control.
import ff from '@/components/form/FormField/FormField.module.scss';

/* (`OptionalMark` was imported here for the LinkedIn label. LinkedIn is required
    now, so the only marked-optional field on this form is gone and with it the
    reason to hand-roll a label at all — `FormField`'s own `label` + `isRequired`
    covers every field in the group. The component itself is untouched and still
    used elsewhere in `profile-shared`.) */

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
   * "I'm already a member of a PL Network team" — the switch that reveals the
   * team select below the role input.
   *
   * It is form state rather than component state because it is an *answer*: it
   * decides whether `company` is a question this person was asked at all, and a
   * value that governs another value has to live where that value lives, or the
   * two disagree the moment the group unmounts and remounts (which it does —
   * the modal and the drawer's step 2 are two hosts).
   */
  onPlTeam: boolean;
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
  /* Unchecked, and that is the honest default: most people arriving at a public
     job board are not already on a PL network team, so the form opens in the
     shape that fits them and the select is something you ask for rather than
     something you dismiss. */
  onPlTeam: false,
  company: null,
};

/**
 * The same form, filled in — one fixture, used by every surface that needs to
 * show this form already answered.
 *
 * Two of those exist: `JobSignUpModal`'s filled design-canvas frame, and the
 * `signed-up-modal` viewer, whose account step opens pre-filled because that
 * person typed these answers into the modal a moment ago. They were separate
 * literals; one fixture means the two can never disagree about who signed up.
 */
export const FILLED_ACCOUNT_FORM: AccountFormData = {
  email: VIEWER_EMAIL,
  name: VIEWER_NAME,
  linkedin: VIEWER_LINKEDIN,
  role: VIEWER_ROLE,
  /* Not on a PL team: the shorter form, and the one the checkbox defaults to.
     A filled fixture that also happened to exercise the gated select would be
     showing the uncommon case as the representative one. */
  onPlTeam: false,
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
  /* (`teamEmail`'s rule — the same shape test as `email` minus `required()` —
     went with the field. Deleted rather than left defined-but-unrendered: a
     schema key with no input is a validation nobody can fail, and the next
     reader has to open the form to find that out.) */
  name: yup.string().required('Name is required'),
  /* **Required, where it used to be the form's one optional field.**
     What changed is what the answer is for. It was a link that would sit on the
     profile — nice to have, skippable — and it is now the only thing on this
     form a human reviewer can actually check: an email and a typed job title are
     claims, a LinkedIn profile is a person. The PL team approves these accounts
     by hand, so the field that makes that possible is not an extra.

     The format test keeps its `return true` on empty. That is not a loophole —
     `.required()` below owns the empty case and says so in its own words, and a
     blank field answered with "enter a valid LinkedIn handle or URL" would be
     telling someone their nothing is malformed. One rule, one message. */
  linkedin: yup
    .string()
    .defined()
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
  role: yup.string().required('Role is required'),
  /* No rule of its own: it is a switch, not an answer to validate, and both of
     its states are valid. It is in the schema so `AccountFormData` and the
     resolver agree on the shape of the form — a key react-hook-form holds and
     yup has never heard of is the drift this file exists to prevent. */
  onPlTeam: yup.boolean().default(false),
  /* Still nullable, and still with no `when('onPlTeam')` rule. The select is
     optional whether or not it is on screen: someone can be at a network team
     the closed list doesn't carry, tick the box honestly, and find nothing to
     pick. Requiring it would turn an honest tick into a dead end. */
  company: yup.mixed<{ label: string; value: string }>().nullable(),
});

/** Form state → the answers. One flattener, so the modal and the pane cannot
 *  disagree about whether `company` travels as a label or a uid.
 *
 *  **`onPlTeam` does not appear in `AccountDetails`, and shouldn't.** It is the
 *  question, and `company` is the answer: an empty company already says "not on
 *  a network team", so carrying the flag downstream would give every consumer
 *  two fields to reconcile and one of them redundant. It is read here only to
 *  make sure the two can never disagree — the group clears `company` when the
 *  box is unticked, and this is the belt to that's braces, for the one render
 *  where a stale option could still be sitting in form state. */
export const toAccountDetails = (data: AccountFormData): AccountDetails => ({
  name: data.name.trim(),
  email: data.email.trim(),
  linkedin: (data.linkedin ?? '').trim(),
  role: data.role.trim(),
  company: data.onPlTeam ? (data.company?.label ?? '') : '',
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
  const { setValue } = useFormContext<AccountFormData>();

  /* Read here rather than inside `FormField`, which watches its own value only
     to drive a character counter — the *description* is the host's to compose,
     and this is the host. `useWatch` re-renders this group on the keystroke that
     completes a domain, which is the one moment the note has something to say. */
  const email = useWatch<AccountFormData, 'email'>({ name: 'email' }) ?? '';

  /* The team row's switch, watched for the same reason: the group re-renders on
     the tick, because the tick is what puts the select on screen. */
  const onPlTeam = useWatch<AccountFormData, 'onPlTeam'>({ name: 'onPlTeam' }) ?? false;

  /* Unticking clears the team rather than hiding it.
     A hidden select still holding "Filecoin Foundation" would submit an employer
     the person has just told the form they don't have — the answer would be
     invisible, kept, and wrong, which is the worst of the three. So the switch
     owns the field it reveals in both directions. */
  const toggleOnPlTeam = (next: boolean) => {
    setValue('onPlTeam', next, { shouldDirty: true });
    if (!next) setValue('company', null, { shouldDirty: true });
  };

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
          description still says what it is *for* — a required field owes the
          person an answer to "why are you asking?" at least as much as an
          optional one did, and this is the only field here whose payoff isn't
          self-evident from its label.

          The description used to end "...bring your LinkedIn profile as a PDF in
          the next step", pointing at the importer's LinkedIn door. That door is
          gone, so the sentence went with it rather than surviving as an
          instruction for a control nobody will find. What is left is the whole
          truth about this field: it is a link on your profile, not a way to fill
          anything in. */}
      {/* **Required now, and back on `FormField`'s own label.**

          It used to be optional, and it wore a hand-rolled label so it could
          carry `(Optional)`. The argument for that mark was a *system*: Team
          email had one, required fields carry `*`, so the one other skippable
          field had to be marked or it would be the input whose state you work
          out from an absent asterisk. Team email is long gone and LinkedIn is
          required, so the system has no optional members left — there is nothing
          for a mark to distinguish, and the only honest state left on this form
          is `*`.

          Which means the hand-rolled label goes too. It existed solely because
          `FormField`'s `label` prop takes a string and a mark is a node; with no
          mark, `label` + `isRequired` is the component doing its own job, and
          this field stops being the one place the group draws a label by hand
          (it associates the label with the input, which the hand-rolled version
          never did — see the note under the team row for the same debt). */}
      <FormField
        name="linkedin"
        label="LinkedIn profile"
        isRequired
        placeholder="eg., johndoe or https://linkedin.com/in/johndoe"
        description="Shown on your profile, alongside your other links."
      />

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

          **The question is now a checkbox, and the label is back to naming one
          field.** It used to be a pair — "Current role & PL network team" — over
          a row that always showed both halves, and the label had to state the
          pair because there was no other way to say that only the second half
          was optional. It could not be written as the question itself ("Are you
          already at a PL network team?") for exactly that reason: a
          question-shaped label over a required `role` would make the required
          half read as skippable.

          The checkbox above takes the question, which frees the label to name
          what is under it. Most people on a public job board are not on a PL
          network team, and the old row put a select in front of all of them
          whose only correct answer was to leave it alone — a closed list of six
          teams reads as a wall to everyone not on it, and the sentence
          underneath existed to talk them past a control they should never have
          been shown. Now the default form is the one that fits them: a role
          input and nothing else. Ticking the box is what asks for the select,
          which turns "leave it blank if this isn't you" into "say so, and we'll
          ask". The description below survives, because the tick is where its
          condition now lives. */}
      <div className={s.checkboxGroup}>
        {/* The `<label>` wraps both, so the sentence is the hit area — a 20px
            box is a small target and the words next to it are the obvious one.
            Shape from `SecRulesCheckbox`, the repo's own labelled checkbox;
            control from `@/components/common/Checkbox`, which is that pattern's
            base-ui root already dressed in the design system.

            First person ("I'm already a member…") rather than the form's usual
            noun-phrase labels, and deliberately so: every other line in this
            group names a thing to fill in, and this one is a claim the person is
            making about themselves. It is the same voice the DS uses for its
            other checkbox — "I'm an accredited investor under SEC rules" — which
            is the nearest thing this codebase has to a precedent for a box you
            tick about yourself. */}
        <label className={s.checkboxRow}>
          <Checkbox checked={onPlTeam} onChange={toggleOnPlTeam} />
          I&apos;m already a member of a PL Network team
        </label>

        <div className={s.column}>
          <div className={s.inputsLabel}>{onPlTeam ? 'Current role & PL network team' : 'Current role'}</div>
          <div className={s.inputsWrapper}>
            <FormField name="role" placeholder="Enter your current role" />
            {/* The `@` and the select appear together or not at all. The
                separator is punctuation *between* two fields — on its own beside
                a single input it is a dangling preposition, a row that looks
                like it lost something. So the reveal is the whole right-hand
                half of the row, not just the control. */}
            {onPlTeam && (
              <>
                <span className={s.separator}>@</span>
          {/* "Select a team", not the source's "Search or add a team". Two
              reasons, both still true now the word is "team". It fits on one
              line at this width — the longer string wrapped and left the select
              taller than the role field beside it, so a paired row stopped
              looking paired. And "add" would be a promise this select doesn't
              keep: production backs that word with an inline add-a-team form
              behind the select's empty state, which this prototype doesn't
              carry.

              The hint below is the one thing neither the label nor the list can
              show: that a blank is still a *correct* answer even here. The
              checkbox now filters out everyone who isn't on the network, but it
              does not filter out someone who is on a team this closed list of
              six doesn't carry — and for them the wall is exactly as high as it
              ever was. */}
                <FormSelect name="company" placeholder="Select a team" isClearable options={companyOptions} />
              </>
            )}
          </div>
        {/* **Hand-rolled with `FormField`'s own `.fieldDescription`, not passed
            to `FormSelect` as a `description` prop.**

            It was that prop first, which looked like the in-pattern choice —
            `FormSelect` renders `description` under its control in its own
            `Field.Root`, the same slot `FormField` uses. The two components do
            not agree on what that slot looks like. Measured on this form, the
            three descriptions read:

              LinkedIn (FormField) .... 12px / 18px / 400 / #455468 / mt 8
              this one (FormSelect) ... 10px / 20px / 500 / #878b94 / mt 0
              Team email (FormField) .. 12px / 18px / 400 / #455468 / mt 8

            Five divergences, and not one of them was a decision — they are two
            stylesheets' defaults meeting in one card. The 200% leading is what
            reads as wrong (a 10px line with 20px of air around it looks like a
            caption that came loose), but the raw `#878b94` is the worse half:
            it is not in the PL palette, which is the same reason `.inputsLabel`
            below swapped production's `#475569` for the token pair.

            So it wears the treatment the other two already have rather than a
            new one invented to sit between them.

            **And it moved out of the select's column, under the whole row.**
            At 10px it wrapped to two lines inside a 241px half; at 12px it
            would have been three. Given the row's full width it is one line —
            and it belongs to the pair anyway, which is how the group is
            labelled one line above.

            The cost, stated: `Field.Description` inside `FormSelect` is
            associated with the control; this `<p>` is not. DOM order still puts
            it immediately after the row, and the group's own label is already a
            plain `<div>` with no `htmlFor` — production's `SignupWizard` does
            the same — so this group was never programmatically labelled to
            begin with. Worth fixing properly if the pattern spreads. */}
        {/* One sentence, and it is an instruction rather than an explanation.

            This went through two longer versions. The first was a rule about the
            list — "Only teams already on the PL network are listed, leave it
            blank if yours isn't one" — which describes the select's contents and
            leaves the reader to work out whether the question is for them. The
            second put a payoff in front of that ("Helps the PL team place you
            when they review your account"), on the reasoning that an optional
            field with no stated reason is one people skip.

            Both were answering a question nobody was asking. The only thing a
            person needs here is whether to type: *are you at one of these
            teams?* — yes, fill it in; no, move on. "Fill in if" carries the
            condition and the permission in one clause, so the blank case needs no
            sentence of its own, and the payoff was justifying a field that costs
            one glance to skip.

            It still names the network, which is the one thing neither the control
            nor the list can show a person whose employer isn't on it.

            **Rewritten, and now conditional on the tick.** It used to read "Fill
            in if you are already at a PL network team", which is the condition
            the checkbox above has taken over — under an unticked box it would be
            pointing at a select that isn't on screen, and under a ticked one it
            would be asking a question the person has just answered. So it only
            renders with the row it belongs to, and it says the one thing the
            tick does not settle: the list is closed and short, and finding
            nothing in it is not a failed answer. */}
          {onPlTeam && (
            <p className={ff.fieldDescription}>Leave the team blank if yours isn&apos;t on the list yet.</p>
          )}
        </div>
      </div>

      {/* (The `Team email` field stood here — a hand-rolled `(Optional)` label
          over a `FormField`, last in the group and directly under the team select.
          Gone; see the note on `AccountFormData`. The hand-rolled-label pattern
          it demonstrated went too, when LinkedIn became required and lost its
          `(Optional)` mark — every label in this group is `FormField`'s own
          again, which is the better end state.) */}
    </div>
  );
}
