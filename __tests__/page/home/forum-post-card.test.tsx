import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ForumPostCard } from '@/components/page/home/TeamNews/components/ForumPostCard/ForumPostCard';
import type { ForumPostUid, IFeedForumPost } from '@/types/feed.types';

jest.mock('@/utils/formatTimeAgo', () => ({ formatTimeAgo: () => '2d ago' }));

const onFeedForumPostCardClicked = jest.fn();
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onFeedForumPostCardClicked }),
}));

jest.mock('@/components/page/home/TeamNews/components/NewsShareMenu', () => ({
  FeedForumPostShareMenu: () => null,
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
  forumTopicUrl: '/forum/topics/5/96',
  commentCount: 2,
  likeCount: 5,
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

  it('opens the detail modal on a row click, reported as a row open', () => {
    const { onOpenDetail } = renderCard();

    fireEvent.click(screen.getByText('Willow Is Live!'));

    expect(onOpenDetail).toHaveBeenCalledWith(post);
    expect(onFeedForumPostCardClicked).toHaveBeenCalledWith(post, 0, 'home', 'row');
  });

  it('opens the same modal from the comment badge, flagged as such for analytics', () => {
    const { onOpenDetail } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'View comments' }));

    expect(onOpenDetail).toHaveBeenCalledWith(post);
    expect(onFeedForumPostCardClicked).toHaveBeenCalledWith(post, 0, 'home', 'comment-button');
  });

  it('never renders a thread inline on the card — the real NodeBB thread lives in the modal', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'View comments' }));

    expect(screen.queryByPlaceholderText('Write your comment here…')).not.toBeInTheDocument();
  });

  it('toggles the like without opening the modal', () => {
    const { onLikeToggle, onOpenDetail } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: /5/ }));

    expect(onLikeToggle).toHaveBeenCalledWith(post);
    expect(onOpenDetail).not.toHaveBeenCalled();
  });
});
