import React from 'react';
import { useFormContext } from 'react-hook-form';

import { IMember } from '@/types/members.types';
import { TEditProfileForm } from '@/components/page/member-details/ProfileDetails/types';

import { canViewPlaa } from '@/services/rbac/utils/plaa/canViewPlaa';

import { LocationSelect } from '@/components/ui/LocationSelect';

import s from './ProfileLocationInput.module.scss';

const PLAA_LOCATION_WARNING =
  'The PLAA program is only available in select locations. You might lose access if you change your location.';

interface Props {
  member: IMember;
}

export const ProfileLocationInput = ({ member }: Props) => {
  const { setValue, watch } = useFormContext<TEditProfileForm>();
  const { country, city, state } = watch();
  const hasPlaaAccess = canViewPlaa(new Set(member.rbac.effectivePermissions.map(({ code }) => code)));

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
      {hasPlaaAccess && (
        <p className={s.warning} role="note">
          {PLAA_LOCATION_WARNING}
        </p>
      )}
      <p className={s.hint}>
        Please share location details to receive invitations for relevant PL events happening in your area.
      </p>
    </div>
  );
};
