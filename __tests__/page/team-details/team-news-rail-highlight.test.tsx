import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { TeamNewsRail } from '@/components/page/team-details/TeamNews/TeamNewsRail';
import type { ITeamNewsByTeamResponse, ITeamNewsItem } from '@/types/team-news.types';

/**
 * The other end of PastTeamCard's "N updates" badge, which links to
 * `/teams/<uid>?highlight=news`. Nothing else on the profile reads that param,
 * so if the rail stops honouring it the badge quietly becomes an ordinary link
 * to the top of the page — no error, no failing type.
 */

const mockSearchParams = jest.fn(() => new URLSearchParams());

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/teams/team-1',
}));

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

jest.mock('@/hooks/useIsMobile', () => ({ useIsMobile: () => false }));

jest.mock('@/utils/formatTimeAgo', () => ({ formatTimeAgo: () => '4d ago' }));

// jsdom has no layout, so the measured teaser can't run here.
jest.mock('@/components/page/home/TeamNews/components/NewsCard/TruncatedSummary', () => ({
  TruncatedSummary: () => <div data-testid="truncated-summary" />,
}));

jest.mock('@/components/page/team-details/TeamNews/TeamNewsModal', () => ({
  TeamNewsModal: () => null,
}));

const item = (uid: string): ITeamNewsItem => ({
  uid,
  teamUid: 'team-1',
  teamName: 'Protocol Labs',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate: '2026-07-01T00:00:00.000Z',
  title: `Headline ${uid}`,
  summary: null,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-07-02T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
});

const initialData: ITeamNewsByTeamResponse = {
  teamUid: 'team-1',
  teamName: 'Protocol Labs',
  page: 1,
  limit: 10,
  total: 2,
  items: [item('n1'), item('n2')],
};

function renderRail(search: string) {
  mockSearchParams.mockReturnValue(new URLSearchParams(search));
  const { container } = render(<TeamNewsRail teamUid="team-1" teamName="Protocol Labs" initialData={initialData} />);
  return container.querySelector('.newsPanel') as HTMLElement;
}

beforeEach(() => jest.clearAllMocks());

describe('TeamNewsRail — ?highlight=news', () => {
  it('highlights the panel when arriving from the updates badge', () => {
    expect(renderRail('?highlight=news')).toHaveClass('highlight');
  });

  it('leaves the panel plain on an ordinary visit', () => {
    expect(renderRail('')).not.toHaveClass('highlight');
  });

  it('still renders the panel when there is nothing to highlight', () => {
    expect(renderRail('')).toBeInTheDocument();
  });

  it('ignores a highlight aimed at some other section', () => {
    expect(renderRail('?highlight=teams')).not.toHaveClass('highlight');
  });

  it('ignores a bare highlight param with no value', () => {
    expect(renderRail('?highlight=')).not.toHaveClass('highlight');
  });

  it('matches the value exactly — "News" is not "news"', () => {
    expect(renderRail('?highlight=News')).not.toHaveClass('highlight');
  });

  it('still highlights when the badge link carries other params alongside', () => {
    expect(renderRail('?tab=about&highlight=news')).toHaveClass('highlight');
  });

  it('highlights the panel without changing what it lists', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('?highlight=news'));
    render(<TeamNewsRail teamUid="team-1" teamName="Protocol Labs" initialData={initialData} />);

    expect(screen.getByRole('heading', { name: 'Protocol Labs News (2)' })).toBeInTheDocument();
    expect(screen.getByText('Headline n1')).toBeInTheDocument();
    expect(screen.getByText('Headline n2')).toBeInTheDocument();
  });
});
