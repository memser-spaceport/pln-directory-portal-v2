import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { IMember } from '@/types/members.types';
import { ProfileLocationInput } from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput';

jest.mock('@/components/ui/LocationSelect', () => ({
  LocationSelect: () => <div>location-select</div>,
}));

const WARNING = /only available in select locations/i;

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
  it('warns a member with PLAA access that a location change can remove it', () => {
    render(<TestForm member={memberWith(['plaa.access'])} />);

    expect(screen.getByText(WARNING)).toBeInTheDocument();
  });

  it('shows no warning to a member without PLAA access', () => {
    render(<TestForm member={memberWith(['founder_guides.view'])} />);

    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });
});
