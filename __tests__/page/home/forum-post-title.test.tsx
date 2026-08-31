import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ForumPostTitle } from '@/components/page/home/TeamNews/components/ForumPostTitle/ForumPostTitle';
import type { ForumPostUid, IFeedForumPost } from '@/types/feed.types';

function post(overrides: Partial<IFeedForumPost> = {}): IFeedForumPost {
  return {
    uid: 'fp_1' as ForumPostUid,
    tid: 1,
    mainPid: 10,
    title: 'How should we shape the storage roadmap?',
    body: 'Body',
    author: { memberUid: 'm1', name: 'Mira Chen', avatarUrl: null, role: null },
    focusAreas: [],
    category: 'Compute',
    createdAt: '2026-08-01T00:00:00.000Z',
    lastActivityAt: '2026-08-01T00:00:00.000Z',
    forumTopicUrl: 'https://forum.example.com/topic/1',
    commentCount: 0,
    likeCount: 0,
    viewCount: 0,
    viewerHasLiked: false,
    ...overrides,
  };
}

describe('ForumPostTitle', () => {
  it('renders plain text by default — the feed card row owns the click', () => {
    render(<ForumPostTitle post={post()} />);

    expect(screen.getByRole('heading', { name: /storage roadmap/i })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links to the forum topic in a new tab when asked to', () => {
    render(<ForumPostTitle post={post()} asLink />);

    const link = screen.getByRole('link', { name: /storage roadmap/i });
    expect(link).toHaveAttribute('href', 'https://forum.example.com/topic/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('falls back to plain text when there is no topic URL to link to', () => {
    render(<ForumPostTitle post={post({ forumTopicUrl: null })} asLink />);

    expect(screen.getByRole('heading', { name: /storage roadmap/i })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps the id on the heading in both modes, so aria-labelledby still resolves', () => {
    const { unmount } = render(<ForumPostTitle id="title-1" post={post()} />);
    expect(screen.getByRole('heading', { name: /storage roadmap/i })).toHaveAttribute('id', 'title-1');
    unmount();

    render(<ForumPostTitle id="title-1" post={post()} asLink />);
    expect(screen.getByRole('heading', { name: /storage roadmap/i })).toHaveAttribute('id', 'title-1');
  });
});
