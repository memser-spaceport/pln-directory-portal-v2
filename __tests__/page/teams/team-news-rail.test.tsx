import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { TeamNewsRail } from '@/components/page/team-details/TeamNews/TeamNewsRail';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { ITeamNewsDiscussion, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

const mockOnCardClicked = jest.fn();
const mockOnViewAllClicked = jest.fn();
const mockOnShowMoreClicked = jest.fn();
const mockOnUpvoteToggled = jest.fn();
const mockOnUpvoteFailed = jest.fn();
const mockOnAllNetworkUpdatesClicked = jest.fn();
const mockUpvoteMutate = jest.fn();
const mockUseCurrentUserStore = jest.fn(() => ({ currentUser: { uid: 'm-1' }, isHydrated: true }));
let lastModalProps: Record<string, unknown> | null = null;
let lastDetailProps: Record<string, unknown> | null = null;

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCardClicked: (...a: unknown[]) => mockOnCardClicked(...a),
    onTeamNewsViewAllClicked: (...a: unknown[]) => mockOnViewAllClicked(...a),
    onTeamNewsAllNetworkUpdatesClicked: (...a: unknown[]) => mockOnAllNetworkUpdatesClicked(...a),
    onTeamNewsShowMoreClicked: (...a: unknown[]) => mockOnShowMoreClicked(...a),
    onTeamNewsUpvoteToggled: (...a: unknown[]) => mockOnUpvoteToggled(...a),
    onTeamNewsUpvoteFailed: (...a: unknown[]) => mockOnUpvoteFailed(...a),
    onTeamNewsShared: jest.fn(),
  }),
}));

// The story modal is /home's, covered by its own suite — stub it to the props
// the rail is responsible for handing over.
jest.mock('@/components/page/home/TeamNews/components/NewsDetailModal', () => ({
  NewsDetailModal: (props: { item: { uid: string } }) => {
    lastDetailProps = props;
    return <div data-testid="news-detail-modal">{props.item.uid}</div>;
  },
  NEWS_DETAIL_TITLE_ID: 'news-detail-modal-title',
}));

// The badge's number, and the request that fills it. Default: unknown, which
// renders as the bare noun rather than a fake 0.
const mockCommentCount = jest.fn<number | undefined, []>(() => undefined);
const mockRequestCommentCounts = jest.fn();

jest.mock('@/services/feed/hooks/useFeedCommentCounts', () => ({
  useFeedCommentCount: () => mockCommentCount(),
  useFeedCommentCounts: (...a: unknown[]) => mockRequestCommentCounts(...a),
}));

// jsdom has no layout, so the real measured teaser never shows its button
// here; the stub always does, exposing the onShowMore plumbing. It mirrors the
// real button's stopPropagation — Show more must not read as a card click.
jest.mock('@/components/page/home/TeamNews/components/NewsCard/TruncatedSummary', () => ({
  TruncatedSummary: ({ onShowMore }: { onShowMore: () => void }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onShowMore();
      }}
    >
      Show more
    </button>
  ),
}));

jest.mock('@/services/team-news/hooks/useTeamNewsUpvoteToggle', () => ({
  useTeamNewsUpvoteToggle: () => ({ mutate: mockUpvoteMutate }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '4d ago',
}));

jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: jest.fn(() => false),
}));

jest.mock('@/services/team-news/hooks/useTeamNewsImpressions', () => ({
  useTeamNewsImpressions: () => ({ recordVisible: jest.fn() }),
}));

jest.mock('@/services/team-news/hooks/useCreateTeamNewsPost', () => ({
  useCreateTeamNewsPost: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/utils/uiFlags', () => ({
  getUiFlag: jest.fn().mockResolvedValue(true),
  setUiFlag: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/components/page/team-details/TeamNews/TeamNewsModal', () => ({
  TeamNewsModal: (props: { isOpen: boolean; fullscreen?: boolean }) => {
    lastModalProps = props;
    return props.isOpen ? (
      <div data-testid={props.fullscreen ? 'team-news-fullpage' : 'team-news-modal'}>
        {props.fullscreen ? 'Full page open' : 'Modal open'}
      </div>
    ) : null;
  },
}));

const makeItem = (uid: string): ITeamNewsItem => ({
  uid,
  teamUid: 'team-1',
  teamName: 'Protocol Labs',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT' as TeamNewsEventType,
  eventDate: '2026-06-01T00:00:00.000Z',
  title: `Headline ${uid}`,
  summary: null,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-06-02T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null } satisfies ITeamNewsDiscussion,
});

