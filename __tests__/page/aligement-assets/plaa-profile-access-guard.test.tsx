import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { PlaaProfileAccessGuard } from '@/components/page/aligement-assets/profile/plaa-profile-access-guard';

const mockUsePlaaAccess = jest.fn();
jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => mockUsePlaaAccess(),
}));

describe('PlaaProfileAccessGuard', () => {
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
    // An unreachable access-control API must not fall through to rendering
    // another member's balance data.
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: true });

    render(
      <PlaaProfileAccessGuard>
        <div>Profile content</div>
      </PlaaProfileAccessGuard>,
    );

    expect(screen.queryByText('Profile content')).not.toBeInTheDocument();
    expect(screen.getByText(/don't have access/i)).toBeInTheDocument();
  });
});
