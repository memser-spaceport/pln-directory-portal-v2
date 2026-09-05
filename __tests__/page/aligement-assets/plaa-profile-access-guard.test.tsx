import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { PlaaProfileAccessGuard } from '@/components/page/aligement-assets/profile/plaa-profile-access-guard';

const mockUsePlaaAccess = jest.fn();
jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => mockUsePlaaAccess(),
}));

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

const MEMBER = { uid: 'member-1' };

describe('PlaaProfileAccessGuard', () => {
  beforeEach(() => {
    // Default: a hydrated, logged-in member. Guest cases override this.
    mockUseCurrentUserStore.mockReturnValue({ currentUser: MEMBER, isHydrated: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the profile for a PLAA member', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: true, isLoading: false, isError: false });

    render(
      <PlaaProfileAccessGuard>
        <div>Profile content</div>
      </PlaaProfileAccessGuard>,
    );

    expect(screen.getByText('Profile content')).toBeInTheDocument();
  });

  it('renders nothing while access is still loading', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: true, isError: false });

    const { container } = render(
      <PlaaProfileAccessGuard>
        <div>Profile content</div>
      </PlaaProfileAccessGuard>,
    );

    // Neither the page nor the refusal — showing "no access" mid-fetch would
    // flash a false negative at a member who does have access.
    expect(container).toBeEmptyDOMElement();
  });

  it('hides the profile from a logged-in member without plaa.access', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });

    render(
      <PlaaProfileAccessGuard>
        <div>Profile content</div>
      </PlaaProfileAccessGuard>,
    );

    expect(screen.queryByText('Profile content')).not.toBeInTheDocument();
    expect(screen.getByText(/don't have access/i)).toBeInTheDocument();
  });

  it('fails closed when the permission lookup errors', () => {
    // An unreachable access-control API must deny rather than fall through to
    // the page. (The data itself is /me-scoped, so this protects the caller's
    // own view, not another member's data.)
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: true });

    render(
      <PlaaProfileAccessGuard>
        <div>Profile content</div>
      </PlaaProfileAccessGuard>,
    );

    expect(screen.queryByText('Profile content')).not.toBeInTheDocument();
    expect(screen.getByText(/don't have access/i)).toBeInTheDocument();
  });

  describe('logged-out visitor', () => {
    // A guest has no permissions, so usePlaaAccess reports exactly what a
    // denied member reports. The two must not be conflated: the refusal card
    // has no login link, so a guest shown it is stuck.
    beforeEach(() => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
      mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });
    });

    it('falls through to the page so its own login CTA shows, instead of the refusal', () => {
      render(
        <PlaaProfileAccessGuard>
          <div>Profile content</div>
        </PlaaProfileAccessGuard>,
      );

      expect(screen.getByText('Profile content')).toBeInTheDocument();
      expect(screen.queryByText(/don't have access/i)).not.toBeInTheDocument();
    });

    it('still renders nothing before hydration settles, rather than guessing', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: false });
      mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: true, isError: false });

      const { container } = render(
        <PlaaProfileAccessGuard>
          <div>Profile content</div>
        </PlaaProfileAccessGuard>,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });
});
