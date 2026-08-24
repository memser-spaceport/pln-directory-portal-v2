'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/common/Checkbox';
import { FormField } from '@/components/form/FormField';
import { MonthYearSelect } from '@/components/form/MonthYearSelect';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import type { ResolvedLocation } from '@/services/location.service';
// The white field panel and its row measure — the same sheet the profile card's
// own editor wears, so this card sits in the stack as one more edited section
// rather than as a dialog that wandered in.
import f from '@/components/page/member-details/ProfileDetails/components/EditProfileForm/EditProfileForm.module.scss';
// The list row: the 12px grey `.expItem`, its two label ranks and the vertical
// rule between facts. A found position is shown in the shape it will take once
// it is a real entry — the checkbox simply stands where the briefcase will.
import e from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList/ExperiencesList.module.scss';
// The label-over-control wrapper the profile card puts around this same picker,
// so the two Location fields in this drawer are the same field twice rather than
// two designs for one thing.
import l from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput/ProfileLocationInput.module.scss';

// `FormTagsInput` with the DS ✕ instead of react-select's filled one.
import { SkillsTagsInput } from '@/components/form/SkillsTagsInput';

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
 * afterwards, which opens the real `EditExperienceForm` with all seven fields. That
 * form already exists and is one press away, so a second inline editor here
 * would be a copy of it that can drift from it.
 *
 * **Why nothing is pre-merged.** Skills shows only what the document added, not
 * the union with what you already had: a card that lists skills you typed last
 * year alongside the ones just parsed is claiming credit for both, and the
 * person then has to work out which half is new.
 */

interface ExperienceImportReviewProps {
  parsed: ParsedProfile;
  /** On the profile now. Empty means the card offers to fill it; set means it
   *  isn't asked about at all — an import shouldn't offer to overwrite an answer
   *  the person gave by hand. */
  currentRole: string;
  /**
   * Whether the profile already has a location. A **boolean**, not the location.
   *
   * The obvious signature was `currentLocation: string`, tested with
   * `.trim() === ''` the way `currentRole` is. It cannot be: the only thing that
   * turns the member's `{metroArea, city, country, region}` into a string is
   * `parseMemberLocation`, which returns the literal `'Unknown'` when there is
   * nothing there. That test would have been false for every member alive and
   * the Location field would never have rendered — a bug with no symptom except
   * a field that is silently never offered. Asking the host for the answer
   * instead makes the mistake unavailable.
   */
  hasLocation: boolean;
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
  /**
   * Commits the selection. **Awaited**, and allowed to throw.
   *
   * Awaited so `EditOfficeHoursFormControls` can render "Processing..." off
   * react-hook-form's `isSubmitting` — a Save that returns instantly while a
   * request is still in flight invites a second press. Allowed to throw because
   * the card is the only place that can report the failure without losing the
   * selection: it stays open, ticked exactly as it was, with the reason above
   * the footnote.
   */
  onSubmit: (selection: ImportSelection) => void | Promise<void>;
}

type Row = ParsedExperience & { include: boolean; duplicate: boolean };

/* Location is absent on purpose — it is a picked record, not typed text, and
   lives in its own state. See the note beside it. */
type ReviewFormData = { role: string; skills: string[] };

/**
 * WHEN TWO ROWS ARE THE SAME JOB: role, company and start date.
 *
 * Not the description, which a parser rewords between runs, and not the end
 * date, which is the field most likely to have legitimately changed since the
 * last import — matching on it would call a finished job a different job. Case-
 * and space-insensitive, because the two sides came out of two different reads
 * of the same document.
 *
 * Exported because the host needs the same rule to decide what it already has,
 * and a second copy of it would drift from this one silently.
 */
export const experienceKey = (entry: { title: string; company: string; startDate: string }) =>
  [entry.title, entry.company, entry.startDate].map((value) => value.trim().toLowerCase()).join('|');

