import React from 'react';
import { Switch } from '@base-ui-components/react/switch';
import { useFormContext } from 'react-hook-form';

import s from './ExperienceDatesInput.module.scss';
import { TEditExperienceForm } from '@/components/page/member-details/ExperienceDetails/types';
import { MonthYearSelect } from '@/components/form/MonthYearSelect';

export const ExperienceDatesInput = () => {
  const { watch, setValue } = useFormContext<TEditExperienceForm>();
  const { startDate, endDate, isCurrent } = watch();

  return (
    <div className={s.root}>
      <div className={s.body}>
        <MonthYearSelect
          label="Start Date*"
          value={startDate}
          onChange={(val) => {
            if (val === null) {
              return;
            }

            setValue('startDate', val, { shouldValidate: true });
          }}
        />
        <MonthYearSelect
          disabled={isCurrent}
          label="End Date"
          value={endDate}
          onChange={(val) => {
            if (val === null) {
              return;
            }

            setValue('endDate', val, { shouldValidate: true });
          }}
        />
        <label className={s.Label}>
          Present
          <Switch.Root defaultChecked className={s.Switch} checked={isCurrent} onCheckedChange={() => setValue('isCurrent', !isCurrent, { shouldValidate: true })}>
            <Switch.Thumb className={s.Thumb} />
          </Switch.Root>
        </label>
      </div>
    </div>
  );
};
