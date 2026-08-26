'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Checkbox } from '@/components/common/Checkbox';
import { EditIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormSwitch } from '@/components/form/FormSwitch';
import { MonthYearSelect } from '@/components/form/MonthYearSelect';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
// Production's own dates group — the wrapper `EditExperienceForm` puts its two
// month/year selects and the `Present` switch in. Imported for the same reason
// the row and the field panel are: the corrected dates should sit exactly as
// they sit in the form that will own them afterwards.
import di from '@/components/page/member-details/ExperienceDetails/components/ExperienceDatesInput/ExperienceDatesInput.module.scss';
// The white field panel and its row measure — the same sheet the profile card's
// own editor wears, so this card sits in the stack as one more edited section
// rather than as a dialog that wandered in.
import f from '@/components/page/member-details/ProfileDetails/components/EditProfileForm/EditProfileForm.module.scss';
// The list row: the 12px grey `.expItem`, its two label ranks and the vertical
// rule between facts. A found position is shown in the shape it will take once
// it is a real entry — the checkbox simply stands where the briefcase will.
import e from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList/ExperiencesList.module.scss';

// Production's `FormTagsInput` with the DS ✕ instead of react-select's filled
// one. It lives in the job-board entry because that is where the swap was first
// needed; it has no coupling to that prototype and should move up here the day a
// second entry wants it.
import { SkillsTagsInput } from '../../job-board/SkillsTagsInput';

import { isoToYm, ymToIso } from './dateBridge';
import type { ImportSelection, ParsedExperience, ParsedProfile } from './types';
import r from './ExperienceImportReview.module.scss';

/**
 * What the document said, before any of it is yours.
 *
 * **Why this is a card and not a modal.** The drawer already has one grammar for
 * changing a section: the card swaps itself for an editor with a title, a
 * Cancel and a Save, and only one is open at a time. A parse result is a change
 * to that section, so it wears that grammar — `EditOfficeHoursFormControls` at
 * the top, the same white field panel underneath. A modal would be a second way
 * to do the same thing, one card apart.
 *
 * **What can be corrected here, and what changed.** This card used to take
 * exactly one correction — a missing start date — and the note here argued that
 * everything else should wait for the pencil on the saved row, because a second
 * inline editor would be a copy of `ExperienceForm` that can drift from it. The
 * ask that overturned it: *"edit one experience item if something is just
 * slightly wrong."* A parser that splits a company name in two produces a row
 * you can see is wrong at the moment you are looking at it, and sending someone
 * to Save-then-find-the-row-then-press-the-pencil to fix a typo is three moves
 * for a two-character edit. So a row now opens in place (`ExperienceRowFields`).
 *
 * The drift worry was real and is answered rather than ignored:
 *
 *  - the editor is production's own field components, with `EditExperienceForm`'s
 *    labels and placeholders verbatim, so there is nothing hand-rolled to drift;
 *  - it edits **only the facts the row displays** — role, company, location and
 *    the dates. The description is not shown anywhere in this card, and offering
 *    to edit an invisible field is how a review turns into a form;
 *  - `ExperienceForm` itself is *not* mounted here, and can't be: it brings its
 *    own `<form>` element, and this card is already inside one. Nested forms are
 *    invalid HTML and the inner Save bubbles out — `profile-settings` has the
 *    receipt for exactly that bug.
 *
 * The card's remaining fields follow the same rule they always did: it asks only
 * for what the profile is still missing (`askName` / `askEmail` / `askRole` /
 * `askLocation`), because an import must never offer to overwrite an answer
 * someone gave by hand.
 *
 * **Why nothing is pre-merged.** Skills shows only what the document added, not
 * the union with what you already had: a card that lists skills you typed last
 * year alongside the ones just parsed is claiming credit for both, and the
 * person then has to work out which half is new.
 */

/* `source` used to be a prop. Its only consumer was the lede's "From your
   resume" / "From your LinkedIn export", and with that line gone nothing here
   asks which door the document came through — so the prop went with it rather
   than sitting unused waiting for someone to re-derive a use for it. */
