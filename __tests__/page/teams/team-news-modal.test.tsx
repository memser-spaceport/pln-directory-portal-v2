import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { TeamNewsModal } from '@/components/page/team-details/TeamNews/TeamNewsModal';
import type { ITeamNewsDiscussion, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

const mockOnCardClicked = jest.fn();
const mockOnLoadMoreClicked = jest.fn();
const mockOnAllNetworkUpdatesClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCardClicked: (...a: unknown[]) => mockOnCardClicked(...a),
    onTeamNewsLoadMoreClicked: (...a: unknown[]) => mockOnLoadMoreClicked(...a),
    onTeamNewsAllNetworkUpdatesClicked: (...a: unknown[]) => mockOnAllNetworkUpdatesClicked(...a),
    onTeamNewsShared: jest.fn(),
  }),
}));

// The story itself is /home's NewsDetailBody, covered by its own suite. What
// this box owns is the drill: which of the two views is on screen, and what
// Back does.
let lastStoryProps: Record<string, unknown> | null = null;
jest.mock('@/components/page/home/TeamNews/components/NewsDetailModal', () => ({
  NewsDetailBody: (props: { item: { uid: string }; onBack?: () => void; onClose: () => void }) => {
    lastStoryProps = props;
    return (
      <div data-testid="story-view">
        <span>{props.item.uid}</span>
        <button type="button" onClick={props.onBack}>
          Back to the news list
        </button>
        <button type="button" onClick={props.onClose}>
          Close story
        </button>
      </div>
    );
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

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: mockCurrentUser(), isHydrated: true }),
}));

const mockCurrentUser = jest.fn<{ uid: string } | null, []>(() => null);

// The page-load-scoped view queue. Mocked so the assertions are about which
// rows this box reports as read, not about batching (its own suite covers that).
const mockRecordVisible = jest.fn();
jest.mock('@/services/team-news/hooks/useTeamNewsImpressions', () => ({
  // `viewedUids` is what the hook reports back for the optimistic +1. This box
  // doesn't merge it (its rows come from their own query), but the mock has to
  // supply it — a jest factory is untyped, so an omission surfaces as a runtime
  // crash in whatever renders next rather than as a type error here.
  useTeamNewsImpressions: () => ({ recordVisible: mockRecordVisible, viewedUids: new Set<string>() }),
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '4d ago',
}));

// jsdom has no layout, so the measured teaser can't be exercised here — and
// modal cards must never mount it in the first place (fullSummary path).
jest.mock('@/components/page/home/TeamNews/components/NewsCard/TruncatedSummary', () => ({
  TruncatedSummary: () => <div data-testid="truncated-summary" />,
}));

jest.mock('@/components/common/Modal/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

jest.mock('@/components/common/filters/SearchInput/SearchInput', () => ({
  SearchInput: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />,
}));

type QueryState = {
  items: ITeamNewsItem[];
  /** Page 1's total FOR THE CURRENT QUERY — it narrows as the reader searches. */
  total: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: jest.Mock;
};

let queryState: QueryState;

jest.mock('@/services/team-news/hooks/useTeamNewsByTeam', () => ({
  useTeamNewsByTeamInfinite: () => queryState,
}));

const makeItem = (uid: string): ITeamNewsItem => ({
  uid,
  teamUid: 'team-1',
  teamName: 'Protocol Labs',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT' as TeamNewsEventType,
  eventDate: '2026-06-01T00:00:00.000Z',
  title: `Headline ${uid}`,
  summary: `Full summary for ${uid} with every word intact.`,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-06-02T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null } satisfies ITeamNewsDiscussion,
});

const loaded = (items: ITeamNewsItem[], total = items.length): QueryState => ({
  items,
  total,
  isLoading: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
});

const loading = (): QueryState => ({
  items: [],
  total: 0,
  isLoading: true,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
});

const scrollToMock = jest.fn();

