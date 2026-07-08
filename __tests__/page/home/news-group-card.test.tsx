import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { NewsGroupCard } from '@/components/page/home/TeamNews/components/NewsGroupCard/NewsGroupCard';
import type { ITeamNewsItem, TeamCluster } from '@/types/team-news.types';

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '2d ago',
}));

const mockStartConversationButton = jest.fn();
jest.mock('@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton', () => ({
  StartConversationButton: (props: { position: number }) => {
    mockStartConversationButton(props);
    return null;
  },
}));

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const makeItem = (uid: string, eventDate: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid,
  teamUid: 'team-1',
  teamName: 'Acme',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate,
  title: `Headline ${uid}`,
  summary: `Summary ${uid}`,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: eventDate,
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

const clusterWith = (items: ITeamNewsItem[]): TeamCluster => ({
  teamUid: 'team-1',
  teamName: 'Acme',
  teamLogoUrl: null,
  items,
});

describe('NewsGroupCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: false });
  });

  it('renders the team header', () => {
    render(<NewsGroupCard cluster={clusterWith([makeItem('a', '2026-05-03T00:00:00.000Z')])} />);
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/teams/team-1');
  });

  it('renders no follow button when onFollowToggle is not provided, even once hydrated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
    render(<NewsGroupCard cluster={clusterWith([makeItem('a', '2026-05-03T00:00:00.000Z')])} />);
    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('does not render the follow button before the auth store hydrates, even with onFollowToggle provided', () => {
    render(
      <NewsGroupCard cluster={clusterWith([makeItem('a', '2026-05-03T00:00:00.000Z')])} onFollowToggle={jest.fn()} />,
    );
    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('renders a compact Follow button next to the team name once hydrated, and calls onFollowToggle on click', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
    const onFollowToggle = jest.fn();
    render(
      <NewsGroupCard
        cluster={clusterWith([makeItem('a', '2026-05-03T00:00:00.000Z')])}
        onFollowToggle={onFollowToggle}
      />,
    );
    const followBtn = screen.getByRole('button', { name: 'Follow Acme' });
    fireEvent.click(followBtn);
    expect(onFollowToggle).toHaveBeenCalledWith('team-1', 'Acme', false);
  });

  it('shows "Following" and does not open the story card when the follow button is clicked', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    const onFollowToggle = jest.fn();
    render(
      <NewsGroupCard
        cluster={clusterWith([makeItem('a', '2026-05-03T00:00:00.000Z')])}
        isFollowing
        onFollowToggle={onFollowToggle}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Following Acme' }));
    expect(onFollowToggle).toHaveBeenCalledWith('team-1', 'Acme', true);
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('redirects to login instead of toggling follow when unauthenticated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    const onFollowToggle = jest.fn();
    render(
      <NewsGroupCard
        cluster={clusterWith([makeItem('a', '2026-05-03T00:00:00.000Z')])}
        onFollowToggle={onFollowToggle}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Follow Acme' }));
    expect(onFollowToggle).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });

  it('renders a story with its summary when present, and omits the paragraph when absent', () => {
    const withSummary = makeItem('a', '2026-05-03T00:00:00.000Z');
    const withoutSummary = makeItem('b', '2026-05-02T00:00:00.000Z', { summary: null });
    render(<NewsGroupCard cluster={clusterWith([withSummary, withoutSummary])} />);
    expect(screen.getByText('Summary a')).toBeInTheDocument();
    expect(screen.queryByText('Summary b')).not.toBeInTheDocument();
  });

  it('shows up to 3 stories sorted newest-first regardless of input order, with no expander', () => {
    const items = [
      makeItem('oldest', '2026-05-01T00:00:00.000Z'),
      makeItem('newest', '2026-05-03T00:00:00.000Z'),
      makeItem('middle', '2026-05-02T00:00:00.000Z'),
    ];
    render(<NewsGroupCard cluster={clusterWith(items)} />);
    const headlines = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headlines).toEqual(['Headline newest', 'Headline middle', 'Headline oldest']);
    expect(screen.queryByRole('button', { name: /view all/i })).not.toBeInTheDocument();
  });

  it('shows an expander when there are more than 3 stories, and toggles the visible list', () => {
    const items = Array.from({ length: 5 }, (_, i) => makeItem(`s${i}`, `2026-05-0${i + 1}T00:00:00.000Z`));
    render(<NewsGroupCard cluster={clusterWith(items)} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    const expander = screen.getByRole('button', { name: 'View all 5 updates from Acme' });

    fireEvent.click(expander);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  it('fires onStoryClick with the clicked story and opens its sourceUrl', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    const onStoryClick = jest.fn();
    const item = makeItem('a', '2026-05-03T00:00:00.000Z');
    render(<NewsGroupCard cluster={clusterWith([item])} onStoryClick={onStoryClick} />);

    fireEvent.click(screen.getByText('Headline a'));
    expect(onStoryClick).toHaveBeenCalledWith(item);
    expect(openSpy).toHaveBeenCalledWith('https://example.com/a', '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('gives each story a distinct position within the card, not the card position', () => {
    const items = [
      makeItem('a', '2026-05-03T00:00:00.000Z'),
      makeItem('b', '2026-05-02T00:00:00.000Z'),
      makeItem('c', '2026-05-01T00:00:00.000Z'),
    ];
    render(<NewsGroupCard cluster={clusterWith(items)} />);
    const positions = mockStartConversationButton.mock.calls.map(([props]) => props.position);
    expect(positions).toEqual([0, 1, 2]);
  });

  it("two cards' expanders operate independently", () => {
    const clusterA = clusterWith(
      Array.from({ length: 5 }, (_, i) => makeItem(`a${i}`, `2026-05-0${i + 1}T00:00:00.000Z`)),
    );
    const clusterB = {
      ...clusterWith(Array.from({ length: 5 }, (_, i) => makeItem(`b${i}`, `2026-05-0${i + 1}T00:00:00.000Z`))),
      teamUid: 'team-2',
      teamName: 'Globex',
    };

    render(
      <>
        <NewsGroupCard cluster={clusterA} />
        <NewsGroupCard cluster={clusterB} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View all 5 updates from Acme' }));
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View all 5 updates from Globex' })).toBeInTheDocument();
  });

  it('resets to collapsed when remounted with a fresh key (simulating a filter change)', () => {
    const items = Array.from({ length: 5 }, (_, i) => makeItem(`s${i}`, `2026-05-0${i + 1}T00:00:00.000Z`));
    const { rerender } = render(<NewsGroupCard key="tab-a" cluster={clusterWith(items)} />);
    fireEvent.click(screen.getByRole('button', { name: 'View all 5 updates from Acme' }));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5);

    rerender(<NewsGroupCard key="tab-b" cluster={clusterWith(items)} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  it("renders an Upvote button reflecting the story's upvote state", () => {
    const item = makeItem('a', '2026-05-03T00:00:00.000Z', { isUpvoted: true, upvoteCount: 5 });
    render(<NewsGroupCard cluster={clusterWith([item])} />);
    expect(screen.getByRole('button', { name: 'Remove upvote (5)' })).toBeInTheDocument();
  });

  it('redirects to login instead of calling onUpvoteToggle when unauthenticated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    const onUpvoteToggle = jest.fn();
    const item = makeItem('a', '2026-05-03T00:00:00.000Z');
    render(<NewsGroupCard cluster={clusterWith([item])} onUpvoteToggle={onUpvoteToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Upvote (0)' }));
    expect(onUpvoteToggle).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });

  it('calls onUpvoteToggle with the clicked story when authenticated, without opening the story', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    const onUpvoteToggle = jest.fn();
    const item = makeItem('a', '2026-05-03T00:00:00.000Z');
    render(<NewsGroupCard cluster={clusterWith([item])} onUpvoteToggle={onUpvoteToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Upvote (0)' }));
    expect(onUpvoteToggle).toHaveBeenCalledWith(item);
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
