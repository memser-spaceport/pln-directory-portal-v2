import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { IMember } from '@/types/members.types';
import { ProfileLocationInput } from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput';

jest.mock('@/components/ui/LocationSelect', () => ({
  LocationSelect: () => <div>location-select</div>,
}));

const WARNING =
  'The PLAA program is limited to certain Geo locations. You may lose access to the page if you change your location.';

function memberWith(permissionCodes: string[]) {
  return {
    rbac: { effectivePermissions: permissionCodes.map((code) => ({ uid: code, code, description: '' })) },
  } as unknown as IMember;
}

function TestForm({ member }: { member: IMember }) {
  const methods = useForm({ defaultValues: { country: 'Germany', city: 'Berlin', state: '' } });

  return (
    <FormProvider {...methods}>
      <ProfileLocationInput member={member} />
    </FormProvider>
  );
}

describe('ProfileLocationInput PLAA warning', () => {
  it.each(['plaa.access', 'plaa.guest', 'plaa.member'])(
    'warns a member holding %s that a location change can remove it',
    (permission) => {
      render(<TestForm member={memberWith([permission])} />);

      expect(screen.getByRole('note')).toHaveTextContent(WARNING);
      expect(screen.getByRole('link', { name: 'The PLAA program' })).toHaveAttribute('href', '/alignment-asset');
    },
  );

  it('shows no warning to a member without PLAA access', () => {
    render(<TestForm member={memberWith(['founder_guides.view'])} />);

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
