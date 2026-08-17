'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Modal } from '@/components/common/Modal';
import { Checkbox } from '@/components/common/Checkbox';
import { CloseIcon, NotePencilIcon, SearchIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { type MultiSelectOption } from '@/components/form/FormMultiSelect';
import {
  buildWorkplaceTypeFacetItems,
  seniorityDisplayLabel,
  sortSeniorityValues,
  workplaceTypeDisplayLabel,
} from '@/utils/jobs.utils';

// Demo Day's "Make an intro" modal chrome, the same way ReferModal takes it:
// 24px card, centred icon / title / desc, twin full-width footer actions.
import intro from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';
// The production "Are you open to collaborate?" row — checkbox, label, hint — is
// this exact field on the profile, so it's the same markup and stylesheet here.
import collab from '@/components/page/member-details/ProfileDetails/components/ProfileCollaborateInput/ProfileCollaborateInput.module.scss';

import { MOCK_LOCATION_FACETS, MOCK_ROLE_CATEGORY_FACETS, MOCK_SENIORITY_FACETS, MOCK_WORKMODE_FACETS } from './mocks';
import { PreferenceMultiSelect } from './PreferenceMultiSelect';
import { SkillsTagsInput } from './SkillsTagsInput';
import { hasCriteria, hasExperience, type JobPreferences, type MemberExperience, type RoleCriteria } from './viewerState';
import s from './JobPreferencesModal.module.scss';

interface JobPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  /** Saved preferences, if any — otherwise the modal falls back to the rail. */
  preferences: JobPreferences;
  /** What the rail is currently narrowed to; the pre-fill when nothing is saved. */
  criteria: RoleCriteria;
  /** What the profile already holds, if anything. */
  experience: MemberExperience;
  onSave: (next: JobPreferences, experience: MemberExperience) => void;
}

type PreferencesFormData = {
  roleCategory: MultiSelectOption[];
  seniority: MultiSelectOption[];
  workplaceType: MultiSelectOption[];
  location: MultiSelectOption[];
  openToNewRoles: boolean;
  /** Step 2 — production `TEditExperienceForm.title` / `.company`, `member.skills`. */
  experienceTitle: string;
  experienceCompany: string;
  skills: string[];
};

type Step = 'looking' | 'experience';

const toOptions = (values: string[], label: (v: string) => string = (v) => v): MultiSelectOption[] =>
  values.map((value) => ({ value, label: label(value) }));

const toValues = (options: MultiSelectOption[] | undefined): string[] => (options ?? []).map((o) => o.value);

/**
 * The match form, in two steps: **what you want**, then **what you do**.
 *
 * Step 1, "What are you looking for?" — four multi-selects mirroring the rail's
 * own sections, plus the availability flag. Two decisions worth naming:
 *
 * 1. **It opens here, not at /settings/job-alerts.** Sending someone to settings
 *    to unlock the page they're standing on loses them, and they'd come back to a
 *    board that had already forgotten why they left.
 *
 * 2. **It arrives pre-filled** from whatever the rail is narrowed to, so the
 *    common path is a one-click confirm rather than a cold form. The person has
 *    already said what they want by filtering; asking again would be pretending
 *    we weren't listening.
 *
 * The fields are the facet vocabulary, not a parallel one — same keys as the
 * jobs, which is what makes the resulting match exact instead of a guess.
 *
 * Step 2, "What do you do?" — the half the sign-in prompt promised: three fields
 * that go **on the profile**, not into a job-board-only record. Role and team are
 * production's own Experience entry, skills is the field the settings form
 * already edits, and the modal says where they land before the button that puts
 * them there. Three more decisions:
 *
 * 3. **Two steps, not one form.** Stacking a résumé under four multi-selects
 *    turns a one-click confirm into a page of work, and the two halves answer
 *    different questions — what the board owes you, and what you owe the teams
 *    reading you.
 *
 * 4. **Step 2 is optional and says so.** Saving with it empty saves the
 *    preferences, which is the part that actually sorts the board. A required
 *    résumé behind a modal nobody opened deliberately is how you lose the person
 *    who was one click from being matched.
 *
 * 5. **Nothing here feeds the match.** No years-of-experience score, no seniority
 *    inferred from a job title. Ranking runs on stated intent; experience is what
 *    makes the person legible once a team finds them.
 */
