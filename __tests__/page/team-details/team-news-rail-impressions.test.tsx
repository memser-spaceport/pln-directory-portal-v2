import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import type {
  ITeamNewsByTeamResponse,
  ITeamNewsDiscussion,
  ITeamNewsItem,
  TeamNewsEventType,
} from '@/types/team-news.types';

/**
 * The rail's Views count, and the one instance behind it.
 *
 * Until this suite existed the rail rendered `TeamNewsCard` without `onVisible`,
 * and `NewsCard` skips its observer entirely without one — so every card showed
 * a number it never contributed to, silently, with no error and no type
 * complaint. These tests exist because that failure mode is invisible: they
 * assert the observer is wired, and that the archive shares the rail's recorder
 * rather than mounting a second one.
 */

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCardClicked: jest.fn(),
    onTeamNewsViewAllClicked: jest.fn(),
    onTeamNewsShowMoreClicked: jest.fn(),
    onTeamNewsUpvoteToggled: jest.fn(),
    onTeamNewsUpvoteFailed: jest.fn(),
    onTeamNewsAllNetworkUpdatesClicked: jest.fn(),
    onTeamNewsShared: jest.fn(),
  }),
}));

jest.mock('@/services/feed/hooks/useFeedCommentCounts', () => ({
  useFeedCommentCount: () => undefined,
  useFeedCommentCounts: jest.fn(),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: null, isHydrated: true }),
}));

jest.mock('@/services/team-news/hooks/useTeamNewsUpvoteToggle', () => ({
  useTeamNewsUpvoteToggle: () => ({ mutate: jest.fn() }),
}));

jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '4d ago',
}));

// jsdom has no layout, so the measured teaser can't run here.
jest.mock('@/components/page/home/TeamNews/components/NewsCard/TruncatedSummary', () => ({
  TruncatedSummary: () => <div data-testid="truncated-summary" />,
}));

/**
 * One recorder per MOUNTED HOOK, stable across renders — the real hook's
 * contract, reproduced.
 *
 * Both halves matter. A single shared mock would pass whether the rail mounted
 * one recorder or two, and two is the bug; so each mount pushes its own. But a
 * fresh function per *call* is just as wrong: `useTeamNewsImpressions` returns a
 * `useCallback`-stable `recordVisible`, and a mock that re-mints it every render
 * would manufacture exactly the observer churn the last test here is meant to
 * detect — the harness failing the code for the harness's own sin.
 *
 * So the mock holds a ref, like the thing it stands in for. `mock`-prefixed
 * because jest.mock factories are hoisted above everything else.
 */
const mockImpressionInstances: jest.Mock[] = [];
jest.mock('@/services/team-news/hooks/useTeamNewsImpressions', () => {
  const { useRef } = jest.requireActual<typeof import('react')>('react');
  return {
    useTeamNewsImpressions: () => {
      const ref = useRef<{ recordVisible: jest.Mock } | null>(null);
      if (ref.current === null) {
        const recordVisible = jest.fn();
        mockImpressionInstances.push(recordVisible);
        ref.current = { recordVisible };
      }
      return ref.current;
    },
  };
});

// The archive is its own suite (team-news-modal.test.tsx). Here it is a prop
// recorder: what matters is which recorder the rail hands it.
let modalProps: Record<string, unknown> | null = null;
jest.mock('@/components/page/team-details/TeamNews/TeamNewsModal', () => ({
  TeamNewsModal: (props: Record<string, unknown>) => {
    modalProps = props;
    return null;
  },
}));

jest.mock('@/components/page/home/TeamNews/components/NewsDetailModal', () => ({
  NewsDetailModal: () => null,
}));

import { TeamNewsRail } from '@/components/page/team-details/TeamNews/TeamNewsRail';

const makeItem = (uid: string): ITeamNewsItem => ({
  uid,
  teamUid: 'team-1',
  teamName: 'Protocol Labs',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT' as TeamNewsEventType,
  eventDate: '2026-06-01T00:00:00.000Z',
  title: `Headline ${uid}`,
  summary: `Full summary for ${uid}.`,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-06-02T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null } satisfies ITeamNewsDiscussion,
  viewCount: 7,
});

const initialData = (items: ITeamNewsItem[], total = items.length): ITeamNewsByTeamResponse =>
  ({ items, total, teamName: 'Protocol Labs' }) as ITeamNewsByTeamResponse;

interface ObservedSet {
  callback: (entries: { target: Element; isIntersecting: boolean }[]) => void;
  elements: Element[];
}

const observed: ObservedSet[] = [];

/** Every observed card reports itself as half on screen. */
function scrollCardsIntoView() {
  observed.forEach(({ callback, elements }) => {
    const cards = elements.filter((el) => el.hasAttribute('data-story-uid'));
    if (cards.length > 0) callback(cards.map((target) => ({ target, isIntersecting: true })));
  });
}

beforeAll(() => {
  // jsdom has no layout, so nothing becomes visible on its own. This keeps what
  // each observer is watching so the intersection can be played back by hand.
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
});

beforeEach(() => {
  jest.clearAllMocks();
  observed.length = 0;
  mockImpressionInstances.length = 0;
  modalProps = null;
});

const renderRail = (items: ITeamNewsItem[], total = items.length) =>
  render(<TeamNewsRail teamUid="team-1" teamName="Protocol Labs" initialData={initialData(items, total)} />);

describe('TeamNewsRail view impressions', () => {
  it('records each preview card once it is half on screen', () => {
    renderRail([makeItem('news-1'), makeItem('news-2')]);

    const [record] = mockImpressionInstances;
    expect(record).not.toHaveBeenCalled();

    scrollCardsIntoView();

    expect(record).toHaveBeenCalledWith('news-1');
    expect(record).toHaveBeenCalledWith('news-2');
    expect(record).toHaveBeenCalledTimes(2);
  });

  it('records nothing while the cards have not been seen', () => {
    renderRail([makeItem('news-1')]);

    // Rendered, observed, and silent — a card off screen is not a view.
    expect(screen.getByText('Headline news-1')).toBeInTheDocument();
    expect(mockImpressionInstances[0]).not.toHaveBeenCalled();
  });

  it('records a card once even if it re-enters the viewport', () => {
    renderRail([makeItem('news-1')]);

    scrollCardsIntoView();
    scrollCardsIntoView();

    expect(mockImpressionInstances[0]).toHaveBeenCalledTimes(1);
  });

  it('mounts ONE recorder and hands that same one to the archive', () => {
    renderRail([makeItem('news-1')], 9);

    // One instance: the rail's. A second would be a second dedup set, and a
    // story read in the rail and again in the archive would count twice.
    expect(mockImpressionInstances).toHaveLength(1);
    expect(modalProps?.recordVisible).toBe(mockImpressionInstances[0]);
  });

  it('passes the recorder by reference, so the observer is built once per card', () => {
    const { rerender } = renderRail([makeItem('news-1')]);
    const observersAfterFirstRender = observed.length;

    rerender(
      <TeamNewsRail teamUid="team-1" teamName="Protocol Labs" initialData={initialData([makeItem('news-1')])} />,
    );

    // A wrapped `(uid) => record(uid)` would give the card a new callback
    // identity every render, and useCardVisibilityTracking lists it in its
    // effect deps — so the observer would be torn down and rebuilt each time.
    expect(observed.length).toBe(observersAfterFirstRender);
  });
});
