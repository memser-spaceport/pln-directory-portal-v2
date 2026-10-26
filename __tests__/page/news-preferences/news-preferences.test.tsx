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

const yourTags = () => screen.getByRole('group', { name: 'Your tags' });
const group = (name: string) => screen.getByRole('group', { name });
const chip = (scope: HTMLElement, name: string) => within(scope).getByRole('button', { name });

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

  it('has a Tags section and no Categories or Suggested section', () => {
    renderPage();
    expect(screen.getByText(/^Tags/)).toBeInTheDocument();
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
    expect(screen.queryByText('Suggested from your profile')).not.toBeInTheDocument();
  });

  it("shows the member's tags first, then the rest under their top-level focus area", () => {
    renderPage();

    expect(chip(yourTags(), 'DeSci')).toHaveAttribute('aria-pressed', 'true');
    expect(chip(group('AI & Robotics'), 'AI & Robotics')).toHaveAttribute('aria-pressed', 'false');
    expect(chip(group('AI & Robotics'), 'AI')).toBeInTheDocument();
    // DeSci is pinned, so it is not repeated under its parent.
    expect(within(group('Economies & Governance')).queryByRole('button', { name: 'DeSci' })).not.toBeInTheDocument();
    expect(chip(group('Economies & Governance'), 'DeFi')).toBeInTheDocument();
  });

  it('adds a tag: saves the whole list, records it, and shows "Saved"', () => {
    mockSetNewsTags.mockImplementation((_next: string[], opts: { onSuccess: () => void }) => opts.onSuccess());
    renderPage();

    fireEvent.click(chip(group('AI & Robotics'), 'AI'));

    expect(mockSetNewsTags).toHaveBeenCalledWith(['desci', 'ai'], expect.any(Object));
    expect(mockAnalytics.onNewsPreferencesTagToggled).toHaveBeenCalledWith({ tag: 'ai', on: true, from: 'settings' });
    expect(chip(group('AI & Robotics'), 'AI')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('keeps a removed tag in place so it can be added back', () => {
    renderPage();

    fireEvent.click(chip(yourTags(), 'DeSci'));

    expect(mockSetNewsTags).toHaveBeenCalledWith([], expect.any(Object));
    expect(chip(yourTags(), 'DeSci')).toHaveAttribute('aria-pressed', 'false');
  });

  it('puts the tags back when the save fails, and records it', () => {
    mockSetNewsTags.mockImplementation((_next: string[], opts: { onError: () => void }) => opts.onError());
    renderPage();

    fireEvent.click(chip(group('AI & Robotics'), 'AI'));

    expect(chip(group('AI & Robotics'), 'AI')).toHaveAttribute('aria-pressed', 'false');
    expect(mockAnalytics.onNewsPreferencesSaveFailed).toHaveBeenCalledWith({ section: 'tags' });
  });

  it('explains seeded tags, and saves them together with the first change', () => {
    renderPage({ initialTags: ['desci'], initialTagsSeeded: true });
    expect(screen.getByText(/We picked these from your teams’ focus areas/)).toBeInTheDocument();

    fireEvent.click(chip(group('AI & Robotics'), 'AI'));

    expect(mockSetNewsTags).toHaveBeenCalledWith(['desci', 'ai'], expect.any(Object));
    expect(screen.queryByText(/We picked these from your teams’ focus areas/)).not.toBeInTheDocument();
  });

  it('prefers the client query over the server-read tags once it loads', () => {
    mockPreferences = { newsTags: ['desci', 'defi'], newsTagsSeeded: false };
    renderPage();
    expect(chip(group('Economies & Governance'), 'DeFi')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/^Tags · 2/)).toBeInTheDocument();
  });

  it('shows the empty state once every tag is removed', () => {
    renderPage();
    fireEvent.click(chip(yourTags(), 'DeSci'));
    expect(
      screen.getByText(/You have no tags, so For You and your digest show news from your own and followed teams only/),
    ).toBeInTheDocument();
  });

  it('keeps the chosen tags and says so when the tag list cannot load', () => {
    mockTagList = { data: undefined, isError: true };
    renderPage({ initialTags: ['desci'] });

    // No title without the list, so the chip shows the slug.
    expect(chip(yourTags(), 'desci')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/We couldn’t load the list of tags/)).toBeInTheDocument();
    expect(screen.getByText(/Teams you follow/)).toBeInTheDocument();
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
    it('points a member who follows teams at Tags', () => {
      renderPage({ from: 'feed' });
      expect(screen.getByText('Remove tags you don’t want in For You.')).toBeInTheDocument();
    });

    it('invites a member with no tags to add some', () => {
      renderPage({ from: 'digest', initialTags: [] });
      expect(screen.getByText('Add a few tags to get news that fits your work in your digest.')).toBeInTheDocument();
    });

    it('points a member who follows no teams at Teams you follow', () => {
      mockFollowed = [];
      renderPage({ from: 'digest' });
      expect(screen.getByText('Follow teams to see their news in your digest.')).toBeInTheDocument();
    });

    it('ends after the first change', () => {
      renderPage({ from: 'feed' });
      fireEvent.click(chip(group('AI & Robotics'), 'AI'));
      expect(screen.queryByText(/Remove tags you don’t want/)).not.toBeInTheDocument();
    });

    it('is absent when opened from the settings menu', () => {
      renderPage({ from: 'settings' });
      expect(screen.queryByText(/Remove tags you don’t want/)).not.toBeInTheDocument();
    });
  });
});
