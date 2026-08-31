import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { FounderGuidesAccessGuard } from '@/components/page/founder-guides/FounderGuidesAccessGuard/FounderGuidesAccessGuard';

/**
 * The guard used to bounce members to /members before the access answer or the
 * auth store had landed, so a permitted member opening a guide link cold got
 * dropped on the members page. Hydration, loading and error each have to hold
 * the redirect back.
 */

const mockReplace = jest.fn();
const mockAccess = jest.fn(() => ({ hasAccess: true, isLoading: false, isError: false }));
const mockIsHydrated = jest.fn(() => true);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('@/services/rbac/hooks/useFounderGuidesAccess', () => ({
  useFounderGuidesAccess: () => mockAccess(),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (selector: (s: { isHydrated: boolean }) => unknown) =>
    selector({ isHydrated: mockIsHydrated() }),
}));

function renderGuard() {
  return render(
    <FounderGuidesAccessGuard>
      <div>Guide body</div>
    </FounderGuidesAccessGuard>,
  );
}

const body = () => screen.queryByText('Guide body');

beforeEach(() => {
  jest.clearAllMocks();
  mockIsHydrated.mockReturnValue(true);
  mockAccess.mockReturnValue({ hasAccess: true, isLoading: false, isError: false });
});

describe('FounderGuidesAccessGuard — letting people in', () => {
  it('renders the guide for a permitted member', () => {
    renderGuard();

    expect(body()).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('FounderGuidesAccessGuard — holding the redirect back', () => {
  it('waits while the access check is still loading', () => {
    mockAccess.mockReturnValue({ hasAccess: false, isLoading: true, isError: false });
    renderGuard();

    expect(body()).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('waits while the auth store has not hydrated, even once access has answered', () => {
    mockIsHydrated.mockReturnValue(false);
    mockAccess.mockReturnValue({ hasAccess: false, isLoading: false, isError: false });
    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not bounce a member out on a failed access request', () => {
    mockAccess.mockReturnValue({ hasAccess: false, isLoading: false, isError: true });
    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders the guide on error rather than an indefinite blank page', () => {
    mockAccess.mockReturnValue({ hasAccess: false, isLoading: false, isError: true });
    renderGuard();

    expect(body()).toBeInTheDocument();
  });
});

describe('FounderGuidesAccessGuard — turning people away', () => {
  it('replaces rather than pushes, so Back does not bounce them again', () => {
    mockAccess.mockReturnValue({ hasAccess: false, isLoading: false, isError: false });
    renderGuard();

    expect(mockReplace).toHaveBeenCalledWith('/members');
  });

  it('never flashes the guide to a member who is being redirected', () => {
    mockAccess.mockReturnValue({ hasAccess: false, isLoading: false, isError: false });
    renderGuard();

    expect(body()).not.toBeInTheDocument();
  });

  it('redirects once the answer lands, not before', () => {
    mockAccess.mockReturnValue({ hasAccess: false, isLoading: true, isError: false });
    const { rerender } = renderGuard();
    expect(mockReplace).not.toHaveBeenCalled();

    mockAccess.mockReturnValue({ hasAccess: false, isLoading: false, isError: false });
    rerender(
      <FounderGuidesAccessGuard>
        <div>Guide body</div>
      </FounderGuidesAccessGuard>,
    );

    expect(mockReplace).toHaveBeenCalledWith('/members');
  });
});
