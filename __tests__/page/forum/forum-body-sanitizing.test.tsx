import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { CommentItem } from '@/components/page/forum/PostComments/components/CommentItem';
import { Posts } from '@/components/page/forum/Posts/Posts';
import { processPostContent } from '@/components/page/forum/Post';
import type { NestedComment } from '@/components/page/forum/PostComments/types';
import type { IUserInfo } from '@/types/shared.types';
import { parseSafeHtml } from '@/utils/html';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/forum',
  useParams: () => ({}),
}));
jest.mock('react-use', () => ({ useMedia: () => false }));
jest.mock('@/analytics/forum.analytics', () => ({
  useForumAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/components/page/forum/CommentsInputDesktop', () => ({ CommentsInputDesktop: () => null }));
jest.mock('@/components/page/forum/LikesButton', () => ({ LikesButton: () => null }));
jest.mock('@/components/page/forum/ItemMenu/ItemMenu', () => ({ ItemMenu: () => null }));
jest.mock('@/components/core/OhBadge/OhBadge', () => ({ OhBadge: () => null }));
jest.mock('react-infinite-scroll-component', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockPosts = jest.fn();
jest.mock('@/services/forum/hooks/useInfiniteForumPosts', () => ({
  useInfiniteForumPosts: () => mockPosts(),
}));

const IFRAME_BODY = '<p>Hello forum</p><iframe src="https://evil.example"></iframe><img src=x onerror="steal()">';

describe('forum bodies from NodeBB render sanitized', () => {
  it('a topic body renders no iframe and no handler, through the /forum post pipeline', () => {
    const { container } = render(
      <div>{parseSafeHtml(processPostContent(IFRAME_BODY).processedContent, 'forumPost')}</div>,
    );
    expect(screen.getByText('Hello forum')).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.innerHTML).not.toMatch(/onerror/);
  });

  it('keeps a markdown image through the pipeline', () => {
    const { container } = render(
      <div>{parseSafeHtml(processPostContent('![shot](https://cdn.test/x.png)').processedContent, 'forumPost')}</div>,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.test/x.png');
    expect(container.querySelector('img')).not.toHaveAttribute('style');
  });

  it('a comment renders no iframe', () => {
    const item = {
      pid: 1,
      tid: 2,
      content: IFRAME_BODY,
      timestamp: Date.now(),
      user: { displayname: 'Jane', uid: 1 },
      replies: [],
    } as unknown as NestedComment;
    const { container } = render(<CommentItem item={item} userInfo={{} as IUserInfo} />);
    expect(screen.getByText('Hello forum')).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('a list teaser whose escaped markup decodes into a tag renders no iframe', () => {
    mockPosts.mockReturnValue({
      data: [
        {
          tid: 1,
          cid: 1,
          title: 'Topic',
          teaser: { content: 'Teaser &lt;iframe src="https://evil.example"&gt;&lt;/iframe&gt; text' },
          user: { displayname: 'Jane', memberUid: 'm_1' },
          timestamp: Date.now(),
          viewcount: 0,
          votes: 0,
          postcount: 1,
        },
      ],
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      isFetchingNextPage: false,
      isLoading: false,
    });
    const { container } = render(<Posts />);
    expect(screen.getByText(/Teaser/)).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
  });
});