describe('TeamNewsRail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
  });

  it('renders preview items and header count', () => {
    render(
      <TeamNewsRail
        teamUid="team-1"
        teamName="Protocol Labs"
        initialData={{
          teamUid: 'team-1',
          teamName: 'Protocol Labs',
          page: 1,
          limit: 3,
          total: 2,
          items: [makeItem('news-1'), makeItem('news-2')],
        }}
      />,
    );

    expect(screen.getByText('Protocol Labs News (2)')).toBeInTheDocument();
    expect(screen.getByText('Headline news-1')).toBeInTheDocument();
    expect(screen.getByText('Headline news-2')).toBeInTheDocument();
    expect(screen.queryByText('Protocol Labs', { selector: '.teamName' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View all news/i })).not.toBeInTheDocument();
  });

  it('shows View all when total exceeds preview limit', () => {
    render(
      <TeamNewsRail
        teamUid="team-1"
        teamName="Protocol Labs"
        initialData={{
          teamUid: 'team-1',
          teamName: 'Protocol Labs',
          page: 1,
          limit: 3,
          total: 5,
          items: [makeItem('news-1'), makeItem('news-2'), makeItem('news-3')],
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'View all news (5)' })).toBeInTheDocument();
    expect(screen.queryByText('Headline news-4')).not.toBeInTheDocument();
  });

  it('opens the modal when View all is clicked on desktop', () => {
    render(
      <TeamNewsRail
        teamUid="team-1"
        teamName="Protocol Labs"
        initialData={{
          teamUid: 'team-1',
          teamName: 'Protocol Labs',
          page: 1,
          limit: 3,
          total: 4,
          items: [makeItem('news-1'), makeItem('news-2'), makeItem('news-3')],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View all news (4)' }));
    expect(mockOnViewAllClicked).toHaveBeenCalledWith('team-1', 'Protocol Labs', 4);
    expect(screen.getByTestId('team-news-modal')).toBeInTheDocument();
  });

  it('opens the full-page view when View all is clicked on mobile', () => {
    jest.mocked(useIsMobile).mockReturnValue(true);

    render(
      <TeamNewsRail
        teamUid="team-1"
        teamName="Protocol Labs"
        initialData={{
          teamUid: 'team-1',
          teamName: 'Protocol Labs',
          page: 1,
          limit: 3,
          total: 4,
          items: [makeItem('news-1'), makeItem('news-2'), makeItem('news-3')],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View all news (4)' }));
    expect(mockOnViewAllClicked).toHaveBeenCalledWith('team-1', 'Protocol Labs', 4);
    expect(screen.getByTestId('team-news-fullpage')).toBeInTheDocument();
  });

  const renderRailWithOneItem = () =>
    render(
      <TeamNewsRail
        teamUid="team-1"
        teamName="Protocol Labs"
        initialData={{
          teamUid: 'team-1',
          teamName: 'Protocol Labs',
          page: 1,
          limit: 3,
          total: 1,
          items: [{ ...makeItem('news-1'), upvoteCount: 0, viewerHasUpvoted: false }],
        }}
      />,
    );

  it('optimistically upvotes, reconciles on success, and shares the overlay with the modal', () => {
    mockUpvoteMutate.mockImplementation((_action, { onSuccess }) =>
      onSuccess({ upvoteCount: 5, viewerHasUpvoted: true }),
    );

    renderRailWithOneItem();
    fireEvent.click(screen.getByRole('button', { name: 'Like (0)' }));

    expect(mockUpvoteMutate).toHaveBeenCalledWith({ uid: 'news-1', isUpvoted: true }, expect.any(Object));
    // Reconciled with the server's authoritative count.
    const voted = screen.getByRole('button', { name: 'Remove like (5)' });

    expect(mockOnUpvoteToggled).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'news-1' }),
      0,
      true,
      'team-profile-rail',
    );
    // The same overlay is handed to the modal so both views stay in sync.
    expect((lastModalProps?.upvoteOverlay as Map<string, unknown>).get('news-1')).toEqual({
      viewerHasUpvoted: true,
      upvoteCount: 5,
    });
    expect(lastModalProps?.onUpvoteToggle).toEqual(expect.any(Function));
  });

  it('reverts the optimistic vote when the mutation fails', () => {
    mockUpvoteMutate.mockImplementation((_action, { onError }) => onError(new Error('nope')));

    renderRailWithOneItem();
    fireEvent.click(screen.getByRole('button', { name: 'Like (0)' }));

    const button = screen.getByRole('button', { name: 'Like (0)' });
    expect(button).toHaveTextContent('0');
    expect(mockOnUpvoteToggled).not.toHaveBeenCalled();
    // team-profile is the OTHER call site. Wiring only /home's would have made
    // the failure rate read 0% here while the success event covered both.
    expect(mockOnUpvoteFailed).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'news-1' }),
      expect.any(Number),
      true,
      'team-profile-rail',
    );
  });

  const summarized = (uid: string): ITeamNewsItem => ({
    ...makeItem(uid),
    summary: `A summary long enough to be trimmed for ${uid}.`,
  });

  const renderRailWithSummaries = (total = 5) =>
    render(
      <TeamNewsRail
        teamUid="team-1"
        teamName="Protocol Labs"
        initialData={{
          teamUid: 'team-1',
          teamName: 'Protocol Labs',
          page: 1,
          limit: 3,
          total,
          items: [summarized('news-1'), summarized('news-2')],
        }}
      />,
    );

  it('opens the story over the profile via Show more, firing only the show-more event', () => {
    renderRailWithSummaries();

    fireEvent.click(screen.getAllByRole('button', { name: 'Show more' })[1]);

    expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-2');
    // The archive stays shut: "Show more" asks for one story, not the list.
    expect(lastModalProps?.isOpen).toBe(false);
    expect(mockOnShowMoreClicked).toHaveBeenCalledWith(expect.objectContaining({ uid: 'news-2' }), 1);
    expect(mockOnCardClicked).not.toHaveBeenCalled();
    expect(mockOnViewAllClicked).not.toHaveBeenCalled();
  });

  it('Show more opens the story even when View all is not rendered (total ≤ preview limit)', () => {
    renderRailWithSummaries(2);

    expect(screen.queryByRole('button', { name: /View all news/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Show more' })[0]);

    expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-1');
  });

  it('tapping a card opens the story instead of leaving for the source', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    renderRailWithSummaries();

    fireEvent.click(screen.getByText('Headline news-1'));

    expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-1');
    expect(open).not.toHaveBeenCalled();
    expect(mockOnCardClicked).toHaveBeenCalledWith(expect.objectContaining({ uid: 'news-1' }), 0, 'team-profile-rail');
    open.mockRestore();
  });

  it('announces the row as a dialog opener so focus can be handed back to it', () => {
    renderRailWithSummaries();

    const row = screen.getByText('Headline news-1').closest('[data-story-uid]');
    expect(row).toHaveAttribute('role', 'button');
    expect(row).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('asks for the counts of the stories it shows', () => {
    renderRailWithSummaries();

    expect(mockRequestCommentCounts).toHaveBeenCalledWith({ uids: ['news-1', 'news-2'], enabled: true });
  });

  it('renders a known count and stays bare when the count is unknown', () => {
    mockCommentCount.mockReturnValue(4);
    const { unmount } = renderRailWithSummaries();
    expect(screen.getAllByRole('button', { name: '4 Comments, open' })).toHaveLength(2);

    unmount();
    // Absent from the response means zero OR not yet known — the button says the
    // noun and nothing else rather than claiming a 0 it can't stand behind.
    mockCommentCount.mockReturnValue(undefined);
    renderRailWithSummaries();
    expect(screen.getAllByRole('button', { name: 'Comments, open' })).toHaveLength(2);
  });

  it('the comment count opens the same story, reported as its own via', () => {
    renderRailWithSummaries();

    fireEvent.click(screen.getAllByRole('button', { name: 'Comments, open' })[1]);

    expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-2');
    expect(mockOnCardClicked).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'news-2' }),
      1,
      'team-profile-rail',
      'comments',
    );
  });

  it('closing the story leaves the profile as it was', () => {
    renderRailWithSummaries();
    fireEvent.click(screen.getByText('Headline news-1'));

    act(() => {
      (lastDetailProps?.onClose as () => void)();
    });

    expect(screen.queryByTestId('news-detail-modal')).not.toBeInTheDocument();
    expect(lastModalProps?.isOpen).toBe(false);
  });

  it('View all after a prior story open is unfocused', () => {
    renderRailWithSummaries();

    fireEvent.click(screen.getAllByRole('button', { name: 'Show more' })[1]);
    act(() => {
      (lastDetailProps?.onClose as () => void)();
    });

    fireEvent.click(screen.getByRole('button', { name: 'View all news (5)' }));
    expect(lastModalProps?.isOpen).toBe(true);
    expect(lastModalProps?.focusUid).toBeNull();
  });

  it('offers All network updates beside View all, and alone when there is no archive', () => {
    const { unmount } = renderRailWithSummaries();

    const link = screen.getByRole('link', { name: /All network updates/i });
    expect(link).toHaveAttribute('href', '/home');
    // The ↗ promises "elsewhere", and the profile behind it is worth keeping.
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getByRole('button', { name: 'View all news (5)' })).toBeInTheDocument();

    fireEvent.click(link);
    expect(mockOnAllNetworkUpdatesClicked).toHaveBeenCalledWith('team-1', 'Protocol Labs', 'team-profile-rail');

    unmount();
    renderRailWithSummaries(2);
    expect(screen.queryByRole('button', { name: /View all news/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All network updates/i })).toBeInTheDocument();
  });

  it('shows empty post prompt when the member can post and there is no news yet', () => {
    render(
      <TeamNewsRail
        teamUid="team-1"
        teamName="Protocol Labs"
        canPost
        memberUid="member-1"
        initialData={{
          teamUid: 'team-1',
          teamName: 'Protocol Labs',
          page: 1,
          limit: 3,
          total: 0,
          items: [],
        }}
      />,
    );

    expect(screen.getByText('No news yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post news' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All network updates/i })).toHaveAttribute('href', '/home');
  });

  it('shows the empty card for a directory admin once the client store is hydrated', () => {
    mockUseCurrentUserStore.mockReturnValue({
      currentUser: {
        uid: 'admin-1',
        rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
      },
      isHydrated: true,
    });

    render(
      <TeamNewsRail
        teamUid="team-1"
        teamName="Protocol Labs"
        canPost={false}
        initialData={{
          teamUid: 'team-1',
          teamName: 'Protocol Labs',
          page: 1,
          limit: 3,
          total: 0,
          items: [],
        }}
      />,
    );

    expect(screen.getByText('No news yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post news' })).toBeInTheDocument();
  });
});
