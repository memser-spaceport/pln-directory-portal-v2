import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ForumPostCard } from '@/components/page/home/TeamNews/components/ForumPostCard/ForumPostCard';
import type { ForumPostUid, IFeedForumPost } from '@/types/feed.types';

jest.mock('@/utils/formatTimeAgo', () => ({ formatTimeAgo: () => '2d ago' }));

const onFeedForumPostCardClicked = jest.fn();
const onFeedCommentThreadToggled = jest.fn();
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onFeedForumPostCardClicked, onFeedCommentThreadToggled }),
}));

jest.mock('@/components/page/home/TeamNews/components/NewsShareMenu', () => ({
  FeedForumPostShareMenu: () => null,
}));

// The thread's own behaviour lives in feed-comments-thread.test.tsx; this file
// covers the card's wiring to it.
const mockThread = jest.fn();
jest.mock('@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread', () => ({
  feedThreadDomId: (uid: string) => `feed-thread-${uid}`,
  FeedCommentsThread: (props: { itemUid: string; forumMainPid?: number; onViewAll: () => void }) => {
    mockThread(props);
    return <div data-testid={`thread-${props.itemUid}`} />;
  },
}));

const post: IFeedForumPost = {
  uid: 'fp_96' as ForumPostUid,
  tid: 96,
  mainPid: 263,
  title: 'Willow Is Live!',
  body: 'Hi Protocol Labs',
  author: { memberUid: 'm-1', name: 'Matt Curran', avatarUrl: null, role: 'Marketing' },
  focusAreas: [],
  category: 'Intros',
  createdAt: '2026-07-01T00:00:00.000Z',
  lastActivityAt: '2026-07-01T00:00:00.000Z',
  forumTopicUrl: '/forum/topics/5/96',
  commentCount: 2,
  likeCount: 5,
  viewCount: 87,
  viewerHasLiked: false,
};

function renderCard(overrides: Partial<React.ComponentProps<typeof ForumPostCard>> = {}) {
  const props = {
    post,
    position: 0,
    onOpenDetail: jest.fn(),
    onLikeToggle: jest.fn(),
    ...overrides,
  };
  render(<ForumPostCard {...props} />);
  return props;
}

beforeEach(() => jest.clearAllMocks());

describe('ForumPostCard', () => {
  it('renders the post as plain text with its author and category kicker', () => {
    renderCard();

    expect(screen.getByText('Willow Is Live!')).toBeInTheDocument();
    expect(screen.getByText('Hi Protocol Labs')).toBeInTheDocument();
    expect(screen.getByText('Matt Curran')).toBeInTheDocument();
  });

  it('shows the topic’s view count, the same number the forum listing shows', () => {
    renderCard();

    expect(screen.getByText('87 Views')).toBeInTheDocument();
  });

  it('shows "0 Views" on an unread topic rather than dropping the control', () => {
    renderCard({ post: { ...post, viewCount: 0 } });

    expect(screen.getByText('0 Views')).toBeInTheDocument();
  });

  it('opens the detail modal on a row click, reported as a row open', () => {
    const { onOpenDetail } = renderCard();

    fireEvent.click(screen.getByText('Willow Is Live!'));

    expect(onOpenDetail).toHaveBeenCalledWith(post);
    expect(onFeedForumPostCardClicked).toHaveBeenCalledWith(post, 0, 'home', 'row');
  });

  it('discloses the real NodeBB thread in place rather than opening the modal', () => {
    const { onOpenDetail } = renderCard();

    expect(screen.queryByTestId('thread-fp_96')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Comments, show/ }));

    expect(onOpenDetail).not.toHaveBeenCalled();
    expect(screen.getByTestId('thread-fp_96')).toBeInTheDocument();
    // The topic's opening post is what a top-level comment replies to.
    expect(mockThread).toHaveBeenCalledWith(expect.objectContaining({ forumMainPid: 263 }));
    expect(onFeedCommentThreadToggled).toHaveBeenCalledWith('fp_96', 'forum', true, 'home');
  });

  it('collapses the thread again on a second click', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /Comments, show/ }));
    fireEvent.click(screen.getByRole('button', { name: /Comments, hide/ }));

    expect(screen.queryByTestId('thread-fp_96')).not.toBeInTheDocument();
    expect(onFeedCommentThreadToggled).toHaveBeenLastCalledWith('fp_96', 'forum', false, 'home');
  });

  it('escalates the inline thread to the modal, flagged as such for analytics', () => {
    const { onOpenDetail } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: /Comments, show/ }));
    mockThread.mock.calls.at(-1)?.[0].onViewAll();

    expect(onOpenDetail).toHaveBeenCalledWith(post);
    expect(onFeedForumPostCardClicked).toHaveBeenCalledWith(post, 0, 'home', 'view-all-comments');
  });

  it('toggles the like without opening the modal', () => {
    const { onLikeToggle, onOpenDetail } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: /5/ }));

    expect(onLikeToggle).toHaveBeenCalledWith(post);
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it('refuses a like on the viewer’s own post — NodeBB rejects a self-vote', () => {
    const { onLikeToggle } = renderCard({ isOwnPost: true });

    const like = screen.getByRole('button', { name: /Like \(5\)/ });
    expect(like).toBeDisabled();
    // The count still reads; only the affordance goes.
    expect(like).toHaveTextContent('5');
    expect(like).toHaveAccessibleName(/You can’t like your own post/);

    fireEvent.click(like);
    expect(onLikeToggle).not.toHaveBeenCalled();
  });

  it('leaves Like alone on everyone else’s posts', () => {
    renderCard({ isOwnPost: false });

    expect(screen.getByRole('button', { name: 'Like (5)' })).toBeEnabled();
  });
});
