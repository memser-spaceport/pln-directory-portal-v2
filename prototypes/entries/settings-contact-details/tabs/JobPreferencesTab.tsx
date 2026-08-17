'use client';

import { useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { toast } from '@/components/core/ToastContainer';
import type { MultiSelectOption } from '@/components/form/FormMultiSelect';
import {
  buildWorkplaceTypeFacetItems,
  seniorityDisplayLabel,
  sortSeniorityValues,
  workplaceTypeDisplayLabel,
} from '@/utils/jobs.utils';

// Production's own frame for this tab, unchanged — the tab swaps its *contents*,
// not the shell it sits in.
import s from '@/components/page/job-alerts/JobAlertsManager/JobAlertsManager.module.scss';
// The production "Are you open to collaborate?" row — checkbox, label, hint — is
// this exact field on the profile, so it's the same markup and stylesheet here.
import collab from '@/components/page/member-details/ProfileDetails/components/ProfileCollaborateInput/ProfileCollaborateInput.module.scss';

// The same select the job-board modal's step 1 uses, so the fields a person fills
// in the modal and the fields they come back to here are the same control — down
// to the grey chip ✕. Cross-entry import, like job-board's own use of
// newsfeed-v0 and news-shared.
import { PreferenceMultiSelect } from '../../job-board/PreferenceMultiSelect';
import {
  MOCK_LOCATION_FACETS,
  MOCK_ROLE_CATEGORY_FACETS,
  MOCK_SENIORITY_FACETS,
  MOCK_WORKMODE_FACETS,
} from '../../job-board/mocks';

import t from './JobPreferencesTab.module.scss';

type PreferencesForm = {
  roleCategory: MultiSelectOption[];
  seniority: MultiSelectOption[];
  workplaceType: MultiSelectOption[];
  location: MultiSelectOption[];
  openToNewRoles: boolean;
};

const toOptions = (values: string[], label: (v: string) => string = (v) => v): MultiSelectOption[] =>
  values.map((value) => ({ value, label: label(value) }));

/**
 * Settings → **Job preferences**, replacing the Job Alert tab.
 *
 * The old tab managed an *alert* — a saved filter that mails you weekly — and
 * for a member who hadn't made one it was a dead end with a "Browse jobs" button
 * on it. But the job board now collects the same four facets as **preferences**:
 * the thing that sorts the board and makes you findable by hiring teams. Having
 * settings offer to manage a weekly email while the board quietly held the
 * answers that actually matter split one idea across two names.
 *
 * So this tab edits the preferences themselves. Three consequences worth naming:
 *
 * 1. **Same fields, same controls as the modal's step 1.** `PreferenceMultiSelect`
 *    is imported, not re-implemented — a settings page that renders a different
 *    control for the same field teaches people the two places are different
 *    things.
 *
 * 2. **"Open to new roles" comes along.** It's `member.openToWork` rather than
 *    filter state, so strictly it lives on the profile — but it's the switch that
 *    decides whether any of this makes you findable, and separating it from the
 *    criteria it governs would leave someone with preferences saved and no idea
 *    why nobody can see them. The hint says where it shows.
 *
 * 3. **The weekly email is not gone, it's downstream.** These criteria are the
 *    same `IJobAlertFilterState` shape the alert used, so "email me these weekly"
 *    is a checkbox on this record rather than a separate tab. Out of scope here —
 *    this prototype is about where the preferences are edited.
 */
export function JobPreferencesTab() {
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

  /* Seeded as if the member had already saved from the board — the empty state is
     the board's job to prompt for, and reviewing this tab blank would show none of
     what it's for. */
  const methods = useForm<PreferencesForm>({
    defaultValues: {
      roleCategory: toOptions(['Engineering']),
      seniority: toOptions(['senior'], seniorityDisplayLabel),
      workplaceType: toOptions(['remote'], workplaceTypeDisplayLabel),
      location: [],
      openToNewRoles: true,
    },
  });
  const { control, setValue, handleSubmit, formState } = methods;
  const openToNewRoles = useWatch({ control, name: 'openToNewRoles' });

  const onSubmit = () => {
    // Same confirmation the board gives, minus the count — nothing here is sorted,
    // so promising a re-sorted board from a settings page would be describing a
    // screen the person isn't looking at.
    toast.success('Job preferences saved.');
    methods.reset(methods.getValues());
  };

  return (
    <div className={s.root}>
      <h5 className={s.title}>Job Preferences</h5>

      <div className={s.card}>
        <div className={s.content}>
          <p className={t.intro}>
            What you&apos;re looking for. We sort the job board around this, and teams hiring for it can find you.
          </p>

          <form className={t.form} onSubmit={handleSubmit(onSubmit)}>
            <FormProvider {...methods}>
              <div className={t.fields}>
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

                <div className={collab.root}>
                  <label className={collab.label}>
                    <Checkbox
                      checked={!!openToNewRoles}
                      onChange={(v) => setValue('openToNewRoles', v, { shouldDirty: true })}
                    />
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

              {/* Disabled until something changes, like every other settings form
                  here — a live Save on an untouched form invites a pointless
                  round trip and gives no signal that anything was edited. */}
              <div className={t.actions}>
                <Button type="submit" size="s" disabled={!formState.isDirty}>
                  Save
                </Button>
              </div>
            </FormProvider>
          </form>
        </div>
      </div>
    </div>
  );
}
