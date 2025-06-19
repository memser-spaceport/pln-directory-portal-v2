import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './ProfileLocationInput.module.scss';
import { FormField } from '@/components/form/FormField';

export const ProfileLocationInput = () => {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Location</span>
      </div>
      <div className={s.body}>
        <div className={s.row}>
          <FormField name="country" placeholder="Enter country" label="Country" />
          <FormField name="state" placeholder="Enter state or province" label="State or Province" />
          <FormField name="city" placeholder="Enter your metro area or city" label="Metro Area/City" />
        </div>
        <p className={s.hint}>Please share location details to receive invitations for the network events happening in your area.</p>
      </div>
    </div>
  );
};
