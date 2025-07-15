import React from 'react';
import { useFormContext } from 'react-hook-form';

import { MonthYearSelect } from '@/components/form/MonthYearSelect';

import { TEditContributionsForm } from '@/components/page/member-details/ContributionsDetails/types';
import s from './ContributionsDatesInput.module.scss';

export const ContributionsDatesInput = () => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TEditContributionsForm>();
  const { startDate, endDate } = watch();

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
          onChange={(val) => {
            if (val === null) {
              return;
            }

            setValue('endDate', val, { shouldValidate: true, shouldDirty: true });
          }}
        />
      </div>
    </div>
  );
};
