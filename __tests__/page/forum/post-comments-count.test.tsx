import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { PostComments } from '@/components/page/forum/PostComments';
import type { TopicResponse } from '@/services/forum/hooks/useForumPost';
import type { IUserInfo } from '@/types/shared.types';

// The comment rows are not what these assertions are about, and CommentItem
// drags in avatars, voting and the reply composer.
jest.mock('@/components/page/forum/PostComments/components/CommentItem', () => ({
  CommentItem: ({ item }: { item: { pid: number; content: string } }) => <div>{item.content}</div>,
}));

jest.mock('@/components/page/forum/CommentsInputDesktop', () => ({
  CommentsInputDesktop: () => <div data-testid="composer" />,
}));

jest.mock('react-use', () => ({ useMedia: () => false }));

type Post = NonNullable<TopicResponse['posts']>[number];

/** A reply as NodeBB serves it — only the fields this component reads. */
function post(pid: number, parentPid?: number): Post {
  return {
    pid,
    content: `Reply ${pid}`,
    parent: parentPid ? { pid: parentPid } : undefined,
  } as unknown as Post;
}

const userInfo = { rbac: { effectivePermissions: [{ code: 'forum.write' }] } } as unknown as IUserInfo;

function renderComments(comments: Post[], total?: number) {
  return render(
    <PostComments comments={comments} total={total} tid={5} mainPid={96} userInfo={userInfo} timestamp={0} />,
  );
}

describe('PostComments — the heading count', () => {
  it('counts the discussion, not the page of it that arrived', () => {
    // NodeBB served 19 of 48 replies. The stats row above already says 48, and
    // two "Comments" numbers disagreeing on one screen is the reported defect.
    renderComments(
      Array.from({ length: 19 }, (_, i) => post(i + 1)),
      48,
    );

    expect(screen.getByText('Comments (48)')).toBeInTheDocument();
  });

  it('says so when the list is only part of the discussion', () => {
    renderComments(
      Array.from({ length: 19 }, (_, i) => post(i + 1)),
      48,
    );

    // Without this, 48 over a list of 19 reads as replies having gone missing —
    // this page has no pagination to reach them with.
    expect(screen.getByText('29 more replies aren’t shown on this page.')).toBeInTheDocument();
  });

  it('says it in the singular for exactly one missing reply', () => {
    renderComments([post(1)], 2);

    expect(screen.getByText('1 more reply isn’t shown on this page.')).toBeInTheDocument();
  });

  it('stays quiet when the whole discussion is on the page', () => {
    renderComments([post(1), post(2)], 2);

    expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    expect(screen.queryByText(/aren’t shown|isn’t shown/)).not.toBeInTheDocument();
  });

  it('never claims fewer replies than it is listing, even from a stale postcount', () => {
    // A just-posted reply is in `posts` before the topic's own postcount
    // catches up; trusting it blindly would print "Comments (1)" over two rows.
    renderComments([post(1), post(2)], 1);

    expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    expect(screen.queryByText(/aren’t shown|isn’t shown/)).not.toBeInTheDocument();
  });

  it('falls back to the loaded length when no total is given', () => {
    renderComments([post(1), post(2)]);

    expect(screen.getByText('Comments (2)')).toBeInTheDocument();
  });

  it('renders (0) for a topic nobody has replied to', () => {
    renderComments([], 0);

    expect(screen.getByText('Comments (0)')).toBeInTheDocument();
  });

  it('renders nothing at all until the topic has loaded', () => {
    const { container } = render(
      <PostComments comments={undefined} tid={5} mainPid={96} userInfo={userInfo} timestamp={0} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
