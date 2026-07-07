import '@testing-library/jest-dom';
import type { ReactElement } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TeamNews } from '@/components/page/home/TeamNews/TeamNews';
import type { ITeamNewsDiscussion, ITeamNewsGroup, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

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

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsTabClicked: (...a: unknown[]) => mockOnTabClicked(...a),
    onTeamNewsCategoryClicked: (...a: unknown[]) => mockOnCategoryClicked(...a),
    onTeamNewsLoadMoreClicked: (...a: unknown[]) => mockOnLoadMoreClicked(...a),
    onTeamNewsCardClicked: (...a: unknown[]) => mockOnCardClicked(...a),
  }),
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '2d ago',
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
  beforeEach(() => jest.clearAllMocks());

  it('renders the global empty state when there are no items', () => {
    renderTeamNews(<TeamNews groups={[]} />);
    expect(screen.getByRole('heading', { level: 2, name: /News from the network/i })).toBeInTheDocument();
    expect(screen.getByText(/No network news in the last 14 days yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('renders the section, tabs with counts, and category chips when populated', () => {
    renderTeamNews(<TeamNews groups={groups} />);
    expect(screen.getByRole('heading', { level: 2, name: /News from the network/i })).toBeInTheDocument();
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
    const card = screen.getByText(/Headline ai-1/).closest('[role="link"]');
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
  });
});
