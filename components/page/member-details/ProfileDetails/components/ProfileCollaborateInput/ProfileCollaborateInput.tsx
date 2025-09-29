import React from 'react';
import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/common/Checkbox';
import { TEditProfileForm } from '@/components/page/member-details/ProfileDetails/types';

import s from './ProfileCollaborateInput.module.scss';

export const ProfileCollaborateInput = () => {
  const { watch, setValue } = useFormContext<TEditProfileForm>();
  const { openToCollaborate } = watch();

  return (
    <div className={s.root}>
      <label className={s.label}>
        <Checkbox
          checked={openToCollaborate}
          onChange={(v) => setValue('openToCollaborate', v, { shouldValidate: true, shouldDirty: true })}
        />

        <div className={s.labelWrapper}>
          <div className={s.primary}>Are you open to collaborate?</div>
          <div className={s.hint}>
            Enabling this implies you are open to collaborate on shared ideas & projects with other members. This is one
            way to join forces & reach a common goal.
          </div>
        </div>
      </label>
    </div>
  );
};