export function ExperienceImportReview(props: ExperienceImportReviewProps) {
  const {
    parsed,
    currentRole,
    hasLocation,
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

  /**
   * The place the person picked out of the autocomplete, if they did.
   *
   * Outside react-hook-form because it is not a text field: what has to reach
   * Save is a resolved record, and the only thing that produces one is
   * `LocationSelect.onSelect`. Registering the *text* would have let a typed
   * "Berlin" that was never picked look, to the form, exactly like a confirmed
   * place — and then fail at the endpoint, after Save, which is the one moment
   * this card exists to avoid.
   */
  const [location, setLocation] = useState<ResolvedLocation | null>(null);

  /* Cleared on each attempt: an error left over from the previous press, sitting
     above a card the person has since changed, is describing a request that no
     longer exists. */
  const [submitError, setSubmitError] = useState<string | null>(null);

  const askRole = currentRole.trim() === '';
  const askLocation = !hasLocation;
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
      skills: newSkills,
    },
  });

  const setRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const included = rows.filter((row) => row.include);
  const missingDates = included.filter((row) => row.startDate === '');

  const submit = async (data: ReviewFormData) => {
    if (missingDates.length > 0) {
      setShowDateErrors(true);
      return;
    }

    const role = askRole ? (data.role ?? '').trim() : '';
    const skills = data.skills ?? [];

    /* Every row unticked, no skills kept, and neither detail answered. There is
       a Save press behind this, so it is not a no-op to the person — but the
       request would carry nothing, and a round trip that cannot change anything
       is a spinner and a failure mode bought for free. Closing is what the press
       meant. */
    const nothingToSave = included.length === 0 && skills.length === 0 && role === '' && !(askLocation && location);

    if (nothingToSave) {
      onClose();
      return;
    }

    setSubmitError(null);

    try {
      await onSubmit({
        experiences: included.map(({ include, duplicate, ...entry }) => entry),
        skills,
        /* Both carry "leave it alone" in-band, and only ever when the card
           didn't ask: a profile that already has a role sends '' rather than
           echoing its own value back for the server to write over itself. */
        role,
        location: askLocation ? location : null,
      });
    } catch {
      /* The card's own sentence, not `error.message`.
         A rejected apply carries whatever the server chose to say, and that is
         written for a log, not for someone looking at their own work history.
         The two things a person needs here are both knowable without it: it
         didn't save, and nothing was lost.

         The exception this will eventually need is the unresolved-skills case —
         the only failure with a specific thing to do about it. That copy waits
         on the endpoint deciding whether unknown skill titles are minted or
         rejected; when it does, the host maps the error and passes the sentence
         in, rather than this catch growing a taxonomy. */
      setSubmitError('We couldn’t save that just now. Nothing has changed — try again.');
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit(submit)}
        /* Form-level Enter guard — the skills input commits a tag on Enter
           without cancelling the event, so without this the second skill saves
           the card. */
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') ev.preventDefault();
        }}
      >
        <EditOfficeHoursFormControls onClose={onClose} title="Review your experience" alwaysEnabled />

        {/* No lede and no group caption above the fields.
            Both were cut, and both were explaining what the card
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
                /* The autocomplete, not a text box, wearing the same label and
                   wrapper the profile card's own location field wears.

                   A CV says "Berlin, Germany" and the profile stores a resolved
                   place — city, metro area, country, region, continent, all of
                   it off `/v1/locations/{placeId}/details`. There is no endpoint
                   that takes the string, so a free-text field here would collect
                   an answer that cannot be saved, and would only say so after
                   Save. Seeding the search with what the document said turns
                   that into one press: the list is already open on the right
                   answer. */
                <div className={f.row}>
                  <div className={l.root}>
                    <div className={l.header}>
                      <span className={l.label}>Location</span>
                    </div>
                    <LocationSelect
                      defaultInputValue={parsed.location || undefined}
                      resolvedCity={location?.city}
                      resolvedState={location?.metroArea ?? undefined}
                      resolvedCountry={location?.country}
                      onSelect={setLocation}
                    />
                    {/* react-select drops an uncontrolled input's text on blur,
                        so the seeded guess can vanish from the box while still
                        being the thing the person is deciding about. This line
                        holds it — and says plainly that reading it is not the
                        same as having chosen it. Gone the moment they pick, when
                        the control shows the resolved place itself. */}
                    {!location && parsed.location && (
                      <p className={l.hint}>Your CV says {parsed.location} — pick the matching place to save it.</p>
                    )}
                  </div>
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

          {/* Above the footnote and below everything it is about: the person's
              eye is on the Save they just pressed, and the reason it didn't take
              belongs at the end of what they were reading, not at the top of a
              card they have already scrolled past. Nothing is cleared — the
              ticks, the dates and the skills are exactly as they left them, so
              a second press is one press. */}
          {submitError && (
            <p className={r.submitError} role="alert">
              {submitError}
            </p>
          )}

          <p className={r.footnote}>You can edit or delete any of these afterwards from the Experience card.</p>
        </div>
      </form>
    </FormProvider>
  );
}
