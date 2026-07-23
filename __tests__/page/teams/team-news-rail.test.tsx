import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { TeamNewsRail } from '@/components/page/team-details/TeamNews/TeamNewsRail';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { ITeamNewsDiscussion, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

const mockOnCardClicked = jest.fn();
const mockOnViewAllClicked = jest.fn();
const mockOnShowMoreClicked = jest.fn();
const mockOnUpvoteToggled = jest.fn();
const mockUpvoteMutate = jest.fn();
const mockUseCurrentUserStore = jest.fn(() => ({ currentUser: { uid: 'm-1' }, isHydrated: true }));
let lastModalProps: Record<string, unknown> | null = null;

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCardClicked: (...a: unknown[]) => mockOnCardClicked(...a),
    onTeamNewsViewAllClicked: (...a: unknown[]) => mockOnViewAllClicked(...a),
    onTeamNewsShowMoreClicked: (...a: unknown[]) => mockOnShowMoreClicked(...a),
    onTeamNewsUpvoteToggled: (...a: unknown[]) => mockOnUpvoteToggled(...a),
  }),
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

jest.mock('@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton', () => ({
  StartConversationButton: () => <button type="button">Discuss</button>,
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '4d ago',
}));

jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: jest.fn(() => false),
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
  beforeEach(() => jest.clearAllMocks());

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
    expect(button).toHaveTextContent('');
    expect(mockOnUpvoteToggled).not.toHaveBeenCalled();
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

  it('opens the modal focused on the clicked item via Show more, firing only the show-more event', () => {
    renderRailWithSummaries();

    fireEvent.click(screen.getAllByRole('button', { name: 'Show more' })[0]);

    expect(lastModalProps?.isOpen).toBe(true);
    expect(lastModalProps?.focusUid).toBe('news-1');
    expect(mockOnShowMoreClicked).toHaveBeenCalledWith(expect.objectContaining({ uid: 'news-1' }), 0);
    expect(mockOnCardClicked).not.toHaveBeenCalled();
    expect(mockOnViewAllClicked).not.toHaveBeenCalled();
  });

  it('View all after a prior Show more open is unfocused', () => {
    renderRailWithSummaries();

    fireEvent.click(screen.getAllByRole('button', { name: 'Show more' })[1]);
    expect(lastModalProps?.focusUid).toBe('news-2');

    act(() => {
      (lastModalProps?.onClose as () => void)();
    });
    expect(lastModalProps?.isOpen).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'View all news (5)' }));
    expect(lastModalProps?.isOpen).toBe(true);
    expect(lastModalProps?.focusUid).toBeNull();
  });

  it('Show more opens the modal even when View all is not rendered (total ≤ preview limit)', () => {
    renderRailWithSummaries(2);

    expect(screen.queryByRole('button', { name: /View all news/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Show more' })[0]);

    expect(lastModalProps?.isOpen).toBe(true);
    expect(lastModalProps?.focusUid).toBe('news-1');
  });
});
