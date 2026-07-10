import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { PopularThisWeekCard } from '@/components/page/home/TeamNews/components/NewsRail/components/PopularThisWeekCard';
import type { ITeamNewsPopularItem } from '@/types/team-news.types';

const mockOnPopularItemClick = jest.fn();

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
    const { container } = render(<PopularThisWeekCard items={[]} onPopularItemClick={mockOnPopularItemClick} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each story with its upvote count and team name', () => {
    render(
      <PopularThisWeekCard
        items={[item({ uid: 'a', title: 'Story A', teamName: 'Team A', upvoteCount: 12 })]}
        onPopularItemClick={mockOnPopularItemClick}
      />,
    );
    expect(screen.getByText('Story A')).toBeInTheDocument();
    expect(screen.getByText('↑ 12 · Team A')).toBeInTheDocument();
  });

  it('calls onPopularItemClick with the clicked item and its position, and does not navigate itself', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <PopularThisWeekCard
        items={[item({ uid: 'a', title: 'Story A', upvoteCount: 12 })]}
        onPopularItemClick={mockOnPopularItemClick}
      />,
    );

    fireEvent.click(screen.getByText('Story A'));

    expect(mockOnPopularItemClick).toHaveBeenCalledWith(expect.objectContaining({ uid: 'a' }), 0);
    // Navigation and analytics now live entirely in the parent's handler — this
    // component is a pure prop-driven list, per the scroll-to-story plan.
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
