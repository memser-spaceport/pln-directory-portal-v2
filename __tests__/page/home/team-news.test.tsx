import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { TeamNews } from '@/components/page/home/TeamNews/TeamNews';
import type { ITeamNewsGroup, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

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

const makeItem = (uid: string, eventType: TeamNewsEventType, focusAreaTitles: string[]): ITeamNewsItem => ({
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
    render(<TeamNews groups={[]} />);
    expect(screen.getByRole('heading', { level: 2, name: /News from the network/i })).toBeInTheDocument();
    expect(screen.getByText(/No network news in the last 14 days yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('renders the section, tabs with counts, and category chips when populated', () => {
    render(<TeamNews groups={groups} />);
    expect(screen.getByRole('heading', { level: 2, name: /News from the network/i })).toBeInTheDocument();
    expect(screen.getByText('5 new')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /AI & Robotics/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Digital Human Rights/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All categories/ })).toHaveClass(/catActive/);
  });

  it('switches to a focus-area tab and reports analytics', () => {
    render(<TeamNews groups={groups} />);
    fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
    expect(mockOnTabClicked).toHaveBeenCalledWith('Digital Human Rights', dhrItems.length);
    expect(screen.getByRole('tab', { name: /Digital Human Rights/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Headline dhr-1/)).toBeInTheDocument();
    expect(screen.queryByText(/Headline ai-1/)).not.toBeInTheDocument();
  });

  it('filters by category and reports analytics with current tab context', () => {
    render(<TeamNews groups={groups} />);
    fireEvent.click(screen.getByRole('button', { name: /Funding/ }));
    expect(mockOnCategoryClicked).toHaveBeenCalledWith('FUNDING', 1, 'All');
    expect(screen.getByText(/Headline ai-1/)).toBeInTheDocument();
    expect(screen.queryByText(/Headline ai-2/)).not.toBeInTheDocument();
  });

  it('disables a category chip when its count is zero (other than the All chip)', () => {
    render(<TeamNews groups={groups} />);
    // Tab to DHR — only MILESTONE + ANNOUNCEMENT items, so FUNDING/LAUNCH/PARTNERSHIP should disable.
    fireEvent.click(screen.getByRole('tab', { name: /Digital Human Rights/ }));
    expect(screen.getByRole('button', { name: /^Funding$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Launch$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Milestone/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /All categories/ })).not.toBeDisabled();
  });

  it('paginates with Load more and reports analytics', () => {
    render(<TeamNews groups={groups} pageSize={2} />);
    // 5 items total, pageSize=2 → first page shows 2.
    expect(screen.getByText(/Showing 2 of 5/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load 2 more/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Load 2 more/ }));
    expect(mockOnLoadMoreClicked).toHaveBeenCalledWith(2, 5, 'All', 'all');
    expect(screen.getByText(/Showing 4 of 5/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Load 1 more/ }));
    expect(screen.queryByRole('button', { name: /Load/ })).not.toBeInTheDocument();
  });

  it('resets pagination to first page when switching tabs or categories', () => {
    render(<TeamNews groups={groups} pageSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: /Load 2 more/ }));
    expect(screen.getByText(/Showing 4 of 5/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /AI & Robotics/ }));
    expect(screen.getByText(/Showing 2 of 3/)).toBeInTheDocument();
    // AI & Robotics has 1 Launch item — chip label is "Launch 1"
    fireEvent.click(screen.getByRole('button', { name: /^Launch\b/ }));
    expect(screen.queryByRole('button', { name: /Load/ })).not.toBeInTheDocument();
  });

  it('renders the per-filter empty state when the active focus area has no items', () => {
    // A group can come back with items: [] in defensive scenarios; switching to it should render the per-filter empty state.
    const mixed: ITeamNewsGroup[] = [
      { focusArea: FA_AI, total: 0, items: [] },
      { focusArea: FA_DHR, total: 1, items: [makeItem('dhr-only', 'MILESTONE', ['Digital Human Rights'])] },
    ];
    render(<TeamNews groups={mixed} />);
    fireEvent.click(screen.getByRole('tab', { name: /AI & Robotics/ }));
    expect(screen.getByText(/No network news in this filter/i)).toBeInTheDocument();
  });

  it('shows g.total in tab badge, not items.length', () => {
    const groupsWithLargerTotal: ITeamNewsGroup[] = [
      { focusArea: FA_AI, total: 99, items: aiItems },
      { focusArea: FA_DHR, total: dhrItems.length, items: dhrItems },
    ];
    render(<TeamNews groups={groupsWithLargerTotal} />);
    const aiTab = screen.getByRole('tab', { name: /AI & Robotics/ });
    expect(within(aiTab).getByText('99')).toBeInTheDocument();
  });

  it('reports analytics when a card is clicked', () => {
    render(<TeamNews groups={groups} />);
    const card = screen.getByText(/Headline ai-1/).closest('a');
    expect(card).toHaveAttribute('href', 'https://example.com/ai-1');
    expect(card).toHaveAttribute('target', '_blank');
    expect(card).toHaveAttribute('rel', 'noopener noreferrer');
    fireEvent.click(within(card!).getByText(/Headline ai-1/));
    expect(mockOnCardClicked).toHaveBeenCalledTimes(1);
    const [item, position] = mockOnCardClicked.mock.calls[0];
    expect(item.uid).toBe('ai-1');
    expect(typeof position).toBe('number');
  });
});
