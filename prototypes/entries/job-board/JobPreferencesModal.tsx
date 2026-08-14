'use client';

import { useEffect, useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Modal } from '@/components/common/Modal';
import { Checkbox } from '@/components/common/Checkbox';
import { CloseIcon, SearchIcon } from '@/components/icons';
import { FormMultiSelect, type MultiSelectOption } from '@/components/form/FormMultiSelect';
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
import { hasCriteria, type JobPreferences, type RoleCriteria } from './viewerState';
import s from './JobPreferencesModal.module.scss';

interface JobPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  /** Saved preferences, if any — otherwise the modal falls back to the rail. */
  preferences: JobPreferences;
  /** What the rail is currently narrowed to; the pre-fill when nothing is saved. */
  criteria: RoleCriteria;
  onSave: (next: JobPreferences) => void;
}

type PreferencesFormData = {
  roleCategory: MultiSelectOption[];
  seniority: MultiSelectOption[];
  workplaceType: MultiSelectOption[];
  location: MultiSelectOption[];
  openToNewRoles: boolean;
};

const toOptions = (values: string[], label: (v: string) => string = (v) => v): MultiSelectOption[] =>
  values.map((value) => ({ value, label: label(value) }));

const toValues = (options: MultiSelectOption[] | undefined): string[] => (options ?? []).map((o) => o.value);

/**
 * "What I'm looking for" — four multi-selects mirroring the rail's own sections,
 * plus the availability flag.
 *
 * Two decisions worth naming:
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
 */
export function JobPreferencesModal({ open, onClose, preferences, criteria, onSave }: JobPreferencesModalProps) {
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
    defaultValues: { roleCategory: [], seniority: [], workplaceType: [], location: [], openToNewRoles: true },
  });
  const { control, reset, setValue } = methods;

  const openToNewRoles = useWatch({ control, name: 'openToNewRoles' });
  const roleCategory = useWatch({ control, name: 'roleCategory' }) ?? [];
  const seniority = useWatch({ control, name: 'seniority' }) ?? [];
  const workplaceType = useWatch({ control, name: 'workplaceType' }) ?? [];
  const location = useWatch({ control, name: 'location' }) ?? [];

  // Seed on open: saved preferences if they exist, otherwise the live rail.
  useEffect(() => {
    if (!open) return;
    const seed: RoleCriteria = hasCriteria(preferences) ? preferences : criteria;
    reset({
      roleCategory: toOptions(seed.roleCategory),
      seniority: toOptions(seed.seniority, seniorityDisplayLabel),
      workplaceType: toOptions(seed.workplaceType, workplaceTypeDisplayLabel),
      location: toOptions(seed.location),
      openToNewRoles: hasCriteria(preferences) ? preferences.openToNewRoles : true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const prefilled = !hasCriteria(preferences) && hasCriteria(criteria);
  const canSave = roleCategory.length > 0 || seniority.length > 0 || workplaceType.length > 0 || location.length > 0;

  const submit = () => {
    if (!canSave) return;
    onSave({
      roleCategory: toValues(roleCategory),
      seniority: toValues(seniority),
      workplaceType: toValues(workplaceType),
      location: toValues(location),
      openToNewRoles: !!openToNewRoles,
    });
  };

  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      <div className={`${intro.modal} ${s.modal}`}>
        <button type="button" className={intro.closeButton} onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>

        <div className={intro.iconWrapper}>
          <SearchIcon width={26} height={26} className={s.icon} />
        </div>

        <h2 className={intro.title}>What are you looking for?</h2>

        <p className={intro.desc}>
          {prefilled
            ? 'Filled in from the filters you just set — adjust anything that isn’t right.'
            : 'We’ll sort the board around this, and teams hiring for it can find you.'}
        </p>

        <FormProvider {...methods}>
          <form
            className={`${intro.form} ${s.form}`}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className={s.fields}>
              <FormMultiSelect
                name="roleCategory"
                label="Role category"
                placeholder="Engineering, Product…"
                options={roleCategoryOptions}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              />
              <FormMultiSelect
                name="seniority"
                label="Seniority"
                placeholder="Senior, Lead…"
                options={seniorityOptions}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              />
              <FormMultiSelect
                name="workplaceType"
                label="Workplace type"
                placeholder="Remote, Hybrid…"
                options={workplaceOptions}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              />
              <FormMultiSelect
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

            <p className={s.note}>
              {canSave
                ? 'You can change this any time in Settings → Job alerts.'
                : 'Pick at least one thing you’re looking for.'}
            </p>

            <div className={intro.actions}>
              <button type="button" className={intro.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={intro.submitButton} disabled={!canSave}>
                Save
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}
