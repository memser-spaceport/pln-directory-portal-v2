import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { TopStoryCard } from '@/components/page/home/TeamNews/components/TopStories/TopStoryCard';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal/NewsDetailModal';
import type { ITeamNewsItem } from '@/types/team-news.types';

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '2d ago',
}));

// Stubbed: the thread's own behaviour is covered in feed-comments-thread.test.tsx.
jest.mock('@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread', () => ({
  feedThreadDomId: (uid: string) => `feed-thread-${uid}`,
  FeedCommentsThread: () => null,
}));

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// NOTE: NewsShareMenu is deliberately NOT mocked here — its position in the
// action row is the thing under test. Other card tests stub it out.

const story: ITeamNewsItem = {
  uid: 'story-1',
  teamUid: 'team-1',
  teamName: 'Acme',
  teamLogoUrl: null,
  eventType: 'FUNDING',
  eventDate: '2026-08-12T00:00:00.000Z',
  title: 'Acme opens a funding call',
  summary: 'Summary of the funding call.',
  sourceUrl: 'https://example.com/story-1',
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-08-12T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  viewCount: 189,
  upvoteCount: 1,
  viewerHasUpvoted: false,
};

/** Slot occupied by `el` in the action row, whatever depth it sits at — the
 *  share trigger may or may not be wrapped by its popover shell, and that's an
 *  implementation detail this test shouldn't pin down. */
function slotOf(row: HTMLElement, el: Element) {
  return Array.from(row.children).findIndex((child) => child === el || child.contains(el));
}

/**
 * Reads the left-to-right order of the action row that contains `Views`.
 *
 * Only the relative order of Share and Views is asserted: the row's exact child
 * count differs per surface (the modal has no Comments control) and is free to
 * change. What must not change is that Share precedes Views.
 */
function actionOrder(viewsLabel: string) {
  const views = screen.getByText(viewsLabel);
  const row = views.parentElement as HTMLElement;
  const share = screen.getByLabelText(`Share ${story.title}`);
  return { shareIndex: slotOf(row, share), viewsIndex: slotOf(row, views) };
}

beforeAll(() => {
  // No global mock exists in jest.setup.js (same inline stub as
  // news-group-card.test.tsx) — the lead card calls useCardVisibilityTracking.
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'me' }, isHydrated: true });
});

describe('feed action row order', () => {
  // Regression guard: the view count shipped ahead of Share on the Top Stories
  // band and in the detail modal, while every other card rendered it after.
  // The canonical order is Share -> Views -> Like (-> Comments).
  it('renders Share before Views on the Top Stories lead card', () => {
    render(
      <TopStoryCard
        story={story}
        windowLabel="Last 14 days"
        isOnly
        isFollowing={false}
        onFollowToggle={jest.fn()}
        onUpvoteToggle={jest.fn()}
        onOpen={jest.fn()}
        onVisible={jest.fn()}
      />,
    );

    const { shareIndex, viewsIndex } = actionOrder('189 Views');
    expect(shareIndex).toBeGreaterThanOrEqual(0);
    expect(shareIndex).toBeLessThan(viewsIndex);
  });

  it('renders Share before Views in the news detail modal', () => {
    render(<NewsDetailModal item={story} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);

    const { shareIndex, viewsIndex } = actionOrder('189 Views');
    expect(shareIndex).toBeGreaterThanOrEqual(0);
    expect(shareIndex).toBeLessThan(viewsIndex);
  });
});
