import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const onTeamNewsForYouSetupClicked = jest.fn();
const onTeamNewsForYouSetupShown = jest.fn();
const onTeamNewsForYouTuneClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsForYouSetupClicked,
    onTeamNewsForYouSetupShown,
    onTeamNewsForYouTuneClicked,
  }),
}));

import {
  ForYouSetupPrompt,
  isForYouSetupVisible,
} from '@/components/page/home/TeamNews/components/ForYouSetupPrompt/ForYouSetupPrompt';
import { ALL_CAT, ALL_TAB, FOR_YOU_CAT } from '@/components/page/home/TeamNews/constants';

const resting = {
  preferencesOn: true,
  signedIn: true,
  forYouHasNoInputs: true,
  activeTab: ALL_TAB,
  activeCategory: ALL_CAT,
  query: '',
  hasTopicFilter: false,
};

describe('isForYouSetupVisible', () => {
  it('is true only on resting All for a signed-in member with no For You inputs', () => {
    expect(isForYouSetupVisible(resting)).toBe(true);
    expect(isForYouSetupVisible({ ...resting, preferencesOn: false })).toBe(false);
    expect(isForYouSetupVisible({ ...resting, signedIn: false })).toBe(false);
    expect(isForYouSetupVisible({ ...resting, forYouHasNoInputs: false })).toBe(false);
    expect(isForYouSetupVisible({ ...resting, activeTab: 'AI & Robotics' })).toBe(false);
    expect(isForYouSetupVisible({ ...resting, activeCategory: FOR_YOU_CAT })).toBe(false);
    expect(isForYouSetupVisible({ ...resting, query: ' filecoin ' })).toBe(false);
    expect(isForYouSetupVisible({ ...resting, hasTopicFilter: true })).toBe(false);
  });
});

describe('ForYouSetupPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links to News preferences and records the set-up click, not the Update click', () => {
    render(<ForYouSetupPrompt memberUid="user-1" visible />);

    expect(screen.getByText('For you').tagName).toBe('SPAN');
    expect(
      screen.getByText(/Get news picked for you\. Choose your topics and teams in News preferences\./),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open News preferences →' });
    expect(link).toHaveAttribute('href', '/settings/news-preferences?from=feed');
    expect(onTeamNewsForYouSetupShown).toHaveBeenCalledTimes(1);
    expect(onTeamNewsForYouSetupShown).toHaveBeenCalledWith('user-1');

    fireEvent.click(link);

    expect(onTeamNewsForYouSetupClicked).toHaveBeenCalledWith('user-1');
    expect(onTeamNewsForYouTuneClicked).not.toHaveBeenCalled();
  });

  it('records shown once per page load, including after the row hides and returns', () => {
    const { rerender } = render(<ForYouSetupPrompt memberUid="user-1" visible />);
    rerender(<ForYouSetupPrompt memberUid="user-1" visible={false} />);
    expect(screen.queryByRole('link', { name: 'Open News preferences →' })).not.toBeInTheDocument();
    rerender(<ForYouSetupPrompt memberUid="user-1" visible />);

    expect(onTeamNewsForYouSetupShown).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while it is hidden', () => {
    render(<ForYouSetupPrompt memberUid="user-1" visible={false} />);
    expect(screen.queryByText(/Get news picked for you/)).not.toBeInTheDocument();
    expect(onTeamNewsForYouSetupShown).not.toHaveBeenCalled();
  });
});
