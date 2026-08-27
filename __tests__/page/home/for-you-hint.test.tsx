import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const onTeamNewsForYouUpdateProfileClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onTeamNewsForYouUpdateProfileClicked }),
}));

import { ForYouHint } from '@/components/page/home/TeamNews/components/ForYouHint/ForYouHint';

describe('ForYouHint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('names followed teams as an input', () => {
    render(<ForYouHint />);
    expect(
      screen.getByText(/For you: Curated based on your profile, primary team attributes, and the teams you follow/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Update your profile/ })).not.toBeInTheDocument();
  });

  it('reports the Update your profile click', () => {
    render(<ForYouHint memberUid="user-1" />);

    fireEvent.click(screen.getByRole('link', { name: /Update your profile/ }));

    expect(onTeamNewsForYouUpdateProfileClicked).toHaveBeenCalledWith('user-1');
  });
});
