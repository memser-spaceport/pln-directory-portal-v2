'use client';

import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { FormTextArea } from '@/components/form/FormTextArea';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { FormSwitch } from '@/components/form/FormSwitch';

import { SettingsMenuView } from './SettingsMenuView';
import { DEFAULT_VALUES, MOCK_AVATAR, SKILL_OPTIONS } from './mocks';
import s from './ProfileSettings.module.scss';

export default function ProfileSettingsPrototype() {
  // Reused fields are base-ui / client-only — gate render to avoid hydration drift.
  const [mounted, setMounted] = useState(false);
  const methods = useForm({ defaultValues: DEFAULT_VALUES });
  const { formState } = methods;

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
                  <FormField name="role" label="Role" placeholder="e.g. Co-founder & CEO" />
                </div>
                <div className={s.labeledField}>
                  <span className={s.fieldLabel}>Skills</span>
                  <FormTagsInput name="skills" selectLabel="Skills" placeholder="Add a skill" options={SKILL_OPTIONS} />
                </div>
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
