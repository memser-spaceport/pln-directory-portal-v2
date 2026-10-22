import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const onTeamNewsForYouTuneClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onTeamNewsForYouTuneClicked }),
}));

import { ForYouHint } from '@/components/page/home/TeamNews/components/ForYouHint/ForYouHint';

describe('ForYouHint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('names followed teams as an input, with no link for a guest', () => {
    render(<ForYouHint />);
    expect(
      screen.getByText(/For you: Curated based on your profile, primary team attributes, and the teams you follow/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links "Tune For You" to News preferences and reports the click (LAB-2941)', () => {
    render(<ForYouHint memberUid="user-1" />);

    const link = screen.getByRole('link', { name: 'Tune For You' });
    expect(link).toHaveAttribute('href', '/settings/news-preferences?from=feed');
    fireEvent.click(link);

    expect(onTeamNewsForYouTuneClicked).toHaveBeenCalledWith('user-1');
  });
});
