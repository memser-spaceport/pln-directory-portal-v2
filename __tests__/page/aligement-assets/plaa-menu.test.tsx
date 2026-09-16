import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import PlaaMenu from '@/components/page/aligement-assets/plaa-menu';

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));

const mockUsePlaaAccess = jest.fn();
jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => mockUsePlaaAccess(),
}));

beforeEach(() => {
  mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });
});

describe('PlaaMenu — Kudos visibility by access level', () => {
  test('shows the Kudos entry for a logged-in PLAA/LabOS user', () => {
    render(<PlaaMenu isLoggedIn />);
    expect(screen.getByRole('button', { name: /kudos/i })).toBeInTheDocument();
  });

  test('hides the Kudos entry entirely for a guest (not logged into LabOS)', () => {
    render(<PlaaMenu isLoggedIn={false} />);
    expect(screen.queryByRole('button', { name: /kudos/i })).not.toBeInTheDocument();
  });

  test('hides the Kudos entry when the login state is not yet known', () => {
    render(<PlaaMenu />);
    expect(screen.queryByRole('button', { name: /kudos/i })).not.toBeInTheDocument();
  });

  test('keeps every other PLAA nav entry visible regardless of login state', () => {
    render(<PlaaMenu isLoggedIn={false} />);
    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activities/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /faq/i })).toBeInTheDocument();
  });
});

describe('PlaaMenu — Profile visibility by PLAA access', () => {
  const profileEntry = () => screen.queryByRole('button', { name: /^profile$/i });

  test('shows Profile for a member holding PLAA access', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: true, isLoading: false, isError: false });
    render(<PlaaMenu isLoggedIn />);
    expect(profileEntry()).toBeInTheDocument();
  });

  test('hides Profile from a signed-in member without PLAA access', () => {
    render(<PlaaMenu isLoggedIn />);
    expect(profileEntry()).not.toBeInTheDocument();
  });

  test('hides Profile from a guest', () => {
    render(<PlaaMenu isLoggedIn={false} />);
    expect(profileEntry()).not.toBeInTheDocument();
  });

  test('hides Profile while access is still loading or failed to load', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: true, isError: false });
    const { unmount } = render(<PlaaMenu isLoggedIn />);
    expect(profileEntry()).not.toBeInTheDocument();
    unmount();

    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: true });
    render(<PlaaMenu isLoggedIn />);
    expect(profileEntry()).not.toBeInTheDocument();
  });
});
