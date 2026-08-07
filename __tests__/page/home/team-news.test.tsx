import '@testing-library/jest-dom';
import type { ReactElement } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TeamNews } from '@/components/page/home/TeamNews/TeamNews';
import { SHOW_POPULAR_THIS_WEEK } from '@/components/page/home/TeamNews/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import type { IFeedForumPost } from '@/types/feed.types';
import type { IDeal } from '@/types/deals.types';
import type { IJobTeamGroup } from '@/types/jobs.types';
import type {
  ITeamNewsDiscussion,
  ITeamNewsGroup,
  ITeamNewsItem,
  ITeamNewsPopularItem,
  TeamNewsEventType,
} from '@/types/team-news.types';

// TeamNews renders NewsRail, which calls the real useQueryClient() for the
// digest-subscribe mutation (only useQuery/useMutation are globally mocked in
// jest.setup.js) — needs a real provider in the tree.
function renderTeamNews(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// The mobile "Type:" dropdown's trigger shows the active category's label,
// which for the default (All categories) is byte-identical to the desktop
// pill's own text — jsdom doesn't evaluate the media query that hides one of
// them, so both are in the DOM at once and a bare name-based query is
// ambiguous. Scope to the pill row (`.catRow`) for anything that queries by
// category label; the dropdown has its own dedicated tests.
function catRow(): HTMLElement {
  return document.querySelector('.catRow') as HTMLElement;
}

/** Default sort is Most popular — switch to Following when a test needs followed-first order. */
function selectFollowingSort() {
  fireEvent.click(screen.getByRole('button', { name: 'Most popular' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Following' }));
}

const mockOnTabClicked = jest.fn();
const mockOnCategoryClicked = jest.fn();
const mockOnLoadMoreClicked = jest.fn();
const mockOnCardClicked = jest.fn();
const mockOnTeamNewsSearch = jest.fn();
const mockOnUpvoteToggled = jest.fn();
const mockOnUpvoteFailed = jest.fn();
const mockOnForumLikeToggled = jest.fn();
const mockOnForumLikeFailed = jest.fn();
const mockOnPopularCardViewed = jest.fn();
const mockOnScrollSucceeded = jest.fn();
const mockOnFallbackOpened = jest.fn();
const mockOnTeamsToFollowViewed = jest.fn();
const mockOnTeamsToFollowHidden = jest.fn();
const mockOnPopularStoryClicked = jest.fn();
const mockOnDetailModalOpened = jest.fn();
const mockOnShared = jest.fn();
const mockOnForumPostModalOpened = jest.fn();
const mockOnTopStoriesBlockViewed = jest.fn();
const mockOnTopStoryClicked = jest.fn();
const mockOnFeedHiringRoleClicked = jest.fn();
const mockOnFeedHiringViewAllClicked = jest.fn();
const mockOnFeedDealClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsTabClicked: (...a: unknown[]) => mockOnTabClicked(...a),
    onTeamNewsCategoryClicked: (...a: unknown[]) => mockOnCategoryClicked(...a),
    onTeamNewsLoadMoreClicked: (...a: unknown[]) => mockOnLoadMoreClicked(...a),
    onTeamNewsCardClicked: (...a: unknown[]) => mockOnCardClicked(...a),
    onTeamNewsSearch: (...a: unknown[]) => mockOnTeamNewsSearch(...a),
    onTeamNewsUpvoteToggled: (...a: unknown[]) => mockOnUpvoteToggled(...a),
    onTeamNewsPopularStoryClicked: (...a: unknown[]) => mockOnPopularStoryClicked(...a),
    onTeamNewsDetailModalOpened: (...a: unknown[]) => mockOnDetailModalOpened(...a),
    onTeamNewsShared: (...a: unknown[]) => mockOnShared(...a),
    onTeamNewsSortChanged: jest.fn(),
    onTeamNewsUpvoteFailed: (...a: unknown[]) => mockOnUpvoteFailed(...a),
    onFeedForumPostLikeToggled: (...a: unknown[]) => mockOnForumLikeToggled(...a),
    onFeedForumPostLikeFailed: (...a: unknown[]) => mockOnForumLikeFailed(...a),
    onFeedForumPostModalOpened: (...a: unknown[]) => mockOnForumPostModalOpened(...a),
    onPopularCardViewed: (...a: unknown[]) => mockOnPopularCardViewed(...a),
    onPopularStoryScrollSucceeded: (...a: unknown[]) => mockOnScrollSucceeded(...a),
    onPopularStoryFallbackOpened: (...a: unknown[]) => mockOnFallbackOpened(...a),
    onTeamsToFollowViewed: (...a: unknown[]) => mockOnTeamsToFollowViewed(...a),
    onTeamsToFollowHidden: (...a: unknown[]) => mockOnTeamsToFollowHidden(...a),
    onTopStoriesBlockViewed: (...a: unknown[]) => mockOnTopStoriesBlockViewed(...a),
    onTopStoryClicked: (...a: unknown[]) => mockOnTopStoryClicked(...a),
    onFeedHiringRoleClicked: (...a: unknown[]) => mockOnFeedHiringRoleClicked(...a),
    onFeedHiringViewAllClicked: (...a: unknown[]) => mockOnFeedHiringViewAllClicked(...a),
    onFeedDealClicked: (...a: unknown[]) => mockOnFeedDealClicked(...a),
  }),
}));

// Forum posts reach the feed through this hook. Default: none, which is what the
// globally-mocked useQuery already produced — so every other test in this file
// behaves exactly as before.
type FeedSocialResult = {
  forumPosts: IFeedForumPost[] | undefined;
  unwindowedForumPosts: IFeedForumPost[] | undefined;
  hasAccess: boolean;
  deepLinkSettled: boolean;
};
/** The ordinary case: every post is inside the 14-day window, so both arrays
 *  agree. Tests that care about the window pass the two separately. */
function feedSocial(posts: IFeedForumPost[] | undefined, hasAccess: boolean): FeedSocialResult {
  return { forumPosts: posts, unwindowedForumPosts: posts, hasAccess, deepLinkSettled: true };
}
const mockUseFeedSocial = jest.fn((): FeedSocialResult => feedSocial(undefined, false));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedSocial', () => ({
  useFeedSocial: (...a: unknown[]) => mockUseFeedSocial(...(a as [])),
}));

// Hiring roll-ups and deals reach the feed through these two. Default: neither
// loaded, which is what the globally-mocked useQuery already produced — so every
// other test in this file behaves exactly as before.
const mockUseFeedHiring = jest.fn((): { hiring: IJobTeamGroup[] | undefined } => ({ hiring: undefined }));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedHiring', () => ({
  useFeedHiring: () => mockUseFeedHiring(),
}));
const mockUseIsBelowDesktop = jest.fn(() => false);
jest.mock('@/hooks/useIsBelowDesktop', () => ({
  useIsBelowDesktop: () => mockUseIsBelowDesktop(),
}));
const mockUseFeedDeals = jest.fn((): { deals: IDeal[] | undefined } => ({ deals: undefined }));
jest.mock('@/components/page/home/TeamNews/hooks/useFeedDeals', () => ({
  useFeedDeals: () => mockUseFeedDeals(),
}));

// The global jest.setup.js mock returns a NEW object with fresh jest.fn()s on
// every useRouter() call — it records nothing across renders. This file needs
// stable spies (the anon #login push) and a useSearchParams that reflects the
// real jsdom URL, because useNewsDeepLink writes via window.history.replaceState
// and reads the params back (Next syncs the two in production).
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: (...a: unknown[]) => mockRouterPush(...a), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/home',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '2d ago',
}));

// TeamNews.tsx calls this directly to feed NewsRail's Teams-to-follow card; the
// global useQuery mock in jest.setup.js returns a fixed non-array `data`, which
// this hook's own array `.filter()` would choke on — mock the hook itself instead,
// matching the pattern news-rail.test.tsx already uses for its other query hooks.
const mockUseSuggestedTeamsToFollow = jest.fn();
jest.mock('@/services/follow/hooks/useSuggestedTeamsToFollow', () => ({
  useSuggestedTeamsToFollow: (...a: unknown[]) => mockUseSuggestedTeamsToFollow(...a),
}));

// The globally mocked useMutation (jest.setup.js) returns a bare jest.fn() that
// never invokes onSuccess/onError — fine for tests only asserting the optimistic
// overlay update, but the analytics-on-success test below needs to trigger that
// callback manually, so this hook is mocked directly instead (same pattern as
// useSuggestedTeamsToFollow above).
const mockUpvoteMutate = jest.fn();
jest.mock('@/services/team-news/hooks/useTeamNewsUpvoteToggle', () => ({
  useTeamNewsUpvoteToggle: () => ({ mutate: (...a: unknown[]) => mockUpvoteMutate(...a) }),
}));

// Same reason as above: the follow tests need to simulate the mutation outcome
// (in particular the null-on-HTTP-failure contract of followTeam/unfollowTeam).
const mockFollowMutate = jest.fn();
jest.mock('@/services/follow/hooks/useFollowTeam', () => ({
  useFollowTeam: () => ({ mutate: (...a: unknown[]) => mockFollowMutate(...a) }),
}));

const FA_AI = { uid: 'fa-ai', title: 'AI & Robotics' };
const FA_DHR = { uid: 'fa-dhr', title: 'Digital Human Rights' };

const makeItem = (
  uid: string,
  eventType: TeamNewsEventType,
  focusAreaTitles: string[],
  discussion: ITeamNewsDiscussion = { count: 0, latestTopicUrl: null },
): ITeamNewsItem => ({
  uid,
  teamUid: `team-${uid}`,
  teamName: `Team ${uid}`,
  teamLogoUrl: null,
  eventType,
  eventDate: '2026-05-01T12:00:00.000Z',
  title: `Headline ${uid}`,
  summary: `Summary ${uid}`,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: focusAreaTitles,
  subFocusAreas: [],
  createdAt: '2026-05-01T12:00:00.000Z',
  discussion,
});

const aiItems: ITeamNewsItem[] = [
  makeItem('ai-1', 'FUNDING', ['AI & Robotics']),
  makeItem('ai-2', 'LAUNCH', ['AI & Robotics']),
  makeItem('ai-3', 'PARTNERSHIP', ['AI & Robotics']),
];
const dhrItems: ITeamNewsItem[] = [
  makeItem('dhr-1', 'MILESTONE', ['Digital Human Rights']),
  makeItem('dhr-2', 'ANNOUNCEMENT', ['Digital Human Rights']),
];

const groups: ITeamNewsGroup[] = [
  { focusArea: FA_AI, total: aiItems.length, items: aiItems },
  { focusArea: FA_DHR, total: dhrItems.length, items: dhrItems },
];

