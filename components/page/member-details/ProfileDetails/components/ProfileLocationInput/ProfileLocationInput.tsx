import React from 'react';
import Link from 'next/link';
import { useFormContext } from 'react-hook-form';

import { IMember } from '@/types/members.types';
import { TEditProfileForm } from '@/components/page/member-details/ProfileDetails/types';

import { PERMISSIONS } from '@/services/rbac/constants';

import { LocationSelect } from '@/components/ui/LocationSelect';

import s from './ProfileLocationInput.module.scss';

const PLAA_PERMISSIONS = [PERMISSIONS.PLAA.PERM_ACCESS, PERMISSIONS.PLAA.PERM_GUEST, PERMISSIONS.PLAA.PERM_MEMBER];

const PLAA_PAGE_HREF = '/alignment-asset';

interface Props {
  member: IMember;
}

export const ProfileLocationInput = ({ member }: Props) => {
  const { setValue, watch } = useFormContext<TEditProfileForm>();
  const { country, city, state } = watch();
  const hasPlaaAccess = member.rbac.effectivePermissions.some(({ code }) => PLAA_PERMISSIONS.includes(code));

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
          <Link href={PLAA_PAGE_HREF} className={s.link}>
            The PLAA program
          </Link>{' '}
          is limited to certain Geo locations. You may lose access to the page if you change your location.
        </p>
      )}
      <p className={s.hint}>
        Please share location details to receive invitations for relevant PL events happening in your area.
      </p>
    </div>
  );
};
