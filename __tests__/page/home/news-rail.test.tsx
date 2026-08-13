import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

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
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'), { scroll: false });
  });

  it('calls the forum-digest mutation with weekly frequency and news enabled when an authenticated user subscribes, and fires onForumDigestOptionSelect(source: home-feed) once it succeeds', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    mockGetForumDigestSettings.mockReturnValue({
      data: {
        forumDigestEnabled: false,
        forumDigestFrequency: 7,
        forumDigestNewsEnabled: false,
        memberUid: 'user-1',
      },
    });
    render(<NewsRail onPopularItemClick={mockOnPopularItemClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        uid: 'user-1',
        payload: {
          forumDigestEnabled: true,
          forumDigestFrequency: 7,
          forumDigestNewsEnabled: true,
          memberUid: 'user-1',
        },
      },
      expect.anything(),
    );

    // mockMutate is a bare jest.fn() — it doesn't auto-invoke onSuccess/onError,
    // so the mutation's outcome must be simulated manually.
    const options = mockMutate.mock.calls[0][1];
    options.onSuccess();

    expect(mockOnForumDigestOptionSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        forumDigestEnabled: true,
        forumDigestFrequency: 7,
        forumDigestNewsEnabled: true,
        source: 'home-feed',
      }),
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

  // The delayed-hide-after-follow behaviour moved into
  // useDelayedHideFollowedSuggestions when the module gained a second surface;
  // it has its own test file now. NewsRail just renders the list it is handed.
  it('renders the suggestions it is given, and drops the modules when renderModules is false', async () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' }, isHydrated: true });
    const visibleSuggestions = [
      { uid: 't1', name: 'Banyan Storage', logo: null, reason: 'Storage · 1.2k followers' },
      { uid: 't2', name: 'Helia Labs', logo: null, reason: 'Infrastructure · 890 followers' },
    ];

    const { rerender } = render(
      <NewsRail
        visibleSuggestions={visibleSuggestions}
        followedTeamUids={new Set()}
        onFollowToggle={jest.fn()}
        onPopularItemClick={mockOnPopularItemClick}
      />,
    );

    expect(screen.getByText('Banyan Storage')).toBeInTheDocument();
    expect(screen.getByText('Helia Labs')).toBeInTheDocument();

    // Below 1200px TeamNews renders these as scrollers instead — the rail must
    // not also render them, or both would be on screen at once.
    rerender(
      <NewsRail
        visibleSuggestions={visibleSuggestions}
        followedTeamUids={new Set()}
        onFollowToggle={jest.fn()}
        onPopularItemClick={mockOnPopularItemClick}
        renderModules={false}
      />,
    );

    // waitFor, not a bare assertion: AnimatePresence plays the card's exit
    // animation, so it stays mounted for the duration. That is also the one
    // window in which both surfaces exist — a resize across 1200px, ~280ms.
    await waitFor(() => expect(screen.queryByText('Banyan Storage')).not.toBeInTheDocument());
    // The digest card has no scroller counterpart, so it stays at every width.
    expect(screen.getByText(/Get network news Digest/i)).toBeInTheDocument();
  });
});
