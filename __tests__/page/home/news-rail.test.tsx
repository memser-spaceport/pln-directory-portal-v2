import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { NewsRail } from '@/components/page/home/TeamNews/components/NewsRail/NewsRail';

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockGetForumDigestSettings = jest.fn();
jest.mock('@/services/forum/hooks/useGetForumDigestSettings', () => ({
  useGetForumDigestSettings: (...args: unknown[]) => mockGetForumDigestSettings(...args),
}));

const mockMutate = jest.fn();
jest.mock('@/services/forum/hooks/useUpdateForumDigestSettings', () => ({
  useUpdateForumDigestSettings: () => ({ mutate: mockMutate }),
}));

const mockOnForumDigestOptionSelect = jest.fn();
const mockOnForumDigestSaveFailed = jest.fn();
jest.mock('@/analytics/settings.analytics', () => ({
  useSettingsAnalytics: () => ({
    onForumDigestOptionSelect: (...a: unknown[]) => mockOnForumDigestOptionSelect(...a),
    onForumDigestSaveFailed: (...a: unknown[]) => mockOnForumDigestSaveFailed(...a),
  }),
}));

const mockUseForumAccess = jest.fn();
jest.mock('@/services/access-control/hooks/useForumAccess', () => ({
  useForumAccess: () => mockUseForumAccess(),
}));

describe('NewsRail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: false });
    mockGetForumDigestSettings.mockReturnValue({ data: { forumDigestEnabled: false } });
    mockUseForumAccess.mockReturnValue({ hasAccess: false, isLoading: false });
  });

  it('always renders the why-follow explainer', () => {
    render(<NewsRail />);
    expect(screen.getByText('Stay in the loop')).toBeInTheDocument();
    expect(screen.getByText('Follow teams to receive updates and announcements.')).toBeInTheDocument();
  });

  it('renders the digest promo without a button before the auth store hydrates', () => {
    render(<NewsRail />);
    expect(screen.getByText('Get network news Digest')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();
  });

  it('shows an enabled Subscribe button once hydrated, for an anonymous user', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    render(<NewsRail />);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('redirects to login on click when unauthenticated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    render(<NewsRail />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });

  it('calls the forum-digest mutation with weekly frequency when an authenticated user subscribes, and fires onForumDigestOptionSelect(source: home-feed) once it succeeds', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockUseForumAccess.mockReturnValue({ hasAccess: true, isLoading: false });
    mockGetForumDigestSettings.mockReturnValue({
      data: { forumDigestEnabled: false, forumDigestFrequency: 7, memberUid: 'user-1' },
    });
    render(<NewsRail />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        uid: 'user-1',
        payload: { forumDigestEnabled: true, forumDigestFrequency: 7, memberUid: 'user-1' },
      },
      expect.anything(),
    );

    // mockMutate is a bare jest.fn() — it doesn't auto-invoke onSuccess/onError,
    // so the mutation's outcome must be simulated manually.
    const options = mockMutate.mock.calls[0][1];
    options.onSuccess();

    expect(mockOnForumDigestOptionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ forumDigestEnabled: true, forumDigestFrequency: 7, source: 'home-feed' }),
    );
    expect(mockOnForumDigestSaveFailed).not.toHaveBeenCalled();
  });

  it('fires onForumDigestSaveFailed(source: home-feed) on mutation failure, and does not also fire onForumDigestOptionSelect', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockUseForumAccess.mockReturnValue({ hasAccess: true, isLoading: false });
    mockGetForumDigestSettings.mockReturnValue({
      data: { forumDigestEnabled: false, forumDigestFrequency: 7, memberUid: 'user-1' },
    });
    render(<NewsRail />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    const options = mockMutate.mock.calls[0][1];
    options.onError();

    expect(mockOnForumDigestSaveFailed).toHaveBeenCalledWith({ attemptedFrequency: 'weekly', source: 'home-feed' });
    expect(mockOnForumDigestOptionSelect).not.toHaveBeenCalled();
  });

  it('shows the subscribed card with a link to Settings once forumDigestEnabled is true, instead of the promo card', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockUseForumAccess.mockReturnValue({ hasAccess: true, isLoading: false });
    mockGetForumDigestSettings.mockReturnValue({ data: { forumDigestEnabled: true } });
    render(<NewsRail />);

    expect(screen.getByText("You're subscribed to the Digest")).toBeInTheDocument();
    expect(screen.getByText('Change frequency or unsubscribe anytime in Settings.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage in Settings/ })).toHaveAttribute('href', '/settings/email');

    expect(screen.queryByText('Get network news Digest')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument();
  });

  it('hides digest cards for authenticated users without forum access', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockUseForumAccess.mockReturnValue({ hasAccess: false, isLoading: false });
    render(<NewsRail />);

    expect(screen.queryByText('Get network news Digest')).not.toBeInTheDocument();
    expect(screen.queryByText("You're subscribed to the Digest")).not.toBeInTheDocument();
  });
});
