import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseProfileData = jest.fn();
jest.mock('@/services/plaa/hooks/useProfileData', () => ({
  useProfileData: () => mockUseProfileData(),
}));

jest.mock('@/components/page/aligement-assets/profile/profile-hero', () => ({
  __esModule: true,
  default: () => <div data-testid="profile-hero" />,
}));

jest.mock('@/components/page/aligement-assets/profile/snapshot-history-tab', () => ({
  __esModule: true,
  default: () => <div data-testid="snapshot-history-tab" />,
}));

jest.mock('@/components/page/aligement-assets/profile/contribution-profile-tab', () => ({
  __esModule: true,
  default: () => <div data-testid="contribution-profile-tab" />,
}));

import Profile from '@/components/page/aligement-assets/profile/profile';

const NOT_ONBOARDED_DATA = {
  identity: { isOnboarded: false },
  balance: {},
  balanceStatus: 'unavailable',
  pointsThisSnapshot: 0,
  snapshotHistory: [],
  contributionHistory: [],
};

const ONBOARDED_DATA = {
  identity: { isOnboarded: true },
  balance: { plaaBalance: 112, activities: 102, infraRewards: 60, redeemed: 50 },
  balanceStatus: 'ready',
  pointsThisSnapshot: 420,
  snapshotHistory: [],
  contributionHistory: [],
};

describe('Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the "Your profile starts here" prompt when not onboarded', () => {
    mockUseProfileData.mockReturnValue(NOT_ONBOARDED_DATA);
    render(<Profile />);

    expect(screen.getByText('Your profile starts here')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-hero')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });

  it('renders the hero and defaults to the Snapshot history tab when onboarded', () => {
    mockUseProfileData.mockReturnValue(ONBOARDED_DATA);
    render(<Profile />);

    expect(screen.getByTestId('profile-hero')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-history-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('contribution-profile-tab')).not.toBeInTheDocument();
  });

  it('switches to the Contribution profile tab on click', () => {
    mockUseProfileData.mockReturnValue(ONBOARDED_DATA);
    render(<Profile />);

    fireEvent.click(screen.getByRole('tab', { name: 'Contribution profile' }));

    expect(screen.getByTestId('contribution-profile-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('snapshot-history-tab')).not.toBeInTheDocument();
  });
});
