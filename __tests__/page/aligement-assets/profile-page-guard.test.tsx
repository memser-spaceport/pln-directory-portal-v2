import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/page/aligement-assets/profile/profile', () => ({
  __esModule: true,
  default: () => <div>profile page body</div>,
}));

const mockUsePlaaAccess = jest.fn();
jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => mockUsePlaaAccess(),
}));

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

import ProfilePage from '@/app/alignment-asset/profile/page';

// Pins the wiring, not the guard's internals: without this, deleting the guard
// from page.tsx would leave every other test in this suite passing.
describe('Profile page — the plaa.access guard is actually mounted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'member-1' }, isHydrated: true });
  });

  test('a logged-in member without plaa.access does not reach the profile body', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });

    render(<ProfilePage />);

    expect(screen.queryByText('profile page body')).not.toBeInTheDocument();
    expect(screen.getByText(/don't have access/i)).toBeInTheDocument();
  });

  test('a PLAA member reaches the profile body', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: true, isLoading: false, isError: false });

    render(<ProfilePage />);

    expect(screen.getByText('profile page body')).toBeInTheDocument();
  });
});
