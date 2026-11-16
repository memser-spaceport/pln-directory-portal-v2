import '@testing-library/jest-dom';
import type { ReactElement } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SignedInHome } from '@/components/page/home/HomeV2/SignedInHome';
import { STREAM_RENDER_MAX } from '@/components/page/home/HomeV2/NetworkUpdates';
import { useCurrentUserStore } from '@/services/auth/store';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import type { IDeal } from '@/types/deals.types';
import type { IFeedForumPost } from '@/types/feed.types';
import type { IHomeEvents, IHomeRoles } from '@/types/home.types';
import type { IJobTeamGroup } from '@/types/jobs.types';
import type { ISuggestedTeam, ITeamNewsGroup, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

// ---- The feed's data hooks (as team-news.test.tsx mocks them) ----

type FeedSocialResult = {
  forumPosts: IFeedForumPost[] | undefined;
  unwindowedForumPosts: IFeedForumPost[] | undefined;
  hasAccess: boolean;
  deepLinkSettled: boolean;
};
const feedSocial = (posts: IFeedForumPost[] | undefined, hasAccess: boolean): FeedSocialResult => ({
  forumPosts: posts,
  unwindowedForumPosts: posts,
  hasAccess,
  deepLinkSettled: true,
});
const mockUseFeedSocial = jest.fn((): FeedSocialResult => feedSocial(undefined, false));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedSocial', () => ({
  useFeedSocial: (...a: unknown[]) => mockUseFeedSocial(...(a as [])),
}));
const mockUseFeedHiring = jest.fn((..._a: unknown[]): { hiring: IJobTeamGroup[] | undefined } => ({
  hiring: undefined,
}));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedHiring', () => ({
  useFeedHiring: (...a: unknown[]) => mockUseFeedHiring(...a),
}));
const mockUseFeedDeals = jest.fn((..._a: unknown[]): { deals: IDeal[] | undefined } => ({ deals: undefined }));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedDeals', () => ({
  useFeedDeals: (...a: unknown[]) => mockUseFeedDeals(...a),
}));
const mockUseFeedForYouJobs = jest.fn((..._a: unknown[]): { forYouJobs: IJobTeamGroup[] | undefined } => ({
  forYouJobs: undefined,
}));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedForYouJobs', () => ({
  useFeedForYouJobs: (...a: unknown[]) => mockUseFeedForYouJobs(...a),
}));
const mockUseSuggestedTeamsToFollow = jest.fn();
jest.mock('@/services/follow/hooks/useSuggestedTeamsToFollow', () => ({
  useSuggestedTeamsToFollow: (...a: unknown[]) => mockUseSuggestedTeamsToFollow(...a),
}));
jest.mock('@/services/team-news/hooks/useTeamNewsUpvoteToggle', () => ({
  useTeamNewsUpvoteToggle: () => ({ mutate: jest.fn() }),
}));
const mockFollowMutate = jest.fn();
jest.mock('@/services/follow/hooks/useFollowTeam', () => ({
  useFollowTeam: () => ({ mutate: (...a: unknown[]) => mockFollowMutate(...a) }),
}));
let mockTopicSlugs: ReadonlySet<string> | null = new Set(['ai', 'robotics', 'storage', 'defi']);
jest.mock('@/services/team-news/hooks/useNewsTopicSlugs', () => ({
  useNewsTopicSlugs: () => mockTopicSlugs,
}));
let mockShowNewsPreferences = true;
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  get SHOW_NEWS_PREFERENCES() {
    return mockShowNewsPreferences;
  },
}));
const mockSetNewsTags = jest.fn();
jest.mock('@/services/members/hooks/useSetNewsTags', () => ({ useSetNewsTags: () => mockSetNewsTags }));
let mockMemberNewsTags: string[] | undefined = ['storage'];
jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: () => ({ data: mockMemberNewsTags ? { newsTags: mockMemberNewsTags } : undefined }),
}));

// ---- The rail ----

let mockDeals: { deals: IDeal[]; total: number } | null = null;
jest.mock('@/components/page/home/HomeV2/useHomeDeals', () => ({ useHomeDeals: () => mockDeals }));

// ---- Analytics ----

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
const mockHomeAnalytics = {
  onFeedTagScopeChanged: jest.fn(),
  onDealClicked: jest.fn(),
  onSeeAllClicked: jest.fn(),
  onRoleClicked: jest.fn(),
  onEventClicked: jest.fn(),
  onFocusAreaClicked: jest.fn(),
};
jest.mock('@/analytics/home.analytics', () => ({ useHomeAnalytics: () => mockHomeAnalytics }));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('@/utils/formatTimeAgo', () => ({ formatTimeAgo: () => '2d ago' }));

// ---- Fixtures ----

