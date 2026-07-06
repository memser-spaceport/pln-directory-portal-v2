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

describe('NewsRail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: false });
    mockGetForumDigestSettings.mockReturnValue({ data: { forumDigestEnabled: false } });
  });

  it('always renders the why-follow explainer', () => {
    render(<NewsRail />);
    expect(screen.getByText('Stay in the loop')).toBeInTheDocument();
    expect(
      screen.getByText('Follow a team to pull its latest news and updates to the top of your feed.'),
    ).toBeInTheDocument();
  });

  it('renders the digest promo without a button before the auth store hydrates', () => {
    render(<NewsRail />);
    expect(screen.getByText('Get notified about network news updates')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();
  });

  it('shows an enabled Subscribe button once hydrated, for an anonymous user', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    render(<NewsRail />);
    expect(screen.getByRole('button', { name: 'Subscribe for Digest' })).toBeInTheDocument();
  });

  it('redirects to login on click when unauthenticated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    render(<NewsRail />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe for Digest' }));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });

  it('calls the forum-digest mutation with weekly frequency when an authenticated user subscribes', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockGetForumDigestSettings.mockReturnValue({
      data: { forumDigestEnabled: false, forumDigestFrequency: 7, memberUid: 'user-1' },
    });
    render(<NewsRail />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe for Digest' }));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        uid: 'user-1',
        payload: { forumDigestEnabled: true, forumDigestFrequency: 7, memberUid: 'user-1' },
      },
      expect.anything(),
    );
    expect(mockOnForumDigestOptionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ forumDigestEnabled: true, forumDigestFrequency: 7 }),
    );
  });

  it('shows the subscribed card with a link to Settings once forumDigestEnabled is true, instead of the promo card', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockGetForumDigestSettings.mockReturnValue({ data: { forumDigestEnabled: true } });
    render(<NewsRail />);

    expect(screen.getByText("You're subscribed to the Digest")).toBeInTheDocument();
    expect(screen.getByText('Change frequency or unsubscribe anytime in Settings.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage in Settings/ })).toHaveAttribute('href', '/settings/email');

    expect(screen.queryByText('Get notified about network news updates')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subscribe for Digest' })).not.toBeInTheDocument();
  });
});
