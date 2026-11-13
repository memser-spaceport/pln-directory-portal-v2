import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { NewsPage } from '@/components/page/home/HomeV2/NewsPage';
import { useCurrentUserStore } from '@/services/auth/store';
import type { IFeedForumPost } from '@/types/feed.types';
import type { ITeamNewsGroup, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

// ---- The feed's data hooks (as signed-in-home.test.tsx mocks them) ----

type FeedSocialResult = {
  forumPosts: IFeedForumPost[] | undefined;
  unwindowedForumPosts: IFeedForumPost[] | undefined;
  hasAccess: boolean;
  deepLinkSettled: boolean;
};
const mockUseFeedSocial = jest.fn(
  (): FeedSocialResult => ({
    forumPosts: undefined,
    unwindowedForumPosts: undefined,
    hasAccess: false,
    deepLinkSettled: true,
  }),
);
jest.mock('@/components/page/home/TeamNews/hooks/useFeedSocial', () => ({
  useFeedSocial: (...a: unknown[]) => mockUseFeedSocial(...(a as [])),
}));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedHiring', () => ({
  useFeedHiring: () => ({ hiring: undefined }),
}));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedDeals', () => ({ useFeedDeals: () => ({ deals: undefined }) }));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedForYouJobs', () => ({
  useFeedForYouJobs: () => ({ forYouJobs: undefined }),
}));
jest.mock('@/services/follow/hooks/useSuggestedTeamsToFollow', () => ({
  useSuggestedTeamsToFollow: () => ({ suggestions: [], isLoading: false }),
}));
const mockUpvoteMutate = jest.fn();
jest.mock('@/services/team-news/hooks/useTeamNewsUpvoteToggle', () => ({
  useTeamNewsUpvoteToggle: () => ({ mutate: (...a: unknown[]) => mockUpvoteMutate(...a) }),
}));
const mockFollowMutate = jest.fn();
jest.mock('@/services/follow/hooks/useFollowTeam', () => ({
  useFollowTeam: () => ({ mutate: (...a: unknown[]) => mockFollowMutate(...a) }),
}));
jest.mock('@/services/team-news/hooks/useNewsTopicSlugs', () => ({
  useNewsTopicSlugs: () => new Set(['ai', 'robotics', 'storage']),
}));

// ---- Doors and analytics ----

const mockSignUp = jest.fn();
const mockRecordSignUpHere = jest.fn();
jest.mock('@/components/page/home/HomeV2/useHomeAuthDoors', () => ({
  useHomeAuthDoors: () => ({
    signUp: (...a: unknown[]) => mockSignUp(...a),
    recordSignUpHere: (...a: unknown[]) => mockRecordSignUpHere(...a),
    signIn: jest.fn(),
  }),
}));
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/analytics/home.analytics', () => ({
  useHomeAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
const mockGoToTop = jest.fn();
jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: () => ({ goToTopBtnClicked: (...a: unknown[]) => mockGoToTop(...a) }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
// The sign-up form itself, stubbed: what matters here is when the page mounts it.
jest.mock('@/components/page/sign-up/components/SignupWizard', () => ({
  SignupWizard: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Join the PL Network">
      <button type="button" onClick={onClose}>
        Close sign-up
      </button>
    </div>
  ),
}));
const mockRouterPush = jest.fn();
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

const forumPost = {
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
} as IFeedForumPost;

function renderPage(
  items: ITeamNewsItem[],
  { signedIn = true, forYouTeamUids = [], unavailable = false } = {} as {
    signedIn?: boolean;
    forYouTeamUids?: string[];
    unavailable?: boolean;
  },
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NewsPage
        feed={{ groups: groupsOf(items), forYouTeamUids, popularItems: [] }}
        signedIn={signedIn}
        unavailable={unavailable}
      />
    </QueryClientProvider>,
  );
}

const grid = () => document.querySelector('[data-news-feed-root]') as HTMLElement;
const headlines = () => Array.from(grid().querySelectorAll('[data-story-uid] h3')).map((h) => h.textContent);
const pillRow = () => document.querySelector('.catRow') as HTMLElement;
const pillNames = () =>
  within(pillRow())
    .getAllByRole('button')
    .map((b) => b.textContent);