export function JobPreferencesModal(props: JobPreferencesModalProps) {
  const { open, onClose, preferences, criteria, experience, onSave } = props;
  const [step, setStep] = useState<Step>('looking');
  const roleCategoryOptions = useMemo(() => toOptions(MOCK_ROLE_CATEGORY_FACETS.map((f) => f.value)), []);
  const seniorityOptions = useMemo(
    () =>
      toOptions(
        sortSeniorityValues(MOCK_SENIORITY_FACETS).map((f) => f.value),
        seniorityDisplayLabel,
      ),
    [],
  );
  const workplaceOptions = useMemo(
    () =>
      toOptions(
        buildWorkplaceTypeFacetItems(MOCK_WORKMODE_FACETS).map((f) => f.value),
        workplaceTypeDisplayLabel,
      ),
    [],
  );
  const locationOptions = useMemo(() => toOptions(MOCK_LOCATION_FACETS.map((f) => f.value)), []);

  const methods = useForm<PreferencesFormData>({
    defaultValues: {
      roleCategory: [],
      seniority: [],
      workplaceType: [],
      location: [],
      openToNewRoles: true,
      experienceTitle: '',
      experienceCompany: '',
      skills: [],
    },
  });
  const { control, reset, setValue } = methods;

  const openToNewRoles = useWatch({ control, name: 'openToNewRoles' });
  const roleCategory = useWatch({ control, name: 'roleCategory' }) ?? [];
  const seniority = useWatch({ control, name: 'seniority' }) ?? [];
  const workplaceType = useWatch({ control, name: 'workplaceType' }) ?? [];
  const location = useWatch({ control, name: 'location' }) ?? [];
  const experienceTitle = useWatch({ control, name: 'experienceTitle' }) ?? '';
  const experienceCompany = useWatch({ control, name: 'experienceCompany' }) ?? '';
  const skills = useWatch({ control, name: 'skills' }) ?? [];

  // Seed on open: saved preferences if they exist, otherwise the live rail. Step 2
  // seeds from the profile, which is the only place its answers live.
  useEffect(() => {
    if (!open) return;
    const seed: RoleCriteria = hasCriteria(preferences) ? preferences : criteria;
    reset({
      roleCategory: toOptions(seed.roleCategory),
      seniority: toOptions(seed.seniority, seniorityDisplayLabel),
      workplaceType: toOptions(seed.workplaceType, workplaceTypeDisplayLabel),
      location: toOptions(seed.location),
      openToNewRoles: hasCriteria(preferences) ? preferences.openToNewRoles : true,
      experienceTitle: experience.title,
      experienceCompany: experience.company,
      skills: [...experience.skills],
    });
    /* Reopening always starts at step 1. The two steps are one answer — landing
       someone back on "what do you do" when they came to change what they're
       looking for would hide the thing they opened the modal for. */
    setStep('looking');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const prefilled = !hasCriteria(preferences) && hasCriteria(criteria);
  const canSave = roleCategory.length > 0 || seniority.length > 0 || workplaceType.length > 0 || location.length > 0;
  const onExperienceStep = step === 'experience';

  const nextExperience = (): MemberExperience => ({
    title: experienceTitle.trim(),
    company: experienceCompany.trim(),
    skills,
  });

  const submit = () => {
    if (!canSave) return;

    // Step 1 hands over rather than saving: the sign-in prompt promised a profile
    // update, so the flow has to reach the step that delivers it.
    if (!onExperienceStep) {
      setStep('experience');
      return;
    }

    onSave(
      {
        roleCategory: toValues(roleCategory),
        seniority: toValues(seniority),
        workplaceType: toValues(workplaceType),
        location: toValues(location),
        openToNewRoles: !!openToNewRoles,
      },
      nextExperience(),
    );
  };

  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      <div className={`${intro.modal} ${s.modal}`}>
        <button type="button" className={intro.closeButton} onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>

        <div className={intro.iconWrapper}>
          {onExperienceStep ? (
            <NotePencilIcon width={26} height={26} className={s.icon} />
          ) : (
            <SearchIcon width={26} height={26} className={s.icon} />
          )}
        </div>

        {/* The step counter rides with the title rather than as its own child of
            the 24px-gap card — a progress line floating 24px above the heading it
            belongs to reads as a separate announcement. */}
        <div className={s.head}>
          <p className={s.stepLabel}>Step {onExperienceStep ? '2' : '1'} of 2</p>
          <h2 className={intro.title}>{onExperienceStep ? 'What do you do?' : 'What are you looking for?'}</h2>
        </div>

        {/* Both steps say the answers can be changed later, not just what they
            buy — step 1 used to describe only the effect, leaving no sign the
            answers persist anywhere you could go back to.

            "in Settings", not "Settings → Job preferences". The arrow is
            breadcrumb notation: it belongs in documentation, where the reader is
            following a path, and reads as machinery in a sentence someone is
            skimming mid-task. Plain "in Settings" is what products say, and it's
            enough — the person needs to know the answers are revisitable and
            roughly where, not to be navigated there by a modal they haven't
            finished. */}
        <p className={intro.desc}>
          {onExperienceStep
            ? 'We’ll add this to your profile — you can update it any time in Settings.'
            : prefilled
              ? 'Filled in from the filters you just set — adjust anything that isn’t right. You can change this later in Settings.'
              : 'We’ll sort the board around this, and teams hiring for it can find you. You can change this later in Settings.'}
        </p>

        <FormProvider {...methods}>
          <form
            className={`${intro.form} ${s.form}`}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {/* Step 2. Three fields, all of which already have a home on the
                profile — Role and Team are production's Experience entry, Skills
                is `member.skills`. Description, dates and location stay in
                Settings → Profile: a date picker is where someone answering a
                popup mid-browse stops answering, and none of them change who
                finds you. */}
            {onExperienceStep ? (
              <div className={s.fields}>
                <FormField name="experienceTitle" label="Role" placeholder="e.g. Senior Protocol Engineer" />
                <FormField name="experienceCompany" label="Team or organization" placeholder="Where you work now" />
                {/* Freeform tags, the same control the settings form uses for this
                    exact field — so the words typed here are the words that show
                    up there, not a parallel list that has to be reconciled. It's
                    `FormTagsInput` transcribed rather than imported, for one
                    reason: its chip ✕ is react-select's filled cross in near-black,
                    and every other ✕ in this flow is the DS `CloseIcon` in grey.
                    See SkillsTagsInput.

                    Enter is how you commit a tag, and in a form it is also how you
                    submit. The input adds the tag but doesn't cancel the default,
                    so unguarded, typing a second skill saved and closed the modal
                    mid-sentence. Cancelling on the way up leaves the tag added and
                    the form still open. */}
                <div
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                >
                  <SkillsTagsInput name="skills" selectLabel="Skills" placeholder="Add a skill" />
                </div>
              </div>
            ) : (
              <div className={s.fields}>
                {/* `FormMultiSelect` transcribed, for the same reason the skills
                    field is — production's chip ✕ is react-select's own filled
                    cross in near-black, and the component exposes no `components`
                    prop to swap it. See PreferenceMultiSelect. */}
                <PreferenceMultiSelect
                  name="roleCategory"
                  label="Role category"
                  placeholder="Engineering, Product…"
                  options={roleCategoryOptions}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />
                <PreferenceMultiSelect
                  name="seniority"
                  label="Seniority"
                  placeholder="Senior, Lead…"
                  options={seniorityOptions}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />
                <PreferenceMultiSelect
                  name="workplaceType"
                  label="Workplace type"
                  placeholder="Remote, Hybrid…"
                  options={workplaceOptions}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />
                <PreferenceMultiSelect
                  name="location"
                  label="Location"
                  placeholder="Anywhere"
                  options={locationOptions}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                />

                {/* Same field, same words, as the profile's own row — this writes to
                    `member.openToWork`. Naming the consequence rather than
                    announcing it after the fact: the person should know their
                    profile changes before they press save, not discover it later. */}
                <div className={collab.root}>
                  <label className={collab.label}>
                    <Checkbox checked={!!openToNewRoles} onChange={(v) => setValue('openToNewRoles', v)} />
                    <div>
                      <div>Open to new roles</div>
                      <div className={collab.hint}>
                        Lets teams hiring for these roles find you in the directory. Shows as{' '}
                        <strong>Open to Collaborate</strong> on your profile.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <p className={s.note}>
              {onExperienceStep
                ? 'Optional — everything here can wait until later.'
                : canSave
                  ? 'Next: what you do, so hiring teams can find you.'
                  : 'Pick at least one thing you’re looking for.'}
            </p>

            {/* Two buttons, never three. "Skip" is Save with the fields empty —
                the preferences are already saved either way, and a third action
                would make an optional step look like a decision. */}
            <div className={intro.actions}>
              <button
                type="button"
                className={intro.cancelButton}
                onClick={onExperienceStep ? () => setStep('looking') : onClose}
              >
                {onExperienceStep ? 'Back' : 'Cancel'}
              </button>
              <button type="submit" className={intro.submitButton} disabled={!canSave}>
                {onExperienceStep ? (hasExperience(nextExperience()) ? 'Save' : 'Skip and save') : 'Next'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}