interface ObservedSet {
  callback: (entries: { target: Element; isIntersecting: boolean }[]) => void;
  elements: Element[];
}

const observed: ObservedSet[] = [];

/** Every card currently observed reports itself as half on screen. */
function scrollCardsIntoView() {
  observed.forEach(({ callback, elements }) => {
    const cards = elements.filter((el) => el.hasAttribute('data-story-uid'));
    if (cards.length > 0) callback(cards.map((target) => ({ target, isIntersecting: true })));
  });
}

const renderModal = (props: Partial<React.ComponentProps<typeof TeamNewsModal>> = {}) =>
  render(
    <TeamNewsModal
      isOpen
      focusUid={null}
      onClose={jest.fn()}
      teamUid="team-1"
      teamName="Protocol Labs"
      total={9}
      {...props}
    />,
  );

const rerenderModal = (
  rerender: (ui: React.ReactElement) => void,
  props: Partial<React.ComponentProps<typeof TeamNewsModal>> = {},
) =>
  rerender(
    <TeamNewsModal
      isOpen
      focusUid={null}
      onClose={jest.fn()}
      teamUid="team-1"
      teamName="Protocol Labs"
      total={9}
      {...props}
    />,
  );

beforeAll(() => {
  // jsdom has no layout, so nothing ever "becomes visible" on its own. This
  // stub keeps what each observer is watching, and `scrollCardsIntoView()`
  // below plays the intersection back for the cards.
  class IO {
    private readonly entry: ObservedSet;

    constructor(callback: ObservedSet['callback']) {
      this.entry = { callback, elements: [] };
      observed.push(this.entry);
    }
    observe(element: Element) {
      this.entry.elements.push(element);
    }
    unobserve(element: Element) {
      this.entry.elements = this.entry.elements.filter((el) => el !== element);
    }
    disconnect() {
      this.entry.elements = [];
    }
  }
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
  if (typeof CSS === 'undefined' || typeof CSS.escape !== 'function') {
    (global as unknown as { CSS: unknown }).CSS = { escape: (v: string) => v.replace(/"/g, '\\"') };
  }
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: scrollToMock, writable: true });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('TeamNewsModal reveal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryState = loaded([makeItem('news-1'), makeItem('news-2'), makeItem('news-3')]);
  });

  it('scrolls to and highlights the focused item, then clears the ring after the duration', () => {
    jest.useFakeTimers();
    renderModal({ focusUid: 'news-2' });

    const card = document.querySelector('[data-story-uid="news-2"]');
    expect(card).toHaveAttribute('data-highlighted', 'true');
    expect(scrollToMock).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(card).not.toHaveAttribute('data-highlighted');
  });

  it('reveals only after the first page renders on a slow first open', () => {
    queryState = loading();
    const { rerender } = renderModal({ focusUid: 'news-2' });
    expect(scrollToMock).not.toHaveBeenCalled();

    queryState = loaded([makeItem('news-1'), makeItem('news-2')]);
    rerenderModal(rerender, { focusUid: 'news-2' });
    expect(scrollToMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-story-uid="news-2"]')).toHaveAttribute('data-highlighted', 'true');
  });

  it('reveals once per open: items identity churn does not re-scroll or re-flash', () => {
    jest.useFakeTimers();
    const { rerender } = renderModal({ focusUid: 'news-2' });
    expect(scrollToMock).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Simulate an upvote-overlay merge / page append: fresh array identity.
    queryState = loaded([makeItem('news-1'), makeItem('news-2'), makeItem('news-3'), makeItem('news-4')]);
    rerenderModal(rerender, { focusUid: 'news-2' });

    expect(scrollToMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-story-uid="news-2"]')).not.toHaveAttribute('data-highlighted');
  });

  it('abandons a pending reveal once the user types in search', () => {
    queryState = loading();
    const { rerender } = renderModal({ focusUid: 'news-2' });

    fireEvent.change(screen.getByPlaceholderText('Search news by keyword or type'), { target: { value: 'ipfs' } });

    queryState = loaded([makeItem('news-1'), makeItem('news-2')]);
    rerenderModal(rerender, { focusUid: 'news-2' });

    expect(scrollToMock).not.toHaveBeenCalled();
    expect(document.querySelector('[data-highlighted]')).toBeNull();
  });

  it('silently no-ops when the focused item is missing, and consumes the attempt', () => {
    queryState = loaded([makeItem('news-1')]);
    const { rerender } = renderModal({ focusUid: 'ghost' });
    expect(scrollToMock).not.toHaveBeenCalled();

    // The uid arriving on a later page must not yank the list after the fact.
    queryState = loaded([makeItem('news-1'), makeItem('ghost')]);
    rerenderModal(rerender, { focusUid: 'ghost' });
    expect(scrollToMock).not.toHaveBeenCalled();
    expect(document.querySelector('[data-highlighted]')).toBeNull();
  });

  it('opens at the top without highlight when focusUid is null (View all)', () => {
    renderModal({ focusUid: null });
    expect(scrollToMock).not.toHaveBeenCalled();
    expect(document.querySelector('[data-highlighted]')).toBeNull();
  });

  it('reveals inside the fullscreen page variant too', () => {
    renderModal({ focusUid: 'news-3', fullscreen: true });
    expect(scrollToMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-story-uid="news-3"]')).toHaveAttribute('data-highlighted', 'true');
  });

  it('renders full summaries and never mounts the measured teaser', () => {
    renderModal();
    expect(screen.queryByTestId('truncated-summary')).toBeNull();
    expect(screen.getByText('Full summary for news-1 with every word intact.')).toBeInTheDocument();
  });
});