const scopeRow = () => screen.getByText('Filter:').parentElement as HTMLElement;
const card = (title: string) =>
  within(grid()).getByRole('heading', { name: title }).closest('[data-story-uid]') as HTMLElement;

/** Types into the phones' search field (both fields share the query) and lets its debounce run. */
const search = (value: string) => {
  jest.useFakeTimers();
  const field = document.querySelector('[class*="mobileSearchRow"] input') as HTMLInputElement;
  fireEvent.change(field, { target: { value } });
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
};

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
  mockUseFeedSocial.mockReturnValue({
    forumPosts: undefined,
    unwindowedForumPosts: undefined,
    hasAccess: false,
    deepLinkSettled: true,
  });
  useCurrentUserStore.setState({ currentUser: { uid: 'user-1' } as never, isHydrated: true });
  window.history.replaceState(null, '', '/?view=news');
});

afterEach(() => {
  useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
});

describe('News page: head and grid', () => {
  it('shows the head and only news, even for a member with forum posts', () => {
    mockUseFeedSocial.mockReturnValue({
      forumPosts: [forumPost],
      unwindowedForumPosts: [forumPost],
      hasAccess: true,
      deepLinkSettled: true,
    });
    renderPage([story('a', 'LAUNCH'), story('b', 'FUNDING')]);

    expect(screen.getByRole('heading', { level: 1, name: 'Network news' })).toBeInTheDocument();
    expect(screen.getByText('2 stories from network teams')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(headlines()).toEqual(['Headline a', 'Headline b']);
    expect(screen.queryByText('Willow Is Live!')).not.toBeInTheDocument();
    expect(within(pillRow()).queryByRole('button', { name: /Discussions/ })).not.toBeInTheDocument();
  });

  it("puts a story's image on its card at full width, and leaves a story without one text only", () => {
    const IMAGE = 'https://cdn.example.com/a.jpg';
    renderPage([story('a', 'LAUNCH', { imageUrl: IMAGE }), story('b', 'FUNDING')]);

    expect(card('Headline a').querySelector('.wide img')).toHaveAttribute('src', IMAGE);
    expect(card('Headline b').querySelector('img')).not.toBeInTheDocument();
  });

  it('opens on All, even when For You has stories', () => {
    renderPage([story('mine', 'LAUNCH', { teamUid: 'my-team' }), story('other', 'FUNDING')], {
      forYouTeamUids: ['my-team'],
    });

    expect(pillNames()).toEqual(['For You1', 'All', 'Funding1', 'Launch1']);
    expect(within(pillRow()).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(headlines()).toHaveLength(2);
  });

  it('says so when the news call failed', () => {
    renderPage([], { unavailable: true });

    expect(screen.getByText(/isn’t available right now/)).toBeInTheDocument();
    expect(document.querySelector('.catRow')).not.toBeInTheDocument();
  });
});

// LAB-3174 (prototype 2026-11-06): signed out there is nothing of the visitor to pick from, so no For You pill; the
// For You note becomes the offer, and "Personalize my news" opens the sign-up modal over the page.
describe('News page: Personalize my news (LAB-3174)', () => {
  it('offers it to a signed-out visitor, with no For You pill, and opens sign-up here', async () => {
    renderPage([story('a', 'FUNDING'), story('b', 'LAUNCH')], { signedIn: false, forYouTeamUids: ['team-a'] });

    expect(
      screen.getByText(/Sign up to see news picked for your skills, your team, and the teams you follow\./),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^For You/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Personalize my news' }));
    expect(mockRecordSignUpHere).toHaveBeenCalledWith('personalize');
    expect(mockSignUp).not.toHaveBeenCalled();
    // In place: the form mounts over the page, with no navigation (two server round trips and a fade glitched it).
    const form = await screen.findByRole('dialog', { name: 'Join the PL Network' });
    expect(mockRouterPush).not.toHaveBeenCalled();

    fireEvent.click(within(form).getByRole('button', { name: 'Close sign-up' }));
    expect(screen.queryByRole('dialog', { name: 'Join the PL Network' })).not.toBeInTheDocument();
  });

  it('does not offer it to a member', () => {
    renderPage([story('a', 'FUNDING')], { signedIn: true });

    expect(screen.queryByRole('button', { name: 'Personalize my news' })).not.toBeInTheDocument();
  });
});

describe('News page: back to top (LAB-3164)', () => {
  it('offers Back to top once the reader is a screen down, and reports it as the news page', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: jest.fn() });
    renderPage([story('a', 'FUNDING')]);
    const backToTop = document.querySelector('button[aria-label="Back to top"]')!;
    expect(backToTop).toHaveAttribute('aria-hidden', 'true');

    document.body.scrollTop = window.innerHeight * 3;
    fireEvent.scroll(document.body);
    expect(backToTop).not.toHaveAttribute('aria-hidden');

    fireEvent.click(backToTop);
    expect(mockGoToTop).toHaveBeenCalledWith(null, 'Home news');
    document.body.scrollTop = 0;
  });
});

