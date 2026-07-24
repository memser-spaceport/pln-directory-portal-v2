import '@testing-library/jest-dom';
import type { ReactElement } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TeamNews } from '@/components/page/home/TeamNews/TeamNews';
import { useCurrentUserStore } from '@/services/auth/store';
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

const mockOnTabClicked = jest.fn();
const mockOnCategoryClicked = jest.fn();
const mockOnLoadMoreClicked = jest.fn();
const mockOnCardClicked = jest.fn();
const mockOnTeamNewsSearch = jest.fn();
const mockOnUpvoteToggled = jest.fn();
const mockOnPopularStoryClicked = jest.fn();
const mockOnDetailModalOpened = jest.fn();
const mockOnShared = jest.fn();

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
  }),
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
    expect(screen.getByRole('button', { name: /All categories/ })).toHaveClass(/catActive/);
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
    expect(screen.getByRole('button', { name: /All categories/ })).not.toBeDisabled();
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

  describe('Active Discussions', () => {
    const aiDiscussed = makeItem('ai-discuss', 'FUNDING', ['AI & Robotics'], {
      count: 1,
      latestTopicUrl: '/forum/t/123',
    });
    const aiPlain = makeItem('ai-plain', 'LAUNCH', ['AI & Robotics']);
    const groupsWithDiscussion: ITeamNewsGroup[] = [
      { focusArea: FA_AI, total: 2, items: [aiDiscussed, aiPlain] },
      { focusArea: FA_DHR, total: dhrItems.length, items: dhrItems },
    ];

    it('does not render Active Discussions when no items have a forum thread', () => {
      renderTeamNews(<TeamNews groups={groups} />);
      expect(screen.queryByRole('button', { name: /Active Discussions/ })).not.toBeInTheDocument();
    });

    it('shows Active Discussions after All categories when at least one item has a thread', () => {
      renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);
      const chips = screen.getAllByRole('button', { name: /categories|Discussions|Funding|Launch/i });
      const allCat = screen.getByRole('button', { name: /All categories/ });
      const activeDisc = screen.getByRole('button', { name: /Active Discussions/ });
      expect(chips.indexOf(activeDisc)).toBeGreaterThan(chips.indexOf(allCat));
      expect(within(activeDisc).getByText('1')).toBeInTheDocument();
    });

    it('filters to discussion items and reports analytics', () => {
      renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);
      fireEvent.click(screen.getByRole('button', { name: /Active Discussions/ }));
      expect(mockOnCategoryClicked).toHaveBeenCalledWith('active-discussions', 1, 'All');
      expect(screen.getByText(/Headline ai-discuss/)).toBeInTheDocument();
      expect(screen.queryByText(/Headline ai-plain/)).not.toBeInTheDocument();
    });

    it('hides Active Discussions on a focus tab with no threads', () => {
      renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);
      expect(screen.getByRole('button', { name: /Active Discussions/ })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
      expect(screen.queryByRole('button', { name: /Active Discussions/ })).not.toBeInTheDocument();
    });

    it('scopes Active Discussions count to the selected focus tab', () => {
      renderTeamNews(<TeamNews groups={groupsWithDiscussion} />);
      fireEvent.click(screen.getByRole('tab', { name: /AI & Robotics/ }));
      const activeDisc = screen.getByRole('button', { name: /Active Discussions/ });
      expect(within(activeDisc).getByText('1')).toBeInTheDocument();
      fireEvent.click(activeDisc);
      expect(screen.getByText(/Headline ai-discuss/)).toBeInTheDocument();
      expect(screen.queryByText(/Headline ai-plain/)).not.toBeInTheDocument();
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
    // Insertion order alpha, beta, zeta — followed-first sorting must pin Zeta on mount.
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
      expect(getTeamOrder()).toEqual(['Zeta', 'Alpha', 'Beta']);

      fireEvent.click(screen.getByRole('button', { name: 'Follow Beta' }));

      expect(screen.getByRole('button', { name: 'Following Beta' })).toBeInTheDocument();
      expect(getTeamOrder()).toEqual(['Zeta', 'Alpha', 'Beta']); // order frozen until reload
    });

    it('clicking Unfollow on a pinned cluster keeps its position (symmetric freeze)', () => {
      renderTeamNews(<TeamNews groups={frozenGroups} />);

      fireEvent.click(screen.getByRole('button', { name: 'Following Zeta' }));

      expect(screen.getByRole('button', { name: 'Follow Zeta' })).toBeInTheDocument();
      expect(getTeamOrder()).toEqual(['Zeta', 'Alpha', 'Beta']); // still pinned this session
    });

    it('reverts the button (but not the order) when the server rejects with a null response', () => {
      renderTeamNews(<TeamNews groups={frozenGroups} />);
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
      expect(getTeamOrder()).toEqual(['Beta', 'Alpha', 'Zeta']);
    });
  });

  describe('upvote — session-stable ordering (frozen until reload)', () => {
    // No followed items → default sort resolves to 'popular', which ranks clusters
    // by upvote count. Equal counts keep insertion order (stable sort), so upvoting
    // Yankee (1 → 2) would rank it above Xray without the mount-time count snapshot.
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

      expect(mockRouterPush).toHaveBeenCalledWith('/home?news=ai-1#login');
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

  describe('popular this week — scroll to story', () => {
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
      openSpy.mockRestore();
    });

    it('highlights the revealed row and removes the highlight shortly after', () => {
      jest.useFakeTimers();
      renderTeamNews(<TeamNews groups={groups} popularItems={[popularItem({ uid: 'ai-1' })]} />);

      fireEvent.click(getRailButton('Headline ai-1'));
      const row = getFeedHeadline('Headline ai-1')!.closest('[role="button"]');
      expect(row).toHaveClass('storyHighlighted');

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
});
