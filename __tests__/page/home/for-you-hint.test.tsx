import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const onTeamNewsForYouTuneClicked = jest.fn();
const onTeamNewsForYouUpdateProfileClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onTeamNewsForYouTuneClicked, onTeamNewsForYouUpdateProfileClicked }),
}));

let mockShowNewsPreferences = true;
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  get SHOW_NEWS_PREFERENCES() {
    return mockShowNewsPreferences;
  },
}));

import { ForYouHint } from '@/components/page/home/TeamNews/components/ForYouHint/ForYouHint';

describe('ForYouHint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowNewsPreferences = true;
  });

  it('names followed teams as an input, with no link for a guest', () => {
    render(<ForYouHint />);
    expect(
      screen.getByText(/For you: Curated based on your profile, primary team attributes, and the teams you follow/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links "Update" (was "Tune For You") to News preferences and reports the click (LAB-2941)', () => {
    render(<ForYouHint memberUid="user-1" />);

    const link = screen.getByRole('link', { name: 'Update' });
    expect(link).toHaveAttribute('href', '/settings/news-preferences?from=feed');
    expect(link.closest('p')).toHaveTextContent(/teams you follow\. Update to make it more relevant\.$/);
    fireEvent.click(link);

    expect(onTeamNewsForYouTuneClicked).toHaveBeenCalledWith('user-1');
  });

  it('keeps the profile link while News preferences is flagged off', () => {
    mockShowNewsPreferences = false;
    render(<ForYouHint memberUid="user-1" />);

    expect(screen.queryByRole('link', { name: 'Update' })).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Update your profile' });
    expect(link).toHaveAttribute('href', '/members/user-1?backTo=%2Fhome');
    expect(screen.getByText(/to make it more relevant/)).toBeInTheDocument();
    fireEvent.click(link);

    expect(onTeamNewsForYouUpdateProfileClicked).toHaveBeenCalledWith('user-1');
    expect(onTeamNewsForYouTuneClicked).not.toHaveBeenCalled();
  });
});
