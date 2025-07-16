import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './ExperienceDatesInput.module.scss';
import { TEditExperienceForm } from '@/components/page/member-details/ExperienceDetails/types';
import { MonthYearSelect } from '@/components/form/MonthYearSelect';
import { FormSwitch } from '@/components/form/FormSwitch';

export const ExperienceDatesInput = () => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TEditExperienceForm>();
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
          isRequired
          error={error1?.message}
          disabled={isCurrent}
          label="End Date"
          value={endDate}
          onChange={(val) => {
            if (val === null) {
              return;
            }

            setValue('endDate', val, { shouldValidate: true, shouldDirty: true });
          }}
        />
        <FormSwitch name="isCurrent" label="Present" />
      </div>
    </div>
  );
};
