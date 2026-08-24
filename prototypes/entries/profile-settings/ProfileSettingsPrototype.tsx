'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { uniq } from 'lodash';

import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { FormTextArea } from '@/components/form/FormTextArea';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { FormSwitch } from '@/components/form/FormSwitch';
/* `MonthYearSelect` used to be imported here for the flat entry's date row. The
   list's editor (`ExperienceForm`) owns the dates now, and imports it itself. */

// The Experience list and its editor, and the CV importer. All four come from
// somewhere else on purpose: this page and the job board's apply drawer are two
// windows onto one record, so they share the components that read and write it.
// `ExperienceList`/`ExperienceForm` still live in `JobProfilePane` and should
// move to `profile-shared/` — see the note on their export.
import { ExperienceForm, ExperienceList } from '../job-board/JobProfilePane';
import { formatExperienceDates, type ExperienceEntry } from '../job-board/viewerState';
import { ExperienceImportPanel } from '../profile-shared/ExperienceImport/ExperienceImportPanel';
import { ExperienceImportReview } from '../profile-shared/ExperienceImport/ExperienceImportReview';
import type { ImportSelection, ParsedProfile } from '../profile-shared/ExperienceImport/types';

// DELETE WITH: the `design-canvas/` folder.
import { readCanvasState, type SettingsCanvasState } from './canvasStates';
import { SettingsMenuView } from './SettingsMenuView';
import { DEFAULT_VALUES, MOCK_AVATAR, SEED_EXPERIENCES, SKILL_OPTIONS } from './mocks';
import s from './ProfileSettings.module.scss';

