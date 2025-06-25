import React from 'react';
import { Switch } from '@base-ui-components/react/switch';

import { useFormContext } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';

// import { FormSelect } from '@/components/form/FormSelect';
import { GroupBase, OptionsOrGroups } from 'react-select';

import s from './GeneralSettings.module.scss';

const OPTIONS = [
  { value: 1, label: 'Daily' },
  { value: 7, label: 'Weekly' },
  { value: 14, label: 'Every 2 weeks' },
  { value: 30, label: 'Monthly' },
] as unknown as OptionsOrGroups<string, GroupBase<string>>;

export const GeneralSettings = () => {
  const { watch, setValue } = useFormContext<TRecommendationsSettingsForm>();
  const { enabled } = watch();

  return (
    <div className={s.root}>
      <label className={s.Label}>
        <div className={s.col}>
          <div className={s.row}>
            <div className={s.primary}>Receive Recommendation</div>
            <Switch.Root defaultChecked className={s.Switch} checked={enabled} onCheckedChange={() => setValue('enabled', !enabled, { shouldValidate: true, shouldDirty: true })}>
              <Switch.Thumb className={s.Thumb} />
            </Switch.Root>
          </div>

          <div className={s.secondary}>Receive suggestions on members you may want to connect with, delivered via email twice per month.</div>
        </div>
      </label>
      {/*<FormSelect name="frequency" placeholder="Frequency" options={OPTIONS} disabled={!enabled} />*/}
    </div>
  );
};