interface ExperienceImportReviewProps {
  parsed: ParsedProfile;
  /**
   * The account's own two facts, as the host knows them right now.
   *
   * Same contract as `currentRole` below — empty means the card offers to fill
   * it, set means it is not asked about at all. Required rather than optional
   * *because* of that contract: an omitted prop would default to empty, which
   * means "ask", so a host that simply forgot would start offering someone the
   * email they signed up with. Passing a value is the host saying it looked.
   *
   * This is the whole reason the rule lives in props instead of in the card: the
   * job board is signed in and has both, onboarding has a name from sign-up and
   * no email yet, settings has both on screen two sections up. Three different
   * answers, one rule, no `if (host === …)` anywhere in here.
   */
  currentName: string;
  currentEmail: string;
  /** On the profile now. Empty means the card offers to fill it; set means it
   *  isn't asked about at all — an import shouldn't offer to overwrite an answer
   *  the person gave by hand. */
  currentRole: string;
  currentLocation: string;
  /** Used only to subtract: what the document found that isn't already there. */
  currentSkills: string[];
  /**
   * The work history already on the profile, for the second and later imports.
   *
   * Without it a re-upload of the same CV appends every position again — three
   * roles become six, silently. Rows matching one of these arrive **labelled and
   * unticked** rather than filtered out: someone who drops a newer CV and is
   * shown "2 found" for a document listing five has been given a puzzle, not a
   * shortcut. Shown-and-off says the same thing and leaves the override in their
   * hands, which matters when the match is only *nearly* right — a corrected end
   * date, a company that changed its name.
   */
  currentExperiences?: Array<{ title: string; company: string; startDate: string }>;
  /** The host's own date formatter, so a found row reads exactly the way the
   *  list it is about to join reads. */
  formatDates: (entry: { startDate: string; endDate: string | null; isCurrent: boolean }) => string;
  /** The host's fix-ups for the field panel inside a drawer, if it has any. */
  bodyClassName?: string;
  onClose: () => void;
  onSubmit: (selection: ImportSelection) => void;
}

type Row = ParsedExperience & { include: boolean; duplicate: boolean };

type ReviewFormData = { name: string; email: string; role: string; location: string; skills: string[] };

/**
 * The row editor's fields, and only the ones the row shows.
 *
 * `ExperienceFormData` in `JobProfilePane` is this plus `description`. The
 * difference is the point — see the note on `ExperienceRowFields`.
 */
type RowFormData = {
  title: string;
  company: string;
  location: string;
  /** ISO while in the form — see `dateBridge`. */
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
};

/**
 * WHEN TWO ROWS ARE THE SAME JOB: role, company and start date.
 *
 * Not the description, which a parser rewords between runs, and not the end
 * date, which is the field most likely to have legitimately changed since the
 * last import — matching on it would call a finished job a different job. Case-
 * and space-insensitive, because the two sides came out of two different reads
 * of the same document.
 *
 * Exported because the design canvas seeds a profile that has already been
 * through one import and then imports over it, and a second copy of this rule
 * would drift from this one silently.
 */
export const experienceKey = (entry: { title: string; company: string; startDate: string }) =>
  [entry.title, entry.company, entry.startDate].map((value) => value.trim().toLowerCase()).join('|');

