import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { PopularThisWeekCard } from '@/components/page/home/TeamNews/components/NewsRail/components/PopularThisWeekCard';
import type { ITeamNewsPopularItem } from '@/types/team-news.types';

const mockOnPopularStoryClicked = jest.fn();
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsPopularStoryClicked: (...a: unknown[]) => mockOnPopularStoryClicked(...a),
  }),
}));

const item = (partial: Partial<ITeamNewsPopularItem> & Pick<ITeamNewsPopularItem, 'uid'>): ITeamNewsPopularItem => ({
  teamUid: 'team-1',
  teamName: 'Team One',
  title: 'Untitled',
  sourceUrl: 'https://example.com/story',
  upvoteCount: 0,
  ...partial,
});

describe('PopularThisWeekCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when items is empty', () => {
    const { container } = render(<PopularThisWeekCard items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each story with its upvote count and team name', () => {
    render(<PopularThisWeekCard items={[item({ uid: 'a', title: 'Story A', teamName: 'Team A', upvoteCount: 12 })]} />);
    expect(screen.getByText('Story A')).toBeInTheDocument();
    expect(screen.getByText('↑ 12 · Team A')).toBeInTheDocument();
  });

  it('opens sourceUrl in a new tab and fires analytics on click', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<PopularThisWeekCard items={[item({ uid: 'a', title: 'Story A', upvoteCount: 12 })]} />);

    fireEvent.click(screen.getByText('Story A'));

    expect(openSpy).toHaveBeenCalledWith('https://example.com/story', '_blank', 'noopener,noreferrer');
    expect(mockOnPopularStoryClicked).toHaveBeenCalledWith(expect.objectContaining({ uid: 'a' }), 0);
    openSpy.mockRestore();
  });
});