describe('TeamNews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSuggestedTeamsToFollow.mockReturnValue({ suggestions: [], isLoading: false });
    // clearAllMocks clears calls, NOT return values — without this, a describe
    // that supplies forum posts leaks them into every later test's feed.
    mockUseFeedSocial.mockReturnValue(feedSocial(undefined, false));
    mockUseFeedHiring.mockReturnValue({ hiring: undefined });
    mockUseFeedDeals.mockReturnValue({ deals: undefined });
    mockUseIsBelowDesktop.mockReturnValue(false);
    // useNewsDeepLink reads the real jsdom URL on mount — reset it so a
    // ?news= param written by one test can't open the modal in the next.
    window.history.replaceState(null, '', '/home');
  });

  it('renders the global empty state when there are no items', () => {
    renderTeamNews(<TeamNews groups={[]} />);
    expect(screen.getByRole('heading', { level: 2, name: /Network updates/i })).toBeInTheDocument();
    expect(screen.getByText(/No network news in the last 14 days yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('renders the section, tabs with counts, and category chips when populated', () => {
    renderTeamNews(<TeamNews groups={groups} />);
    expect(screen.getByRole('heading', { level: 2, name: /Network updates/i })).toBeInTheDocument();
    expect(screen.getByText('5 new')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /AI & Robotics/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Digital Human Rights/ })).toBeInTheDocument();
    expect(within(catRow()).getByRole('button', { name: /All categories/ })).toHaveClass(/catActive/);
  });

  it('switches to a focus-area tab and reports analytics', () => {
    renderTeamNews(<TeamNews groups={groups} />);
    fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
    expect(mockOnTabClicked).toHaveBeenCalledWith('Digital Human Rights', dhrItems.length);
    expect(screen.getByRole('tab', { name: /Digital Human Rights/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Headline dhr-1/)).toBeInTheDocument();
    expect(screen.queryByText(/Headline ai-1/)).not.toBeInTheDocument();
  });

  it('filters by category and reports analytics with current tab context', () => {
    renderTeamNews(<TeamNews groups={groups} />);
    fireEvent.click(screen.getByRole('button', { name: /Funding/ }));
    expect(mockOnCategoryClicked).toHaveBeenCalledWith('FUNDING', 1, 'All');
    expect(screen.getByText(/Headline ai-1/)).toBeInTheDocument();
    expect(screen.queryByText(/Headline ai-2/)).not.toBeInTheDocument();
  });

  it('disables a category chip when its count is zero (other than the All chip)', () => {
    renderTeamNews(<TeamNews groups={groups} />);
    // Tab to DHR — only MILESTONE + ANNOUNCEMENT items, so FUNDING/LAUNCH/PARTNERSHIP should disable.
    fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
    expect(screen.getByRole('button', { name: /^Funding$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Launch$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Milestone/ })).not.toBeDisabled();
    expect(within(catRow()).getByRole('button', { name: /All categories/ })).not.toBeDisabled();
  });

  it('renders an Other category chip, disabled when no OTHER items exist', () => {
    renderTeamNews(<TeamNews groups={groups} />);
    // Neither fixture group has an OTHER item, so the chip should render but disable like any other zero-count category.
    expect(screen.getByRole('button', { name: /^Other$/ })).toBeDisabled();
  });

  it('enables the Other category chip and filters by it when OTHER items exist', () => {
    const otherItem = makeItem('ai-other', 'OTHER', ['AI & Robotics']);
    const groupsWithOther: ITeamNewsGroup[] = [
      { focusArea: FA_AI, total: aiItems.length + 1, items: [...aiItems, otherItem] },
      { focusArea: FA_DHR, total: dhrItems.length, items: dhrItems },
    ];
    renderTeamNews(<TeamNews groups={groupsWithOther} />);
    expect(screen.getByRole('button', { name: /^Other/ })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /^Other/ }));
    expect(mockOnCategoryClicked).toHaveBeenCalledWith('OTHER', 1, 'All');
    expect(screen.getByText(/Headline ai-other/)).toBeInTheDocument();
    expect(screen.queryByText(/Headline ai-1/)).not.toBeInTheDocument();
  });

  describe('mobile "Type:" category dropdown', () => {
    // jsdom doesn't evaluate the media query that hides this dropdown at
    // desktop widths and the pill row below mobile, so both are always in the
    // DOM in tests — scope to `.typeMobile` the same way category-pill tests
    // scope to `.catRow`.
    const typeDropdown = (): HTMLElement => document.querySelector('.typeMobile') as HTMLElement;

    it('defaults to the plain "All categories" label, with no count', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      expect(within(typeDropdown()).getByRole('button', { name: 'All categories' })).toBeInTheDocument();
    });

    it('omits zero-count categories and folds counts into the label for the rest', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(within(typeDropdown()).getByRole('button', { name: 'All categories' }));

      // aiItems: FUNDING, LAUNCH, PARTNERSHIP (1 each); dhrItems: MILESTONE, ANNOUNCEMENT (1 each).
      expect(screen.getByRole('menuitem', { name: 'Funding (1)' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Milestone (1)' })).toBeInTheDocument();
      // OTHER has zero items in this fixture — dropped, not shown disabled
      // (SortDropdown has no disabled state; see the memo's own comment).
      expect(screen.queryByRole('menuitem', { name: /Other/ })).not.toBeInTheDocument();
    });

    it('filters the feed and reports the same analytics event a pill click would', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(within(typeDropdown()).getByRole('button', { name: 'All categories' }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Funding (1)' }));

      expect(mockOnCategoryClicked).toHaveBeenCalledWith('FUNDING', 1, 'All');
      expect(screen.getByText(/Headline ai-1/)).toBeInTheDocument();
      expect(screen.queryByText(/Headline ai-2/)).not.toBeInTheDocument();
      // The trigger now reflects the selection, count folded in — same label
      // format the menu offered it under.
      expect(within(typeDropdown()).getByRole('button', { name: 'Funding (1)' })).toBeInTheDocument();
    });

    it('stays in sync with the desktop pill row — selecting a pill updates the dropdown label too', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      // The pill's accessible name is "Launch" + its count span concatenated
      // with no separator (e.g. "Launch1") — matching other tests in this file.
      fireEvent.click(within(catRow()).getByRole('button', { name: /^Launch/ }));

      expect(within(typeDropdown()).getByRole('button', { name: 'Launch (1)' })).toBeInTheDocument();
    });
  });

  it('shows all items on Show All click and collapses back on Show Less, reports analytics', () => {
    renderTeamNews(<TeamNews groups={groups} pageSize={2} />);
    // 5 items total, pageSize=2 → first 2 visible
    expect(screen.getByText(/Headline ai-1/)).toBeInTheDocument();
    expect(screen.getByText(/Headline ai-2/)).toBeInTheDocument();
    expect(screen.queryByText(/Headline ai-3/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show All/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show All/i }));
    expect(mockOnLoadMoreClicked).toHaveBeenCalledWith(2, 5, 'home', {
      currentTab: 'All',
      currentCategory: 'all',
    });
    expect(screen.getByText(/Headline ai-3/)).toBeInTheDocument();
    expect(screen.getByText(/Headline dhr-2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show Less/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show Less/i }));
    expect(screen.queryByText(/Headline ai-3/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show All/i })).toBeInTheDocument();
  });

  it('collapses back to pageSize when switching tabs or categories', () => {
    renderTeamNews(<TeamNews groups={groups} pageSize={2} />);
    // Expand all 5 items
    fireEvent.click(screen.getByRole('button', { name: /Show All/i }));
    expect(screen.getByText(/Headline ai-3/)).toBeInTheDocument();

    // Switch tab — should collapse
    fireEvent.click(screen.getByRole('tab', { name: /AI & Robotics/ }));
    expect(screen.queryByText(/Headline ai-3/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show All/i })).toBeInTheDocument();

    // Expand again, then filter by category — should collapse
    fireEvent.click(screen.getByRole('button', { name: /Show All/i }));
    expect(screen.getByText(/Headline ai-3/)).toBeInTheDocument();
    // AI & Robotics has 1 Launch item (ai-2), which is ≤ pageSize — no button after collapse
    fireEvent.click(screen.getByRole('button', { name: /^Launch\b/ }));
    expect(screen.queryByRole('button', { name: /Show All/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Headline ai-2/)).toBeInTheDocument();
  });

  it('renders the per-filter empty state when the active focus area has no items', () => {
    // A group can come back with items: [] in defensive scenarios; switching to it should render the per-filter empty state.
    const mixed: ITeamNewsGroup[] = [
      { focusArea: FA_AI, total: 0, items: [] },
      { focusArea: FA_DHR, total: 1, items: [makeItem('dhr-only', 'MILESTONE', ['Digital Human Rights'])] },
    ];
    renderTeamNews(<TeamNews groups={mixed} />);
    fireEvent.click(screen.getByRole('tab', { name: /AI & Robotics/ }));
    expect(screen.getByText(/No network news in this filter/i)).toBeInTheDocument();
  });

  it('shows g.total in tab badge, not items.length', () => {
    const groupsWithLargerTotal: ITeamNewsGroup[] = [
      { focusArea: FA_AI, total: 99, items: aiItems },
      { focusArea: FA_DHR, total: dhrItems.length, items: dhrItems },
    ];
    renderTeamNews(<TeamNews groups={groupsWithLargerTotal} />);
    const aiTab = screen.getByRole('tab', { name: /AI & Robotics/ });
    expect(within(aiTab).getByText('99')).toBeInTheDocument();
  });

  it('reports analytics when a card is clicked', () => {
    renderTeamNews(<TeamNews groups={groups} />);
    const card = screen.getByText(/Headline ai-1/).closest('[role="button"]');
    expect(card).toBeInTheDocument();
    fireEvent.click(within(card! as HTMLElement).getByText(/Headline ai-1/));
    expect(mockOnCardClicked).toHaveBeenCalledTimes(1);
    const [item, position, source] = mockOnCardClicked.mock.calls[0];
    expect(item.uid).toBe('ai-1');
    expect(typeof position).toBe('number');
    expect(source).toBe('home');
  });

  describe('Discussions category', () => {
    const aiDiscussed = makeItem('ai-discuss', 'FUNDING', ['AI & Robotics'], {
      count: 1,
      latestTopicUrl: '/forum/t/123',
    });
    const aiPlain = makeItem('ai-plain', 'LAUNCH', ['AI & Robotics']);
    const groupsWithDiscussion: ITeamNewsGroup[] = [
      { focusArea: FA_AI, total: 2, items: [aiDiscussed, aiPlain] },
      { focusArea: FA_DHR, total: dhrItems.length, items: dhrItems },
    ];

    it('does not render Discussions when there are no forum posts and no threaded items', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      expect(screen.queryByRole('button', { name: /Discussions/ })).not.toBeInTheDocument();
    });

    it('shows Discussions after All categories when at least one item has a thread', () => {
      renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);
      const chips = within(catRow()).getAllByRole('button', { name: /categories|Discussions|Funding|Launch/i });
      const allCat = within(catRow()).getByRole('button', { name: /All categories/ });
      const discussions = within(catRow()).getByRole('button', { name: /Discussions/ });
      expect(chips.indexOf(discussions)).toBeGreaterThan(chips.indexOf(allCat));
      expect(within(discussions).getByText('1')).toBeInTheDocument();
    });

    it('filters to discussion items and reports analytics', () => {
      renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);
      fireEvent.click(screen.getByRole('button', { name: /Discussions/ }));
      expect(mockOnCategoryClicked).toHaveBeenCalledWith('discussions', 1, 'All');
      expect(screen.getByText(/Headline ai-discuss/)).toBeInTheDocument();
      expect(screen.queryByText(/Headline ai-plain/)).not.toBeInTheDocument();
    });

    it('hides Discussions on a focus tab with nothing to show', () => {
      renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);
      expect(screen.getByRole('button', { name: /Discussions/ })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
      expect(screen.queryByRole('button', { name: /Discussions/ })).not.toBeInTheDocument();
    });

    it('scopes the Discussions count to the selected focus tab', () => {
      renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);
      fireEvent.click(screen.getByRole('tab', { name: /AI & Robotics/ }));
      const discussions = screen.getByRole('button', { name: /Discussions/ });
      expect(within(discussions).getByText('1')).toBeInTheDocument();
      fireEvent.click(discussions);
      expect(screen.getByText(/Headline ai-discuss/)).toBeInTheDocument();
      expect(screen.queryByText(/Headline ai-plain/)).not.toBeInTheDocument();
    });

    describe('with forum posts in the feed', () => {
      const forumPost: IFeedForumPost = {
        uid: 'fp_96',
        tid: 96,
        mainPid: 263,
        title: 'Willow Is Live!',
        body: 'Hi Protocol Labs',
        author: { memberUid: 'm-1', name: 'Matt Curran', avatarUrl: null, role: null },
        focusAreas: [],
        category: 'Intros',
        createdAt: '2026-07-01T00:00:00.000Z',
        lastActivityAt: '2026-07-01T00:00:00.000Z',
        forumTopicUrl: '/forum/topics/5/96',
        commentCount: 2,
        likeCount: 5,
        viewerHasLiked: false,
      };

      beforeEach(() => {
        mockUseFeedSocial.mockReturnValue(feedSocial([forumPost], true));
      });

      it('offers the Discussions pill for forum posts alone, with no threaded news items', () => {
        // `groups` has no item with a forum thread — before this, the cards were
        // in the feed with no pill that could reach them.
        renderTeamNews(<TeamNews groups={groups} />);

        const discussions = screen.getByRole('button', { name: /Discussions/ });
        expect(within(discussions).getByText('1')).toBeInTheDocument();
      });

      it('counts forum posts alongside threaded news items', () => {
        renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);

        // 1 threaded news item + 1 forum post.
        expect(within(screen.getByRole('button', { name: /Discussions/ })).getByText('2')).toBeInTheDocument();
      });

      it('keeps the forum post visible when Discussions is selected, and drops plain news', () => {
        renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);

        fireEvent.click(screen.getByRole('button', { name: /Discussions/ }));

        expect(screen.getByText('Willow Is Live!')).toBeInTheDocument();
        expect(screen.getByText(/Headline ai-discuss/)).toBeInTheDocument();
        expect(screen.queryByText(/Headline ai-plain/)).not.toBeInTheDocument();
      });

      it('still hides forum posts under an event-type pill (a post has no event type)', () => {
        renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);

        fireEvent.click(screen.getByRole('button', { name: /Funding/ }));

        expect(screen.queryByText('Willow Is Live!')).not.toBeInTheDocument();
      });

      // A post older than the 14-day window is absent from `forumPosts` but
      // still present in `unwindowedForumPosts` — the split that lets an old
      // shared link work without letting a stale post into the feed.
      describe('when the post falls outside the 14-day window', () => {
        beforeEach(() => {
          mockUseFeedSocial.mockReturnValue({
            forumPosts: [],
            unwindowedForumPosts: [forumPost],
            hasAccess: true,
            deepLinkSettled: true,
          });
        });

        it('keeps it out of the feed, and out of the Discussions pill', () => {
          renderTeamNews(<TeamNews groups={groups} />);

          expect(screen.queryByText('Willow Is Live!')).not.toBeInTheDocument();
          expect(screen.queryByRole('button', { name: /Discussions/ })).not.toBeInTheDocument();
        });

        it('still opens it from a ?post= deep link, rather than stripping the param', () => {
          window.history.replaceState(null, '', '/home?post=fp_96');

          renderTeamNews(<TeamNews groups={groups} />);

          // Resolving from the windowed list would leave the modal empty and
          // silently drop the param — the exact regression this guards.
          expect(mockOnForumPostModalOpened).toHaveBeenCalled();
          expect(window.location.search).toBe('?post=fp_96');
        });
      });
    });
  });

  describe('grouped by team', () => {
    const ACME_UID = 'team-acme';
    const withTeam = (item: ITeamNewsItem, teamUid: string, teamName: string): ITeamNewsItem => ({
      ...item,
      teamUid,
      teamName,
    });

    // 5 Acme stories under AI & Robotics, plus one unrelated single-story team.
    const acmeAiItems = [
      makeItem('acme-0', 'FUNDING', ['AI & Robotics']),
      makeItem('acme-1', 'LAUNCH', ['AI & Robotics']),
      makeItem('acme-2', 'PARTNERSHIP', ['AI & Robotics']),
      makeItem('acme-3', 'MILESTONE', ['AI & Robotics']),
      makeItem('acme-4', 'ANNOUNCEMENT', ['AI & Robotics']),
    ].map((item) => withTeam(item, ACME_UID, 'Acme'));
    const soloItem = makeItem('solo-1', 'LAUNCH', ['AI & Robotics']);

    // The same team also has a story filed under a different focus area.
    const acmeDhrItem = withTeam(makeItem('acme-dhr', 'MILESTONE', ['Digital Human Rights']), ACME_UID, 'Acme');

    const groupsWithSharedTeam: ITeamNewsGroup[] = [
      { focusArea: FA_AI, total: 6, items: [...acmeAiItems, soloItem] },
      { focusArea: FA_DHR, total: 1, items: [acmeDhrItem] },
    ];

    it('renders one card per team, collapsing a team with more than 3 stories behind an expander', () => {
      renderTeamNews(<TeamNews groups={groupsWithSharedTeam} />);
      // On the default "All" tab, Acme's cluster merges all 6 of its stories (5 AI + 1 DHR).
      expect(screen.getAllByRole('link', { name: 'Acme' })).toHaveLength(1);
      expect(screen.getByRole('button', { name: 'View all 6 updates from Acme' })).toBeInTheDocument();
    });

    it('Show All/Show Less counts team cards, not stories', () => {
      renderTeamNews(<TeamNews groups={groupsWithSharedTeam} pageSize={1} />);
      // 2 team cards total (Acme, solo team) on the All tab — pageSize=1 shows only the first.
      expect(screen.getByRole('link', { name: 'Acme' })).toBeInTheDocument();
      expect(screen.queryByText(/Headline solo-1/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Show All/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Show All/i }));
      expect(mockOnLoadMoreClicked).toHaveBeenCalledWith(1, 2, 'home', {
        currentTab: 'All',
        currentCategory: 'all',
      });
      expect(screen.getByText(/Headline solo-1/)).toBeInTheDocument();
    });

    it('a category chip can show a higher count than the number of rendered team cards', () => {
      renderTeamNews(<TeamNews groups={groupsWithSharedTeam} />);
      // 5 Acme stories are FUNDING/LAUNCH/PARTNERSHIP/MILESTONE/ANNOUNCEMENT — only "Funding" narrows to Acme's single funding story.
      fireEvent.click(screen.getByRole('button', { name: /^Funding/ }));
      expect(screen.getAllByRole('link', { name: 'Acme' })).toHaveLength(1);
      expect(screen.getByText(/Headline acme-0/)).toBeInTheDocument();
      expect(screen.queryByText(/Headline acme-1/)).not.toBeInTheDocument();
    });

    it('does not carry stale per-card expansion when switching tabs for a team present in multiple focus areas', () => {
      renderTeamNews(<TeamNews groups={groupsWithSharedTeam} />);
      // On "All", Acme has 6 stories (5 AI + 1 DHR) — expand to "Show less".
      fireEvent.click(screen.getByRole('button', { name: 'View all 6 updates from Acme' }));
      expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();

      // Switching to the AI & Robotics tab narrows Acme to 5 stories — the card
      // must reset to collapsed, not keep showing a stale "Show less" for a
      // story list that belonged to the previous filter.
      fireEvent.click(screen.getByRole('tab', { name: /AI & Robotics/ }));
      expect(screen.getByRole('button', { name: 'View all 5 updates from Acme' })).toBeInTheDocument();
    });

    it('sorts followed teams first, computed from clusters not individual stories', () => {
      const followedItem = {
        ...withTeam(makeItem('followed-1', 'FUNDING', ['AI & Robotics']), 'team-zeta', 'Zeta'),
        isFollowed: true,
      };
      const groupsWithFollowed: ITeamNewsGroup[] = [
        { focusArea: FA_AI, total: aiItems.length + 1, items: [...aiItems, followedItem] },
      ];
      renderTeamNews(<TeamNews groups={groupsWithFollowed} />);
      selectFollowingSort();
      const teamLinks = screen.getAllByRole('link', { name: /^(Zeta|Team )/ });
      // Zeta is followed and should render first despite being last in insertion order.
      expect(teamLinks[0]).toHaveTextContent('Zeta');
    });
  });

  describe('search', () => {
    const SEARCH_PLACEHOLDER = 'Search by news, teams…';
    // The desktop field (rendered via headerDetails, inside NewsBase's header)
    // comes before the mobile row (NewsBase's first `children`) in DOM order —
    // so the mobile row is always the LAST match, whether or not desktop is open.
    const getMobileInput = () => {
      const inputs = screen.getAllByPlaceholderText(SEARCH_PLACEHOLDER);
      return inputs[inputs.length - 1];
    };
    const getDesktopInput = () => screen.getAllByPlaceholderText(SEARCH_PLACEHOLDER)[0];

    const lattice = {
      ...makeItem('lattice-1', 'FUNDING', ['AI & Robotics']),
      teamUid: 'team-lattice',
      teamName: 'Lattice Compute',
      tags: ['network'],
    };
    const acme = {
      ...makeItem('acme-1', 'LAUNCH', ['AI & Robotics']),
      teamUid: 'team-acme',
      teamName: 'Acme',
      title: 'Acme launches new product',
      summary: 'A regular update from the team.',
      tags: ['network', 'ai-robotics'],
    };
    const filecoin = {
      ...makeItem('fil-1', 'MILESTONE', ['AI & Robotics']),
      teamUid: 'team-filecoin',
      teamName: 'Filecoin Foundation',
      title: 'Storage milestone reached',
      summary: 'Great progress on the storage network.',
      tags: ['network', 'storage'],
    };
    const searchGroups: ITeamNewsGroup[] = [{ focusArea: FA_AI, total: 3, items: [lattice, acme, filecoin] }];

    it('renders the search icon collapsed by default, and reveals a focused input on click', () => {
      renderTeamNews(<TeamNews groups={searchGroups} />);
      expect(screen.getAllByPlaceholderText(SEARCH_PLACEHOLDER)).toHaveLength(1); // mobile row only
      expect(screen.getByRole('button', { name: 'Search news' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Search news' }));
      const inputs = screen.getAllByPlaceholderText(SEARCH_PLACEHOLDER);
      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toHaveFocus(); // the desktop field, opened via the icon click
    });

    it('narrows visible cards by team name', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} />);
      fireEvent.change(getMobileInput(), { target: { value: 'lattice' } });
      act(() => jest.advanceTimersByTime(700));

      expect(screen.getByRole('link', { name: 'Lattice Compute' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Acme' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Filecoin Foundation' })).not.toBeInTheDocument();
      jest.useRealTimers();
    });

    it('narrows by story title, summary, or tag', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} />);
      const input = getMobileInput();

      fireEvent.change(input, { target: { value: 'launches new product' } }); // title match
      act(() => jest.advanceTimersByTime(700));
      expect(screen.getByRole('link', { name: 'Acme' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Filecoin Foundation' })).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'great progress' } }); // summary match
      act(() => jest.advanceTimersByTime(700));
      expect(screen.getByRole('link', { name: 'Filecoin Foundation' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Acme' })).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'ai-robotics' } }); // tag match
      act(() => jest.advanceTimersByTime(700));
      expect(screen.getByRole('link', { name: 'Acme' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Lattice Compute' })).not.toBeInTheDocument();

      jest.useRealTimers();
    });

    it('keeps the query applied when switching focus-area tabs', () => {
      jest.useFakeTimers();
      const dhrAcme = { ...acme, uid: 'acme-dhr', focusAreas: ['Digital Human Rights'] };
      const groupsWithTabs: ITeamNewsGroup[] = [
        { focusArea: FA_AI, total: 3, items: [lattice, acme, filecoin] },
        { focusArea: FA_DHR, total: 1, items: [dhrAcme] },
      ];
      renderTeamNews(<TeamNews groups={groupsWithTabs} />);
      const input = getMobileInput();
      fireEvent.change(input, { target: { value: 'acme' } });
      act(() => jest.advanceTimersByTime(700));
      expect(screen.getByRole('link', { name: 'Acme' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
      expect(getMobileInput()).toHaveValue('acme');
      expect(screen.getByRole('link', { name: 'Acme' })).toBeInTheDocument();
      jest.useRealTimers();
    });

    it('collapses the desktop field on blur when empty, but keeps it open with text', () => {
      renderTeamNews(<TeamNews groups={searchGroups} />);
      fireEvent.click(screen.getByRole('button', { name: 'Search news' }));
      expect(screen.getAllByPlaceholderText(SEARCH_PLACEHOLDER)).toHaveLength(2);

      fireEvent.blur(getDesktopInput());
      expect(screen.getByRole('button', { name: 'Search news' })).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(SEARCH_PLACEHOLDER)).toHaveLength(1);

      fireEvent.click(screen.getByRole('button', { name: 'Search news' }));
      fireEvent.change(getDesktopInput(), { target: { value: 'a' } });
      fireEvent.blur(getDesktopInput());
      expect(screen.queryByRole('button', { name: 'Search news' })).not.toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(SEARCH_PLACEHOLDER)).toHaveLength(2);
    });

    it('shows a query-aware empty message when the search matches nothing', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} />);
      fireEvent.change(getMobileInput(), { target: { value: 'zzz-no-match' } });
      act(() => jest.advanceTimersByTime(700));
      expect(screen.getByText('No network news matches "zzz-no-match".')).toBeInTheDocument();
      jest.useRealTimers();
    });

    it('restores the full set when the query is cleared', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} />);
      const input = getMobileInput();
      fireEvent.change(input, { target: { value: 'lattice' } });
      act(() => jest.advanceTimersByTime(700));
      expect(screen.queryByRole('link', { name: 'Acme' })).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: '' } });
      act(() => jest.advanceTimersByTime(700));
      expect(screen.getByRole('link', { name: 'Lattice Compute' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Acme' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Filecoin Foundation' })).toBeInTheDocument();
      jest.useRealTimers();
    });

    it('resets page-level Show All/Less when a new search query is entered', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} pageSize={1} />);
      fireEvent.click(screen.getByRole('button', { name: /Show All/i }));
      expect(screen.getByRole('button', { name: /Show Less/i })).toBeInTheDocument();

      // "network" matches all 3 items, so results still exceed pageSize=1 —
      // isolates the expanded-reset behavior from the narrowing behavior.
      fireEvent.change(getMobileInput(), { target: { value: 'network' } });
      act(() => jest.advanceTimersByTime(700));
      expect(screen.getByRole('button', { name: /Show All/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Show Less/i })).not.toBeInTheDocument();
      jest.useRealTimers();
    });

    it('does not revert typed text when an unrelated re-render interrupts an in-flight debounce (regression test)', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} />);
      const input = getMobileInput();

      fireEvent.change(input, { target: { value: 'lat' } });
      act(() => jest.advanceTimersByTime(300)); // 400ms still remain on this debounce

      // Unrelated re-render: clicking a category chip forces TeamNews (and thus
      // SearchInput's onChange prop) to re-render well before the debounce settles.
      // Lattice is FUNDING, so it stays visible/matchable after this filter too.
      fireEvent.click(screen.getByRole('button', { name: /^Funding/ }));

      // Continue typing on the same input.
      fireEvent.change(input, { target: { value: 'lattice' } });

      // Advance to exactly when the original debounce (for 'lat') would have
      // fired — the moment a leaked debounce instance would visibly revert
      // the input to the stale, shorter value.
      act(() => jest.advanceTimersByTime(400));
      expect(getMobileInput()).toHaveValue('lattice');

      // Let the real, single debounce settle fully.
      act(() => jest.advanceTimersByTime(700));
      expect(getMobileInput()).toHaveValue('lattice');
      expect(screen.getByRole('link', { name: 'Lattice Compute' })).toBeInTheDocument();
      jest.useRealTimers();
    });

    it('fires onTeamNewsSearch once the debounce settles, with the typed value, narrowed result count, and current tab/category', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} />);
      fireEvent.change(getMobileInput(), { target: { value: 'lattice' } });
      act(() => jest.advanceTimersByTime(700));
      expect(mockOnTeamNewsSearch).toHaveBeenCalledWith('lattice', 1, 'All', 'all');
      jest.useRealTimers();
    });

    it('does not fire onTeamNewsSearch when the query is cleared', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} />);
      const input = getMobileInput();
      fireEvent.change(input, { target: { value: 'lattice' } });
      act(() => jest.advanceTimersByTime(700));
      expect(mockOnTeamNewsSearch).toHaveBeenCalledTimes(1);

      fireEvent.change(input, { target: { value: '' } });
      act(() => jest.advanceTimersByTime(700));
      expect(mockOnTeamNewsSearch).toHaveBeenCalledTimes(1); // still just the one call from above
      jest.useRealTimers();
    });

    it('does not re-fire onTeamNewsSearch merely from switching tabs with an already-set query', () => {
      jest.useFakeTimers();
      const dhrAcme = { ...acme, uid: 'acme-dhr', focusAreas: ['Digital Human Rights'] };
      const groupsWithTabs: ITeamNewsGroup[] = [
        { focusArea: FA_AI, total: 3, items: [lattice, acme, filecoin] },
        { focusArea: FA_DHR, total: 1, items: [dhrAcme] },
      ];
      renderTeamNews(<TeamNews groups={groupsWithTabs} />);
      fireEvent.change(getMobileInput(), { target: { value: 'acme' } });
      act(() => jest.advanceTimersByTime(700));
      expect(mockOnTeamNewsSearch).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
      expect(mockOnTeamNewsSearch).toHaveBeenCalledTimes(1); // tab switch alone must not trigger a second call
      jest.useRealTimers();
    });

    it('reports resultCount/currentTab scoped to the tab active when the search fires, not the tab at mount (latest-ref correctness)', () => {
      jest.useFakeTimers();
      const dhrOnly = {
        ...makeItem('dhr-unique', 'MILESTONE', ['Digital Human Rights']),
        teamUid: 'team-dhr-only',
        teamName: 'DHR Only Team',
        tags: ['unique-dhr-tag'],
      };
      const groupsWithTabs: ITeamNewsGroup[] = [
        { focusArea: FA_AI, total: 3, items: [lattice, acme, filecoin] },
        { focusArea: FA_DHR, total: 1, items: [dhrOnly] },
      ];
      renderTeamNews(<TeamNews groups={groupsWithTabs} />);

      // Switch to the DHR tab BEFORE searching — the search's resultCount/tab
      // should reflect DHR, not the AI/"All" tab active when the component mounted.
      fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
      fireEvent.change(getMobileInput(), { target: { value: 'unique-dhr-tag' } });
      act(() => jest.advanceTimersByTime(700));

      expect(mockOnTeamNewsSearch).toHaveBeenCalledWith('unique-dhr-tag', 1, 'Digital Human Rights', 'all');
      jest.useRealTimers();
    });

    it('truncates searchValue to 100 characters before reporting it', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={searchGroups} />);
      const longQuery = 'a'.repeat(150);
      fireEvent.change(getMobileInput(), { target: { value: longQuery } });
      act(() => jest.advanceTimersByTime(700));

      expect(mockOnTeamNewsSearch).toHaveBeenCalledWith(longQuery.slice(0, 100), 0, 'All', 'all');
      const [reportedValue] = mockOnTeamNewsSearch.mock.calls[0];
      expect(reportedValue).toHaveLength(100);
      jest.useRealTimers();
    });
  });

  describe('upvotes', () => {
    const itemA = makeItem('up-a', 'ANNOUNCEMENT', ['AI & Robotics']);
    const itemB = {
      ...makeItem('up-b', 'LAUNCH', ['AI & Robotics']),
      teamUid: 'team-up-b',
      teamName: 'Team up-b',
    };
    const upvoteGroups: ITeamNewsGroup[] = [{ focusArea: FA_AI, total: 2, items: [itemA, itemB] }];

    // This file otherwise relies on the real (unmocked) auth store defaulting to
    // signed-out, which every other describe block here is fine with (FollowButton
    // is gated behind isHydrated and never renders). UpvoteButton has no such gate,
    // so an anonymous click here would just redirect to login — sign in for these
    // tests specifically, and restore the signed-out default afterward.
    beforeEach(() => {
      useCurrentUserStore.setState({ currentUser: { uid: 'user-1' }, isHydrated: true });
    });
    afterEach(() => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
    });

    it("toggling upvote on one story does not affect another story's state (overlay is per-item)", () => {
      renderTeamNews(<TeamNews groups={upvoteGroups} />);
      const buttons = screen.getAllByRole('button', { name: 'Like (0)' });
      expect(buttons).toHaveLength(2);

      fireEvent.click(buttons[0]);

      expect(screen.getByRole('button', { name: 'Remove like (1)' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Like (0)' })).toBeInTheDocument(); // the other story unaffected
    });

    it('fires onTeamNewsUpvoteToggled analytics once the mutation succeeds', () => {
      renderTeamNews(<TeamNews groups={upvoteGroups} />);
      const [firstButton] = screen.getAllByRole('button', { name: 'Like (0)' });
      fireEvent.click(firstButton);

      expect(mockUpvoteMutate).toHaveBeenCalledWith({ uid: 'up-a', isUpvoted: true }, expect.anything());
      // mockUpvoteMutate is a bare jest.fn() — it doesn't auto-invoke onSuccess/onError,
      // so the mutation's outcome must be simulated manually (mirrors news-rail.test.tsx).
      const options = mockUpvoteMutate.mock.calls[0][1];
      options.onSuccess();

      expect(mockOnUpvoteToggled).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'up-a' }),
        expect.any(Number),
        true,
        'home',
      );
    });

    it('reverts the overlay and does not fire success analytics when the mutation fails', () => {
      renderTeamNews(<TeamNews groups={upvoteGroups} />);
      const [firstButton] = screen.getAllByRole('button', { name: 'Like (0)' });
      fireEvent.click(firstButton);
      expect(screen.getByRole('button', { name: 'Remove like (1)' })).toBeInTheDocument();

      const options = mockUpvoteMutate.mock.calls[0][1];
      act(() => options.onError());

      expect(screen.getAllByRole('button', { name: 'Like (0)' })).toHaveLength(2);
      expect(mockOnUpvoteToggled).not.toHaveBeenCalled();
      // A rolled-back like used to be indistinguishable from one that stuck.
      expect(mockOnUpvoteFailed).toHaveBeenCalledWith(expect.anything(), expect.any(Number), true, 'home');
    });

    it('does not change followed-first cluster ordering when upvoting an unfollowed story', () => {
      const followedItem = {
        ...makeItem('followed-x', 'FUNDING', ['AI & Robotics']),
        teamUid: 'team-zzz',
        teamName: 'Zzz',
        isFollowed: true,
      };
      const groupsWithFollowed: ITeamNewsGroup[] = [
        { focusArea: FA_AI, total: 3, items: [itemA, itemB, followedItem] },
      ];
      renderTeamNews(<TeamNews groups={groupsWithFollowed} />);
      selectFollowingSort();

      fireEvent.click(screen.getAllByRole('button', { name: 'Like (0)' })[0]);

      const teamLinks = screen.getAllByRole('link', { name: /Zzz|Team up-/ });
      expect(teamLinks[0]).toHaveTextContent('Zzz');
    });
  });

  describe('follow — session-stable ordering (frozen until reload)', () => {
    const zeta = {
      ...makeItem('fz-1', 'FUNDING', ['AI & Robotics']),
      teamUid: 'team-zeta',
      teamName: 'Zeta',
      isFollowed: true,
    };
    const alpha = { ...makeItem('fa-1', 'LAUNCH', ['AI & Robotics']), teamUid: 'team-alpha', teamName: 'Alpha' };
    const beta = { ...makeItem('fb-1', 'MILESTONE', ['AI & Robotics']), teamUid: 'team-beta', teamName: 'Beta' };
    // Insertion order alpha, beta, zeta — Following sort must pin Zeta on mount.
    const frozenGroups: ITeamNewsGroup[] = [{ focusArea: FA_AI, total: 3, items: [alpha, beta, zeta] }];

    const getTeamOrder = () => screen.getAllByRole('link', { name: /^(Zeta|Alpha|Beta)/ }).map((l) => l.textContent);

    // FollowButton only renders hydrated + signed-in (same setup as the upvotes block).
    beforeEach(() => {
      useCurrentUserStore.setState({ currentUser: { uid: 'user-1' }, isHydrated: true });
    });
    afterEach(() => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
    });

    it('clicking Follow flips the button immediately but does not move the cluster', () => {
      renderTeamNews(<TeamNews groups={frozenGroups} />);
      selectFollowingSort();
      expect(getTeamOrder()).toEqual(['Zeta', 'Alpha', 'Beta']);

      fireEvent.click(screen.getByRole('button', { name: 'Follow Beta' }));

      expect(screen.getByRole('button', { name: 'Following Beta' })).toBeInTheDocument();
      expect(getTeamOrder()).toEqual(['Zeta', 'Alpha', 'Beta']); // order frozen until reload
    });

    it('clicking Unfollow on a pinned cluster keeps its position (symmetric freeze)', () => {
      renderTeamNews(<TeamNews groups={frozenGroups} />);
      selectFollowingSort();

      fireEvent.click(screen.getByRole('button', { name: 'Following Zeta' }));

      expect(screen.getByRole('button', { name: 'Follow Zeta' })).toBeInTheDocument();
      expect(getTeamOrder()).toEqual(['Zeta', 'Alpha', 'Beta']); // still pinned this session
    });

    it('reverts the button (but not the order) when the server rejects with a null response', () => {
      renderTeamNews(<TeamNews groups={frozenGroups} />);
      selectFollowingSort();
      fireEvent.click(screen.getByRole('button', { name: 'Follow Beta' }));
      expect(screen.getByRole('button', { name: 'Following Beta' })).toBeInTheDocument();

      // followTeam/unfollowTeam resolve to null on non-OK responses instead of
      // throwing — simulate that outcome manually (mockFollowMutate is a bare jest.fn()).
      const options = mockFollowMutate.mock.calls[0][1];
      act(() => options.onSuccess(null));

      expect(screen.getByRole('button', { name: 'Follow Beta' })).toBeInTheDocument();
      expect(getTeamOrder()).toEqual(['Zeta', 'Alpha', 'Beta']); // frozen order untouched by the revert
    });

    it('a fresh mount applies the new follow order (simulates page reload)', () => {
      const { unmount } = renderTeamNews(<TeamNews groups={frozenGroups} />);
      selectFollowingSort();
      fireEvent.click(screen.getByRole('button', { name: 'Follow Beta' }));
      expect(getTeamOrder()).toEqual(['Zeta', 'Alpha', 'Beta']);
      // rerender() would NOT reset the snapshot (state persists) — a reload is a fresh mount
      // with fresh SSR flags, so unmount and render anew with the server's new truth.
      unmount();

      const reloadedGroups: ITeamNewsGroup[] = [
        {
          focusArea: FA_AI,
          total: 3,
          items: [alpha, { ...beta, isFollowed: true }, { ...zeta, isFollowed: false }],
        },
      ];
      renderTeamNews(<TeamNews groups={reloadedGroups} />);
      selectFollowingSort();
      expect(getTeamOrder()).toEqual(['Beta', 'Alpha', 'Zeta']);
    });
  });

  describe('upvote — session-stable ordering (frozen until reload)', () => {
    // Default sort is 'popular', which ranks clusters by upvote count. Equal
    // counts keep insertion order (stable sort), so upvoting Yankee (1 → 2)
    // would rank it above Xray without the mount-time count snapshot.
    const xray = {
      ...makeItem('ux-1', 'FUNDING', ['AI & Robotics']),
      teamUid: 'team-xray',
      teamName: 'Xray',
      upvoteCount: 1,
    };
    const yankee = {
      ...makeItem('uy-1', 'LAUNCH', ['AI & Robotics']),
      teamUid: 'team-yankee',
      teamName: 'Yankee',
      upvoteCount: 1,
    };
    const frozenGroups: ITeamNewsGroup[] = [{ focusArea: FA_AI, total: 2, items: [xray, yankee] }];

    const getTeamOrder = () => screen.getAllByRole('link', { name: /^(Xray|Yankee)/ }).map((l) => l.textContent);
    // Both stories start at count 1, so the buttons share a name — index 1 is
    // Yankee's, matching the rendered [Xray, Yankee] order asserted first.
    const getYankeeUpvoteButton = () => screen.getAllByRole('button', { name: 'Like (1)' })[1];

    // UpvoteButton redirects anonymous clicks to login — sign in (same setup as
    // the upvotes block above).
    beforeEach(() => {
      useCurrentUserStore.setState({ currentUser: { uid: 'user-1' }, isHydrated: true });
    });
    afterEach(() => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
    });

    it('upvoting flips the button and count immediately but does not move the cluster', () => {
      renderTeamNews(<TeamNews groups={frozenGroups} />);
      expect(getTeamOrder()).toEqual(['Xray', 'Yankee']);

      fireEvent.click(getYankeeUpvoteButton());

      expect(screen.getByRole('button', { name: 'Remove like (2)' })).toBeInTheDocument();
      expect(getTeamOrder()).toEqual(['Xray', 'Yankee']); // order frozen until reload

      // Removing the upvote is symmetric: count drops back, cluster still doesn't move.
      fireEvent.click(screen.getByRole('button', { name: 'Remove like (2)' }));
      expect(screen.getAllByRole('button', { name: 'Like (1)' })).toHaveLength(2);
      expect(getTeamOrder()).toEqual(['Xray', 'Yankee']);
    });

    it('reverts the button (but not the order) when the mutation fails', () => {
      renderTeamNews(<TeamNews groups={frozenGroups} />);
      fireEvent.click(getYankeeUpvoteButton());
      expect(screen.getByRole('button', { name: 'Remove like (2)' })).toBeInTheDocument();

      const options = mockUpvoteMutate.mock.calls[0][1];
      act(() => options.onError());

      expect(screen.getAllByRole('button', { name: 'Like (1)' })).toHaveLength(2);
      expect(getTeamOrder()).toEqual(['Xray', 'Yankee']); // frozen order untouched by the revert
    });

    it('reconciling with a different server count updates the button only, never the order', () => {
      renderTeamNews(<TeamNews groups={frozenGroups} />);
      fireEvent.click(getYankeeUpvoteButton());

      // Concurrent voters: server's authoritative count differs from the optimistic +1.
      const options = mockUpvoteMutate.mock.calls[0][1];
      act(() => options.onSuccess({ viewerHasUpvoted: true, upvoteCount: 7 }));

      expect(screen.getByRole('button', { name: 'Remove like (7)' })).toBeInTheDocument();
      expect(getTeamOrder()).toEqual(['Xray', 'Yankee']); // still ranked by page-load counts
    });

    it('a fresh mount applies the new count order (simulates page reload)', () => {
      const { unmount } = renderTeamNews(<TeamNews groups={frozenGroups} />);
      fireEvent.click(getYankeeUpvoteButton());
      expect(getTeamOrder()).toEqual(['Xray', 'Yankee']);
      // rerender() would NOT reset the snapshot (state persists) — a reload is a fresh
      // mount with fresh SSR counts, so unmount and render anew with the server's truth.
      unmount();

      const reloadedGroups: ITeamNewsGroup[] = [
        { focusArea: FA_AI, total: 2, items: [xray, { ...yankee, upvoteCount: 2, viewerHasUpvoted: true }] },
      ];
      renderTeamNews(<TeamNews groups={reloadedGroups} />);
      expect(getTeamOrder()).toEqual(['Yankee', 'Xray']);
    });
  });

  describe('news detail modal + deep link (?news=<uid>)', () => {
    const getDialog = () => screen.getByRole('dialog');

    beforeEach(() => {
      useCurrentUserStore.setState({ currentUser: { uid: 'user-1' }, isHydrated: true });
    });
    afterEach(() => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
    });

    it('opens the modal on row click, writes ?news= synchronously, and never window.opens', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
      renderTeamNews(<TeamNews groups={groups} />);

      fireEvent.click(screen.getByRole('button', { name: 'Headline ai-1' }));

      const dialog = getDialog();
      expect(within(dialog).getByRole('heading', { name: 'Headline ai-1' })).toBeInTheDocument();
      expect(window.location.search).toBe('?news=ai-1'); // history.replaceState is synchronous
      expect(openSpy).not.toHaveBeenCalled();
      expect(mockOnCardClicked).toHaveBeenCalledTimes(1);
      openSpy.mockRestore();
    });

    it('preserves unrelated query params (utm) across open and close', () => {
      window.history.replaceState(null, '', '/home?utm_source=li');
      renderTeamNews(<TeamNews groups={groups} />);

      fireEvent.click(screen.getByRole('button', { name: 'Headline ai-1' }));
      expect(window.location.search).toContain('utm_source=li');
      expect(window.location.search).toContain('news=ai-1');

      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Close' }));
      expect(window.location.search).toBe('?utm_source=li');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes on Escape and strips only the news param', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(screen.getByRole('button', { name: 'Headline ai-1' }));
      expect(getDialog()).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.location.search).toBe('');
    });

    it('shows the source links inside the modal (they left the row click)', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(screen.getByRole('button', { name: 'Headline ai-1' }));

      const link = within(getDialog()).getByRole('link', { name: 'example.com' });
      expect(link).toHaveAttribute('href', 'https://example.com/ai-1');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('keeps the modal Like and the feed row in sync through the shared overlay', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(screen.getByRole('button', { name: 'Headline ai-1' }));

      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Like (0)' }));

      expect(within(getDialog()).getByRole('button', { name: 'Remove like (1)' })).toBeInTheDocument();
      // The originating feed row reads the same overlay-merged item.
      const row = screen.getByRole('button', { name: 'Headline ai-1' });
      expect(within(row).getByRole('button', { name: 'Remove like (1)' })).toBeInTheDocument();
    });

    it('anonymous Like in the modal pushes a #login URL that carries the news param', () => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
      window.history.replaceState(null, '', '/home?news=ai-1');
      renderTeamNews(<TeamNews groups={groups} />);

      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Like (0)' }));

      expect(mockRouterPush).toHaveBeenCalledWith('/home?news=ai-1#login', { scroll: false });
    });

    it('a valid deep link opens the modal on first render and reports the deep-link open once', () => {
      window.history.replaceState(null, '', '/home?news=dhr-1');
      renderTeamNews(<TeamNews groups={groups} />);

      expect(within(getDialog()).getByRole('heading', { name: 'Headline dhr-1' })).toBeInTheDocument();
      expect(mockOnDetailModalOpened).toHaveBeenCalledTimes(1);
      expect(mockOnDetailModalOpened).toHaveBeenCalledWith(expect.objectContaining({ uid: 'dhr-1' }));
    });

    it('an unknown uid renders the plain feed and silently strips the param', () => {
      window.history.replaceState(null, '', '/home?news=expired-uid&utm_source=li');
      renderTeamNews(<TeamNews groups={groups} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.location.search).toBe('?utm_source=li');
      expect(mockOnDetailModalOpened).not.toHaveBeenCalled();
    });

    it('row clicks never report a deep-link modal open', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(screen.getByRole('button', { name: 'Headline ai-1' }));
      expect(mockOnDetailModalOpened).not.toHaveBeenCalled();
    });

    it('opening the share popover from a row never opens the modal', () => {
      renderTeamNews(<TeamNews groups={groups} />);

      fireEvent.click(screen.getByRole('button', { name: 'Share Headline ai-1' }));

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.location.search).toBe('');
    });

    it('clicking a share menu item never opens the row modal beneath it', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(screen.getByRole('button', { name: 'Share Headline ai-1' }));

      fireEvent.click(screen.getByRole('menuitem', { name: 'Share on X' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      openSpy.mockRestore();
    });

    it('Escape with the share popover open closes only the popover; the next Escape closes the modal', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(screen.getByRole('button', { name: 'Headline ai-1' }));
      const dialog = getDialog();

      fireEvent.click(within(dialog).getByRole('button', { name: /^Share/ }));
      const menu = screen.getByRole('menu');

      fireEvent.keyDown(menu, { key: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument(); // modal survived the first Escape

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shares from the modal footer report the news-modal source', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
      renderTeamNews(<TeamNews groups={groups} />);
      fireEvent.click(screen.getByRole('button', { name: 'Headline ai-1' }));

      fireEvent.click(within(getDialog()).getByRole('button', { name: /^Share/ }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Share on X' }));

      expect(openSpy.mock.calls[0][0]).toContain(encodeURIComponent('news=ai-1'));
      expect(mockOnShared).toHaveBeenCalledWith(expect.objectContaining({ uid: 'ai-1' }), 'x', 'news-modal');
      openSpy.mockRestore();
    });
  });

  (SHOW_POPULAR_THIS_WEEK ? describe : describe.skip)('popular this week — scroll to story', () => {
    const popularItem = (
      partial: Partial<ITeamNewsPopularItem> & Pick<ITeamNewsPopularItem, 'uid'>,
    ): ITeamNewsPopularItem => ({
      teamUid: 'team-ai-1',
      teamName: 'Team ai-1',
      title: 'Headline ai-1',
      sourceUrl: 'https://example.com/ai-1',
      upvoteCount: 5,
      ...partial,
    });

    // Feed rows are role="button" too now (they open the detail modal) and use
    // the headline as accessible name; share triggers are "Share <headline>".
    // The rail button is the one whose name STARTS with the headline and that
    // carries no data-story-uid.
    const getRailButton = (title: string) =>
      screen
        .getAllByRole('button', { name: new RegExp(`^${title}`) })
        .find((el) => !el.hasAttribute('data-story-uid'))!;
    const getFeedHeadline = (title: string) => screen.queryByText(new RegExp(title), { selector: 'h3' });

    it('reveals an already-visible story without changing tab/category/query, and does not navigate', () => {
      renderTeamNews(<TeamNews groups={groups} popularItems={[popularItem({ uid: 'ai-1' })]} />);
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      fireEvent.click(getRailButton('Headline ai-1'));

      expect(mockOnPopularStoryClicked).toHaveBeenCalledWith(expect.objectContaining({ uid: 'ai-1' }), 0);
      expect(openSpy).not.toHaveBeenCalled();
      expect(screen.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true');
      expect(getFeedHeadline('Headline ai-1')).toBeInTheDocument();
      expect(getFeedHeadline('Headline ai-1')!.closest('[role="button"]')).toHaveClass('storyHighlighted');
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
      openSpy.mockRestore();
    });

    it('resets to the All tab and reveals the story when the target is outside the active tab', () => {
      renderTeamNews(
        <TeamNews
          groups={groups}
          popularItems={[
            popularItem({ uid: 'dhr-1', teamUid: 'team-dhr-1', teamName: 'Team dhr-1', title: 'Headline dhr-1' }),
          ]}
        />,
      );
      fireEvent.click(screen.getByRole('tab', { name: /AI & Robotics/ }));
      expect(getFeedHeadline('Headline dhr-1')).not.toBeInTheDocument();

      fireEvent.click(getRailButton('Headline dhr-1'));

      expect(screen.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true');
      expect(getFeedHeadline('Headline dhr-1')).toBeInTheDocument();
    });

    it('resets category to All when the target is excluded by the active category', () => {
      renderTeamNews(<TeamNews groups={groups} popularItems={[popularItem({ uid: 'ai-1' })]} />);
      fireEvent.click(screen.getByRole('button', { name: /^Launch\b/ })); // narrows to ai-2, excluding ai-1
      expect(getFeedHeadline('Headline ai-1')).not.toBeInTheDocument();

      fireEvent.click(getRailButton('Headline ai-1'));

      expect(getFeedHeadline('Headline ai-1')).toBeInTheDocument();
      // Proves category reset to All, not just re-narrowed to Funding.
      expect(getFeedHeadline('Headline ai-3')).toBeInTheDocument();
    });

    it('clears an active search query that would exclude the target', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={groups} popularItems={[popularItem({ uid: 'ai-1' })]} />);
      const input = screen.getAllByPlaceholderText('Search by news, teams…')[0];
      fireEvent.change(input, { target: { value: 'dhr' } });
      act(() => jest.advanceTimersByTime(700));
      expect(getFeedHeadline('Headline ai-1')).not.toBeInTheDocument();

      fireEvent.click(getRailButton('Headline ai-1'));

      expect(getFeedHeadline('Headline ai-1')).toBeInTheDocument();
      jest.useRealTimers();
    });

    it('expands "Show All" when the target cluster is beyond pageSize', () => {
      renderTeamNews(
        <TeamNews
          groups={groups}
          pageSize={1}
          popularItems={[
            popularItem({ uid: 'dhr-1', teamUid: 'team-dhr-1', teamName: 'Team dhr-1', title: 'Headline dhr-1' }),
          ]}
        />,
      );
      expect(getFeedHeadline('Headline dhr-1')).not.toBeInTheDocument();

      fireEvent.click(getRailButton('Headline dhr-1'));

      expect(screen.getByRole('button', { name: /Show Less/i })).toBeInTheDocument();
      expect(getFeedHeadline('Headline dhr-1')).toBeInTheDocument();
    });

    it("auto-expands only the target story's own card, leaving others untouched", () => {
      const withTeam = (item: ITeamNewsItem, teamUid: string, teamName: string): ITeamNewsItem => ({
        ...item,
        teamUid,
        teamName,
      });
      const acmeItems = [
        makeItem('acme-0', 'FUNDING', ['AI & Robotics']),
        makeItem('acme-1', 'LAUNCH', ['AI & Robotics']),
        makeItem('acme-2', 'PARTNERSHIP', ['AI & Robotics']),
        makeItem('acme-3', 'MILESTONE', ['AI & Robotics']),
      ].map((item) => withTeam(item, 'team-acme', 'Acme'));
      const otherItems = [
        makeItem('other-0', 'FUNDING', ['AI & Robotics']),
        makeItem('other-1', 'LAUNCH', ['AI & Robotics']),
        makeItem('other-2', 'PARTNERSHIP', ['AI & Robotics']),
        makeItem('other-3', 'MILESTONE', ['AI & Robotics']),
      ].map((item) => withTeam(item, 'team-other', 'Other'));
      const cardGroups: ITeamNewsGroup[] = [{ focusArea: FA_AI, total: 8, items: [...acmeItems, ...otherItems] }];

      renderTeamNews(
        <TeamNews
          groups={cardGroups}
          popularItems={[
            popularItem({ uid: 'acme-3', teamUid: 'team-acme', teamName: 'Acme', title: 'Headline acme-3' }),
          ]}
        />,
      );
      expect(screen.getByRole('button', { name: 'View all 4 updates from Acme' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View all 4 updates from Other' })).toBeInTheDocument();

      fireEvent.click(getRailButton('Headline acme-3'));

      expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View all 4 updates from Other' })).toBeInTheDocument();
      expect(getFeedHeadline('Headline acme-3')).toBeInTheDocument();
    });

    it('falls back to opening sourceUrl when the target story no longer exists in allItems', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
      renderTeamNews(
        <TeamNews
          groups={groups}
          popularItems={[popularItem({ uid: 'expired-uid', sourceUrl: 'https://example.com/expired' })]}
        />,
      );

      fireEvent.click(getRailButton('Headline ai-1'));

      expect(openSpy).toHaveBeenCalledWith('https://example.com/expired', '_blank', 'noopener,noreferrer');
      // The live, previously unmeasured failure path: ranked server-side, aged
      // out of the 14-day window before it was clicked.
      expect(mockOnFallbackOpened).toHaveBeenCalledWith(expect.objectContaining({ uid: 'expired-uid' }), 0);
      expect(mockOnScrollSucceeded).not.toHaveBeenCalled();
      openSpy.mockRestore();
    });

    it('highlights the revealed row and removes the highlight shortly after', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={groups} popularItems={[popularItem({ uid: 'ai-1' })]} />);

      fireEvent.click(getRailButton('Headline ai-1'));
      const row = getFeedHeadline('Headline ai-1')!.closest('[role="button"]');
      expect(row).toHaveClass('storyHighlighted');
      // The denominator for the fallback above.
      expect(mockOnScrollSucceeded).toHaveBeenCalledWith(expect.objectContaining({ uid: 'ai-1' }), 0);

      act(() => jest.advanceTimersByTime(2000));
      expect(row).not.toHaveClass('storyHighlighted');
      jest.useRealTimers();
    });

    it('supersedes a still-active highlight when a second Popular item is clicked', () => {
      renderTeamNews(
        <TeamNews
          groups={groups}
          popularItems={[
            popularItem({ uid: 'ai-1' }),
            popularItem({ uid: 'ai-2', title: 'Headline ai-2', sourceUrl: 'https://example.com/ai-2' }),
          ]}
        />,
      );

      fireEvent.click(getRailButton('Headline ai-1'));
      const firstRow = getFeedHeadline('Headline ai-1')!.closest('[role="button"]');
      expect(firstRow).toHaveClass('storyHighlighted');

      fireEvent.click(getRailButton('Headline ai-2'));
      const secondRow = getFeedHeadline('Headline ai-2')!.closest('[role="button"]');

      expect(firstRow).not.toHaveClass('storyHighlighted');
      expect(secondRow).toHaveClass('storyHighlighted');
    });
  });

  describe('hiring and deals in the feed', () => {
    const jobRole = (uid: string, overrides: Partial<IJobTeamGroup['roles'][number]> = {}) => ({
      uid,
      roleTitle: `Role ${uid}`,
      roleCategory: null,
      seniority: null,
      location: ['Remote'],
      workMode: null,
      applyUrl: `https://jobs.example.com/${uid}`,
      lastUpdated: '2026-08-01T00:00:00.000Z',
      postedDate: null,
      detectionDate: null,
      ...overrides,
    });

    const hiringGroup = (uid: string, overrides: Partial<IJobTeamGroup> = {}): IJobTeamGroup =>
      ({
        team: { uid, name: `Hiring ${uid}`, logoUrl: null, focusAreas: [], subFocusAreas: [] },
        totalRoles: 5,
        roles: [jobRole(`${uid}-r1`), jobRole(`${uid}-r2`)],
        ...overrides,
      }) as IJobTeamGroup;

    const feedDeal = (uid: string, overrides: Partial<IDeal> = {}): IDeal =>
      ({
        uid,
        vendorName: `Vendor ${uid}`,
        vendorTeamUid: null,
        logoUid: null,
        category: 'Infrastructure',
        audience: 'ALL_FOUNDERS',
        shortDescription: `Perk ${uid}`,
        status: 'ACTIVE',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        isRedeemed: false,
        isUsing: false,
        teamsRedemptionCount: 0,
        teamsUsingCount: 0,
        logoUrl: null,
      }) as IDeal;

    // Nine items clears TOP_STORIES_MIN_CORPUS, so the band takes three and six
    // ranked entries remain — enough for the cadence to place both signals.
    const wideItems = Array.from({ length: 9 }, (_, i) => makeItem(`w-${i}`, 'FUNDING', ['AI & Robotics']));
    const wideGroups: ITeamNewsGroup[] = [{ focusArea: FA_AI, total: wideItems.length, items: wideItems }];

    it('renders a hiring roll-up and a deal card in the stream', () => {
      mockUseFeedHiring.mockReturnValue({ hiring: [hiringGroup('acme')] });
      mockUseFeedDeals.mockReturnValue({ deals: [feedDeal('d1')] });
      renderTeamNews(<TeamNews groups={wideGroups} pageSize={20} />);

      expect(screen.getByText('Hiring acme is hiring')).toBeInTheDocument();
      expect(screen.getByText('View all 5 open roles at Hiring acme')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Vendor d1' })).toBeInTheDocument();
      expect(screen.getByText('Perk d1')).toBeInTheDocument();
    });

    it('never lets a signal lead the feed', () => {
      mockUseFeedHiring.mockReturnValue({ hiring: [hiringGroup('acme')] });
      mockUseFeedDeals.mockReturnValue({ deals: [feedDeal('d1')] });
      renderTeamNews(<TeamNews groups={wideGroups} pageSize={20} />);

      const first = document.querySelector('[data-news-feed-list]')!.firstElementChild!;
      expect(first.textContent).not.toContain('is hiring');
      expect(first.textContent).not.toContain('Vendor d1');
    });

    it('carries the job board attribution params on role links', () => {
      mockUseFeedHiring.mockReturnValue({ hiring: [hiringGroup('acme')] });
      renderTeamNews(<TeamNews groups={wideGroups} pageSize={20} />);

      expect(screen.getByRole('link', { name: 'Role acme-r1' })).toHaveAttribute(
        'href',
        'https://jobs.example.com/acme-r1?utm_source=os.pl.xyz&utm_medium=job_board',
      );
    });

    it('renders a role without an apply link as plain text, not a dead anchor', () => {
      mockUseFeedHiring.mockReturnValue({
        hiring: [hiringGroup('acme', { roles: [jobRole('no-url', { applyUrl: null })] })],
      });
      renderTeamNews(<TeamNews groups={wideGroups} pageSize={20} />);

      expect(screen.getByText('Role no-url')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Role no-url' })).not.toBeInTheDocument();
    });

    it('renders no location rather than an empty one', () => {
      mockUseFeedHiring.mockReturnValue({
        hiring: [hiringGroup('acme', { roles: [jobRole('bare', { location: [] })] })],
      });
      renderTeamNews(<TeamNews groups={wideGroups} pageSize={20} />);

      const row = screen.getByRole('link', { name: 'Role bare' }).closest('li')!;
      expect(row.textContent).toBe('Role bare');
    });

    // Neither kind carries a focus area or an event type, so every narrowed
    // view drops them — the same flag that hides the band.
    it('drops both kinds on a category pill', () => {
      mockUseFeedHiring.mockReturnValue({ hiring: [hiringGroup('acme')] });
      mockUseFeedDeals.mockReturnValue({ deals: [feedDeal('d1')] });
      renderTeamNews(<TeamNews groups={wideGroups} pageSize={20} />);
      expect(screen.getByText('Hiring acme is hiring')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /^Funding\b/ }));

      expect(screen.queryByText('Hiring acme is hiring')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Vendor d1' })).not.toBeInTheDocument();
    });

    it('leaves the feed intact when neither stream loads', () => {
      renderTeamNews(<TeamNews groups={wideGroups} pageSize={20} />);

      expect(screen.queryByText(/is hiring/)).not.toBeInTheDocument();
      expect(document.querySelector('[data-news-feed-list]')!.children.length).toBeGreaterThan(0);
    });

    it('reports role, view-all and deal clicks with their feed position', () => {
      mockUseFeedHiring.mockReturnValue({ hiring: [hiringGroup('acme')] });
      mockUseFeedDeals.mockReturnValue({ deals: [feedDeal('d1')] });
      renderTeamNews(<TeamNews groups={wideGroups} pageSize={20} />);

      fireEvent.click(screen.getByRole('link', { name: 'Role acme-r1' }));
      expect(mockOnFeedHiringRoleClicked).toHaveBeenCalledWith(
        expect.objectContaining({ team: expect.objectContaining({ uid: 'acme' }) }),
        expect.objectContaining({ uid: 'acme-r1' }),
        0,
        expect.any(Number),
      );

      fireEvent.click(screen.getByText('View all 5 open roles at Hiring acme'));
      expect(mockOnFeedHiringViewAllClicked).toHaveBeenCalled();

      fireEvent.click(screen.getByRole('heading', { name: 'Vendor d1' }));
      expect(mockOnFeedDealClicked).toHaveBeenCalledWith(expect.objectContaining({ uid: 'd1' }), expect.any(Number));
    });
  });

  describe('sub-desktop rails', () => {
    const suggestions = [
      { uid: 's1', name: 'Banyan Storage', logo: null, reason: 'Storage · 1.2k followers' },
      { uid: 's2', name: 'Helia Labs', logo: null, reason: 'Infrastructure · 890 followers' },
    ];
    const popular = [
      {
        uid: 'ai-1',
        teamUid: 'team-ai-1',
        teamName: 'Team ai-1',
        title: 'Headline ai-1',
        sourceUrl: 'https://example.com/ai-1',
        upvoteCount: 5,
      },
    ];

    const railAside = () => screen.queryByRole('complementary', { name: /sidebar/i });
    // The rail's own cards are labelled sections too, so a bare role query would
    // match either surface — scope to the feed column, which is where the
    // scrollers live.
    const scroller = (name: string) =>
      within(document.querySelector('[data-news-feed-root]') as HTMLElement).queryByRole('region', { name });

    beforeEach(() => {
      mockUseSuggestedTeamsToFollow.mockReturnValue({ suggestions, isLoading: false });
    });

    it('keeps Teams to follow in the rail at desktop width, with no scrollers', () => {
      renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);

      expect(within(railAside()!).getByText('Banyan Storage')).toBeInTheDocument();
      if (SHOW_POPULAR_THIS_WEEK) {
        expect(within(railAside()!).getByText('Popular this week')).toBeInTheDocument();
      } else {
        expect(within(railAside()!).queryByText('Popular this week')).not.toBeInTheDocument();
      }
      expect(scroller('Teams to follow')).not.toBeInTheDocument();
      expect(scroller('Popular this week')).not.toBeInTheDocument();
    });

    it('lifts Teams to follow into a horizontal row below desktop', () => {
      mockUseIsBelowDesktop.mockReturnValue(true);
      renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);

      expect(scroller('Teams to follow')).toBeInTheDocument();
      if (SHOW_POPULAR_THIS_WEEK) {
        expect(scroller('Popular this week')).toBeInTheDocument();
      } else {
        expect(scroller('Popular this week')).not.toBeInTheDocument();
      }
      // The rail is still in the tree for the digest card — it just no longer
      // carries these two.
      expect(within(railAside()!).queryByText('Banyan Storage')).not.toBeInTheDocument();
    });

    it('keeps the digest card in the rail at both widths', () => {
      const { unmount } = renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);
      expect(within(railAside()!).getByText(/Get network news Digest/i)).toBeInTheDocument();
      unmount();

      mockUseIsBelowDesktop.mockReturnValue(true);
      renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);
      expect(within(railAside()!).getByText(/Get network news Digest/i)).toBeInTheDocument();
    });

    it('mounts exactly one instance of each module at either width', () => {
      mockUseIsBelowDesktop.mockReturnValue(true);
      renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);

      expect(screen.getAllByText('Banyan Storage')).toHaveLength(1);
      if (SHOW_POPULAR_THIS_WEEK) {
        expect(screen.getAllByText('Popular this week')).toHaveLength(1);
      } else {
        expect(screen.queryByText('Popular this week')).not.toBeInTheDocument();
      }
    });

    // The events live in TeamNews now precisely so the count doesn't depend on
    // which surface rendered.
    it('fires each view event exactly once, on either surface', () => {
      renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);
      expect(mockOnTeamsToFollowViewed).toHaveBeenCalledTimes(1);
      expect(mockOnPopularCardViewed).toHaveBeenCalledTimes(SHOW_POPULAR_THIS_WEEK ? 1 : 0);

      jest.clearAllMocks();
      mockUseSuggestedTeamsToFollow.mockReturnValue({ suggestions, isLoading: false });
      mockUseIsBelowDesktop.mockReturnValue(true);
      renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);

      expect(mockOnTeamsToFollowViewed).toHaveBeenCalledTimes(1);
      expect(mockOnPopularCardViewed).toHaveBeenCalledTimes(SHOW_POPULAR_THIS_WEEK ? 1 : 0);
    });

    it('follows a team from the scroller with the same payload as the rail row', () => {
      mockUseIsBelowDesktop.mockReturnValue(true);
      useCurrentUserStore.setState({ currentUser: { uid: 'user-1' }, isHydrated: true });
      try {
        renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);

        const row = scroller('Teams to follow')!;
        fireEvent.click(within(row).getByRole('button', { name: /follow banyan storage/i }));

        expect(mockFollowMutate).toHaveBeenCalled();
      } finally {
        useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
      }
    });

    (SHOW_POPULAR_THIS_WEEK ? it : it.skip)('reveals the story in the feed when a scroller card is tapped', () => {
      mockUseIsBelowDesktop.mockReturnValue(true);
      renderTeamNews(<TeamNews groups={groups} popularItems={popular} />);

      const row = scroller('Popular this week')!;
      fireEvent.click(within(row).getByRole('button', { name: /Headline ai-1/ }));

      expect(mockOnPopularStoryClicked).toHaveBeenCalled();
    });
  });

  describe('top stories band', () => {
    // TOP_STORIES_MIN_CORPUS is 9: the band's three plus a full default page.
    const bandItems = (count: number, upvotesByIndex: Record<number, number> = {}): ITeamNewsItem[] =>
      Array.from({ length: count }, (_, i) => ({
        ...makeItem(`b-${i}`, 'FUNDING', ['AI & Robotics']),
        upvoteCount: upvotesByIndex[i] ?? 0,
        eventDate: `2026-05-${String(count - i).padStart(2, '0')}T12:00:00.000Z`,
      }));

    const bandGroups = (items: ITeamNewsItem[]): ITeamNewsGroup[] => [{ focusArea: FA_AI, total: items.length, items }];

    /** The stream under the band — the band renders its own copies of the same
     *  stories, so feed assertions must not query globally. */
    const feed = () => within(document.querySelector('[data-news-feed-list]') as HTMLElement);
    const band = () => screen.queryByRole('region', { name: 'Top stories' });

    it('renders nothing below the minimum corpus', () => {
      renderTeamNews(<TeamNews groups={bandGroups(bandItems(8))} />);

      expect(band()).not.toBeInTheDocument();
      expect(feed().getByText('Headline b-0')).toBeInTheDocument();
    });

    it('renders the lead plus two rows once the corpus is met', () => {
      renderTeamNews(<TeamNews groups={bandGroups(bandItems(9, { 4: 50, 7: 40, 1: 30 }))} />);

      const region = band()!;
      expect(region).toBeInTheDocument();
      expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent('Headline b-4');
      expect(within(region).getByText('Headline b-7')).toBeInTheDocument();
      expect(within(region).getByText('Headline b-1')).toBeInTheDocument();
      expect(within(region).getByText('Last 14 days')).toBeInTheDocument();
    });

    it('removes the band stories from the stream below it', () => {
      renderTeamNews(<TeamNews groups={bandGroups(bandItems(9, { 4: 50, 7: 40, 1: 30 }))} pageSize={20} />);

      for (const uid of ['b-4', 'b-7', 'b-1']) {
        expect(feed().queryByText(`Headline ${uid}`)).not.toBeInTheDocument();
      }
      expect(feed().getByText('Headline b-0')).toBeInTheDocument();
      expect(feed().getByText('Headline b-8')).toBeInTheDocument();
    });

    it('hides the band on a focus-area tab, a category pill, and a search query', () => {
      const items = bandItems(9, { 4: 50 });
      renderTeamNews(
        <TeamNews
          groups={[
            { focusArea: FA_AI, total: items.length, items },
            { focusArea: FA_DHR, total: dhrItems.length, items: dhrItems },
          ]}
        />,
      );
      expect(band()).toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
      expect(band()).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: /^All/ }));
      expect(band()).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /^Funding\b/ }));
      expect(band()).not.toBeInTheDocument();
    });

    // Both rank by likes, so left alone they show the same three stories a few
    // hundred pixels apart.
    (SHOW_POPULAR_THIS_WEEK ? it : it.skip)('keeps band stories out of the rail’s Popular this week', () => {
      const items = bandItems(9, { 4: 50, 7: 40, 1: 30 });
      renderTeamNews(
        <TeamNews
          groups={bandGroups(items)}
          popularItems={[
            {
              uid: 'b-4',
              teamUid: 'team-b-4',
              teamName: 'Team b-4',
              title: 'Headline b-4',
              sourceUrl: 'x',
              upvoteCount: 50,
            },
            {
              uid: 'b-0',
              teamUid: 'team-b-0',
              teamName: 'Team b-0',
              title: 'Headline b-0',
              sourceUrl: 'y',
              upvoteCount: 2,
            },
          ]}
        />,
      );

      const rail = screen.getByRole('complementary', { name: /sidebar/i });
      expect(within(rail).queryByText('Headline b-4')).not.toBeInTheDocument();
      expect(within(rail).getByText('Headline b-0')).toBeInTheDocument();
    });

    it('reports its own view and click analytics with slot and position', () => {
      renderTeamNews(<TeamNews groups={bandGroups(bandItems(9, { 4: 50, 7: 40, 1: 30 }))} />);

      expect(mockOnTopStoriesBlockViewed).toHaveBeenCalledWith('b-4', 2);

      fireEvent.click(within(band()!).getByRole('button', { name: 'Headline b-7' }));
      expect(mockOnTopStoryClicked).toHaveBeenCalledWith(expect.objectContaining({ uid: 'b-7' }), 'row', 1);
      // The band never routes through the feed's card-clicked event: its items
      // aren't in visibleEntries, so that handler's position lookup is -1.
      expect(mockOnCardClicked).not.toHaveBeenCalled();
    });

    it('opens the detail modal and writes ?news= when a band story is clicked', () => {
      renderTeamNews(<TeamNews groups={bandGroups(bandItems(9, { 4: 50 }))} />);

      fireEvent.click(within(band()!).getByRole('button', { name: 'Headline b-4' }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(new URLSearchParams(window.location.search).get('news')).toBe('b-4');
    });

    // The band ranks from the mount-time snapshot for the same reason the feed
    // does (#2677) — otherwise liking the lead demotes it under the cursor.
    it('does not re-rank when the lead is liked', () => {
      // Same reason the upvotes block above signs in: UpvoteButton has no
      // isHydrated gate, so an anonymous click just redirects to login.
      useCurrentUserStore.setState({ currentUser: { uid: 'user-1' }, isHydrated: true });
      try {
        renderTeamNews(<TeamNews groups={bandGroups(bandItems(9, { 4: 50, 7: 40, 1: 30 }))} />);

        const leadBefore = within(band()!).getByRole('heading', { level: 2 }).textContent;
        fireEvent.click(within(band()!).getAllByRole('button', { name: /^Like/ })[0]);

        expect(within(band()!).getByRole('heading', { level: 2 })).toHaveTextContent(leadBefore!);
      } finally {
        useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
      }
    });
  });
});