describe('News page: filters', () => {
  it('filters by pill, and a second press on the active pill goes back to All', () => {
    renderPage([story('f', 'FUNDING'), story('l', 'LAUNCH')]);

    const funding = within(pillRow()).getByRole('button', { name: /Funding/ });
    fireEvent.click(funding);
    expect(headlines()).toEqual(['Headline f']);

    fireEvent.click(funding);
    expect(headlines()).toHaveLength(2);
    expect(within(pillRow()).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('matches a #tag search, the pill counts follow it, and a miss offers Clear search', () => {
    renderPage([
      story('tagged', 'LAUNCH', { tags: ['ai'] }),
      story('other', 'FUNDING', { tags: ['storage'] }),
      story('also', 'LAUNCH', { tags: ['storage'] }),
    ]);

    search('#ai');
    expect(headlines()).toEqual(['Headline tagged']);
    expect(pillNames()).toEqual(['All', 'Launch1']);

    search('nothing like this');
    expect(screen.getByText(/No stories match “nothing like this”/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(headlines()).toHaveLength(3);
  });

  it('stacks hashtags: a story must carry every one, with a chip each in the scope row', () => {
    renderPage([
      story('ai-only', 'LAUNCH', { tags: ['ai'] }),
      story('ai-robotics', 'FUNDING', { tags: ['ai', 'robotics'] }),
    ]);

    fireEvent.click(within(card('Headline ai-only')).getByRole('button', { name: 'Show only #ai updates' }));
    expect(headlines()).toEqual(['Headline ai-only', 'Headline ai-robotics']);

    fireEvent.click(within(card('Headline ai-robotics')).getByRole('button', { name: 'Also filter by #robotics' }));
    expect(headlines()).toEqual(['Headline ai-robotics']);
    expect(within(scopeRow()).getByText('#ai')).toBeInTheDocument();
    expect(within(scopeRow()).getByText('#robotics')).toBeInTheDocument();
    expect(within(scopeRow()).getByText('1 story')).toBeInTheDocument();

    fireEvent.click(within(scopeRow()).getByRole('button', { name: 'Clear all' }));
    expect(headlines()).toHaveLength(2);
  });
});

describe('News page: signed out', () => {
  beforeEach(() => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
  });

  it('asks for an account on Follow, opens Join the network on Like, and has no For You', () => {
    renderPage([story('a', 'LAUNCH')], { signedIn: false });

    expect(within(pillRow()).queryByRole('button', { name: /For You/ })).not.toBeInTheDocument();

    fireEvent.click(within(card('Headline a')).getByRole('button', { name: 'Follow Team a' }));
    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockSignUp).toHaveBeenCalledWith('news');

    fireEvent.click(within(card('Headline a')).getByRole('button', { name: /^Like/ }));

    expect(screen.getByRole('dialog', { name: 'Join the network' })).toBeInTheDocument();
    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockFollowMutate).not.toHaveBeenCalled();
    expect(mockUpvoteMutate).not.toHaveBeenCalled();
  });

  it('still opens the story', () => {
    renderPage([story('a', 'LAUNCH')], { signedIn: false });

    fireEvent.click(card('Headline a'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
