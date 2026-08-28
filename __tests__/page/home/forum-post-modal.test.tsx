import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ForumPostModal } from '@/components/page/home/TeamNews/components/ForumPostModal/ForumPostModal';
import type { ForumPostUid, IFeedForumPost } from '@/types/feed.types';

jest.mock('@/utils/formatTimeAgo', () => ({ formatTimeAgo: () => '2d ago' }));

jest.mock('@/components/page/home/TeamNews/components/NewsShareMenu', () => ({
  FeedForumPostShareMenu: () => <button type="button">Share</button>,
}));

jest.mock('@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread', () => ({
  FeedCommentsThread: () => null,
}));

jest.mock('@/services/feed/hooks/useFeedComments', () => ({
  useFeedForumTopicBodyHtml: () => undefined,
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

describe('ForumPostModal', () => {
  it('opens the forum topic in a new tab from the Open in Forum button', () => {
    render(<ForumPostModal post={post} onClose={jest.fn()} onLikeToggle={jest.fn()} />);

    const openInForum = screen.getByRole('link', { name: 'Open in Forum' });
    expect(openInForum).toHaveAttribute('href', '/forum/topics/5/96');
    expect(openInForum).toHaveAttribute('target', '_blank');
  });

  it('also links the title to the same topic in a new tab', () => {
    render(<ForumPostModal post={post} onClose={jest.fn()} onLikeToggle={jest.fn()} />);

    const title = screen.getByRole('link', { name: 'Willow Is Live!' });
    expect(title).toHaveAttribute('href', '/forum/topics/5/96');
    expect(title).toHaveAttribute('target', '_blank');
  });

  it('hides Open in Forum when the post has no topic URL', () => {
    render(<ForumPostModal post={{ ...post, forumTopicUrl: null }} onClose={jest.fn()} onLikeToggle={jest.fn()} />);

    expect(screen.queryByRole('link', { name: 'Open in Forum' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Willow Is Live!' })).toBeInTheDocument();
  });
});
