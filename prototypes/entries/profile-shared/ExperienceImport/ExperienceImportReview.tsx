'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/common/Checkbox';
import { FormField } from '@/components/form/FormField';
import { MonthYearSelect } from '@/components/form/MonthYearSelect';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
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
 * **Why so little of it is editable here.** Only two things can be corrected in
 * this card: a start date, because the record requires one and a missing one is
 * the single thing that can block Save; and the details the profile is still
 * missing, because one of them gates applying. Everything else — a mangled
 * title, a company the parser split in two — is edited by the pencil on the row
 * afterwards, which opens the real `ExperienceForm` with all seven fields. That
 * form already exists and is one press away, so a second inline editor here
 * would be a copy of it that can drift from it.
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

type ReviewFormData = { role: string; location: string; skills: string[] };

export function ExperienceImportReview(props: ExperienceImportReviewProps) {
  const {
    parsed,
    currentRole,
    currentLocation,
    currentSkills,
    currentExperiences = [],
    formatDates,
    bodyClassName,
    onClose,
    onSubmit,
  } = props;

  /* Role + company + start date. Not the description, which a parser rewords
     between runs, and not the end date, which is the field most likely to have
     legitimately changed since the last import — matching on it would call a
     finished job a different job. Case- and space-insensitive because the two
     sides came out of two different reads of the same document. */
  const alreadyHave = useMemo(() => {
    const key = (x: { title: string; company: string; startDate: string }) =>
      [x.title, x.company, x.startDate].map((v) => v.trim().toLowerCase()).join('|');
    return new Set(currentExperiences.map(key));
  }, [currentExperiences]);

  const isDuplicate = (item: ParsedExperience) =>
    alreadyHave.has([item.title, item.company, item.startDate].map((v) => v.trim().toLowerCase()).join('|'));

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

  const askRole = currentRole.trim() === '';
  const askLocation = currentLocation.trim() === '';
  const asksDetails = askRole || askLocation;

  /* Only what the document added. See the note above. */
  const newSkills = useMemo(() => {
    const have = new Set(currentSkills.map((skill) => skill.toLowerCase()));
    return parsed.skills.filter((skill) => !have.has(skill.toLowerCase()));
  }, [currentSkills, parsed.skills]);

  const methods = useForm<ReviewFormData>({
    mode: 'onSubmit',
    defaultValues: {
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
      experiences: included.map(({ include, ...entry }) => entry),
      skills: data.skills ?? [],
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
                 first rather than three groups down. Unheaded: two labelled
                 fields are their own heading, and "Experience (N found)" below
                 is a count rather than a label, which is why that one stays. */}
          {asksDetails && (
            <section className={r.group}>
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

          {/* 2. The positions. */}
          <section className={r.group}>
            {/* Counts what the document held, not what is ticked — the number
                is a fact about the file, and a count that dropped as you
                unticked rows would be reporting your edits back to you. */}
            <h3 className={r.groupTitle}>Experience ({rows.length} found)</h3>
            <ul className={r.rows}>
              {rows.map((row) => {
                const needsDate = row.startDate === '';
                const dateError = showDateErrors && row.include && needsDate;

                return (
                  <li key={row.key} className={clsx(e.expItem, r.rowItem, { [r.rowOff]: !row.include })}>
                    <div className={r.rowCheck}>
                      <Checkbox checked={row.include} onChange={(next) => setRow(row.key, { include: next })} />
                    </div>
                    <div className={clsx(e.details, r.rowDetails)}>
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
                        {/* Says why this one row arrived switched off. Without
                            it an unticked row in a card whose other rows are
                            ticked reads as the parser being unsure about it,
                            which is a different and more worrying claim. On the
                            secondary line rather than beside the title: it is a
                            fact about the row's *state*, not part of the job. */}
                        {row.duplicate && <span className={r.rowAlready}>Already on your profile</span>}
                      </div>

                      {/* The one correction this card takes. A start date is
                          required by the record, and "2021 – present" with no
                          month is the commonest thing a parser hands back — so
                          it is asked for here rather than discovered as a
                          failure after Save. Only while the row is included:
                          a row on its way to being dropped owes nothing. */}
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
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

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

          <p className={r.footnote}>You can edit or delete any of these afterwards from the Experience card.</p>
        </div>
      </form>
    </FormProvider>
  );
}
