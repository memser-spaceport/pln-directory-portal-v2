import React from 'react';
import { useFormContext } from 'react-hook-form';

import { MonthYearSelect } from '@/components/form/MonthYearSelect';

import { TEditContributionsForm } from '@/components/page/member-details/ContributionsDetails/types';
import s from './ContributionsDatesInput.module.scss';
import { Switch } from '@base-ui-components/react/switch';

export const ContributionsDatesInput = () => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TEditContributionsForm>();
  const { startDate, endDate, isCurrent } = watch();

  const error0 = errors.startDate;
  const error1 = errors.endDate;

  return (
    <div className={s.root}>
      <div className={s.body}>
        <MonthYearSelect
          error={error0?.message}
          isRequired
          label="Start Date"
          value={startDate}
          onChange={(val) => {
            if (val === null) {
              return;
            }

            setValue('startDate', val, { shouldValidate: true, shouldDirty: true });
          }}
        />
        <MonthYearSelect
          error={error1?.message}
          label="End Date"
          value={endDate}
          disabled={isCurrent}
          onChange={(val) => {
            if (val === null) {
              return;
            }

            setValue('endDate', val, { shouldValidate: true, shouldDirty: true });
          }}
        />
        <label className={s.Label}>
          Present
          <Switch.Root defaultChecked className={s.Switch} checked={isCurrent} onCheckedChange={() => setValue('isCurrent', !isCurrent, { shouldValidate: true, shouldDirty: true })}>
            <Switch.Thumb className={s.Thumb} />
          </Switch.Root>
        </label>
      </div>
    </div>
  );
};
