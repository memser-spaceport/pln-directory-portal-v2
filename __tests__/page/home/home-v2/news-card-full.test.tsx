import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { NewsCard } from '@/components/page/home/TeamNews/components/NewsCard/NewsCard';
import type { ITeamNewsItem } from '@/types/team-news.types';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'u1' }, isHydrated: true }),
}));
jest.mock('@/utils/formatTimeAgo', () => ({ formatTimeAgo: () => '2d ago' }));
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/services/team-news/hooks/useNewsTopicSlugs', () => ({
  useNewsTopicSlugs: () => new Set(['ai', 'robotics', 'storage', 'defi']),
}));
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  SHOW_NEWS_PREFERENCES: true,
}));
// The inline thread is covered by its own tests; here only whether it mounts.
jest.mock('@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread', () => ({
  FeedCommentsThread: () => <div>Comments thread</div>,
  feedThreadDomId: (uid: string) => `thread-${uid}`,
}));

const LONG_SUMMARY =
  'The network shipped its first mainnet release this week, after a two-month public testnet. Operators can now ' +
  'run the client on commodity hardware, and the team published the benchmark suite it used to tune it.';

const story = (overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid: 'n1',
  teamUid: 't1',
  teamName: 'Team One',
  teamLogoUrl: null,
  eventType: 'LAUNCH',
  eventDate: '2026-11-01T00:00:00.000Z',
  title: 'Mainnet is live',
  summary: LONG_SUMMARY,
  sourceUrl: 'https://example.com/a',
  sourceDomain: 'example.com',
  tags: ['launch', 'ai', 'robotics'],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-11-01T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  upvoteCount: 4,
  ...overrides,
});

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
});

describe('NewsCard, full variant', () => {
  it('shows the story in full: the team, the headline, the whole summary and the event kicker', () => {
    render(<NewsCard variant="full" item={story()} onOpenDetail={jest.fn()} />);

    expect(screen.getByRole('link', { name: 'Team One' })).toHaveAttribute('href', '/teams/t1');
    expect(screen.getByRole('heading', { level: 3, name: 'Mainnet is live' })).toBeInTheDocument();
    // The summary is not truncated in the markup (no "Show more"): the card is the reading view.
    expect(screen.getByText(LONG_SUMMARY)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show more/ })).not.toBeInTheDocument();
    expect(screen.getByText('Launch')).toBeInTheDocument();
  });

  it('draws the topic tags as #tag links that call the scope handler, and marks the selected ones', () => {
    const onTagSelect = jest.fn();
    const onOpenDetail = jest.fn();
    render(
      <NewsCard
        variant="full"
        item={story()}
        onOpenDetail={onOpenDetail}
        onTagSelect={onTagSelect}
        activeTags={['ai']}
      />,
    );

    const tags = screen.getByRole('list', { name: 'Tags' });
    // The legacy verb tag is not a chip.
    expect(
      within(tags)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['#ai', '#robotics']);
    expect(within(tags).getByRole('button', { name: 'Stop filtering by #ai' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(within(tags).getByRole('button', { name: 'Also filter by #robotics' }));
    expect(onTagSelect).toHaveBeenCalledWith('robotics');
    // The tag is its own target: the story doesn't open.
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  // Which stories are top (rank 1–3) is the stream's call: signed-in-home.test.tsx covers it.
  it('badges a top story "Top story"', () => {
    render(<NewsCard variant="full" item={story({ editorialRank: 1 })} isTopStory />);
    expect(screen.getByText('Top story')).toBeInTheDocument();
  });

  it('has no badge on an ordinary story', () => {
    render(<NewsCard variant="full" item={story()} />);
    expect(screen.queryByText('Top story')).not.toBeInTheDocument();
  });

  it('opens the story from the row, and its comments inline', () => {
    const onOpenDetail = jest.fn();
    render(<NewsCard variant="full" item={story()} onOpenDetail={onOpenDetail} onUpvoteToggle={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mainnet is live' }));
    expect(onOpenDetail).toHaveBeenCalledWith(expect.objectContaining({ uid: 'n1' }), 'row');

    expect(screen.queryByText('Comments thread')).not.toBeInTheDocument();
    fireEvent.click(document.querySelector('[aria-controls="thread-n1"]') as HTMLElement);
    expect(screen.getByText('Comments thread')).toBeInTheDocument();
    expect(onOpenDetail).toHaveBeenCalledTimes(1);
  });

  it('leaves the other variants as they were', () => {
    render(<NewsCard item={story()} isTopStory />);
    expect(screen.queryByText('Top story')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Tags' })).not.toBeInTheDocument();
  });
});
