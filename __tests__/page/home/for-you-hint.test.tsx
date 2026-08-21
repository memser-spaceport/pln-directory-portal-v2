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

  it('does not offer Update profile when there is no member to send', () => {
    render(<ForYouHint />);
    expect(screen.queryByRole('link', { name: /Update profile/ })).not.toBeInTheDocument();
  });

  it('reports the Update profile click', () => {
    render(<ForYouHint memberUid="user-1" />);

    fireEvent.click(screen.getByRole('link', { name: /Update profile/ }));

    expect(onTeamNewsForYouUpdateProfileClicked).toHaveBeenCalledWith('user-1');
  });
});
