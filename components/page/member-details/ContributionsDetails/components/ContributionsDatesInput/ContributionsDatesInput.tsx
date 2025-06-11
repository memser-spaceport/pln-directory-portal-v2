import React from 'react';
import { useFormContext } from 'react-hook-form';

import { MonthYearSelect } from '@/components/form/MonthYearSelect';

import { TEditContributionsForm } from '@/components/page/member-details/ContributionsDetails/types';
import s from './ContributionsDatesInput.module.scss';

export const ContributionsDatesInput = () => {
  const { watch, setValue } = useFormContext<TEditContributionsForm>();
  const { startDate, endDate } = watch();

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
          label="End Date"
          value={endDate}
          onChange={(val) => {
            if (val === null) {
              return;
            }

            setValue('endDate', val, { shouldValidate: true });
          }}
        />
      </div>
    </div>
  );
};