export function ExperienceImportReview(props: ExperienceImportReviewProps) {
  const {
    parsed,
    currentName,
    currentEmail,
    currentRole,
    currentLocation,
    currentSkills,
    currentExperiences = [],
    formatDates,
    bodyClassName,
    onClose,
    onSubmit,
  } = props;

  const alreadyHave = useMemo(() => new Set(currentExperiences.map(experienceKey)), [currentExperiences]);

  const isDuplicate = (item: ParsedExperience) => alreadyHave.has(experienceKey(item));

  const [rows, setRows] = useState<Row[]>(() =>
    parsed.experiences.map((item) => {
      const duplicate = isDuplicate(item);
      /* Off by default when it is already there — the only row state in this
         card that isn't "yes, add it". */
      return { ...item, duplicate, include: !duplicate };
    }),
  );
  /* Date errors appear on the first blocked Save, not while the card is being
     read. A row that arrives incomplete is the parser's shortcoming, not the
     person's mistake, and marking it red before they have done anything reads as
     an accusation. */
  const [showDateErrors, setShowDateErrors] = useState(false);
  /* One row open at a time, and the card's only piece of mode.

     Not a set, and not `rows.map(r => r.editing)`: the drawer's grammar is that
     one editor is open at a time, and a single nullable key is the only shape
     that cannot express two. The pencils on the other rows are not rendered
     while it holds — see the note where they are drawn. */
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const askName = currentName.trim() === '';
  const askEmail = currentEmail.trim() === '';
  const askRole = currentRole.trim() === '';
  const askLocation = currentLocation.trim() === '';
  const asksDetails = askName || askEmail || askRole || askLocation;

  /* Only what the document added. See the note above. */
  const newSkills = useMemo(() => {
    const have = new Set(currentSkills.map((skill) => skill.toLowerCase()));
    return parsed.skills.filter((skill) => !have.has(skill.toLowerCase()));
  }, [currentSkills, parsed.skills]);

  const methods = useForm<ReviewFormData>({
    mode: 'onSubmit',
    defaultValues: {
      /* Seeded either way, asked about only when blank. The unasked half never
         renders a field, but it still has to be in the form: `ImportSelection`
         promises a value for every one of them, and reading it back off the same
         object the fields write to is one source instead of two. */
      name: askName ? (parsed.name ?? '') : currentName,
      email: askEmail ? (parsed.email ?? '') : currentEmail,
      role: askRole ? parsed.role : currentRole,
      location: askLocation ? parsed.location : currentLocation,
      skills: newSkills,
    },
  });

  const setRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const included = rows.filter((row) => row.include);
  const missingDates = included.filter((row) => row.startDate === '');

  const submit = (data: ReviewFormData) => {
    if (missingDates.length > 0) {
      setShowDateErrors(true);
      return;
    }
    onSubmit({
      experiences: included.map(({ include, duplicate, ...entry }) => entry),
      skills: data.skills ?? [],
      name: (data.name ?? '').trim(),
      email: (data.email ?? '').trim(),
      role: (data.role ?? '').trim(),
      location: (data.location ?? '').trim(),
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit(submit)}
        /* Production's form-level Enter guard — the skills input commits a tag on
           Enter without cancelling the event, so without this the second skill
           saves the card. */
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') ev.preventDefault();
        }}
      >
        <EditOfficeHoursFormControls onClose={onClose} title="Review your experience" alwaysEnabled />

        {/* No lede and no group caption above the fields.
            Both were removed on request, and both were explaining what the card
            already shows: Cancel and Save sit in the header, so "nothing is
            added until you press Save" is the button saying it twice, and two
            labelled fields prefilled with the document's answers do not need a
            sentence telling you they came from the document and can be edited.
            The one line kept is the footnote, which says something the card
            *can't* show — what remains possible after Save. */}
        <div className={clsx(f.body, bodyClassName, r.body)}>
          {/* 1. The details the profile is still missing. First, because the
                 current role is what the board requires before you can apply,
                 and the drawer's rule is that required things are asked for
                 first rather than three groups down. Unheaded: labelled fields
                 are their own heading, and "Experience (N found)" below is a
                 count rather than a label, which is why that one stays.

                 **Why the contact details join this group instead of getting
                 their own.** Name and email are the same kind of thing as role
                 and location here: a scalar the document had at the top of the
                 page, offered only where the profile is blank. This group is
                 already the one that owns that question — it *is* "the blanks a
                 document can fill" — so a second headed group beside it would be
                 two boxes for one idea, and would force a heading onto the four
                 fields that are perfectly legible as four labelled fields. The
                 group also never shows all four at once in practice: the job
                 board shows none of them, onboarding shows an email and maybe a
                 location. A "Contact details" heading over one email field is
                 chrome charging rent on a single input.

                 **Why name and email come first.** Production's onboarding
                 `ProfileStep` is exactly these two fields in exactly this order,
                 and it is the one place the product already pairs them; the
                 profile header card then reads name, role, location down the
                 page. Identity, then how to reach you, then what you do and
                 where — which is also the order a CV's header block prints in,
                 so the fields land in the order the person is reading them off
                 their own document. Role staying above location is unchanged,
                 and the requirement argument above was always about the *group*
                 being first, not about which field opens it. */}
          {asksDetails && (
            /* Two across rather than a stack — see `.detailsGrid`. Not
               `r.group`: these four are one-line answers where every other group
               in the card is full-width by nature. */
            <section className={r.detailsGrid}>
              {askName && (
                <div className={f.row}>
                  {/* Label and placeholder are the settings page's, which is the
                      other surface in these prototypes that edits these two
                      fields. Production's own onboarding placeholders are "User
                      Name" / "User@mail.com"; the label is what matters and it
                      agrees, and one voice across the two surfaces beats
                      transcribing a placeholder nobody defends. */}
                  <FormField name="name" label="Name" placeholder="Your full name" />
                </div>
              )}
              {askEmail && (
                <div className={f.row}>
                  <FormField name="email" label="Email" placeholder="you@example.com" />
                </div>
              )}
              {askRole && (
                <div className={f.row}>
                  <FormField name="role" label="Current role" placeholder="e.g. Senior Protocol Engineer" />
                </div>
              )}
              {askLocation && (
                <div className={f.row}>
                  <FormField name="location" label="Location" placeholder="e.g. Berlin, Germany" />
                </div>
              )}
            </section>
          )}

          {/* 2. The positions — when the document carried any.
                 A parse now reaches this card as long as it found *something*
                 (see `isEmptyParse` in the panel), so a two-column CV whose
                 skills and headline read cleanly but whose job history did not
                 arrives here with an empty list. Hidden rather than shown as
                 "Experience (0 found)": that heading is a report on the file,
                 and reporting a zero to someone who can see the empty space
                 under it is the card being pleased with itself. */}
          {rows.length > 0 && (
            <section className={r.group}>
              {/* Counts what the document held, not what is ticked — the number
                is a fact about the file, and a count that dropped as you
                unticked rows would be reporting your edits back to you. */}
              <h3 className={r.groupTitle}>Experience ({rows.length} found)</h3>
              <ul className={r.rows}>
                {rows.map((row) => {
                  const needsDate = row.startDate === '';
                  const dateError = showDateErrors && row.include && needsDate;
                  const editing = editingKey === row.key;

                  return (
                    <li key={row.key} className={clsx(e.expItem, r.rowItem, { [r.rowOff]: !row.include })}>
                      {/* Outside the editor on purpose. Opening a row to fix a
                        typo must not change whether it is being added — and the
                        surest way to guarantee that is for the tick to be the
                        same control in both states, sitting in the same place,
                        untouched by the fields beside it. It also means a row
                        can still be dropped without closing the editor first. */}
                      <div className={r.rowCheck}>
                        <Checkbox checked={row.include} onChange={(next) => setRow(row.key, { include: next })} />
                      </div>
                      <div className={clsx(e.details, r.rowDetails)}>
                        {editing ? (
                          <ExperienceRowFields row={row} onChange={(patch) => setRow(row.key, patch)} />
                        ) : (
                          <>
                            <div className={e.row}>
                              <div className={e.primaryLabel}>{row.title}</div>
                              {row.company && (
                                <>
                                  <span className={e.Separator} />
                                  <div className={e.primaryLabel}>{row.company}</div>
                                </>
                              )}
                              {row.location && (
                                <>
                                  <span className={e.Separator} />
                                  <div className={e.primaryLabel}>{row.location}</div>
                                </>
                              )}
                            </div>
                            <div className={e.row}>
                              <div className={e.secondaryLabel}>
                                {needsDate ? 'No dates in the document' : formatDates(row)}
                              </div>
                              {/* Says why this one row arrived switched off.
                                Without it an unticked row in a card whose other
                                rows are ticked reads as the parser being unsure
                                about it, which is a different and more worrying
                                claim. On the secondary line rather than beside
                                the title: it is a fact about the row's *state*,
                                not part of the job.

                                It survives an edit, and deliberately is not
                                recomputed from the corrected fields. `duplicate`
                                is a fact about what the document said, matched
                                against what was already saved; re-running the
                                match after someone fixes a mangled company name
                                would decide the row is a different job, tick it
                                back on, and append the position a second time —
                                which is the exact bug the flag exists to
                                prevent. */}
                              {row.duplicate && <span className={r.rowAlready}>Already on your profile</span>}
                            </div>

                            {/* The correction this card has always taken, and the
                              one it still offers without opening the editor. A
                              start date is required by the record, and "2021 –
                              present" with no month is the commonest thing a
                              parser hands back — so it is asked for here rather
                              than discovered as a failure after Save. Only while
                              the row is included: a row on its way to being
                              dropped owes nothing.

                              Still its own control rather than folded into the
                              editor: this one is a *demand*, raised by the card
                              because Save is blocked on it, and it has to be
                              visible without anyone going looking. The editor is
                              an offer. */}
                            {needsDate && row.include && (
                              <div className={r.rowDate}>
                                <MonthYearSelect
                                  label="Start Date"
                                  isRequired
                                  error={dateError ? 'Start date is required' : undefined}
                                  value={ymToIso(row.startDate || null)}
                                  onChange={(value) => {
                                    if (value === null) return;
                                    setRow(row.key, { startDate: isoToYm(value) ?? '' });
                                  }}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* The row's own control, in `ExperiencesList`'s own slot —
                        `.expItem` reserves 32px on the right for exactly this,
                        and the saved row this one is about to become carries the
                        same pencil in the same place. One gesture, learned once.

                        **Why the other pencils disappear while one row is open.**
                        The drawer's rule is one editor at a time, and it gets it
                        for free by replacing the whole list with the form. Here
                        the editor opens in place, so the other rows are still on
                        screen and their pencils would be a second door into a
                        second editor. Hiding them says "finish this one" without
                        a disabled state, and without the alternative — swapping
                        editors on click — quietly dropping whatever was typed.

                        `Done` rather than `Save`: nothing is saved by it. The
                        fields write straight through to the row, exactly as the
                        start-date correction above always has, so this only
                        folds the row back up. The card's Save in the header is
                        the only Save on this surface, and it stays live the
                        whole time — two Saves with different scopes on one
                        screen is a question nobody should have to answer. */}
                      {/* The slot is always here, even when it holds nothing.

                        That is the whole fix for a row that changed width as you
                        used it. `$row-action` was already sized to the wider of
                        the two controls so `Done` and the pencil couldn't shift
                        the content column between them — but the third state,
                        *no control at all*, was rendering `false` and releasing
                        the slot entirely. So the moment one row opened, every
                        other row silently grew by 52px (36 slot + 16 gap) while
                        the open one kept its 36 — the editing fields ending up
                        visibly short of the read rows above them. A reserved
                        slot has to be reserved in all three states, not two. */}
                      <div className={r.rowAction}>
                        {editing ? (
                          <button type="button" className={r.rowDone} onClick={() => setEditingKey(null)}>
                            Done
                          </button>
                        ) : (
                          editingKey === null && (
                            <button
                              type="button"
                              className={clsx(e.editBtn, r.rowEdit)}
                              onClick={() => setEditingKey(row.key)}
                              aria-label={`Edit ${row.title || 'this position'}`}
                            >
                              <EditIcon />
                            </button>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 3. Skills. Editable rather than a checklist: the tags input is the
                 control this profile already uses for skills, and it lets
                 someone drop a bad parse and add the one it missed in the same
                 gesture. */}
          {newSkills.length > 0 && (
            <section className={r.group}>
              <SkillsTagsInput
                name="skills"
                selectLabel={`Skills (${newSkills.length} found)`}
                placeholder="Add a skill"
              />
            </section>
          )}

          {/* Only where it is true. It points at the Experience card, so with no
              positions to add there is nothing there to go and edit — and a
              reassurance about a card you were never given anything for is the
              kind of leftover line that makes the rest of them less believed. */}
          {rows.length > 0 && (
            <p className={r.footnote}>You can edit or delete any of these afterwards from the Experience card.</p>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

/* ------------------------------------------------------- one row, corrected --- */

/**
 * The fields for one parsed position, in place of the row that showed it.
 *
 * **What it is made of.** `FormField`, `MonthYearSelect` and `FormSwitch`, with
 * `EditExperienceForm`'s labels and placeholders word for word, inside
 * production's own `ExperienceDatesInput` wrapper. Nothing here is hand-rolled;
 * it is the form the pencil on a saved row opens, minus two of its parts.
 *
 * **The two it drops, and why.**
 *
 *  - *Impact or Work Description.* The review never shows a description — not on
 *    the row, not anywhere in the card — so an editor for it would be the only
 *    field on screen whose current value is invisible. It also means mounting a
 *    rich-text editor inside a 12px grey list row, which is a card inside a row.
 *    The parsed description rides along untouched and the footnote already
 *    points at where to write one.
 *  - *Delete Experience.* The checkbox two columns to the left already means
 *    "don't add this", non-destructively and reversibly. A red Delete beside it
 *    would be a second control for the same decision, and the louder of the two
 *    would be the one that can't be undone.
 *
 * **Why it writes through instead of having its own Save.** The card already had
 * one inline correction — the missing start date — and it has never had a commit
 * step: `onChange` writes to the row and that is the whole interaction. Doing
 * anything else here would put a second Save on a card that has one in its
 * header, with a narrower scope, three inches apart. So every field writes to
 * `rows` as it changes, `Done` only folds the row back up, and the card's Save
 * can be pressed at any moment without losing a keystroke.
 *
 * A nested `FormProvider`, not a nested `<form>`: the fields need RHF context
 * and the card is already inside a form element. One is context, the other is
 * invalid HTML that swallows submits.
 *
 * The validation `ExperienceForm` runs (role, company and start date required,
 * end date unless Present) is deliberately *not* re-registered here. There is
 * nothing to validate against — no submit of its own — and the one rule that
 * actually blocks Save, the missing start date, is already enforced by the card
 * for every row whether or not anyone opened it.
 */
function ExperienceRowFields({ row, onChange }: { row: Row; onChange: (patch: Partial<Row>) => void }) {
  const methods = useForm<RowFormData>({
    mode: 'onSubmit',
    defaultValues: {
      title: row.title,
      company: row.company,
      location: row.location,
      startDate: ymToIso(row.startDate || null),
      endDate: ymToIso(row.endDate),
      isCurrent: row.isCurrent,
    },
  });
  const { control, setValue } = methods;

  /* `useWatch`, which is what the rest of these prototypes use, rather than
     `useForm().watch` — the subscription form of that one is flagged by the
     React Compiler lint as unmemoizable, and this is the codebase's own idiom
     anyway (`JobProfilePane` watches its dates the same way). */
  const title = useWatch({ control, name: 'title' });
  const company = useWatch({ control, name: 'company' });
  const location = useWatch({ control, name: 'location' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const isCurrent = useWatch({ control, name: 'isCurrent' });

  /* Held in a ref so the write-through below depends on the *values* only. The
     parent hands down a fresh `onChange` every render — and this write-through is
     what causes those renders — so listing it as a dependency would be a loop
     with an extra step in it. */
  const commit = useRef(onChange);
  useEffect(() => {
    commit.current = onChange;
  });

  useEffect(() => {
    commit.current({
      title: title ?? '',
      company: company ?? '',
      location: location ?? '',
      /* Same 'YYYY-MM' the row arrived in, and the same emptiness: a cleared
         start date leaves the row blocked exactly as the parser leaving it blank
         did, rather than inventing a month. */
      startDate: isoToYm(startDate ?? null) ?? '',
      endDate: isCurrent ? null : isoToYm(endDate ?? null),
      isCurrent: !!isCurrent,
    });
  }, [title, company, location, startDate, endDate, isCurrent]);

  return (
    <FormProvider {...methods}>
      <div className={r.rowFields}>
        <FormField name="title" label="Role" placeholder="Enter role" />
        <FormField name="company" label="Team or Organization" placeholder="Enter team or organization" />
        {/* Production's dates group, forced to a column by `.rowDates`. The
            drawer spreads these across a row because it has 582px to do it in;
            a list row inside a card does not, and two selects per line beats
            four across one. */}
        <div className={di.root}>
          <div className={clsx(di.body, r.rowDates)}>
            <MonthYearSelect
              label="Start Date"
              isRequired
              value={startDate ?? null}
              onChange={(value) => {
                if (value === null) return;
                setValue('startDate', value, { shouldDirty: true });
              }}
            />
            <MonthYearSelect
              label="End Date"
              isRequired={!isCurrent}
              disabled={!!isCurrent}
              value={endDate ?? null}
              onChange={(value) => {
                if (value === null) return;
                setValue('endDate', value, { shouldDirty: true });
              }}
            />
            {/* Production disables the end date rather than hiding it while
                `Present` is on — hiding a field is a change you can't see you
                made — and keeps the switch on that field's own line, because it
                is the control that removes it. */}
            <FormSwitch name="isCurrent" label="Present" />
          </div>
        </div>
        <FormField name="location" label="Location" placeholder="Enter location" />
      </div>
    </FormProvider>
  );
}
