import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { NewsPreferences } from '@/components/page/news-preferences/NewsPreferences';
import type { NewsTeamSignal } from '@/components/page/news-preferences/buildTeamSignals';

const mockSetNewsCategories = jest.fn();
const mockToggleFollow = jest.fn();
const mockAnalytics = {
  onNewsPreferencesOpened: jest.fn(),
  onNewsPreferencesCategoryToggled: jest.fn(),
  onNewsPreferencesSaveFailed: jest.fn(),
  onNewsPreferencesFollowToggled: jest.fn(),
};
let mockPreferences: { newsCategories: string[] } | undefined;
let mockFollowed: Array<{ uid: string; name: string; logoUrl: string | null }> = [];
const mockToastError = jest.fn();

jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: () => ({ data: mockPreferences }),
}));
jest.mock('@/services/members/hooks/useSetNewsCategories', () => ({
  useSetNewsCategories: () => mockSetNewsCategories,
}));
jest.mock('@/services/follow/hooks/useFollowedTeams', () => ({
  useFollowedTeams: () => ({ data: mockFollowed, isPending: false }),
}));
jest.mock('@/services/follow/hooks/useFollowTeam', () => ({
  useFollowTeam: () => ({ mutateAsync: mockToggleFollow }),
}));
jest.mock('@/analytics/settings.analytics', () => ({ useSettingsAnalytics: () => mockAnalytics }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));
jest.mock('@/utils/common.utils', () => ({ triggerLoader: jest.fn() }));

const ALL = ['FUNDING', 'LAUNCH', 'PARTNERSHIP', 'ANNOUNCEMENT', 'MILESTONE', 'OTHER'] as const;
const signals: NewsTeamSignal[] = [
  { teamUid: 't1', teamName: 'Lumen', focusAreas: ['AI & Robotics'], industryTags: ['Storage'], communities: [] },
];

function renderPage(props: Partial<React.ComponentProps<typeof NewsPreferences>> = {}) {
  return render(<NewsPreferences uid="m1" from="settings" initialCategories={[...ALL]} signals={signals} {...props} />);
}

const chip = (name: string) =>
  within(screen.getByRole('group', { name: 'News categories' })).getByRole('button', { name });

describe('NewsPreferences (LAB-2941)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPreferences = undefined;
    mockFollowed = [{ uid: 'acme', name: 'Acme', logoUrl: null }];
  });

  it('records the visit with how the member arrived', () => {
    renderPage({ from: 'digest' });
    expect(mockAnalytics.onNewsPreferencesOpened).toHaveBeenCalledWith('digest');
  });

  it('saves a category switched off, in category order, and records it', () => {
    renderPage();
    fireEvent.click(chip('Funding'));

    expect(mockSetNewsCategories).toHaveBeenCalledWith(
      ['LAUNCH', 'PARTNERSHIP', 'ANNOUNCEMENT', 'MILESTONE', 'OTHER'],
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(mockAnalytics.onNewsPreferencesCategoryToggled).toHaveBeenCalledWith({
      category: 'FUNDING',
      on: false,
      from: 'settings',
    });
  });

  it('shows the change at once, before the save returns, and puts it back if the save fails', () => {
    renderPage();
    fireEvent.click(chip('Funding'));
    expect(chip('Funding')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/You get 5 of 6 kinds of news/)).toBeInTheDocument();

    act(() => mockSetNewsCategories.mock.calls[0][1].onError());
    expect(chip('Funding')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/You get every kind of news/)).toBeInTheDocument();
  });

  it('shows "Saved" after a successful save and records a failed one', () => {
    renderPage();
    fireEvent.click(chip('Launch'));
    const { onSuccess, onError } = mockSetNewsCategories.mock.calls[0][1];

    act(() => onSuccess());
    expect(screen.getByRole('status')).toHaveTextContent('Saved');

    act(() => onError());
    expect(mockAnalytics.onNewsPreferencesSaveFailed).toHaveBeenCalledWith({ section: 'categories' });
  });

  it('reads the saved categories and keeps the last one on', () => {
    mockPreferences = { newsCategories: ['LAUNCH'] };
    renderPage();

    expect(chip('Launch')).toBeDisabled();
    expect(chip('Launch')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Funding')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/You get 1 of 6 kinds of news/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    expect(mockSetNewsCategories).toHaveBeenCalledWith([...ALL], expect.anything());
  });

  it('offers no Deals or Hiring chip', () => {
    renderPage();
    expect(within(screen.getByRole('group', { name: 'News categories' })).getAllByRole('button')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /Deals|Hiring/ })).not.toBeInTheDocument();
  });

  it("lists the member's teams with what news is matched on", () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Lumen' })).toHaveAttribute('href', '/teams/t1');
    expect(screen.getByText('AI & Robotics, Storage')).toBeInTheDocument();
    expect(screen.queryByText(/Skills/)).not.toBeInTheDocument();
  });

  it('explains suggestions for a member with no team', () => {
    renderPage({ signals: [] });
    expect(screen.getByText(/suggestions come only from the teams you follow/)).toBeInTheDocument();
  });

  it('unfollows in place and can follow again', async () => {
    mockToggleFollow.mockResolvedValue({ following: false });
    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Acme/ }));
    });
    expect(mockToggleFollow).toHaveBeenLastCalledWith({ teamUid: 'acme', action: 'unfollow' });
    expect(screen.getByText(/Teams you follow · 0/)).toBeInTheDocument();
    expect(screen.getAllByText('Acme').length).toBeGreaterThan(0);

    mockToggleFollow.mockResolvedValue({ following: true });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Acme/ }));
    });
    expect(mockToggleFollow).toHaveBeenLastCalledWith({ teamUid: 'acme', action: 'follow' });
    expect(screen.getByText(/Teams you follow · 1/)).toBeInTheDocument();
  });

  it('reverts a failed unfollow and says so', async () => {
    mockToggleFollow.mockResolvedValue(null);
    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Acme/ }));
    });
    expect(screen.getByText(/Teams you follow · 1/)).toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalled();
    expect(mockAnalytics.onNewsPreferencesSaveFailed).toHaveBeenCalledWith({ section: 'teams', teamUid: 'acme' });
  });

  it('shows the empty state with a way to Teams', () => {
    mockFollowed = [];
    renderPage();
    expect(screen.getByText(/You don.t follow any teams yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See teams to follow' })).toHaveAttribute('href', '/teams');
  });

  describe('arrival from the digest or the feed', () => {
    it('points a member who follows teams at Categories', () => {
      renderPage({ from: 'feed' });
      expect(screen.getByText('Choose the kinds of news you want in For You.')).toBeInTheDocument();
    });

    it('points a member who follows no teams at Teams you follow', () => {
      mockFollowed = [];
      renderPage({ from: 'digest' });
      expect(screen.getByText('Follow teams to see their news in your digest.')).toBeInTheDocument();
    });

    it('ends after the first change, and never shows from the settings menu', () => {
      renderPage({ from: 'feed' });
      fireEvent.click(chip('Funding'));
      expect(screen.queryByText(/Choose the kinds of news/)).not.toBeInTheDocument();
    });

    it('is absent when opened from the settings menu', () => {
      renderPage({ from: 'settings' });
      expect(screen.queryByText(/Choose the kinds of news/)).not.toBeInTheDocument();
    });
  });
});
