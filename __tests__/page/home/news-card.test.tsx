import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { NewsCard } from '@/components/page/home/TeamNews/components/NewsCard/NewsCard';
import type { ITeamNewsDiscussion, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

const mockPush = jest.fn();
const mockUseCurrentUserStore = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

jest.mock('@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton', () => ({
  StartConversationButton: () => <button type="button">Discuss</button>,
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '4d ago',
}));

const item: ITeamNewsItem = {
  uid: 'news-1',
  teamUid: 'team-1',
  teamName: 'Protocol Labs',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT' as TeamNewsEventType,
  eventDate: '2026-06-01T00:00:00.000Z',
  title: 'Headline news-1',
  summary: null,
  sourceUrl: 'https://example.com/news-1',
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-06-02T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null } satisfies ITeamNewsDiscussion,
  upvoteCount: 2,
  viewerHasUpvoted: false,
};

describe('NewsCard upvotes', () => {
  let windowOpen: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
    windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpen.mockRestore();
  });

  it('renders no upvote button when onUpvoteToggle is not provided', () => {
    render(<NewsCard item={item} upvoteCount={2} viewerHasUpvoted={false} />);

    expect(screen.queryByRole('button', { name: /Upvote/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discuss' })).toBeInTheDocument();
  });

  it('renders the upvote button and forwards the toggle for a signed-in viewer', () => {
    const onUpvoteToggle = jest.fn();
    render(<NewsCard item={item} upvoteCount={2} viewerHasUpvoted={false} onUpvoteToggle={onUpvoteToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Upvote (2)' }));

    expect(onUpvoteToggle).toHaveBeenCalledWith(item);
    expect(mockPush).not.toHaveBeenCalled();
    // The card is itself a link — the upvote click must not open the article.
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('redirects guests to login instead of toggling', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    const onUpvoteToggle = jest.fn();
    render(<NewsCard item={item} upvoteCount={2} viewerHasUpvoted={false} onUpvoteToggle={onUpvoteToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Upvote (2)' }));

    expect(onUpvoteToggle).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });

  it('withholds the upvote button until the auth store hydrates', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: false });
    render(<NewsCard item={item} upvoteCount={2} viewerHasUpvoted={false} onUpvoteToggle={jest.fn()} />);

    expect(screen.queryByRole('button', { name: /Upvote/i })).not.toBeInTheDocument();
  });

  it('does not open the article when Enter is pressed on an inner button', () => {
    const onUpvoteToggle = jest.fn();
    render(<NewsCard item={item} hideTeam upvoteCount={2} viewerHasUpvoted={false} onUpvoteToggle={onUpvoteToggle} />);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Upvote (2)' }), { key: 'Enter' });
    expect(windowOpen).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('link'), { key: 'Enter' });
    expect(windowOpen).toHaveBeenCalledWith('https://example.com/news-1', '_blank', 'noopener,noreferrer');
  });

  it('shows the voted state with the count', () => {
    render(<NewsCard item={item} upvoteCount={3} viewerHasUpvoted onUpvoteToggle={jest.fn()} />);

    const button = screen.getByRole('button', { name: 'Remove upvote (3)' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('Upvoted');
    expect(button).toHaveTextContent('3');
  });

  it('hides the count at zero', () => {
    render(<NewsCard item={item} upvoteCount={0} viewerHasUpvoted={false} onUpvoteToggle={jest.fn()} />);

    const button = screen.getByRole('button', { name: 'Upvote (0)' });
    expect(button).toHaveTextContent(/^Upvote$/);
  });
});