export default function ProfileSettingsPrototype() {
  // Reused fields are base-ui / client-only — gate render to avoid hydration drift.
  const [mounted, setMounted] = useState(false);
  /* DELETE WITH: the `design-canvas/` folder. See `canvasStates.ts`. */
  const [canvas, setCanvas] = useState<SettingsCanvasState | null>(null);
  const methods = useForm({ defaultValues: DEFAULT_VALUES });
  const { formState, control, setValue } = methods;

  /* The three `experienceStartDate` / `EndDate` / `IsCurrent` watchers that used
     to sit here drove the flat entry's date row. The list's editor owns its own
     dates now, so they went with the flat fields.

     What is watched instead is what the import review needs to know it must not
     overwrite: the role and skills already on the form. */
  const watchedRole = useWatch({ control, name: 'role' });
  const watchedSkills = useWatch({ control, name: 'skills' });
  /* The two Basic information fields, watched for the same reason: the review
     card asks for a contact detail only where the profile is blank, and on this
     page Name and Email are two sections up the same form. Watching them rather
     than reading `DEFAULT_VALUES` means clearing the field on screen is enough
     to make the import offer to fill it — one answer, in one place. */
  const watchedName = useWatch({ control, name: 'name' });
  const watchedEmail = useWatch({ control, name: 'email' });

  /* The Experience list lives outside RHF. The form here carries scalars, and a
     list needs add / edit / delete rather than `register` — so it is component
     state, and the Save bar reads both. */
  const [experiences, setExperiences] = useState<ExperienceEntry[]>(SEED_EXPERIENCES);
  const [experiencesDirty, setExperiencesDirty] = useState(false);
  const [editing, setEditing] = useState<{ kind: 'experience'; uid: string | null } | { kind: 'import' } | null>(null);
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const cvInput = useRef<HTMLInputElement>(null);

  const importing = editing?.kind === 'import';
  const editingEntry = editing?.kind === 'experience';
  const entryBeingEdited = useMemo(
    () => (editingEntry && editing.uid ? (experiences.find((i) => i.uid === editing.uid) ?? null) : null),
    [editing, editingEntry, experiences],
  );

  const closeImport = () => {
    setEditing(null);
    setParsed(null);
    setPickedFile(null);
  };

  const saveExperience = (entry: ExperienceEntry) => {
    setExperiences((prev) =>
      prev.some((i) => i.uid === entry.uid) ? prev.map((i) => (i.uid === entry.uid ? entry : i)) : [...prev, entry],
    );
    setExperiencesDirty(true);
    setEditing(null);
  };

  const deleteExperience = (uid: string) => {
    setExperiences((prev) => prev.filter((i) => i.uid !== uid));
    setExperiencesDirty(true);
    setEditing(null);
  };

  /* The same three merge rules the drawer applies, for the same reason: an
     import adds to what you have and never overwrites an answer you gave by
     hand. Role fills only a blank; skills union; positions append — and the
     review has already unticked the ones that are duplicates. */
  const applyImport = (selection: ImportSelection) => {
    /* Name and email fill a blank exactly as role does. They are on this page,
       so unlike the drawer there is somewhere to put them — and unlike
       onboarding they are normally already answered, so this normally does
       nothing. That is the rule working, not the rule missing. */
    if ((watchedName ?? '').trim() === '' && selection.name.trim() !== '') {
      setValue('name', selection.name.trim(), { shouldDirty: true });
    }
    if ((watchedEmail ?? '').trim() === '' && selection.email.trim() !== '') {
      setValue('email', selection.email.trim(), { shouldDirty: true });
    }
    if ((watchedRole ?? '').trim() === '' && selection.role.trim() !== '') {
      setValue('role', selection.role.trim(), { shouldDirty: true });
    }
    if (selection.skills.length) {
      setValue('skills', uniq([...(watchedSkills ?? []), ...selection.skills]), { shouldDirty: true });
    }
    if (selection.experiences.length) {
      setExperiences((prev) => [
        ...prev,
        ...selection.experiences.map((entry, i) => ({
          uid: `imported-${prev.length + i + 1}`,
          title: entry.title,
          company: entry.company,
          description: entry.description,
          startDate: entry.startDate,
          endDate: entry.isCurrent ? null : entry.endDate,
          isCurrent: entry.isCurrent,
          location: entry.location,
        })),
      ]);
      setExperiencesDirty(true);
    }
    closeImport();
  };

  /* The mount gate was already here for the base-ui fields. The canvas state
     rides on it, because the importer panel seeds its own `useState` from the
     props it mounts with — a state applied one paint later would never reach it.
     DELETE WITH: the `design-canvas/` folder. */
  useEffect(() => {
    const state = readCanvasState(window.location.search);
    if (state?.noHistory) setExperiences([]);
    setCanvas(state);
    setMounted(true);
  }, []);
  if (!mounted) return <div className={s.page} />;

  return (
    <div className={s.page}>
      <div className={s.backbar}>
        <BackButton to="/prototypes" />
        <span className={s.backTitle}>Profile</span>
      </div>

      <div className={s.layout}>
        <aside className={s.aside}>
          <SettingsMenuView active="profile" />
        </aside>

        <main className={s.content}>
          <FormProvider {...methods}>
            {/* A div, not a `<form>`.

                The Experience section now hosts two components that bring their
                own `<form>` — `ExperienceForm` and `ExperienceImportReview`, both
                shared with the apply drawer, both submitting through
                `EditOfficeHoursFormControls`' `type="submit"`. Nested forms are
                invalid HTML and behave accordingly: the inner Save bubbled out to
                this one, which is a mocked no-op, so pressing Save in the review
                silently did nothing at all.

                Nothing is lost by dropping it. RHF needs a `FormProvider`, not a
                form element, and this page's submit was `handleSubmit(() => {})`
                — a mock that never went anywhere. The save bar below is a plain
                button now. */}
            <div>
              {/* Basic info */}
              <section className={s.section}>
                <h2 className={s.sectionTitle}>Basic information</h2>
                <div className={s.avatarRow}>
                  <img className={s.avatar} src={MOCK_AVATAR} alt="" />
                  <div className={s.avatarActions}>
                    <Button size="s" style="border" variant="neutral">
                      Change photo
                    </Button>
                    <span className={s.avatarHint}>JPG or PNG, up to 4MB.</span>
                  </div>
                </div>
                <div className={s.grid2}>
                  <FormField name="name" label="Name" placeholder="Your full name" isRequired />
                  <FormField name="email" label="Email" placeholder="you@example.com" isRequired />
                </div>
                <FormTextArea name="bio" label="Bio" placeholder="Tell the network about yourself" />
              </section>

              {/* Team & skills */}
              <section className={s.section}>
                <h2 className={s.sectionTitle}>Team &amp; skills</h2>
                <div className={s.grid2}>
                  <FormField name="team" label="Primary team" placeholder="Select a team" />
                  {/* "Role on the team", not "Role": this is the membership row, and
                      the Experience section below has its own Role. Two fields with
                      the same label on one page is a question about which one
                      matters. */}
                  <FormField name="role" label="Role on the team" placeholder="e.g. Co-founder & CEO" />
                </div>
                {/* `FormTagsInput` renders `selectLabel` as its own label, so the
                    wrapper's was printing "Skills" twice. */}
                <FormTagsInput name="skills" selectLabel="Skills" placeholder="Add a skill" options={SKILL_OPTIONS} />
              </section>

              {/* Experience — a list, and the second surface carrying the CV importer.

                  **Why a list now.** This was seven flat fields holding one
                  entry, justified by the job board's old two-step modal, which
                  only ever captured a current role. That modal is gone,
                  production's Experience is a list, and a CV returns several
                  positions at once — so a single entry stopped being a
                  simplification of the record and became a different one.

                  **Why the drawer's components.** `ExperienceList` and
                  `ExperienceForm` are imported from `JobProfilePane` rather
                  than re-typed. Two editors for one record is how two surfaces
                  start disagreeing about what a valid entry is — the thing
                  `profile-shared/` exists to prevent. (They belong in
                  `profile-shared/`; see the note on the export.)

                  **What changes around the review card.** It is the same card as
                  the drawer's. What differs is this page's single sticky Save for
                  the whole form: while the review is open that bar is disabled,
                  exactly as the drawer disables its footer while a section is
                  being edited. Two live Saves with different scopes on one screen
                  is a question nobody should have to answer. */}
              <section className={s.section}>
                {importing ? (
                  parsed ? (
                    <ExperienceImportReview
                      parsed={parsed}
                      /* Both filled, and both visible on this same page two
                         sections up — so the review shows neither. A card that
                         offered to overwrite the Name field the person can see
                         above it would be the clearest possible version of the
                         thing the ask-only-for-blanks rule exists to prevent. */
                      currentName={watchedName ?? ''}
                      currentEmail={watchedEmail ?? ''}
                      currentRole={watchedRole ?? ''}
                      currentLocation=""
                      currentSkills={watchedSkills ?? []}
                      currentExperiences={experiences}
                      formatDates={formatExperienceDates}
                      onClose={closeImport}
                      onSubmit={applyImport}
                    />
                  ) : (
                    <>
                      <div className={s.sectionHead}>
                        <h2 className={s.sectionTitle}>Add experience from a document</h2>
                        <button type="button" className={s.sectionAction} onClick={closeImport}>
                          Cancel
                        </button>
                      </div>
                      <ExperienceImportPanel
                        entry="direct"
                        initialFile={pickedFile}
                        onParsed={setParsed}
                        onAddManually={() => setEditing({ kind: 'experience', uid: null })}
                      />
                    </>
                  )
                ) : editingEntry ? (
                  <ExperienceForm
                    initial={entryBeingEdited}
                    onClose={() => setEditing(null)}
                    onSubmit={saveExperience}
                    onDelete={deleteExperience}
                  />
                ) : (
                  <>
                    <div className={s.sectionHead}>
                      <h2 className={s.sectionTitle}>
                        Experience {experiences.length ? `(${experiences.length})` : ''}
                      </h2>
                      <div className={s.sectionActions}>
                        {experiences.length > 0 && (
                          <>
                            {/* Straight to the file dialog, like the drawer's —
                                the input sits beside the button so the press
                                itself carries the user gesture. */}
                            <button type="button" className={s.sectionAction} onClick={() => cvInput.current?.click()}>
                              Update from CV
                            </button>
                            <input
                              ref={cvInput}
                              type="file"
                              className={s.visuallyHidden}
                              accept=".pdf,.doc,.docx"
                              onChange={(ev) => {
                                const chosen = ev.target.files?.[0] ?? null;
                                ev.target.value = '';
                                if (!chosen) return;
                                setPickedFile(chosen);
                                setEditing({ kind: 'import' });
                              }}
                            />
                          </>
                        )}
                        <button
                          type="button"
                          className={s.sectionAddAction}
                          onClick={() => setEditing({ kind: 'experience', uid: null })}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                    <p className={s.sectionHint}>
                      Where you&apos;ve worked. This is what a hiring team sees when you apply to a role on the job
                      board.
                    </p>
                    {experiences.length === 0 ? (
                      <ExperienceImportPanel
                        emptyLabel="Share your work history and skills. This shows what you know and what you can do."
                        onParsed={(result) => {
                          setParsed(result);
                          setEditing({ kind: 'import' });
                        }}
                        onAddManually={() => setEditing({ kind: 'experience', uid: null })}
                        // DELETE WITH: the `design-canvas/` folder.
                        canvasOpen={canvas?.importOpen}
                      />
                    ) : (
                      <ExperienceList entries={experiences} onEdit={(uid) => setEditing({ kind: 'experience', uid })} />
                    )}
                  </>
                )}
              </section>

              {/* Contact */}
              <section className={s.section}>
                <h2 className={s.sectionTitle}>Contact &amp; social</h2>
                <div className={s.grid2}>
                  <FormField name="linkedin" label="LinkedIn" placeholder="username" />
                  <FormField name="github" label="GitHub" placeholder="username" />
                  <FormField name="twitter" label="X / Twitter" placeholder="username" />
                  <FormField name="telegram" label="Telegram" placeholder="username" />
                  <FormField name="discord" label="Discord" placeholder="username#0000" />
                </div>
              </section>

              {/* Availability */}
              <section className={s.section}>
                <h2 className={s.sectionTitle}>Availability</h2>
                <div className={s.toggles}>
                  <FormSwitch
                    name="openToCollaborate"
                    label="Open to collaborate"
                    helperText="Show an “Open to Collaborate” badge on your profile"
                  />
                  <FormSwitch
                    name="officeHours"
                    label="Office hours"
                    helperText="Let members book a short 1:1 with you"
                  />
                </div>
              </section>

              {/* Sticky save bar */}
              <div className={s.saveBar}>
                <Button
                  type="button"
                  size="m"
                  style="border"
                  variant="neutral"
                  onClick={() => {
                    methods.reset(DEFAULT_VALUES);
                    setExperiences(SEED_EXPERIENCES);
                    setExperiencesDirty(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
                {/* Disabled while the Experience card is open, the way the
                    drawer's footer is: mid-edit there is unsaved work in front of
                    the person, and a page-level Save that stepped over it would
                    drop what they were doing. It also reads `experiencesDirty`,
                    because the list is not RHF's and `formState.isDirty` cannot
                    see it — a Save that stayed grey after you imported three
                    roles would look broken. */}
                <Button
                  type="button"
                  size="m"
                  style="fill"
                  variant="primary"
                  disabled={(!formState.isDirty && !experiencesDirty) || !!editing}
                  onClick={() => {
                    /* The mock of a save: the values become the new baseline, so
                       the bar stands down and the page reads as settled. It used
                       to be `handleSubmit(() => {})`, which left the form dirty
                       forever — a Save that stays lit after you press it is the
                       page saying it didn't work. */
                    methods.reset(methods.getValues());
                    setExperiencesDirty(false);
                  }}
                >
                  Save changes
                </Button>
              </div>
            </div>
          </FormProvider>
        </main>
      </div>
    </div>
  );
}
