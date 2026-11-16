import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ProfileSection } from '@/components/common/profile/SectionEditLock';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { OwnProfileContext } from '@/components/common/profile/SectionVisibility/OwnProfileContext';
import type { SectionVisibility } from '@/components/common/profile/SectionVisibility/types/sectionVisibility';

const SHARED_ON_INTRO: SectionVisibility = {
  level: 'shared',
  label: 'Shared on intro',
  description: 'Shared with the people you are introduced to.',
};

function renderSection(input: { isOwnProfile: boolean; visibility?: SectionVisibility }) {
  const { isOwnProfile, visibility } = input;

  return render(
    <OwnProfileContext.Provider value={isOwnProfile}>
      <ProfileSection name="Investor Profile" visibility={visibility}>
        <DetailsSectionHeader title="Investor Details" />
      </ProfileSection>
    </OwnProfileContext.Provider>,
  );
}

describe('SectionVisibilityBadge', () => {
  it('labels the section on the member’s own profile', () => {
    renderSection({ isOwnProfile: true, visibility: SHARED_ON_INTRO });

    expect(screen.getByRole('button', { name: /^Shared on intro/ })).toBeInTheDocument();
  });

  it('explains who can see the section when pressed', async () => {
    renderSection({ isOwnProfile: true, visibility: SHARED_ON_INTRO });

    fireEvent.click(screen.getByRole('button', { name: /^Shared on intro/ }));

    expect(await screen.findByText('Shared with the people you are introduced to.')).toBeInTheDocument();
  });

  it('stays hidden on someone else’s profile', () => {
    renderSection({ isOwnProfile: false, visibility: SHARED_ON_INTRO });

    expect(screen.queryByRole('button', { name: /^Shared on intro/ })).not.toBeInTheDocument();
  });

  it('stays hidden in a section that declares no visibility', () => {
    renderSection({ isOwnProfile: true });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('stays hidden outside a profile section', () => {
    render(
      <OwnProfileContext.Provider value>
        <DetailsSectionHeader title="Experience" />
      </OwnProfileContext.Provider>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
