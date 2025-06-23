import React from 'react';
import { Switch } from '@base-ui-components/react/switch';

import { useFormContext } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';

import { FormSelect } from '@/components/form/FormSelect';
import { GroupBase, OptionsOrGroups } from 'react-select';

import s from './GeneralSettings.module.scss';

const OPTIONS = [
  { value: 'daily' as string, label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as unknown as OptionsOrGroups<string, GroupBase<string>>;

export const GeneralSettings = () => {
  const { watch, setValue } = useFormContext<TRecommendationsSettingsForm>();
  const { enabled } = watch();

  return (
    <div className={s.root}>
      <label className={s.Label}>
        <Switch.Root defaultChecked className={s.Switch} checked={enabled} onCheckedChange={() => setValue('enabled', !enabled, { shouldValidate: true, shouldDirty: true })}>
          <Switch.Thumb className={s.Thumb} />
        </Switch.Root>
        <div className={s.col}>
          <div className={s.primary}>Receive Recommendation</div>
          <div className={s.secondary}>Would you like to receive emails recommending useful contacts?</div>
        </div>
      </label>
      <FormSelect name="frequency" placeholder="Frequency" options={OPTIONS} disabled={!enabled} />
    </div>
  );
};
