import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TeamNewsDetails } from '@/components/page/member-details/TeamNewsDetails';
import type { IMember } from '@/types/members.types';
import type { ITeamNewsByTeamResponse, ITeamNewsItem } from '@/types/team-news.types';
import type { IUserInfo } from '@/types/shared.types';

const mockOnCardClicked = jest.fn();
const mockOnViewAllClicked = jest.fn();
const mockOnUpvoteToggled = jest.fn();
const mockOnUpvoteFailed = jest.fn();
const mockUpvoteMutate = jest.fn();
const mockCommentCount = jest.fn<number | undefined, []>(() => undefined);

let newsState: { data: ITeamNewsByTeamResponse | undefined; isPending: boolean };
let lastDetailProps: Record<string, unknown> | null = null;
let lastArchiveProps: Record<string, unknown> | null = null;

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCardClicked: (...a: unknown[]) => mockOnCardClicked(...a),
    onTeamNewsViewAllClicked: (...a: unknown[]) => mockOnViewAllClicked(...a),
    onTeamNewsUpvoteToggled: (...a: unknown[]) => mockOnUpvoteToggled(...a),
    onTeamNewsUpvoteFailed: (...a: unknown[]) => mockOnUpvoteFailed(...a),
  }),
}));

// The archive is the team profile's and has its own suite — stub it to the
// props this card is responsible for handing over. Renders nothing when closed,
// like the real one's fullscreen branch, so "is the archive up" is a DOM query.
jest.mock('@/components/page/team-details/TeamNews/TeamNewsModal', () => ({
  TeamNewsModal: (props: { isOpen: boolean; teamName: string; total?: number }) => {
    lastArchiveProps = props;
    if (!props.isOpen) return null;
    return (
      <div data-testid="team-news-archive">
        {props.teamName} archive ({props.total})
      </div>
    );
  },
}));

// The story modal is /home's and has its own suite — stub it down to the props
// this card is responsible for handing over.
jest.mock('@/components/page/home/TeamNews/components/NewsDetailModal', () => ({
  NewsDetailModal: (props: { item: { uid: string } }) => {
    lastDetailProps = props;
    return <div data-testid="news-detail-modal">{props.item.uid}</div>;
  },
}));

// The global useMutation mock never invokes onSuccess/onError, so optimism
// can't be exercised through it.
jest.mock('@/services/team-news/hooks/useTeamNewsUpvoteToggle', () => ({
  useTeamNewsUpvoteToggle: () => ({ mutate: mockUpvoteMutate }),
}));

// The global useQuery mock takes no arguments and ignores select/enabled, so the
// hook has to be mocked at its own module level.
jest.mock('@/components/page/member-details/TeamNewsDetails/hooks/useMemberTeamNews', () => ({
  useMemberTeamNews: () => newsState,
}));

// The card reads counts for its rows; the shared entry is /home's and has its
// own suite.
jest.mock('@/services/feed/hooks/useFeedCommentCounts', () => ({
  useFeedCommentCounts: jest.fn(),
  useFeedCommentCount: () => mockCommentCount(),
}));

// Stubbed to assert only what this card owns — that the footer is attributed to
// this surface. The new-tab behaviour is the real component's, and asserting it
// here would test this stub; the rail and modal suites render the real one.
jest.mock('@/components/page/team-details/TeamNews/TeamNewsFeedLink', () => ({
  TeamNewsFeedLink: (props: { source: string }) => (
    <a href="/home" target="_blank" rel="noopener noreferrer">
      All network updates ({props.source})
    </a>
  ),
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: (date: string) => (date === 'BAD_DATE' ? '' : '4d ago'),
}));

const APPROVED_VIEWER = { uid: 'viewer-1', rbac: { status: 'APPROVED' } } as unknown as IUserInfo;

