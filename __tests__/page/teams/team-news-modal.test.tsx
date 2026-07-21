import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { TeamNewsModal } from '@/components/page/team-details/TeamNews/TeamNewsModal';
import type { ITeamNewsDiscussion, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

const mockOnCardClicked = jest.fn();
const mockOnLoadMoreClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCardClicked: (...a: unknown[]) => mockOnCardClicked(...a),
    onTeamNewsLoadMoreClicked: (...a: unknown[]) => mockOnLoadMoreClicked(...a),
  }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: null, isHydrated: true }),
}));

jest.mock('@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton', () => ({
  StartConversationButton: () => <button type="button">Discuss</button>,
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

const loaded = (items: ITeamNewsItem[]): QueryState => ({
  items,
  isLoading: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
});

const loading = (): QueryState => ({
  items: [],
  isLoading: true,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
});

const scrollToMock = jest.fn();

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
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
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
