import React from 'react';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { useFormContext } from 'react-hook-form';
import { TEditProfileForm } from '@/components/page/member-details/ProfileDetails/types';

import s from './ProfileCollaborateInput.module.scss';

export const ProfileCollaborateInput = () => {
  const { watch, setValue, register } = useFormContext<TEditProfileForm>();
  const { openToCollaborate } = watch();

  return (
    <div className={s.root}>
      <label className={s.Label}>
        <Checkbox.Root
          className={s.Checkbox}
          checked={openToCollaborate}
          onCheckedChange={(val) => setValue('openToCollaborate', val, { shouldValidate: true, shouldDirty: true })}
        >
          <Checkbox.Indicator className={s.Indicator}>
            <CheckIcon className={s.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
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

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