function makeItem(uid: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem {
  return {
    uid,
    teamUid: 'team-1',
    teamName: 'Filecoin',
    teamLogoUrl: null,
    eventType: 'FUNDING',
    eventDate: '2026-08-14T00:00:00.000Z',
    title: `Story ${uid}`,
    summary: null,
    sourceUrl: 'https://example.com',
    sourceDomain: 'example.com',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: '2026-08-14T00:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
    upvoteCount: 0,
    viewerHasUpvoted: false,
    ...overrides,
  } as ITeamNewsItem;
}

function makeResponse(items: ITeamNewsItem[]): ITeamNewsByTeamResponse {
  return { teamUid: 'team-1', teamName: 'Filecoin', page: 1, limit: 3, total: items.length, items };
}

function makeMember(overrides: Partial<IMember> = {}): IMember {
  return {
    id: 'member-1',
    name: 'Ada',
    mainTeam: { id: 'team-1', name: 'Filecoin' },
    teams: [{ id: 'team-1', name: 'Filecoin', mainTeam: true }],
    ...overrides,
  } as unknown as IMember;
}

function renderCard(member: IMember = makeMember(), userInfo: IUserInfo | null = APPROVED_VIEWER, isLoggedIn = true) {
  return render(<TeamNewsDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  lastDetailProps = null;
  lastArchiveProps = null;
  newsState = { data: makeResponse([makeItem('news-1'), makeItem('news-2')]), isPending: false };
});

/** The card's story rows. Asserting on getAllByRole('button') would also count
 *  the footer's "View all news", which is not a row. */
const storyRows = (container: HTMLElement) => container.querySelectorAll('[data-story-uid]');

describe('TeamNewsDetails', () => {
  it('renders the primary team header and a row per story', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: /Updates from the team \(2\)/ })).toBeInTheDocument();
    expect(screen.getByText('Story news-1')).toBeInTheDocument();
    expect(screen.getByText('Story news-2')).toBeInTheDocument();
  });

  it('renders at most three rows even when more are returned', () => {
    newsState = {
      data: makeResponse([makeItem('n1'), makeItem('n2'), makeItem('n3'), makeItem('n4')]),
      isPending: false,
    };
    const { container } = renderCard();

    expect(storyRows(container)).toHaveLength(3);
    expect(screen.queryByText('Story n4')).not.toBeInTheDocument();
  });

  it('renders nothing when the member has no primary team', () => {
    const { container } = renderCard(makeMember({ mainTeam: null, teams: [] }));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the primary team resolves but its uid is empty', () => {
    const member = makeMember({ mainTeam: { id: '', name: 'Filecoin' }, teams: [] });
    const { container } = renderCard(member);
    expect(container).toBeEmptyDOMElement();
  });

  it('falls back to the single team when no role is flagged primary, matching the profile header', () => {
    const member = makeMember({ mainTeam: null, teams: [{ id: 'team-1', name: 'Filecoin' }] as IMember['teams'] });
    renderCard(member);

    expect(screen.getByRole('heading', { name: /Updates from the team/ })).toBeInTheDocument();
  });

  it('does not fall back when the member is on several teams and none is flagged', () => {
    const member = makeMember({
      mainTeam: null,
      teams: [
        { id: 'team-1', name: 'Filecoin' },
        { id: 'team-2', name: 'IPFS' },
      ] as IMember['teams'],
    });
    const { container } = renderCard(member);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the team has no news', () => {
    newsState = { data: makeResponse([]), isPending: false };
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while the request is in flight', () => {
    newsState = { data: undefined, isPending: true };
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
  });

  it('is hidden from guests, matching the Teams section above it', () => {
    const { container } = renderCard(makeMember(), null, false);
    expect(container).toBeEmptyDOMElement();
  });

  it('is hidden from a signed-in viewer who is not approved and not the owner', () => {
    const pending = { uid: 'viewer-2', rbac: { status: 'PENDING' } } as unknown as IUserInfo;
    const { container } = renderCard(makeMember(), pending);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders for a non-approved owner viewing their own profile', () => {
    const owner = { uid: 'member-1', rbac: { status: 'PENDING' } } as unknown as IUserInfo;
    renderCard(makeMember(), owner);
    expect(screen.getByRole('heading', { name: /Updates from the team/ })).toBeInTheDocument();
  });

  it('omits the time element for an unparseable or future date rather than rendering it empty', () => {
    newsState = { data: makeResponse([makeItem('news-1', { eventDate: 'BAD_DATE' })]), isPending: false };
    renderCard();

    expect(screen.getByText('Story news-1')).toBeInTheDocument();
    expect(screen.queryByText('4d ago')).not.toBeInTheDocument();
  });

  it('still renders when the team name is empty everywhere', () => {
    // The header no longer names the team, so an empty name must not produce a
    // stray separator or a blank heading.
    const member = makeMember({ mainTeam: { id: 'team-1', name: '' }, teams: [] });
    newsState = { data: { ...makeResponse([makeItem('news-1')]), teamName: '' }, isPending: false };
    renderCard(member);

    expect(screen.getByRole('heading', { name: /Updates from the team \(1\)/ })).toBeInTheDocument();
  });

  it('renders the count in the header from the team total, not the row count', () => {
    newsState = {
      data: { ...makeResponse([makeItem('n1'), makeItem('n2'), makeItem('n3')]), total: 47 },
      isPending: false,
    };
    const { container } = renderCard();

    // 3 rows shown, 47 stories exist — the footer is what reaches the rest.
    expect(screen.getByRole('heading', { name: /Updates from the team \(47\)/ })).toBeInTheDocument();
    expect(storyRows(container)).toHaveLength(3);
  });

  it('renders the All network updates footer attributed to this surface', () => {
    renderCard();
    expect(screen.getByText('All network updates (member-profile)')).toBeInTheDocument();
  });

  describe('View all news', () => {
    const withTotal = (total: number, items = [makeItem('n1'), makeItem('n2'), makeItem('n3')]) => {
      newsState = { data: { ...makeResponse(items), total }, isPending: false };
    };

    it('is absent when the card already shows every story', () => {
      // 3 of 3: the archive would list the same three rows and cost a fetch to
      // do it, so "All network updates" takes the footer row alone.
      withTotal(3);
      renderCard();

      expect(screen.queryByRole('button', { name: /View all news/i })).not.toBeInTheDocument();
      expect(screen.getByText('All network updates (member-profile)')).toBeInTheDocument();
    });

    it('is absent when there are fewer stories than the preview limit', () => {
      withTotal(2, [makeItem('n1'), makeItem('n2')]);
      renderCard();

      expect(screen.queryByRole('button', { name: /View all news/i })).not.toBeInTheDocument();
    });

    it('counts the whole archive, not the rows on screen', () => {
      withTotal(47);
      renderCard();

      expect(screen.getByRole('button', { name: 'View all news (47)' })).toBeInTheDocument();
    });

    it('opens the archive and reports it as this surface, not the rail', () => {
      withTotal(47);
      renderCard();

      expect(screen.queryByTestId('team-news-archive')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'View all news (47)' }));

      expect(screen.getByTestId('team-news-archive')).toBeInTheDocument();
      // The 4th argument is the whole point: onTeamNewsViewAllClicked used to
      // bake in 'team-profile-rail', which would have filed these clicks as
      // team-profile traffic with nothing at the call site to show it.
      expect(mockOnViewAllClicked).toHaveBeenCalledWith('team-1', 'Filecoin', 47, 'member-profile-modal');
    });

    it('hands the archive the total it already has, so the header needs no round trip', () => {
      withTotal(47);
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: 'View all news (47)' }));

      expect(screen.getByTestId('team-news-archive')).toHaveTextContent('Filecoin archive (47)');
      expect(lastArchiveProps).toMatchObject({
        teamUid: 'team-1',
        total: 47,
        focusUid: null,
        source: 'member-profile-modal',
      });
    });

    it('shares the card upvote overlay with the archive', () => {
      // Without this the vote a reader casts inside the archive would not move
      // the row behind it, and the next click would POST again instead of DELETE.
      withTotal(47);
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: 'View all news (47)' }));

      expect(lastArchiveProps?.upvoteOverlay).toBeInstanceOf(Map);
      expect(typeof lastArchiveProps?.onUpvoteToggle).toBe('function');
    });

    it('closes the archive back to the card', () => {
      withTotal(47);
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: 'View all news (47)' }));

      act(() => {
        (lastArchiveProps?.onClose as () => void)();
      });

      expect(screen.queryByTestId('team-news-archive')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View all news (47)' })).toBeInTheDocument();
    });

    it('never has the archive and a story open at once', () => {
      // TeamNewsModal renders its Modal without inertBackground, so the rows
      // behind it stay reachable by keyboard. One state is what stops a second
      // overlay stacking on the first — two close buttons, one ambiguous Escape.
      withTotal(47);
      const { container } = renderCard();

      fireEvent.click(storyRows(container)[0] as HTMLElement);
      expect(screen.getByTestId('news-detail-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('team-news-archive')).not.toBeInTheDocument();

      act(() => {
        (lastDetailProps?.onClose as () => void)();
      });
      fireEvent.click(screen.getByRole('button', { name: 'View all news (47)' }));

      expect(screen.getByTestId('team-news-archive')).toBeInTheDocument();
      expect(screen.queryByTestId('news-detail-modal')).not.toBeInTheDocument();
    });
  });

  it('shows the like count and the comment count on each row', () => {
    mockCommentCount.mockReturnValue(5);
    newsState = { data: makeResponse([makeItem('news-1', { upvoteCount: 9 })]), isPending: false };
    renderCard();

    expect(screen.getByText('9 likes')).toBeInTheDocument();
    expect(screen.getByText('5 comments')).toBeInTheDocument();
  });

  it('treats an absent comment count as zero rather than rendering an object', () => {
    // The jest useQuery mock ignores `select`, so the hook can hand back a
    // non-number; absent is also a real wire state (groupBy drops zero counts).
    mockCommentCount.mockReturnValue(undefined);
    renderCard();

    expect(screen.getAllByText('0 comments').length).toBeGreaterThan(0);
  });

  describe('opening a story', () => {
    it('stamps the row so focus can be restored to it, and opens the modal on click', () => {
      renderCard();

      const row = screen.getByText('Story news-1').closest('[data-story-uid]') as HTMLElement;
      // An attribute selector, not an implicit role — restoreFocusToRow queries
      // [role="button"][data-story-uid], which a real <button> would not match.
      expect(row).toHaveAttribute('role', 'button');
      expect(row).toHaveAttribute('aria-haspopup', 'dialog');

      fireEvent.click(row);

      expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-1');
      expect(mockOnCardClicked).toHaveBeenCalledWith(expect.objectContaining({ uid: 'news-1' }), 0, 'member-profile');
    });

    it('opens on Enter and on Space, and Space does not scroll the page', () => {
      renderCard();
      const row = screen.getByText('Story news-2').closest('[data-story-uid]') as HTMLElement;

      fireEvent.keyDown(row, { key: 'Enter' });
      expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-2');

      act(() => (lastDetailProps?.onClose as () => void)());

      const spaceEvent = fireEvent.keyDown(row, { key: ' ' });
      // fireEvent returns false when preventDefault was called.
      expect(spaceEvent).toBe(false);
      expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-2');
    });

    it('exposes the card as a focus-restore fallback for when the row is gone', () => {
      const { container } = renderCard();
      expect(container.querySelector('[data-news-feed-root]')).toBeInTheDocument();
    });

    it('keeps the open story mounted when a refetch drops it out of the top three', () => {
      const { rerender } = renderCard();
      fireEvent.click(screen.getByText('Story news-1').closest('[data-story-uid]') as HTMLElement);
      expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-1');

      // A newer story lands and pushes news-1 past the limit.
      newsState = { data: makeResponse([makeItem('news-9'), makeItem('news-2')]), isPending: false };
      rerender(<TeamNewsDetails member={makeMember()} isLoggedIn userInfo={APPROVED_VIEWER} />);

      expect(screen.queryByText('Story news-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('news-detail-modal')).toHaveTextContent('news-1');
    });

    it('closes the modal', () => {
      renderCard();
      fireEvent.click(screen.getByText('Story news-1').closest('[data-story-uid]') as HTMLElement);

      act(() => (lastDetailProps?.onClose as () => void)());

      expect(screen.queryByTestId('news-detail-modal')).not.toBeInTheDocument();
    });
  });

  describe('upvoting from the modal', () => {
    const openAndVote = () => {
      renderCard();
      fireEvent.click(screen.getByText('Story news-1').closest('[data-story-uid]') as HTMLElement);
      act(() => (lastDetailProps?.onUpvoteToggle as (i: ITeamNewsItem) => void)(makeItem('news-1')));
    };

    it('reconciles to the server count and reports the toggle', () => {
      mockUpvoteMutate.mockImplementation((_action, { onSuccess }) =>
        onSuccess({ upvoteCount: 5, viewerHasUpvoted: true }),
      );
      openAndVote();

      expect(mockUpvoteMutate).toHaveBeenCalledWith({ uid: 'news-1', isUpvoted: true }, expect.any(Object));
      expect((lastDetailProps?.item as ITeamNewsItem).upvoteCount).toBe(5);
      expect((lastDetailProps?.item as ITeamNewsItem).viewerHasUpvoted).toBe(true);
      expect(mockOnUpvoteToggled).toHaveBeenCalledWith(expect.anything(), 0, true, 'member-profile');
    });

    it('rolls the vote back and reports the failure', () => {
      mockUpvoteMutate.mockImplementation((_action, { onError }) => onError(new Error('nope')));
      openAndVote();

      expect((lastDetailProps?.item as ITeamNewsItem).upvoteCount).toBe(0);
      expect((lastDetailProps?.item as ITeamNewsItem).viewerHasUpvoted).toBe(false);
      // Without this the surface's failure rate reads a flat 0%.
      expect(mockOnUpvoteFailed).toHaveBeenCalledWith(expect.anything(), 0, true, 'member-profile');
    });
  });
});
