import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { NewsPreferences } from '@/components/page/news-preferences/NewsPreferences';
import type { INewsTagGroup } from '@/types/team-news.types';

const mockSetNewsTags = jest.fn();
const mockToggleFollow = jest.fn();
const mockAnalytics = {
  onNewsPreferencesOpened: jest.fn(),
  onNewsPreferencesTagToggled: jest.fn(),
  onNewsPreferencesSaveFailed: jest.fn(),
  onNewsPreferencesFollowToggled: jest.fn(),
};
let mockPreferences: { newsTags: string[]; newsTagsSeeded: boolean } | undefined;
let mockTagList: { data?: INewsTagGroup[]; isError: boolean };
let mockFollowed: Array<{ uid: string; name: string; logoUrl: string | null }> = [];
const mockToastError = jest.fn();

jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: () => ({ data: mockPreferences }),
}));
jest.mock('@/services/members/hooks/useSetNewsTags', () => ({
  useSetNewsTags: () => mockSetNewsTags,
}));
jest.mock('@/services/team-news/hooks/useNewsTags', () => ({
  useNewsTags: () => mockTagList,
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

/** The shape `GET /v1/team-news/tags` returns (LAB-2998). */
const TAG_LIST: INewsTagGroup[] = [
  { slug: 'ai-robotics', title: 'AI & Robotics', children: [{ slug: 'ai', title: 'AI' }] },
  {
    slug: 'economies-governance',
    title: 'Economies & Governance',
    children: [
      { slug: 'desci', title: 'DeSci' },
      { slug: 'defi', title: 'DeFi' },
    ],
  },
];

function renderPage(props: Partial<React.ComponentProps<typeof NewsPreferences>> = {}) {
  return render(
    <NewsPreferences uid="m1" from="settings" initialTags={['desci']} initialTagsSeeded={false} {...props} />,
  );
}

const topics = () => screen.getByRole('group', { name: 'Topics' });
const chip = (name: string) => within(topics()).getByRole('button', { name });
const chipNames = () =>
  within(topics())
    .getAllByRole('button')
    .map((b) => b.textContent);

describe('NewsPreferences tags (LAB-3000)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // clearAllMocks keeps implementations: a failing save would leak into the next test.
    mockSetNewsTags.mockReset();
    mockPreferences = undefined;
    mockTagList = { data: TAG_LIST, isError: false };
    mockFollowed = [{ uid: 'acme', name: 'Acme', logoUrl: null }];
  });

  it('records the visit with how the member arrived', () => {
    renderPage({ from: 'digest' });
    expect(mockAnalytics.onNewsPreferencesOpened).toHaveBeenCalledWith('digest');
  });

  it('has a Topics section and no Categories or Suggested section', () => {
    renderPage();
    expect(screen.getByText(/^Topics/)).toBeInTheDocument();
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
    expect(screen.queryByText('Suggested from your profile')).not.toBeInTheDocument();
  });

  it("shows one flat list of #topics, the member's own first, then the rest in the list's order", () => {
    renderPage();

    expect(chipNames()).toEqual(['#desci', '#ai-robotics', '#ai', '#economies-governance', '#defi']);
    expect(chip('#desci')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('#ai')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('#desci')).toHaveAttribute('title', 'Unsubscribe from #desci');
    expect(chip('#ai')).toHaveAttribute('title', 'Subscribe to #ai');
    expect(screen.queryByText('AI & Robotics')).not.toBeInTheDocument();
  });

  it('links to Email Preferences for the digest frequency', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Email Preferences' })).toHaveAttribute('href', '/settings/email');
  });

  it('adds a tag: saves the whole list, records it, and shows "Saved"', () => {
    mockSetNewsTags.mockImplementation((_next: string[], opts: { onSuccess: () => void }) => opts.onSuccess());
    renderPage();

    fireEvent.click(chip('#ai'));

    expect(mockSetNewsTags).toHaveBeenCalledWith(['desci', 'ai'], expect.any(Object));
    expect(mockAnalytics.onNewsPreferencesTagToggled).toHaveBeenCalledWith({ tag: 'ai', on: true, from: 'settings' });
    expect(chip('#ai')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('keeps a removed tag in place so it can be added back', () => {
    renderPage();

    fireEvent.click(chip('#desci'));

    expect(mockSetNewsTags).toHaveBeenCalledWith([], expect.any(Object));
    expect(chip('#desci')).toHaveAttribute('aria-pressed', 'false');
  });

  it('puts the tags back when the save fails, and records it', () => {
    mockSetNewsTags.mockImplementation((_next: string[], opts: { onError: () => void }) => opts.onError());
    renderPage();

    fireEvent.click(chip('#ai'));

    expect(chip('#ai')).toHaveAttribute('aria-pressed', 'false');
    expect(mockAnalytics.onNewsPreferencesSaveFailed).toHaveBeenCalledWith({ section: 'tags' });
  });

  it('explains seeded tags, and saves them together with the first change', () => {
    renderPage({ initialTags: ['desci'], initialTagsSeeded: true });
    expect(screen.getByText(/We picked these from your teams’ focus areas/)).toBeInTheDocument();

    fireEvent.click(chip('#ai'));

    expect(mockSetNewsTags).toHaveBeenCalledWith(['desci', 'ai'], expect.any(Object));
    expect(screen.queryByText(/We picked these from your teams’ focus areas/)).not.toBeInTheDocument();
  });

  it('prefers the client query over the server-read tags once it loads', () => {
    mockPreferences = { newsTags: ['desci', 'defi'], newsTagsSeeded: false };
    renderPage();
    expect(chip('#defi')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/^Topics · 2/)).toBeInTheDocument();
  });

  it('shows the empty state once every tag is removed', () => {
    renderPage();
    fireEvent.click(chip('#desci'));
    expect(
      screen.getByText(
        /You’re not subscribed to any topics. Pick some to get news tagged with them in For You and your digest./,
      ),
    ).toBeInTheDocument();
  });

  it('keeps the chosen tags and says so when the tag list cannot load', () => {
    mockTagList = { data: undefined, isError: true };
    renderPage({ initialTags: ['desci'] });

    expect(chipNames()).toEqual(['#desci']);
    expect(chip('#desci')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/We couldn’t load the list of topics/)).toBeInTheDocument();
    expect(screen.getByText(/Teams you follow/)).toBeInTheDocument();
  });

  it("shows a followed team's focus area under its name when the backend sends one", () => {
    mockFollowed = [{ uid: 'acme', name: 'Acme', logoUrl: null, focusArea: 'Digital Human Rights' } as never];
    renderPage();
    expect(screen.getByText('Digital Human Rights')).toBeInTheDocument();
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
    it('points a member who follows teams at Topics', () => {
      renderPage({ from: 'feed' });
      expect(screen.getByText('Unsubscribe from topics you don’t want in For You.')).toBeInTheDocument();
    });

    it('invites a member with no topics to subscribe to some', () => {
      renderPage({ from: 'digest', initialTags: [] });
      expect(
        screen.getByText('Subscribe to a few topics to get news that fits your work in your digest.'),
      ).toBeInTheDocument();
    });

    it('points a member with topics who follows no teams at Teams you follow', () => {
      mockFollowed = [];
      renderPage({ from: 'digest' });
      expect(screen.getByText('Follow teams to see their news in your digest.')).toBeInTheDocument();
    });

    it('points a member with no topics and no follows at Topics first', () => {
      mockFollowed = [];
      renderPage({ from: 'digest', initialTags: [] });
      expect(
        screen.getByText('Subscribe to a few topics to get news that fits your work in your digest.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Follow teams to see their news in your digest.')).not.toBeInTheDocument();
    });

    it('ends after the first change', () => {
      renderPage({ from: 'feed' });
      fireEvent.click(chip('#ai'));
      expect(screen.queryByText(/Unsubscribe from topics you don’t want/)).not.toBeInTheDocument();
    });

    it('is absent when opened from the settings menu', () => {
      renderPage({ from: 'settings' });
      expect(screen.queryByText(/Unsubscribe from topics you don’t want/)).not.toBeInTheDocument();
    });
  });
});