describe('TeamNewsModal drill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    scrollToMock.mockClear();
    lastStoryProps = null;
    queryState = loaded([makeItem('news-1'), makeItem('news-2'), makeItem('news-3')]);
  });

  const openStory = (uid: string) => fireEvent.click(screen.getByText(`Headline ${uid}`));

  it('swaps the box to the clicked story instead of stacking a second modal', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    renderModal();

    openStory('news-2');

    expect(screen.getByTestId('story-view')).toHaveTextContent('news-2');
    // The list is gone, not layered over: one view, one Close, one Escape.
    expect(screen.queryByText('Headline news-1')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search news by keyword or type')).not.toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
    expect(lastStoryProps?.source).toBe('team-profile-modal');
    open.mockRestore();
  });

  it('Back returns to the list and puts the reader back on the row they opened', () => {
    jest.useFakeTimers();
    renderModal();
    openStory('news-3');

    fireEvent.click(screen.getByRole('button', { name: 'Back to the news list' }));

    expect(screen.queryByTestId('story-view')).toBeNull();
    expect(screen.getByText('Headline news-1')).toBeInTheDocument();
    expect(scrollToMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-story-uid="news-3"]')).toHaveAttribute('data-highlighted', 'true');
  });

  it('Back keeps the search the reader had typed', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('Search news by keyword or type'), { target: { value: 'ipfs' } });

    openStory('news-1');
    fireEvent.click(screen.getByRole('button', { name: 'Back to the news list' }));

    expect(screen.getByPlaceholderText('Search news by keyword or type')).toHaveValue('ipfs');
  });

  it('Close from a drilled story leaves the modal entirely', () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    openStory('news-2');

    fireEvent.click(screen.getByRole('button', { name: 'Close story' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('reopening the archive after a close starts on the list, not the last story', () => {
    const { rerender } = renderModal();
    openStory('news-2');

    rerenderModal(rerender, { isOpen: false });
    rerenderModal(rerender, { isOpen: true });

    expect(screen.queryByTestId('story-view')).toBeNull();
    expect(screen.getByText('Headline news-1')).toBeInTheDocument();
  });

  it('asks for the counts of every row it has loaded, and again as pages arrive', () => {
    const { rerender } = renderModal();
    expect(mockRequestCommentCounts).toHaveBeenLastCalledWith({
      uids: ['news-1', 'news-2', 'news-3'],
      enabled: true,
    });

    // A second page: the hook is handed the grown list and asks only for what's
    // new — the archive's uid universe is not fixed at open.
    queryState = loaded([makeItem('news-1'), makeItem('news-2'), makeItem('news-3'), makeItem('news-4')]);
    rerenderModal(rerender);

    expect(mockRequestCommentCounts).toHaveBeenLastCalledWith({
      uids: ['news-1', 'news-2', 'news-3', 'news-4'],
      enabled: true,
    });
  });

  it('the comment count drills to the same story, reported as its own via', () => {
    renderModal();

    fireEvent.click(screen.getAllByRole('button', { name: 'Comments, open' })[2]);

    expect(screen.getByTestId('story-view')).toHaveTextContent('news-3');
    expect(mockOnCardClicked).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'news-3' }),
      2,
      'team-profile-modal',
      'comments',
    );
  });

  it('drills inside the fullscreen page variant too', () => {
    renderModal({ fullscreen: true });

    openStory('news-1');
    expect(screen.getByTestId('story-view')).toHaveTextContent('news-1');

    fireEvent.click(screen.getByRole('button', { name: 'Back to the news list' }));
    expect(screen.getByText('Headline news-1')).toBeInTheDocument();
  });

  it('offers All network updates from the list, in both shells', () => {
    const { rerender } = renderModal();

    const link = screen.getByRole('link', { name: /All network updates/i });
    expect(link).toHaveAttribute('href', '/home');
    // A new tab, so this box — and the reader's place in it — survives the trip.
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    fireEvent.click(link);
    expect(mockOnAllNetworkUpdatesClicked).toHaveBeenCalledWith('team-1', 'Protocol Labs', 'team-profile-modal');

    rerenderModal(rerender, { fullscreen: true });
    const fullscreenLink = screen.getByRole('link', { name: /All network updates/i });
    expect(fullscreenLink).toBeInTheDocument();
    expect(fullscreenLink).toHaveAttribute('target', '_blank');
  });

  // Opened from a listing card's "N new posts" chip, the caller has no archive
  // total to pass — the chip counted a 7-day window, this box lists everything.
  describe('without a `total` prop', () => {
    const renderChipOpened = (props: Partial<React.ComponentProps<typeof TeamNewsModal>> = {}) =>
      render(
        <TeamNewsModal
          isOpen
          focusUid={null}
          onClose={jest.fn()}
          teamUid="team-1"
          teamName="Protocol Labs"
          source="teams-listing-modal"
          {...props}
        />,
      );

    it('takes the archive size from its own first unfiltered fetch', () => {
      queryState = loaded([makeItem('news-1')], 47);
      renderChipOpened();

      expect(screen.getByText('Protocol Labs News (47)')).toBeInTheDocument();
    });

    it('holds the header still while the reader searches', () => {
      queryState = loaded([makeItem('news-1'), makeItem('news-2')], 47);
      const { rerender } = renderChipOpened();
      expect(screen.getByText('Protocol Labs News (47)')).toBeInTheDocument();

      // Typing narrows the list, and with it the hook's `total`. Reading that
      // live would tick the header down to (2) — the search reporting itself
      // twice, in the one line that is supposed to say where you are.
      act(() => {
        fireEvent.change(screen.getByPlaceholderText(/Search news/i), { target: { value: 'funding' } });
      });
      queryState = loaded([makeItem('news-1')], 2);
      rerender(
        <TeamNewsModal
          isOpen
          focusUid={null}
          onClose={jest.fn()}
          teamUid="team-1"
          teamName="Protocol Labs"
          source="teams-listing-modal"
        />,
      );

      expect(screen.getByText('Protocol Labs News (47)')).toBeInTheDocument();
      expect(screen.queryByText('Protocol Labs News (2)')).not.toBeInTheDocument();
    });

    it('still prefers an explicit total when the caller has one', () => {
      queryState = loaded([makeItem('news-1')], 47);
      renderChipOpened({ total: 9 });

      expect(screen.getByText('Protocol Labs News (9)')).toBeInTheDocument();
    });

    it('sends the opening surface to the footer link, not the profile default', () => {
      queryState = loaded([makeItem('news-1')], 47);
      renderChipOpened();

      fireEvent.click(screen.getByRole('link', { name: /All network updates/i }));
      expect(mockOnAllNetworkUpdatesClicked).toHaveBeenCalledWith('team-1', 'Protocol Labs', 'teams-listing-modal');
    });
  });
});

