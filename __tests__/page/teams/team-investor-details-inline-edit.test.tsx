import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { TeamInvestorDetails } from '@/components/page/team-details/TeamInvestorDetails';

jest.mock('@/components/page/team-details/TeamInvestorDetails/components/EditTeamInvestorDetailsForm', () => ({
  EditTeamInvestorDetailsForm: () => <div>Edit Fund Details Form</div>,
}));

describe('TeamInvestorDetails inline edit', () => {
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

  it('shows readonly fund details and switches to edit mode for team leads', () => {
    render(
      <TeamInvestorDetails
        team={
          {
            id: 'team-1',
            isFund: true,
            investorProfile: {
              uid: 'profile-1',
              investmentFocus: ['AI', 'Infra'],
              typicalCheckSize: '250000',
              createdAt: '',
              updatedAt: '',
              teamUid: 'team-1',
              memberUid: null,
              secRulesAccepted: true,
              investInStartupStages: ['Seed'],
              investInFundTypes: ['Early stage'],
            },
          } as any
        }
        userInfo={{ uid: 'user-1', leadingTeams: ['team-1'], roles: [] } as any}
        isLoggedIn
      />,
    );

    expect(screen.getByText('Fund Details')).toBeInTheDocument();
    expect(screen.getByText('Early stage')).toBeInTheDocument();
    expect(screen.getByText(/\$250,000/)).toBeInTheDocument();
    expect(screen.getByText('Seed')).toBeInTheDocument();
    expect(screen.getByText('AI, Infra')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByText('Edit Fund Details Form')).toBeInTheDocument();
    expect(screen.queryByText('AI, Infra')).not.toBeInTheDocument();
  });

  it('does not show edit action for viewers without team access', () => {
    render(
      <TeamInvestorDetails
        team={
          {
            id: 'team-1',
            isFund: true,
            investorProfile: {
              uid: 'profile-1',
              investmentFocus: ['AI'],
              typicalCheckSize: '50000',
              createdAt: '',
              updatedAt: '',
              teamUid: 'team-1',
              memberUid: null,
              secRulesAccepted: true,
              investInStartupStages: ['Pre-seed'],
              investInFundTypes: ['Growth'],
            },
          } as any
        }
        userInfo={{ uid: 'user-2', leadingTeams: [], roles: [] } as any}
        isLoggedIn
      />,
    );

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('renders empty state when fund details are missing', () => {
    render(
      <TeamInvestorDetails
        team={
          {
            id: 'team-1',
            isFund: true,
            investorProfile: {
              uid: 'profile-1',
              investmentFocus: [],
              typicalCheckSize: '',
              createdAt: '',
              updatedAt: '',
              teamUid: 'team-1',
              memberUid: null,
              secRulesAccepted: true,
              investInStartupStages: [],
              investInFundTypes: [],
            },
          } as any
        }
        userInfo={{ uid: 'user-1', leadingTeams: ['team-1'], roles: [] } as any}
        isLoggedIn
      />,
    );

    expect(screen.getByText('Fund Details')).toBeInTheDocument();
    expect(screen.getByText('Add fund types')).toBeInTheDocument();
    expect(screen.getByText('Add typical check size')).toBeInTheDocument();
    expect(screen.getByText('Add startup stages')).toBeInTheDocument();
    expect(screen.getByText('Add investment focus')).toBeInTheDocument();
  });

  it('opens fund edit mode when clicking an empty state add button', () => {
    render(
      <TeamInvestorDetails
        team={
          {
            id: 'team-1',
            isFund: true,
            investorProfile: {
              uid: 'profile-1',
              investmentFocus: [],
              typicalCheckSize: '',
              createdAt: '',
              updatedAt: '',
              teamUid: 'team-1',
              memberUid: null,
              secRulesAccepted: true,
              investInStartupStages: [],
              investInFundTypes: [],
            },
          } as any
        }
        userInfo={{ uid: 'user-1', leadingTeams: ['team-1'], roles: [] } as any}
        isLoggedIn
      />,
    );

    fireEvent.click(screen.getByText('Add fund types'));

    expect(screen.getByText('Edit Fund Details Form')).toBeInTheDocument();
  });
});