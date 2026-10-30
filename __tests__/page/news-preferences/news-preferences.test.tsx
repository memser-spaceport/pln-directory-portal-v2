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
  onNewsPreferencesTagSearched: jest.fn(),
  onNewsPreferencesForYouLinkClicked: jest.fn(),
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

  it('asks what news the member wants, and has no Categories or Suggested section (LAB-3023)', () => {
    renderPage();
    expect(screen.getByText('What do you want news about?')).toBeInTheDocument();
    expect(screen.getByText('Pick a few tags. They shape For You and your digest.')).toBeInTheDocument();
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
    expect(screen.queryByText('Suggested from your profile')).not.toBeInTheDocument();
  });

  it('groups the #topics by theme, alphabetical within each (LAB-3023)', () => {
    renderPage();

    const theme = (name: string) =>
      within(screen.getByRole('group', { name }))
        .getAllByRole('button')
        .map((b) => b.textContent);
    expect(theme('AI & frontier tech')).toEqual(['#ai', '#ai-robotics', '#desci']);
    expect(theme('Economies & governance')).toEqual(['#defi', '#economies-governance']);
    expect(chipNames()).toEqual(['#ai', '#ai-robotics', '#desci', '#defi', '#economies-governance']);
    expect(chip('#desci')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('#ai')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('#desci')).toHaveAttribute('title', 'Unsubscribe from #desci');
    expect(chip('#ai')).toHaveAttribute('title', 'Subscribe to #ai');
    // The API's parents are not the themes.
    expect(screen.queryByText('AI & Robotics')).not.toBeInTheDocument();
  });

  it('puts a tag no theme knows under Other, last', () => {
    renderPage({ initialTags: ['desci', 'zk-gaming'] });
    expect(screen.getByRole('group', { name: 'Other' })).toHaveTextContent('#zk-gaming');
    expect(chipNames().at(-1)).toBe('#zk-gaming');
  });

  describe('search (LAB-3023)', () => {
    const search = () => screen.getByRole('searchbox', { name: 'Search tags' });

    it('narrows the chips as you type, hiding themes with no match', () => {
      renderPage();
      fireEvent.change(search(), { target: { value: 'de' } });

      expect(chipNames()).toEqual(['#desci', '#defi']);
      expect(screen.getByRole('group', { name: 'AI & frontier tech' })).toBeInTheDocument();
      fireEvent.change(search(), { target: { value: 'robot' } });
      expect(chipNames()).toEqual(['#ai-robotics']);
      expect(screen.queryByRole('group', { name: 'Economies & governance' })).not.toBeInTheDocument();
    });

    it('finds a tag typed with # or spaces, and a whole theme by its name', () => {
      renderPage();
      fireEvent.change(search(), { target: { value: '#Economies Gov' } });
      expect(chipNames()).toEqual(['#economies-governance']);
      fireEvent.change(search(), { target: { value: 'Economies' } });
      expect(chipNames()).toEqual(['#defi', '#economies-governance']);
      fireEvent.change(search(), { target: { value: 'frontier' } });
      expect(chipNames()).toEqual(['#ai', '#ai-robotics', '#desci']);
    });

    it('says when nothing matches, and toggling still works on a filtered chip', () => {
      renderPage();
      fireEvent.change(search(), { target: { value: 'zzz' } });
      expect(screen.getByText('No tags match “zzz”.')).toBeInTheDocument();

      fireEvent.change(search(), { target: { value: 'ai' } });
      fireEvent.click(chip('#ai'));
      expect(mockSetNewsTags).toHaveBeenCalledWith(['desci', 'ai'], expect.any(Object));
    });

    it('offers a clear button only while there is text, which empties the field and keeps focus in it', () => {
      renderPage();
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

      fireEvent.change(search(), { target: { value: 'robot' } });
      expect(chipNames()).toEqual(['#ai-robotics']);
      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

      expect(search()).toHaveValue('');
      expect(search()).toHaveFocus();
      expect(chipNames()).toEqual(['#ai', '#ai-robotics', '#desci', '#defi', '#economies-governance']);
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    });

    it('records a search when the member leaves the field with text in it', () => {
      renderPage();
      fireEvent.blur(search());
      expect(mockAnalytics.onNewsPreferencesTagSearched).not.toHaveBeenCalled();

      fireEvent.change(search(), { target: { value: ' de ' } });
      fireEvent.blur(search());
      expect(mockAnalytics.onNewsPreferencesTagSearched).toHaveBeenCalledWith({ query: 'de', matches: 2 });
    });
  });

  it('links to Email Preferences for the digest frequency', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Email Preferences' })).toHaveAttribute('href', '/settings/email');
  });

  describe('"For You" in the intro (LAB-3036)', () => {
    it('links "For You" to the For You feed on Home, in the same tab, and keeps the sentence text', () => {
      renderPage();
      const link = screen.getByRole('link', { name: 'For You' });
      expect(link).toHaveAttribute('href', '/home?feed=for-you');
      expect(link).not.toHaveAttribute('target');
      expect(link).toHaveClass(screen.getByRole('link', { name: 'Email Preferences' }).className);
      expect(link.closest('p')).toHaveTextContent(
        'These shape For You on Home and the news in your email digest. To change how often the digest arrives, go to Email Preferences.',
      );
    });

    it.each(['settings', 'feed', 'digest'] as const)('records a click with how the member arrived (%s)', (from) => {
      renderPage({ from });
      const link = screen.getByRole('link', { name: 'For You' });
      expect(link).toHaveAttribute('href', '/home?feed=for-you');
      fireEvent.click(link);
      expect(mockAnalytics.onNewsPreferencesForYouLinkClicked).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.onNewsPreferencesForYouLinkClicked).toHaveBeenCalledWith(from);
    });
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

  it('does not claim it picked tags when the seed is empty (LAB-3018)', () => {
    renderPage({ initialTags: [], initialTagsSeeded: true });
    expect(screen.queryByText(/We picked these/)).not.toBeInTheDocument();
    expect(screen.getByText('Pick a few tags. They shape For You and your digest.')).toBeInTheDocument();
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
  });

  it('keeps inviting a pick once every tag is removed', () => {
    renderPage({ initialTagsSeeded: true });
    fireEvent.click(chip('#desci'));
    expect(screen.queryByText(/We picked these/)).not.toBeInTheDocument();
    expect(screen.getByText('Pick a few tags. They shape For You and your digest.')).toBeInTheDocument();
  });

  it('keeps the chosen tags and says so when the tag list cannot load', () => {
    mockTagList = { data: undefined, isError: true };
    renderPage({ initialTags: ['desci'] });

    expect(chipNames()).toEqual(['#desci']);
    expect(chip('#desci')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/We couldn’t load the list of topics/)).toBeInTheDocument();
    expect(screen.getByText(/Teams you follow/)).toBeInTheDocument();
  });

  it("shows all of a followed team's focus areas under its name (LAB-3018)", () => {
    mockFollowed = [
      {
        uid: 'acme',
        name: 'Acme',
        logoUrl: null,
        focusAreas: ['Digital Human Rights', 'Economies & Governance'],
      } as never,
    ];
    renderPage();
    expect(screen.getByText('Digital Human Rights, Economies & Governance')).toBeInTheDocument();
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