// Opened from a listing card's chip (the teams grid, the job board), this box is
// the whole reading surface — there is no rail behind it holding vote state and
// no feed underneath it counting views. Both have to work here on their own.
describe('TeamNewsModal opened without rail-owned state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    observed.length = 0;
    mockCurrentUser.mockReturnValue({ uid: 'member-1' });
    queryState = loaded([makeItem('news-1'), makeItem('news-2'), makeItem('news-3')]);
  });

  const renderStandalone = (props: Partial<React.ComponentProps<typeof TeamNewsModal>> = {}) =>
    render(
      <TeamNewsModal
        isOpen
        focusUid={null}
        onClose={jest.fn()}
        teamUid="team-1"
        teamName="Protocol Labs"
        source="job-board-modal"
        {...props}
      />,
    );

  it('offers a Like on every row, with no vote state handed in', () => {
    renderStandalone();

    // Reading a story and being able to like it are the same act; a caller that
    // has no second view to sync must not lose the button for it.
    expect(screen.getAllByRole('button', { name: /^Like \(0\)$/ })).toHaveLength(3);
  });

  it('holds the vote itself when nobody else is holding it', () => {
    renderStandalone();

    fireEvent.click(screen.getAllByRole('button', { name: /^Like \(0\)$/ })[1]);

    expect(screen.getByRole('button', { name: 'Remove like (1)' })).toHaveAttribute('aria-pressed', 'true');
    // Only the row that was clicked.
    expect(screen.getAllByRole('button', { name: /^Like \(0\)$/ })).toHaveLength(2);
  });

  it('defers to the caller when it has its own handler, rather than voting twice', () => {
    const onUpvoteToggle = jest.fn();
    renderStandalone({ onUpvoteToggle, upvoteOverlay: new Map() });

    fireEvent.click(screen.getAllByRole('button', { name: /^Like \(0\)$/ })[0]);

    expect(onUpvoteToggle).toHaveBeenCalledWith(expect.objectContaining({ uid: 'news-1' }), 0, 'job-board-modal');
    // The caller owns the overlay, so this box must not also move the count.
    expect(screen.getAllByRole('button', { name: /^Like \(0\)$/ })).toHaveLength(3);
  });

  it('counts a row as read once it is on screen', () => {
    renderStandalone();

    scrollCardsIntoView();

    // The number these rows display is the one they now contribute to.
    expect(mockRecordVisible.mock.calls.map(([uid]) => uid)).toEqual(['news-1', 'news-2', 'news-3']);
  });

  it('reports nothing for rows nobody scrolled to', () => {
    renderStandalone();

    expect(mockRecordVisible).not.toHaveBeenCalled();
  });

  it('defers to the caller’s recorder, rather than counting into a second set', () => {
    const recordVisible = jest.fn();
    renderStandalone({ recordVisible });

    scrollCardsIntoView();

    expect(recordVisible.mock.calls.map(([uid]) => uid)).toEqual(['news-1', 'news-2', 'news-3']);
    // Its own instance stays silent. Both firing is how a story read in the
    // team-profile rail and again in here would count twice for one sitting —
    // the dedup set lives per instance, so two instances cannot agree.
    expect(mockRecordVisible).not.toHaveBeenCalled();
  });
});
