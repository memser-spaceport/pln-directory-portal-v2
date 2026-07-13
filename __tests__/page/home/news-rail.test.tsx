import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

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

const mockOnPopularItemClick = jest.fn();

describe('NewsRail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: false });
    mockGetForumDigestSettings.mockReturnValue({ data: { forumDigestEnabled: false } });
  });

  it('does not render the why-follow explainer', () => {
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);
    expect(screen.queryByText('Stay in the loop')).not.toBeInTheDocument();
  });

  it('renders the digest promo without a button before the auth store hydrates', () => {
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);
    expect(screen.getByText('Get network news Digest')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();
  });

  it('shows an enabled Subscribe button once hydrated, for an anonymous user', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('redirects to login on click when unauthenticated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });

  it('calls the forum-digest mutation with weekly frequency when an authenticated user subscribes, and fires onForumDigestOptionSelect(source: home-feed) once it succeeds', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockGetForumDigestSettings.mockReturnValue({
      data: { forumDigestEnabled: false, forumDigestFrequency: 7, memberUid: 'user-1' },
    });
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);
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
    mockGetForumDigestSettings.mockReturnValue({
      data: { forumDigestEnabled: false, forumDigestFrequency: 7, memberUid: 'user-1' },
    });
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    const options = mockMutate.mock.calls[0][1];
    options.onError();

    expect(mockOnForumDigestSaveFailed).toHaveBeenCalledWith({ attemptedFrequency: 'weekly', source: 'home-feed' });
    expect(mockOnForumDigestOptionSelect).not.toHaveBeenCalled();
  });

  it('shows the subscribed card with a link to Settings once forumDigestEnabled is true, instead of the promo card', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockGetForumDigestSettings.mockReturnValue({ data: { forumDigestEnabled: true } });
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);

    expect(screen.getByText("You're subscribed to the Digest")).toBeInTheDocument();
    expect(screen.getByText('Change frequency or unsubscribe anytime in Settings.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage in Settings/ })).toHaveAttribute('href', '/settings/email');

    expect(screen.queryByText('Get network news Digest')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument();
  });

  it('shows the digest promo to authenticated users without forum access (news-only digest)', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);

    expect(screen.getByText('Get network news Digest')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('keeps a followed suggestion visible with Following for 2s, then removes it', () => {
    jest.useFakeTimers();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    const onFollowToggle = jest.fn();
    const suggestions = [
      { uid: 't1', name: 'Banyan Storage', logo: null, reason: 'Storage · 1.2k followers' },
      { uid: 't2', name: 'Helia Labs', logo: null, reason: 'Infrastructure · 890 followers' },
    ];

    const { rerender } = render(
      <NewsRail
        suggestedTeams={suggestions}
        followedTeamUids={new Set()}
        onFollowToggle={onFollowToggle}
        onPopularItemClick={mockOnPopularItemClick}
      />,
    );

    expect(screen.getByText('Banyan Storage')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /follow banyan storage/i }));
    expect(onFollowToggle).toHaveBeenCalledWith('t1', 'Banyan Storage', false, 'news-rail', {
      position: 0,
      reason: 'Storage',
    });

    rerender(
      <NewsRail
        suggestedTeams={suggestions}
        followedTeamUids={new Set(['t1'])}
        onFollowToggle={onFollowToggle}
        onPopularItemClick={mockOnPopularItemClick}
      />,
    );

    expect(screen.getByRole('button', { name: /following banyan storage/i })).toBeInTheDocument();
    expect(screen.getByText('Helia Labs')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Banyan Storage')).not.toBeInTheDocument();
    expect(screen.getByText('Helia Labs')).toBeInTheDocument();
    jest.useRealTimers();
  });
});
