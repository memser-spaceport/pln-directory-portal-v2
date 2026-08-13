'use client';

import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { FormTextArea } from '@/components/form/FormTextArea';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { FormSwitch } from '@/components/form/FormSwitch';
import { MonthYearSelect } from '@/components/form/MonthYearSelect';

import { SettingsMenuView } from './SettingsMenuView';
import { DEFAULT_VALUES, MOCK_AVATAR, SKILL_OPTIONS } from './mocks';
import s from './ProfileSettings.module.scss';

export default function ProfileSettingsPrototype() {
  // Reused fields are base-ui / client-only — gate render to avoid hydration drift.
  const [mounted, setMounted] = useState(false);
  const methods = useForm({ defaultValues: DEFAULT_VALUES });
  const { formState, control, setValue } = methods;

  /* The experience dates. `MonthYearSelect` is a controlled pair of react-selects
     rather than a registered input, so it's driven the same way production's
     `ExperienceDatesInput` drives it — watch, then `setValue`. */
  const experienceStartDate = useWatch({ control, name: 'experienceStartDate' });
  const experienceEndDate = useWatch({ control, name: 'experienceEndDate' });
  const experienceIsCurrent = useWatch({ control, name: 'experienceIsCurrent' });

  useEffect(() => setMounted(true), []);
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
            <form onSubmit={methods.handleSubmit(() => {})}>
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

              {/* Experience — the destination the job board's step-2 modal names.
                  "We'll update it in Settings → Profile" is only true if the
                  fields it collects are editable here, so this section carries
                  production's own Experience entry field-for-field (Role, Team or
                  Organization, Description, Dates, Location — see
                  `ExperienceDetails/components/EditExperienceForm`).

                  Role, Team and Skills are the three the modal writes; the rest
                  are the ones it deliberately doesn't ask for mid-browse. One
                  entry, not a list: the modal captures a current role, and an
                  add/remove list editor is a bigger surface than this prototype
                  is asking a question about. */}
              <section className={s.section}>
                <h2 className={s.sectionTitle}>Experience</h2>
                <p className={s.sectionHint}>
                  What you do now. This is what a hiring team sees when a role on the job board matches you.
                </p>
                <div className={s.grid2}>
                  <FormField name="experienceTitle" label="Role" placeholder="Enter role" isRequired />
                  <FormField
                    name="experienceCompany"
                    label="Team or organization"
                    placeholder="Enter team or organization"
                    isRequired
                  />
                </div>
                <FormTextArea
                  name="experienceDescription"
                  label="Description"
                  placeholder="What you work on there"
                />
                {/* Row copied from production's `ExperienceDatesInput`: two
                    month/year selects and the Present switch, which disables the
                    end date rather than hiding it. */}
                <div className={s.dates}>
                  <MonthYearSelect
                    label="Start date"
                    isRequired
                    value={experienceStartDate ?? null}
                    onChange={(val) => setValue('experienceStartDate', val ?? '', { shouldDirty: true })}
                  />
                  <MonthYearSelect
                    label="End date"
                    disabled={!!experienceIsCurrent}
                    value={experienceEndDate ?? null}
                    onChange={(val) => setValue('experienceEndDate', val, { shouldDirty: true })}
                  />
                  <FormSwitch name="experienceIsCurrent" label="Present" />
                </div>
                <FormField name="experienceLocation" label="Location" placeholder="Enter location" />
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
                <Button type="button" size="m" style="border" variant="neutral">
                  Cancel
                </Button>
                <Button type="submit" size="m" style="fill" variant="primary" disabled={!formState.isDirty}>
                  Save changes
                </Button>
              </div>
            </form>
          </FormProvider>
        </main>
      </div>
    </div>
  );
}
