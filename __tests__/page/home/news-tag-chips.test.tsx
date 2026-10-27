import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

import { NewsGroupCard } from '@/components/page/home/TeamNews/components/NewsGroupCard/NewsGroupCard';
import { TopStoryCard } from '@/components/page/home/TeamNews/components/TopStories/TopStoryCard';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal/NewsDetailModal';
import { NewsDetailBody } from '@/components/page/home/TeamNews/components/NewsDetailModal/NewsDetailBody';
import type { ITeamNewsItem } from '@/types/team-news.types';

let mockFlag = true;
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  get SHOW_NEWS_PREFERENCES() {
    return mockFlag;
  },
}));

const mockTopicSlugs = new Set(['ai', 'digital-human-rights', 'decentralized-storage', 'ai-robotics']);
jest.mock('@/services/team-news/hooks/useNewsTopicSlugs', () => ({
  useNewsTopicSlugs: () => mockTopicSlugs,
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '2d ago',
}));

jest.mock('@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread', () => ({
  feedThreadDomId: (uid: string) => `feed-thread-${uid}`,
  FeedCommentsThread: () => null,
}));

jest.mock('@/components/page/home/TeamNews/components/SourceList/SourceList', () => ({
  SourceList: () => null,
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: null, isHydrated: false }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const makeItem = (tags: string[]): ITeamNewsItem => ({
  uid: 'story-1',
  teamUid: 'team-1',
  teamName: 'Acme',
  teamLogoUrl: null,
  eventType: 'LAUNCH',
  eventDate: '2026-10-20T00:00:00.000Z',
  title: 'Acme ships a thing',
  summary: 'Summary.',
  sourceUrl: 'https://example.com/story-1',
  sourceDomain: 'example.com',
  tags,
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-10-20T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
});

const MIXED = ['ai', 'launch', 'longevity'];
const MANY_TOPICS = ['ai', 'launch', 'digital-human-rights', 'decentralized-storage', 'ai-robotics'];

function renderFeedRow(item: ITeamNewsItem) {
  return render(
    <NewsGroupCard
      onStoryOpen={jest.fn()}
      onStoryVisible={jest.fn()}
      cluster={{ teamUid: 'team-1', teamName: 'Acme', teamLogoUrl: null, items: [item] }}
    />,
  );
}

function renderTopStory(item: ITeamNewsItem) {
  return render(
    <TopStoryCard
      story={item}
      windowLabel="Last 14 days"
      isOnly
      isFollowing={false}
      onFollowToggle={jest.fn()}
      onUpvoteToggle={jest.fn()}
      onOpen={jest.fn()}
      onVisible={jest.fn()}
    />,
  );
}

function chipTexts() {
  const list = screen.queryByRole('list', { name: 'Tags' });
  return list
    ? within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent)
    : [];
}

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
});

beforeEach(() => {
  mockFlag = true;
});

describe('news tag chips (LAB-3003)', () => {
  describe.each([
    ['Home feed row', renderFeedRow],
    ['Top stories card', renderTopStory],
  ])('%s', (_name, renderCard) => {
    it('shows only the topic chip for ["ai", "launch", "longevity"]', () => {
      renderCard(makeItem(MIXED));
      expect(chipTexts()).toEqual(['#ai']);
      expect(screen.queryByText('#launch')).not.toBeInTheDocument();
      expect(screen.queryByText('#longevity')).not.toBeInTheDocument();
    });

    it('shows the first 3 topics when there are more', () => {
      renderCard(makeItem(MANY_TOPICS));
      expect(chipTexts()).toEqual(['#ai', '#digital-human-rights', '#decentralized-storage']);
    });

    it('renders no chip row for an item with no tags', () => {
      renderCard(makeItem([]));
      expect(screen.queryByRole('list', { name: 'Tags' })).not.toBeInTheDocument();
    });

    it('renders no chip row with the flag off', () => {
      mockFlag = false;
      renderCard(makeItem(MIXED));
      expect(screen.queryByRole('list', { name: 'Tags' })).not.toBeInTheDocument();
      expect(screen.queryByText('#ai')).not.toBeInTheDocument();
    });
  });

  describe('detail modal', () => {
    it('shows the topics, then the free-form extras, and never a verb tag', () => {
      render(<NewsDetailModal item={makeItem(MIXED)} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);
      expect(chipTexts()).toEqual(['#ai', '#longevity']);
      expect(screen.queryByText('#launch')).not.toBeInTheDocument();
    });

    it('shows every topic, without the card limit', () => {
      render(<NewsDetailModal item={makeItem(MANY_TOPICS)} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);
      expect(chipTexts()).toEqual(['#ai', '#digital-human-rights', '#decentralized-storage', '#ai-robotics']);
    });

    it('shows the chips in the shared body that the team and member profiles open', () => {
      render(
        <NewsDetailBody item={makeItem(MIXED)} onClose={jest.fn()} onBack={jest.fn()} onUpvoteToggle={jest.fn()} />,
      );
      expect(chipTexts()).toEqual(['#ai', '#longevity']);
    });

    it('renders no chip row with the flag off', () => {
      mockFlag = false;
      render(<NewsDetailModal item={makeItem(MIXED)} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);
      expect(screen.queryByRole('list', { name: 'Tags' })).not.toBeInTheDocument();
    });
  });
});
