'use client';

/**
 * Team locations — LAB-2829 feedback on the multi-location field.
 *
 * Tester notes (2026-10-19): (1) let me choose which location is the HQ;
 * (2) it isn't obvious how a location gets saved. Design review added: the HQ
 * chip doesn't say what HQ is, and the bordered ✕ isn't a DS pattern.
 *
 * The page is the team profile's Edit Profile Details card with a Version switch:
 *   Current  — the LAB-2830 feature env: production's `EditFormControls` row and
 *              the field transcribed (CurrentLocationsInput).
 *   Proposed — one list, "Primary" badge + "Make primary", trash remove
 *              (ProposedLocationsInput; HQ is "primary" there, see its note 1),
 *              inside the profile's section-editing pattern from
 *              `profile-shared`: Cancel/Save under the fields, every other card
 *              muted while this one is open, and the save status bar
 *              (`FloatingEditorControls`) once the card is scrolled away —
 *              "Editing Profile Details", or "Unsaved changes in Profile
 *              Details" with Keep editing and Save. The job-board drawer puts
 *              the same row in its footer; a page has no footer, so here it
 *              floats, as on the member profile. This is the answer to the
 *              tester's "not obvious how to save": the one Save follows you.
 *
 * Reuse map
 *   import: DetailsSection, DetailsSectionHeader, EditFormControls, EditFormMobileControls,
 *           FormField, TrashIcon, toast; profile-shared Section / SectionEditorTitle /
 *           SectionEditorControls / EditorDirtyContext / editSectionClasses / FloatingEditorControls
 *   transcribed: the feature env's TeamLocationsInput (not on main yet)
 *   dropped from the real form (deliberately): logo, admin status switch, fund checkbox,
 *   stage / industry selects and About — they call live option APIs and are not what's
 *   under review. The four fields above Locations stay so the field sits in its real
 *   neighbourhood.
 */
import { useRef, useState } from 'react';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import { FormField } from '@/components/form/FormField';
import { toast } from '@/components/core/ToastContainer';

import { FloatingEditorControls } from '../profile-shared/FloatingEditorControls';
import {
  EditorDirtyContext,
  Section,
  SectionEditorControls,
  SectionEditorTitle,
  editSectionClasses,
} from '../profile-shared/SectionEditor/SectionEditor';

import { CurrentLocationsInput } from './CurrentLocationsInput';
import { ProposedLocationsInput } from './ProposedLocationsInput';
import { MAX_TEAM_LOCATIONS, mockOtherSections, mockTeam } from './mocks';

import s from './TeamLocationsPrototype.module.scss';

type TVersion = 'current' | 'proposed';

type TForm = {
  name: string;
  shortDescription: string;
  dateFounded: string;
  teamSize: string;
  locations: { value: string }[];
};

const filled = (locations: { value?: string }[] = []) =>
  locations.map((location) => location.value?.trim().toLowerCase()).filter(Boolean);

// The feature's own rules (max, unique), plus — Proposed only — the first row must be filled
// once there are other locations, so the Primary badge never sits on an empty field.
const makeSchema = (version: TVersion) =>
  yup.object({
    name: yup.string().trim().required('Please add Team Name').max(150),
    shortDescription: yup.string().trim().max(150).defined(),
    dateFounded: yup.string().trim().defined(),
    teamSize: yup.string().trim().defined(),
    locations: yup
      .array()
      .of(yup.object({ value: yup.string().trim().defined() }))
      .max(MAX_TEAM_LOCATIONS, `Add up to ${MAX_TEAM_LOCATIONS} locations`)
      .test('unique-locations', 'Each location can only be added once', (locations = []) => {
        const values = filled(locations);
        return new Set(values).size === values.length;
      })
      .test('hq-first', 'Add a primary location, or make one of your other locations primary', (locations = []) => {
        if (version === 'current') return true;
        const hq = locations[0]?.value?.trim();
        return Boolean(hq) || filled(locations.slice(1)).length === 0;
      })
      .defined(),
  });

const toDefaults = (locations: string[]): TForm => ({
  name: mockTeam.name,
  shortDescription: mockTeam.shortDescription,
  dateFounded: mockTeam.dateFounded,
  teamSize: mockTeam.teamSize,
  locations: (locations.length ? locations : ['']).map((value) => ({ value })),
});