const story = (uid: string, eventType: TeamNewsEventType, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid,
  teamUid: `team-${uid}`,
  teamName: `Team ${uid}`,
  teamLogoUrl: null,
  eventType,
  eventDate: '2026-11-01T12:00:00.000Z',
  title: `Headline ${uid}`,
  summary: `Summary ${uid}`,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: ['AI & Robotics'],
  subFocusAreas: [],
  createdAt: '2026-11-01T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

const groupsOf = (items: ITeamNewsItem[]): ITeamNewsGroup[] => [
  { focusArea: { uid: 'fa-ai', title: 'AI & Robotics' }, total: items.length, items },
];

const forumPost: IFeedForumPost = {
  uid: 'fp_96',
  tid: 96,
  mainPid: 263,
  title: 'Willow Is Live!',
  body: 'Hi Protocol Labs',
  author: { memberUid: 'm-1', name: 'Matt Curran', avatarUrl: null, role: null },
  focusAreas: [],
  category: 'Intros',
  createdAt: '2026-10-31T00:00:00.000Z',
  lastActivityAt: '2026-10-31T00:00:00.000Z',
  forumTopicUrl: '/forum/topics/5/96',
  commentCount: 2,
  likeCount: 5,
  viewCount: 0,
  viewerHasLiked: false,
};

const ROLES: IHomeRoles = {
  roles: [
    {
      uid: 'r1',
      title: 'Protocol Engineer',
      teamUid: 't1',
      teamName: 'Hiring Co',
      teamLogoUrl: null,
      location: 'Remote',
      applyUrl: 'https://jobs.example.com/r1',
    },
  ],
  total: 171,
};

const EVENTS: IHomeEvents = {
  events: [
    {
      uid: 'e1',
      name: 'Founders Dinner',
      startDate: '2026-11-08T00:00:00.000Z',
      endDate: '2026-11-08T00:00:00.000Z',
      location: 'Berlin',
    },
  ],
  total: 4,
};

const deal = (uid: string, createdAt: string, offerValue?: string | null): IDeal => ({
  uid,
  vendorName: `Vendor ${uid}`,
  vendorTeamUid: null,
  logoUid: null,
  category: 'Infra',
  audience: 'ALL_FOUNDERS',
  shortDescription: `Line ${uid}`,
  status: 'ACTIVE',
  createdAt,
  updatedAt: createdAt,
  isRedeemed: false,
  isUsing: false,
  teamsRedemptionCount: 0,
  teamsUsingCount: 0,
  logoUrl: null,
  offerValue,
});

const SUGGESTED: ISuggestedTeam[] = [
  { uid: 'st-1', name: 'Suggested One', logo: null, reason: 'Storage · 12 followers', shortDescription: null },
] as ISuggestedTeam[];

function renderHome(
  items: ITeamNewsItem[],
  extra: {
    roles?: IHomeRoles | null;
    events?: IHomeEvents | null;
    portfolio?: React.ComponentProps<typeof SignedInHome>['portfolio'];
    projectFocusAreaCounts?: Record<string, number> | null;
    forYouTeamUids?: string[];
    forYouTags?: string[];
  } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui: ReactElement = (
    <SignedInHome
      feed={{
        groups: groupsOf(items),
        forYouTeamUids: extra.forYouTeamUids ?? [],
        forYouTags: extra.forYouTags,
        popularItems: [],
      }}
      roles={extra.roles === undefined ? ROLES : extra.roles}
      events={extra.events === undefined ? EVENTS : extra.events}
      portfolio={extra.portfolio ?? []}
      projectFocusAreaCounts={extra.projectFocusAreaCounts}
    />
  );
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const pillRow = () => document.querySelector('.catRow') as HTMLElement;
const pillNames = () =>
  within(pillRow())
    .getAllByRole('button')
    .map((b) => b.textContent);
const stream = () => document.querySelector('[data-news-feed-root]') as HTMLElement;
/** The news cards' headlines, in stream order (forum cards have headings too). */
const streamHeadlines = () => Array.from(stream().querySelectorAll('[data-story-uid] h3')).map((h) => h.textContent);
const scopeRow = () => screen.getByText('Filter:').parentElement as HTMLElement;

beforeAll(() => {
  // useCardVisibilityTracking needs one; nothing intersects in jsdom.
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseFeedSocial.mockReturnValue(feedSocial(undefined, false));
  mockUseFeedHiring.mockReturnValue({ hiring: undefined });
  mockUseFeedDeals.mockReturnValue({ deals: undefined });
  mockUseFeedForYouJobs.mockReturnValue({ forYouJobs: undefined });
  mockUseSuggestedTeamsToFollow.mockReturnValue({ suggestions: [], isLoading: false });
  mockTopicSlugs = new Set(['ai', 'robotics', 'storage', 'defi']);
  mockShowNewsPreferences = true;
  mockMemberNewsTags = ['storage'];
  mockDeals = null;
  useCurrentUserStore.setState({ currentUser: { uid: 'user-1' } as never, isHydrated: true });
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
});

describe('Network Updates: the stream', () => {
  it('shows every story as its own card, with no tabs, no Top stories band and no Quick Actions', () => {
    renderHome([
      story('a', 'LAUNCH', { teamUid: 'same', teamName: 'Same Team' }),
      story('b', 'FUNDING', { teamUid: 'same', teamName: 'Same Team' }),
    ]);

    expect(screen.getByRole('heading', { level: 2, name: 'Network Updates' })).toBeInTheDocument();
    // Two stories from one team: two cards, not a team cluster with "View all".
    expect(streamHeadlines()).toEqual(['Headline a', 'Headline b']);
    expect(screen.queryByText(/View all 2 updates/)).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Top stories/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all news' })).toHaveAttribute('href', '/?view=news');
  });

  it("shows a story's image as its card thumbnail and as the story dialog's header (LAB-3134)", () => {
    const IMAGE = 'https://cdn.example.com/a.jpg';
    renderHome([story('a', 'LAUNCH', { imageUrl: IMAGE }), story('b', 'FUNDING')]);

    const rowA = within(stream()).getByRole('button', { name: 'Headline a' });
    expect(rowA.querySelector('.thumb img')).toHaveAttribute('src', IMAGE);
    // A text-only story stays text-only.
    expect(within(stream()).getByRole('button', { name: 'Headline b' }).querySelector('img')).not.toBeInTheDocument();

    fireEvent.click(rowA.querySelector('img') as HTMLImageElement);

    expect(screen.getByRole('dialog').querySelector('.hero img')).toHaveAttribute('src', IMAGE);
  });

  // LAB-3174: the line is under the pills on every filter. Its link opens News preferences, not general Settings.
  it('shows the For you line on every filter, with News preferences right after the sentence', () => {
    renderHome([story('a', 'LAUNCH'), story('b', 'FUNDING')]);

    const line = () => screen.getByText(/Curated from your profile, your team, and the teams you follow\./);
    expect(line()).toHaveTextContent(
      'For you · Curated from your profile, your team, and the teams you follow. News preferences',
    );
    expect(within(line()).getByRole('link', { name: 'News preferences' })).toHaveAttribute(
      'href',
      '/settings/news-preferences',
    );
    expect(
      screen.queryByRole('link', { name: /Update your profile|make it more relevant|Tune For You/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(within(pillRow()).getByRole('button', { name: /^Funding/ }));
    expect(line()).toBeInTheDocument();
  });

  it('replaces the For you line with the set-up row when the member has no inputs (LAB-3080)', () => {
    renderHome([story('a', 'LAUNCH'), story('b', 'FUNDING')], { forYouTags: [], forYouTeamUids: [] });

    const link = screen.getByRole('link', { name: 'Open News preferences →' });
    expect(link).toHaveAttribute('href', '/settings/news-preferences?from=feed');
    expect(
      screen.getByText(/Get news picked for you\. Choose your topics and teams in News preferences\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Curated from your profile/)).not.toBeInTheDocument();

    fireEvent.click(within(pillRow()).getByRole('button', { name: /^Funding/ }));
    expect(screen.queryByRole('link', { name: 'Open News preferences →' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Curated from your profile/)).not.toBeInTheDocument();

    fireEvent.click(within(pillRow()).getByRole('button', { name: /^All/ }));
    expect(screen.getByRole('link', { name: 'Open News preferences →' })).toBeInTheDocument();
  });

  it('shows the set-up row when the member has teams but no For You news, no tags and no follows', () => {
    renderHome([story('a', 'LAUNCH'), story('b', 'FUNDING')], { forYouTags: [], forYouTeamUids: ['team-missing'] });

    expect(screen.getByRole('link', { name: 'Open News preferences →' })).toHaveAttribute(
      'href',
      '/settings/news-preferences?from=feed',
    );
    expect(screen.queryByText(/Curated from your profile/)).not.toBeInTheDocument();
    expect(within(pillRow()).queryByRole('button', { name: /For You/ })).not.toBeInTheDocument();
  });

  it('keeps the curated line when the member has a tag but no stories this week', () => {
    renderHome([story('a', 'LAUNCH')], { forYouTags: ['neurotech'], forYouTeamUids: [] });

    expect(screen.getByText(/Curated from your profile, your team, and the teams you follow\./)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open News preferences →' })).not.toBeInTheDocument();
  });

  it('fetches and injects no hiring, deals or For You job entries', () => {
    mockUseFeedHiring.mockReturnValue({ hiring: [{ team: { uid: 'h' } } as unknown as IJobTeamGroup] });
    mockUseFeedDeals.mockReturnValue({ deals: [deal('d1', '2026-11-01')] });
    mockUseFeedForYouJobs.mockReturnValue({ forYouJobs: [{ team: { uid: 'j' } } as unknown as IJobTeamGroup] });

    renderHome([story('a', 'LAUNCH')]);

    expect(mockUseFeedHiring).toHaveBeenCalledWith(false);
    expect(mockUseFeedDeals).toHaveBeenCalledWith(false);
    expect(mockUseFeedForYouJobs.mock.calls.every(([enabled]) => enabled === false)).toBe(true);
    // One card: the story. Nothing slotted in beside it.
    expect(stream().children).toHaveLength(1);
  });

  it('interleaves forum posts for a member with forum access, and offers Discussions with posts only', () => {
    mockUseFeedSocial.mockReturnValue(feedSocial([forumPost], true));
    renderHome([
      story('threaded', 'LAUNCH', { discussion: { count: 2, latestTopicUrl: 'https://forum/1' } }),
      story('plain', 'FUNDING'),
    ]);

    expect(within(stream()).getByText('Willow Is Live!')).toBeInTheDocument();
    const discussions = within(pillRow()).getByRole('button', { name: /Discussions/ });
    // The forum post alone: a news story with a thread stays a story.
    expect(within(discussions).getByText('1')).toBeInTheDocument();

    fireEvent.click(discussions);
    expect(streamHeadlines()).toEqual([]);
    expect(within(stream()).getByText('Willow Is Live!')).toBeInTheDocument();
  });

  it('has no Discussions pill and no forum posts without forum access', () => {
    renderHome([story('threaded', 'LAUNCH', { discussion: { count: 2, latestTopicUrl: 'https://forum/1' } })]);

    expect(within(pillRow()).queryByRole('button', { name: /Discussions/ })).not.toBeInTheDocument();
  });

  it('draws the fixed pill row and hides the pills with nothing under them', () => {
    renderHome([story('f', 'FUNDING'), story('m', 'MILESTONE'), story('t', 'ANNOUNCEMENT', { editorialRank: 1 })]);

    // No Launch stories, no Discussions, no For You: those pills are absent. Milestone is never on the row.
    expect(pillNames()).toEqual(['All', 'Top1', 'Funding1', 'Announcement1']);
  });

  it('lists only the editorial top stories under Top, each badged, and returns to All on a second press', () => {
    renderHome([
      story('r1', 'LAUNCH', { editorialRank: 1 }),
      story('r2', 'FUNDING', { editorialRank: 2 }),
      story('r3', 'LAUNCH', { editorialRank: 3 }),
      story('r4', 'LAUNCH', { editorialRank: 4 }),
      story('r5', 'LAUNCH', { editorialRank: 5 }),
      story('plain', 'LAUNCH'),
    ]);

    // In the stream, where they stand: badged, not pinned.
    expect(within(stream()).getAllByText('Top story')).toHaveLength(5);

    const top = within(pillRow()).getByRole('button', { name: /^Top/ });
    fireEvent.click(top);
    expect(streamHeadlines()).toEqual(['Headline r1', 'Headline r2', 'Headline r3', 'Headline r4', 'Headline r5']);
    expect(top).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(top);
    expect(streamHeadlines()).toHaveLength(6);
    expect(within(pillRow()).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('matches a #tag search against the tags', () => {
    jest.useFakeTimers();
    renderHome([story('tagged', 'LAUNCH', { tags: ['ai'] }), story('other', 'LAUNCH', { tags: ['storage'] })]);

    const field = document.querySelector('[class*="mobileSearchRow"] input') as HTMLInputElement;
    fireEvent.change(field, { target: { value: '#ai' } });
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();

    expect(streamHeadlines()).toEqual(['Headline tagged']);
  });
});

describe('Network Updates: tags stack', () => {
  const items = [
    story('ai-only', 'LAUNCH', { tags: ['ai'] }),
    story('ai-robotics', 'FUNDING', { tags: ['ai', 'robotics'] }),
    story('ai-storage', 'LAUNCH', { tags: ['ai', 'storage'] }),
    story('robotics-only', 'LAUNCH', { tags: ['robotics'] }),
  ];

  const clickTag = (card: string, tag: string) => {
    const headline = within(stream()).getByRole('heading', { name: `Headline ${card}` });
    const row = headline.closest('[data-story-uid]') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: new RegExp(`#${tag}`) }));
  };

  it('shows only the stories carrying every selected tag, with a chip per tag, the count and Clear all', () => {
    renderHome(items);

    clickTag('ai-robotics', 'ai');
    expect(streamHeadlines()).toEqual(['Headline ai-only', 'Headline ai-robotics', 'Headline ai-storage']);
    expect(within(scopeRow()).getByText('3 updates')).toBeInTheDocument();
    // One tag: Follow, not Clear all.
    expect(within(scopeRow()).getByRole('button', { name: 'Follow #ai' })).toBeInTheDocument();
    expect(within(scopeRow()).queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();

    clickTag('ai-robotics', 'robotics');
    expect(streamHeadlines()).toEqual(['Headline ai-robotics']);
    expect(within(scopeRow()).getByText('#ai')).toBeInTheDocument();
    expect(within(scopeRow()).getByText('#robotics')).toBeInTheDocument();
    expect(within(scopeRow()).getByText('1 update')).toBeInTheDocument();
    expect(within(scopeRow()).getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
    expect(within(scopeRow()).queryByRole('button', { name: /^Follow/ })).not.toBeInTheDocument();

    expect(mockHomeAnalytics.onFeedTagScopeChanged.mock.calls).toEqual([
      [{ tags: ['ai'], action: 'add' }],
      [{ tags: ['ai', 'robotics'], action: 'add' }],
    ]);
  });

  it('removes a tag from its chip, from a second click, and clears all', () => {
    renderHome(items);
    clickTag('ai-robotics', 'ai');
    clickTag('ai-robotics', 'robotics');

    fireEvent.click(within(scopeRow()).getByRole('button', { name: 'Stop filtering by #robotics' }));
    expect(streamHeadlines()).toHaveLength(3);

    clickTag('ai-only', 'ai');
    expect(screen.queryByText('Filter:')).not.toBeInTheDocument();
    expect(streamHeadlines()).toHaveLength(4);

    clickTag('ai-robotics', 'ai');
    clickTag('ai-robotics', 'robotics');
    fireEvent.click(within(scopeRow()).getByRole('button', { name: 'Clear all' }));
    expect(screen.queryByText('Filter:')).not.toBeInTheDocument();

    expect(mockHomeAnalytics.onFeedTagScopeChanged.mock.calls.map(([p]) => p.action)).toEqual([
      'add',
      'add',
      'remove',
      'remove',
      'add',
      'add',
      'clear',
    ]);
    expect(mockHomeAnalytics.onFeedTagScopeChanged).toHaveBeenLastCalledWith({ tags: [], action: 'clear' });
  });

  it('offers the commonest other tags that would narrow the scope, and adds one as a narrow', () => {
    renderHome(items);
    clickTag('ai-only', 'ai');

    const narrow = within(scopeRow()).getAllByRole('button', { name: /^Also filter by/ });
    expect(narrow.map((b) => b.textContent)).toEqual(['+ #robotics', '+ #storage']);

    fireEvent.click(narrow[1]);
    expect(streamHeadlines()).toEqual(['Headline ai-storage']);
    expect(mockHomeAnalytics.onFeedTagScopeChanged).toHaveBeenLastCalledWith({
      tags: ['ai', 'storage'],
      action: 'narrow',
    });
  });

  it('hides forum posts while any tag is selected', () => {
    mockUseFeedSocial.mockReturnValue(feedSocial([forumPost], true));
    renderHome(items);
    expect(within(stream()).getByText('Willow Is Live!')).toBeInTheDocument();

    clickTag('ai-only', 'ai');
    expect(within(stream()).queryByText('Willow Is Live!')).not.toBeInTheDocument();
  });

  it('falls back to All when a tag empties the active pill', () => {
    renderHome(items);
    fireEvent.click(within(pillRow()).getByRole('button', { name: /^Funding/ }));
    expect(streamHeadlines()).toEqual(['Headline ai-robotics']);

    clickTag('ai-robotics', 'robotics');
    clickTag('ai-robotics', 'robotics'); // off again: no change in Funding's count
    clickTag('ai-robotics', 'ai');
    expect(streamHeadlines()).toEqual(['Headline ai-robotics']);
    // Narrow to storage: no Funding story carries ai + storage, so the pill goes and the stream shows All.
    fireEvent.click(within(scopeRow()).getByRole('button', { name: 'Also filter by #storage' }));
    expect(within(pillRow()).queryByRole('button', { name: /^Funding/ })).not.toBeInTheDocument();
    expect(streamHeadlines()).toEqual(['Headline ai-storage']);
  });

  it("Follow adds the tag to the member's News preferences tags", () => {
    renderHome(items);
    clickTag('ai-only', 'ai');

    fireEvent.click(within(scopeRow()).getByRole('button', { name: 'Follow #ai' }));
    expect(mockSetNewsTags).toHaveBeenCalledWith(['storage', 'ai'], expect.any(Object));
    expect(within(scopeRow()).getByRole('button', { name: 'Following #ai' })).toBeInTheDocument();
  });

  it('has no Follow with News preferences off, and still shows the tags', () => {
    mockShowNewsPreferences = false;
    mockTopicSlugs = null;
    renderHome(items);
    clickTag('ai-only', 'ai');

    expect(within(scopeRow()).queryByRole('button', { name: /Follow/ })).not.toBeInTheDocument();
  });
});

describe('Network Updates: the cut', () => {
  const many = Array.from({ length: 8 }, (_, i) =>
    story(`s${i}`, 'LAUNCH', { eventDate: `2026-11-0${9 - i}T12:00:00.000Z` }),
  );
  let resizeCallbacks: Array<() => void> = [];
  let mutationCallbacks: Array<() => void> = [];
  let wide = true;
  let railBottom = 650;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    resizeCallbacks = [];
    mutationCallbacks = [];
    railBottom = 650;
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(cb: () => void) {
        resizeCallbacks.push(cb);
      }
      observe() {}
      disconnect() {}
    };
    (global as unknown as { MutationObserver: unknown }).MutationObserver = class {
      constructor(cb: () => void) {
        mutationCallbacks.push(cb);
      }
      observe() {}
      disconnect() {}
    };
    window.matchMedia = ((query: string) => ({
      matches: wide && query === '(min-width: 960px)',
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    })) as never;
    // Each card is 200px tall, stacked with 20px gaps; the rail ends 650px below the list's top.
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200);
    jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
      return Array.from(this.parentElement?.children ?? []).indexOf(this) * 220;
    });
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const bottom = this.tagName === 'ASIDE' ? railBottom : 0;
      return { top: 0, bottom } as DOMRect;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
    delete (global as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    delete (global as unknown as { MutationObserver?: unknown }).MutationObserver;
  });

  const measure = () => act(() => resizeCallbacks.forEach((cb) => cb()));
  const cards = () => Array.from(stream().children) as HTMLElement[];

  it('beside the rail, keeps the cards that end above the rail whole and cuts the list at its end', () => {
    wide = true;
    renderHome(many);
    measure();

    // The rail ends at 650px, which fits three cards. The floor is four. The fifth starts at 880, so the clip is 904.
    expect(cards().filter((c) => !c.hasAttribute('inert'))).toHaveLength(4);
    expect(cards()[4]).toHaveAttribute('inert');
    expect(cards()[4]).toHaveAttribute('aria-hidden', 'true');
    expect(stream()).toHaveStyle({ maxHeight: '904px' });
  });

  it('stacked on a phone, shows three cards and 140px of the fourth', () => {
    wide = false;
    renderHome(many);
    measure();

    expect(cards().filter((c) => !c.hasAttribute('inert'))).toHaveLength(3);
    expect(stream()).toHaveStyle({ maxHeight: `${3 * 220 + 140}px` });
  });

  it('measures again when the sidebar gains a section after the first cut', () => {
    wide = true;
    const view = renderHome(many);
    measure();
    expect(cards().filter((c) => !c.hasAttribute('inert'))).toHaveLength(4);

    railBottom = 1400;
    mockDeals = { deals: [deal('d1', '2026-11-01', '12 mo free')], total: 10 };
    const queryClient = new QueryClient();
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <SignedInHome
          feed={{ groups: groupsOf(many), forYouTeamUids: [], popularItems: [] }}
          roles={ROLES}
          events={EVENTS}
          portfolio={[]}
        />
      </QueryClientProvider>,
    );

    expect(cards().filter((c) => !c.hasAttribute('inert')).length).toBeGreaterThan(4);
    expect(stream()).toHaveStyle({ maxHeight: '1400px' });
  });

  it('grows the cut when the sidebar content is taller than its box', () => {
    wide = true;
    jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'ASIDE' ? 1200 : 0;
    });
    renderHome(many);
    act(() => mutationCallbacks.forEach((cb) => cb()));

    // Bottoms at 200, 420, 640, 860, 1080 fit under 1200. The box alone (650) would have kept three.
    expect(cards().filter((c) => !c.hasAttribute('inert'))).toHaveLength(5);
    expect(stream()).toHaveStyle({ maxHeight: '1200px' });
  });

  it('does not cut a stream that ends before the rail', () => {
    wide = true;
    renderHome(many.slice(0, 2));
    measure();

    expect(cards().some((c) => c.hasAttribute('inert'))).toBe(false);
    expect(stream().style.maxHeight).toBe('');
    expect(screen.queryByText('Other news')).not.toBeInTheDocument();
  });

  const onDate = (uid: string, eventType: TeamNewsEventType, day: number, teamUid: string, rank?: number) =>
    story(uid, eventType, {
      teamUid,
      editorialRank: rank,
      eventDate: `2026-11-${String(day).padStart(2, '0')}T12:00:00.000Z`,
    });

  it('keeps a short For You list first, then Other news, and cuts the column at the rail', () => {
    wide = true;
    renderHome(
      [
        onDate('fy1', 'LAUNCH', 9, 't1'),
        onDate('fy2', 'FUNDING', 8, 't2'),
        onDate('fy1-old', 'LAUNCH', 1, 't1'),
        onDate('o0', 'LAUNCH', 7, 'o0'),
        onDate('o1', 'FUNDING', 6, 'o1'),
        onDate('o2', 'LAUNCH', 5, 'o2'),
        onDate('o3', 'ANNOUNCEMENT', 4, 'o3'),
        onDate('o4', 'LAUNCH', 3, 'o4'),
      ],
      { forYouTeamUids: ['t1', 't2'] },
    );
    measure();

    expect(within(pillRow()).getByRole('button', { name: /^For You/ })).toHaveAttribute('aria-pressed', 'true');
    const headlines = streamHeadlines();
    expect(headlines.slice(0, 2)).toEqual(['Headline fy1', 'Headline fy2']);
    expect(headlines.filter((title) => title === 'Headline fy1')).toHaveLength(1);
    expect(headlines).toContain('Headline fy1-old');
    expect(headlines).toContain('Headline o0');
    const divider = screen.getByText('Other news');
    const second = within(stream()).getByRole('heading', { name: 'Headline fy2' });
    const firstOther = within(stream()).getByRole('heading', { name: 'Headline o0' });
    expect(second.compareDocumentPosition(divider) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(divider.compareDocumentPosition(firstOther) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cards().filter((c) => c.hasAttribute('data-feed-card') && !c.hasAttribute('inert'))).toHaveLength(4);
    expect(stream().style.maxHeight).not.toBe('');
  });

  it('fills a short Top list the same way, without repeating the top story', () => {
    wide = true;
    renderHome([
      onDate('top', 'LAUNCH', 9, 'top-team', 1),
      onDate('o0', 'FUNDING', 8, 'o0'),
      onDate('o1', 'FUNDING', 7, 'o1'),
      onDate('o2', 'FUNDING', 6, 'o2'),
      onDate('o3', 'FUNDING', 5, 'o3'),
      onDate('o4', 'FUNDING', 4, 'o4'),
      onDate('o5', 'FUNDING', 3, 'o5'),
    ]);
    fireEvent.click(within(pillRow()).getByRole('button', { name: /^Top/ }));
    measure();

    const headlines = streamHeadlines();
    expect(headlines[0]).toBe('Headline top');
    expect(headlines.filter((title) => title === 'Headline top')).toHaveLength(1);
    expect(screen.getByText('Other news')).toBeInTheDocument();
    expect(cards().filter((c) => c.hasAttribute('data-feed-card') && !c.hasAttribute('inert'))).toHaveLength(4);
    expect(stream().style.maxHeight).not.toBe('');
  });

  it('does not add Other news when the tab already reaches the rail', () => {
    wide = true;
    const forYou = Array.from({ length: 8 }, (_, i) => onDate(`s${i}`, 'LAUNCH', 20 - i, `t${i}`));
    renderHome([...forYou, onDate('extra', 'FUNDING', 1, 'extra')], {
      forYouTeamUids: forYou.map((item) => item.teamUid),
    });
    measure();

    expect(within(pillRow()).getByRole('button', { name: /^For You/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Other news')).not.toBeInTheDocument();
    expect(cards().filter((c) => !c.hasAttribute('inert'))).toHaveLength(4);
    expect(stream()).toHaveStyle({ maxHeight: '904px' });
  });

  it(`mounts at most ${STREAM_RENDER_MAX} cards`, () => {
    renderHome(Array.from({ length: STREAM_RENDER_MAX + 5 }, (_, i) => story(`m${i}`, 'LAUNCH')));
    expect(cards()).toHaveLength(STREAM_RENDER_MAX);
  });
});

// LAB-3174 item 6 (Polina, 2026-11-06): under the focus areas, a full-width white band with the portfolio map, the PL
// entities and the investor logo wall, as on the signed-out page.
describe('The network overview under the focus areas', () => {
  it('shows the portfolio, the entities and the investor wall, in that order, after Browse by focus area', () => {
    const portfolio = PORTFOLIO_FALLBACK.slice(0, 12).map((row) => ({ ...row, source: 'fallback' as const }));
    renderHome([story('a', 'LAUNCH')], { portfolio });

    const order = [
      screen.getByRole('heading', { name: 'Browse by focus area' }),
      screen.getByRole('heading', { name: 'Protocol Labs portfolio' }),
      screen.getByRole('heading', { name: 'Protocol Labs entities' }),
      screen.getByRole('heading', { name: /raised from top VCs/ }),
    ];
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.getByText('12 teams across four focus areas, with Protocol Labs at the centre.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show the whole map' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'A16zcrypto (opens in a new tab)' })).toHaveAttribute(
      'href',
      'https://a16zcrypto.com',
    );
  });
});

describe('The signed-in rail', () => {
  const sectionNames = () =>
    Array.from(document.querySelector('aside')!.firstElementChild!.children).map(
      (el) => el.getAttribute('aria-label') ?? el.querySelector('h2')?.textContent,
    );

  it('orders roles, events, Teams to follow, deals and Popular this week', () => {
    mockUseSuggestedTeamsToFollow.mockReturnValue({ suggestions: SUGGESTED, isLoading: false });
    mockDeals = { deals: [deal('d1', '2026-11-01', '12 mo free')], total: 38 };
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SignedInHome
          feed={{
            groups: groupsOf([story('a', 'LAUNCH')]),
            popularItems: [
              { uid: 'p1', title: 'Popular one', teamUid: 't', teamName: 'T', sourceUrl: 'https://x', upvoteCount: 3 },
            ],
          }}
          roles={ROLES}
          events={EVENTS}
          portfolio={[]}
        />
      </QueryClientProvider>,
    );

    expect(sectionNames()).toEqual([
      'Open roles in the network',
      'Upcoming events',
      'Teams to follow',
      'New deals for your team',
      'Popular this week',
    ]);
    // No sign-up note under the roles.
    expect(screen.queryByText(/to apply with your directory profile/)).not.toBeInTheDocument();
  });

  it('has no deals section without deals access', () => {
    mockDeals = null;
    renderHome([story('a', 'LAUNCH')]);

    expect(screen.queryByText('Portfolio perks')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /See all \d+ deals/ })).not.toBeInTheDocument();
  });

  it('shows a value pill only for a deal with an offer value, and records the 1-based position on open', () => {
    mockDeals = {
      deals: [deal('d1', '2026-11-03', '12 mo free'), deal('d2', '2026-11-02', null), deal('d3', '2026-11-01')],
      total: 38,
    };
    renderHome([story('a', 'LAUNCH')]);

    const rows = within(screen.getByRole('region', { name: 'New deals for your team' })).getAllByRole('listitem');
    expect(within(rows[0]).getByText('12 mo free')).toBeInTheDocument();
    expect(rows[1].querySelector('[class*="dealValue"]')).toBeNull();
    expect(rows[2].querySelector('[class*="dealValue"]')).toBeNull();
    expect(screen.getByText('Portfolio perks')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all 38 deals' })).toHaveAttribute('href', '/deals');

    fireEvent.click(within(rows[1]).getByRole('link'));
    expect(mockHomeAnalytics.onDealClicked).toHaveBeenCalledWith({ deal_uid: 'd2', position: 2 });
    expect(within(rows[1]).getByRole('link')).toHaveAttribute('href', '/deals/d2');
    // A long name is clamped to two lines in CSS; the full name stays readable on hover.
    expect(within(rows[0]).getByText('Vendor d1')).toHaveAttribute('title', 'Vendor d1');
  });

  it('records the shared home-* events, as signed in', () => {
    renderHome([story('a', 'LAUNCH')]);

    fireEvent.click(screen.getByRole('link', { name: 'Protocol Engineer' }));
    expect(mockHomeAnalytics.onRoleClicked).toHaveBeenCalledWith({ team_uid: 't1', position: 1, signed_in: true });
    fireEvent.click(screen.getByRole('link', { name: 'Founders Dinner' }));
    expect(mockHomeAnalytics.onEventClicked).toHaveBeenCalledWith({ event_uid: 'e1', position: 1, signed_in: true });
    fireEvent.click(screen.getByRole('link', { name: 'See all news' }));
    expect(mockHomeAnalytics.onSeeAllClicked).toHaveBeenCalledWith({ section: 'news' });
  });

  it('follows a suggested team from the rail as the news rail does', () => {
    mockUseSuggestedTeamsToFollow.mockReturnValue({ suggestions: SUGGESTED, isLoading: false });
    renderHome([story('a', 'LAUNCH')]);

    fireEvent.click(screen.getByRole('button', { name: 'Follow Suggested One' }));
    expect(mockFollowMutate).toHaveBeenCalledWith({ teamUid: 'st-1', action: 'follow' }, expect.any(Object));
  });

  // LAB-3185: following was one-way (the button disabled itself), so a team followed by mistake could only be
  // unfollowed from its own page. Following → Follow now, as on the news cards.
  it('unfollows a team just followed from the rail, with the same button', () => {
    mockUseSuggestedTeamsToFollow.mockReturnValue({ suggestions: SUGGESTED, isLoading: false });
    renderHome([story('a', 'LAUNCH')]);

    fireEvent.click(screen.getByRole('button', { name: 'Follow Suggested One' }));
    const following = screen.getByRole('button', { name: 'Following Suggested One' });
    expect(following).toBeEnabled();

    fireEvent.click(following);
    expect(mockFollowMutate).toHaveBeenLastCalledWith({ teamUid: 'st-1', action: 'unfollow' }, expect.any(Object));
    expect(screen.getByRole('button', { name: 'Follow Suggested One' })).toBeInTheDocument();
  });

  it('opens a Popular this week story in its dialog', () => {
    const queryClient = new QueryClient();
    const item = story('pop', 'LAUNCH');
    render(
      <QueryClientProvider client={queryClient}>
        <SignedInHome
          feed={{
            groups: groupsOf([item]),
            popularItems: [
              {
                uid: 'pop',
                title: 'Headline pop',
                teamUid: 't',
                teamName: 'T',
                sourceUrl: 'https://x',
                upvoteCount: 3,
              },
            ],
          }}
          roles={null}
          events={null}
          portfolio={[]}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(within(screen.getByRole('region', { name: 'Popular this week' })).getByRole('button'));
    expect(window.location.search).toBe('?news=pop');
  });

  it('shows the focus-area cards under the feed, with no Projects link for an area with no projects', () => {
    renderHome([], {
      projectFocusAreaCounts: {
        'Digital Human Rights': 42,
        'Economies & Governance': 8,
        'AI & Robotics': 2,
        Neurotech: 0,
      },
    });

    const cards = within(screen.getByRole('list', { name: 'Browse the directory by focus area' })).getAllByRole(
      'listitem',
    );
    expect(cards).toHaveLength(4);
    const neuro = cards.find((c) => within(c).queryByRole('heading', { name: 'Neurotechnology' }))!;
    expect(within(neuro).queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
    expect(within(neuro).getByRole('link', { name: 'Teams' })).toHaveAttribute('href', '/teams?focusAreas=Neurotech');
  });
});
