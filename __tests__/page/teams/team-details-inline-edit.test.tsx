import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { TeamDetails } from '@/components/page/team-details/TeamDetails';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'team-1' })),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() })),
}));

jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: jest.fn(() => ({
    onEditTeamByAdmin: jest.fn(),
    onEditTeamByLead: jest.fn(),
  })),
}));

jest.mock('@/utils/team.utils', () => ({
  getTeamPriority: jest.fn(() => undefined),
  getPriorityLabel: jest.fn(() => 'Priority'),
  getTechnologyImage: jest.fn(() => '/icons/tech-default.svg'),
}));

jest.mock('@/components/page/team-details/technologies', () => {
  const MockTechnologies = () => <div>Technologies Section</div>;
  MockTechnologies.displayName = 'MockTechnologies';
  return MockTechnologies;
});
jest.mock('@/components/common/ExpandableDescription', () => ({
  ExpandableDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/services/teams/hooks/useTeamsFormOptions', () => ({
  useTeamsFormOptions: jest.fn(() => ({
    data: {
      fundingStage: [{ id: 'seed', name: 'Seed' }],
      industryTags: [{ id: 'ai', name: 'AI' }],
    },
  })),
}));
jest.mock('@/components/page/member-details/ProfileDetails/components/ProfileImageInput', () => ({
  ProfileImageInput: () => <div>Profile Image Input</div>,
}));
jest.mock('@/components/page/member-details/BioDetails/components/BioInput', () => ({
  BioInput: () => <div>About Editor</div>,
}));

describe('TeamDetails inline edit', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('switches to inline edit mode after clicking Edit', () => {
    render(
      <TeamDetails
        team={{
          id: 'team-1',
          name: 'Team Alpha',
          logo: '/team.png',
          shortDescription: 'Short description',
          longDescription: '<p>About team</p>',
          fundingStage: { title: 'Seed' },
          industryTags: [{ title: 'AI' }],
          technologies: [],
          membershipSources: [],
          asks: [],
          maintainingProjects: [],
          contributingProjects: [],
          teamFocusAreas: [],
        }}
        userInfo={{ uid: 'user-1', leadingTeams: ['team-1'], roles: [] } as any}
      />,
    );

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('About team')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByText('Edit Profile Details')).toBeInTheDocument();
    expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    expect(screen.getByText('Profile Image Input')).toBeInTheDocument();
    expect(screen.getByText('About Editor')).toBeInTheDocument();
    expect(screen.queryByText('About team')).not.toBeInTheDocument();
  });
});