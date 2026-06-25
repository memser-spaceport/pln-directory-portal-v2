import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { TeamNewsRail } from '@/components/page/team-details/TeamNews/TeamNewsRail';
import type { ITeamNewsDiscussion, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCardClicked: jest.fn(),
  }),
}));

jest.mock('@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton', () => ({
  StartConversationButton: () => <button type="button">Discuss</button>,
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '4d ago',
}));

jest.mock('@/components/page/team-details/TeamNews/TeamNewsModal', () => ({
  TeamNewsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="team-news-modal">Modal open</div> : null,
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

  it('opens the modal when View all is clicked', () => {
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
    expect(screen.getByTestId('team-news-modal')).toBeInTheDocument();
  });
});
