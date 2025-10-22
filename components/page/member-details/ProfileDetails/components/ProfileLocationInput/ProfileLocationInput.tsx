import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './ProfileLocationInput.module.scss';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { TEditProfileForm } from '@/components/page/member-details/ProfileDetails/types';

export const ProfileLocationInput = () => {
  const { setValue, watch } = useFormContext<TEditProfileForm>();
  const { country, city, state } = watch();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Location</span>
      </div>
      <LocationSelect
        resolvedCountry={country}
        resolvedCity={city}
        resolvedState={state}
        onSelect={(place) => {
          setValue('city', place.city ?? '', { shouldValidate: true, shouldDirty: true });
          setValue('state', place.metroArea ?? '', { shouldValidate: true, shouldDirty: true });
          setValue('country', place.country ?? '', { shouldValidate: true, shouldDirty: true });
        }}
      />
      <p className={s.hint}>
        Please share location details to receive invitations for the network events happening in your area.
      </p>
    </div>
  );
};