export default function TeamLocationsPrototype() {
  const [version, setVersion] = useState<TVersion>('proposed');
  // What a Save last wrote, so switching versions compares the same data.
  const [saved, setSaved] = useState<string[]>(mockTeam.locations);
  /* Proposed only: the open card the status bar watches, and whether its form has
     unsaved changes (reported by SectionEditorControls through EditorDirtyContext). */
  const editCardRef = useRef<HTMLDivElement>(null);
  const [dirty, setDirty] = useState(false);
  const proposed = version === 'proposed';

  return (
    <div className={s.page}>
      <div className={s.demoBar}>
        <span className={s.demoLabel}>Version</span>
        <div className={s.demoSwitch}>
          {(
            [
              ['current', 'Current (feature env)'],
              ['proposed', 'Proposed'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`${s.demoBtn} ${version === key ? s.demoBtnActive : ''}`}
              onClick={() => setVersion(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <EditorDirtyContext.Provider value={setDirty}>
        <div className={s.column}>
          <p className={s.savedLine}>
            <span className={s.savedLabel}>Saved on the profile</span>
            {saved.length ? saved.join(' · ') : 'No locations'}
          </p>

          {proposed ? (
            <Section muted={false} ref={editCardRef}>
              <DetailsSection editView classes={editSectionClasses(true)}>
                <TeamDetailsForm key={version} version={version} locations={saved} onSaved={setSaved} />
              </DetailsSection>
            </Section>
          ) : (
            <DetailsSection editView>
              <TeamDetailsForm key={version} version={version} locations={saved} onSaved={setSaved} />
            </DetailsSection>
          )}

          {/* The rest of the team page — scaffolding so the editor can be scrolled away.
              Muted in Proposed, as every other card is while one is open. */}
          {mockOtherSections.map((section) => (
            <Section key={section.title} muted={proposed}>
              <DetailsSection>
                <DetailsSectionHeader title={section.title} />
                <ul className={s.otherRows}>
                  {section.rows.map((row) => (
                    <li key={row}>{row}</li>
                  ))}
                </ul>
              </DetailsSection>
            </Section>
          ))}
        </div>

        {proposed && (
          <FloatingEditorControls
            target={editCardRef}
            activeKey="profile-details"
            canSave={dirty}
            status={dirty ? 'Unsaved changes in Profile Details' : 'Editing Profile Details'}
          />
        )}
      </EditorDirtyContext.Provider>
    </div>
  );
}

function TeamDetailsForm({
  version,
  locations,
  onSaved,
}: {
  version: TVersion;
  locations: string[];
  onSaved: (locations: string[]) => void;
}) {
  const methods = useForm<TForm>({
    defaultValues: toDefaults(locations),
    resolver: yupResolver(makeSchema(version)) as never,
    mode: 'onSubmit',
  });
  const { handleSubmit, reset } = methods;

  const onSubmit = (data: TForm) => {
    const next = data.locations.map((location) => location.value.trim()).filter(Boolean);
    onSaved(next);
    reset(toDefaults(next));
    toast.success('Profile details saved');
  };

  const fields = (
    <div className={s.panel}>
      <FormField name="name" placeholder="Enter team name" label="Team Name" max={150} isRequired />
      <FormField name="shortDescription" placeholder="Add a short description" label="Short Description" max={150} />
      <FormField
        name="dateFounded"
        placeholder="eg., 2014"
        label="Date Founded"
        maxLength={4}
        inputMode="numeric"
        description="The 4-digit year your team was founded."
      />
      <FormField
        name="teamSize"
        placeholder="eg., 50 or 11-50"
        label="Team Size"
        description="Employee count as a number, or a range label."
      />

      {version === 'current' ? <CurrentLocationsInput /> : <ProposedLocationsInput />}
    </div>
  );

  // Cancel resets the form; the prototype keeps the editor open because the editor is the subject.
  const close = () => undefined;

  if (version === 'proposed') {
    return (
      <FormProvider {...methods}>
        <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <SectionEditorTitle title="Edit Profile Details" />
          {fields}
          <SectionEditorControls onClose={close} />
        </form>
      </FormProvider>
    );
  }

  return (
    <FormProvider {...methods}>
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <EditFormControls title="Edit Profile Details" onClose={close}>
          {fields}
        </EditFormControls>
        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
