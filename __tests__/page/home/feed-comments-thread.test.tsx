import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { FeedCommentsThread } from '@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedComments } from '@/services/feed/hooks/useFeedComments';
import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import type { IFeedComment } from '@/types/feed.types';

jest.mock('@/services/feed/hooks/useFeedComments', () => ({ useFeedComments: jest.fn() }));
jest.mock('@/services/feed/hooks/useAddFeedComment', () => ({ useAddFeedComment: jest.fn() }));
jest.mock('@/services/feed/hooks/useDeleteFeedComment', () => ({ useDeleteFeedComment: jest.fn() }));

const useFeedCommentsMock = useFeedComments as jest.Mock;
const useAddFeedCommentMock = useAddFeedComment as jest.Mock;
const useDeleteFeedCommentMock = useDeleteFeedComment as jest.Mock;

const routerPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

function comment(uid: string, text: string, isOwn = false, replies: IFeedComment[] = []): IFeedComment {
  return {
    uid,
    itemUid: 'n-1',
    parentUid: null,
    author: { uid: `m-${uid}`, name: `Author ${uid}`, avatarUrl: null, role: 'Founder @ Lattice' },
    text,
    createdAt: '2026-07-01T00:00:00.000Z',
    isOwn,
    replies,
  };
}

/** A reply carries its parent, mirroring what both backends send. */
function reply(
  uid: string,
  text: string,
  parentUid: string,
  isOwn = false,
  replies: IFeedComment[] = [],
): IFeedComment {
  return { ...comment(uid, text, isOwn, replies), parentUid };
}

// Comments are oldest-first — these fixtures are ordered accordingly.
function mockThread(items: IFeedComment[]) {
  useFeedCommentsMock.mockReturnValue({ data: { items } });
}

function mockMutation(mock: jest.Mock, overrides: Partial<Record<string, unknown>> = {}) {
  const mutation = {
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    variables: undefined,
    reset: jest.fn(),
    ...overrides,
  };
  mock.mockReturnValue(mutation);
  return mutation;
}

function signIn() {
  useCurrentUserStore.setState({
    currentUser: { uid: 'viewer-1', name: 'Test Viewer' },
    isHydrated: true,
  });
}

function signOut() {
  useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
}

beforeEach(() => {
  jest.clearAllMocks();
  signIn();
  mockMutation(useDeleteFeedCommentMock);
});

describe('FeedCommentsThread — list', () => {
  it('caps at the 2 MOST RECENT comments (oldest-first data — last 2, not first 2) behind "View all N"', () => {
    mockThread([comment('c1', 'First'), comment('c2', 'Second'), comment('c3', 'Third')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View all 3 comments' }));
    expect(screen.getByText('First')).toBeInTheDocument();
  });

  it('renders only the composer for an empty thread', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);
    expect(screen.getByPlaceholderText('Write your comment here…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View all/ })).not.toBeInTheDocument();
  });

  it('renders comment text as inert text — a script tag never executes or nests markup', () => {
    mockThread([comment('c1', '<script>alert(1)</script>')]);
    mockMutation(useAddFeedCommentMock);
    const { container } = render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('falls back to a readable byline when the author has no name (the wire allows null)', () => {
    const nameless = { ...comment('c1', 'Anonymous-ish'), author: { uid: 'm-1', name: null, avatarUrl: null } };
    mockThread([nameless]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('shows a role only when the source provides one (news comments have none)', () => {
    const roleless = {
      ...comment('c1', 'No role here'),
      author: { uid: 'm-1', name: 'Author c1', avatarUrl: null },
    };
    mockThread([roleless]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.queryByText(/Founder @ Lattice/)).not.toBeInTheDocument();
  });
});

describe('FeedCommentsThread — replies', () => {
  it('renders a reply nested under the comment it answers', () => {
    mockThread([comment('c1', 'Top level', false, [reply('c2', 'A reply', 'c1')])]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.getByText('Top level')).toBeInTheDocument();
    expect(screen.getByText('A reply')).toBeInTheDocument();
  });

  it('renders three levels: comment → reply → reply-to-reply', () => {
    mockThread([
      comment('c1', 'Level 0', false, [reply('c2', 'Level 1', 'c1', false, [reply('c3', 'Level 2', 'c2')])]),
    ]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.getByText('Level 2')).toBeInTheDocument();
  });

  it('keeps a level-3 reply visible by lifting it to the cap — the wire allows unlimited depth', () => {
    mockThread([
      comment('c1', 'Level 0', false, [
        reply('c2', 'Level 1', 'c1', false, [
          reply('c3', 'Level 2', 'c2', false, [reply('c4', 'Level 3 lifted', 'c3')]),
        ]),
      ]),
    ]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.getByText('Level 3 lifted')).toBeInTheDocument();
  });

  it('counts replies in "View all N comments" — the cap applies to top-level comments only', () => {
    mockThread([
      comment('c1', 'First', false, [reply('c1r', 'Reply to first', 'c1')]),
      comment('c2', 'Second'),
      comment('c3', 'Third'),
    ]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    // 3 top-level + 1 reply = 4, matching what the count badge shows.
    expect(screen.getByRole('button', { name: 'View all 4 comments' })).toBeInTheDocument();
    // Only the last 2 top-level comments are visible, so the reply is hidden too.
    expect(screen.queryByText('Reply to first')).not.toBeInTheDocument();
  });

  it('offers delete on an own reply, not just on top-level comments', () => {
    mockThread([comment('c1', 'Not mine', false, [reply('c2', 'My reply', 'c1', true)])]);
    mockMutation(useAddFeedCommentMock);
    const deleteMutation = mockMutation(useDeleteFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(deleteMutation.mutate).toHaveBeenCalledWith({ commentUid: 'c2' }, expect.any(Object));
  });
});

describe('FeedCommentsThread — composer', () => {
  it('submits the trimmed draft and clears the input only on success', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const input = screen.getByPlaceholderText('Write your comment here…');
    fireEvent.change(input, { target: { value: '  Hello there  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(mutation.mutate).toHaveBeenCalledWith({ text: 'Hello there' }, expect.any(Object));
    // Not cleared yet — only the mutate-level onSuccess clears it.
    expect(input).toHaveValue('  Hello there  ');

    const { onSuccess } = mutation.mutate.mock.calls[0][1];
    act(() => onSuccess());
    expect(input).toHaveValue('');
  });

  it('never submits while a comment is already in flight (handler guard, not just the disabled attribute)', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock, { isPending: true, variables: { text: 'In flight' } });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const input = screen.getByPlaceholderText('Write your comment here…');
    fireEvent.change(input, { target: { value: 'Another one' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it('renders the in-flight comment dimmed from the mutation variables', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock, { isPending: true, variables: { text: 'Posting this now' } });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);
    expect(screen.getByText('Posting this now')).toBeInTheDocument();
    expect(screen.getByText('· posting…')).toBeInTheDocument();
  });

  it('shows the inline error with the draft intact, clearing the error on the next keystroke', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock, { isError: true });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t post your comment — try again.'.replace('’', "'"));

    const input = screen.getByPlaceholderText('Write your comment here…');
    fireEvent.change(input, { target: { value: 'retry text' } });
    expect(mutation.reset).toHaveBeenCalled();
  });
});

describe('FeedCommentsThread — delete', () => {
  it('shows a delete affordance only on comments the viewer owns', () => {
    mockThread([comment('c1', 'Not mine'), comment('c2', 'Mine', true)]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    // One own comment among two visible ⇒ exactly one delete affordance.
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1);
  });

  it('confirm → Yes calls the delete mutation for that comment, then collapses the confirm on success', () => {
    mockThread([comment('c1', 'Mine', true)]);
    mockMutation(useAddFeedCommentMock);
    const deleteMutation = mockMutation(useDeleteFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete this comment?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(deleteMutation.mutate).toHaveBeenCalledWith({ commentUid: 'c1' }, expect.any(Object));

    const { onSuccess } = deleteMutation.mutate.mock.calls[0][1];
    act(() => onSuccess());
    // Confirm state cleared — back to the plain "Delete" affordance.
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('Cancel dismisses the confirm without mutating', () => {
    mockThread([comment('c1', 'Mine', true)]);
    mockMutation(useAddFeedCommentMock);
    const deleteMutation = mockMutation(useDeleteFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(deleteMutation.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows an inline error scoped to the failed comment and never double-fires while pending', () => {
    mockThread([comment('c1', 'Mine', true)]);
    mockMutation(useAddFeedCommentMock);
    mockMutation(useDeleteFeedCommentMock, {
      isPending: true,
      isError: true,
      variables: { commentUid: 'c1' },
    });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText(/Couldn.t delete/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  });
});

describe('FeedCommentsThread — signed-out gate', () => {
  it('replaces the composer with a sign-in row that routes to #login, thread still readable', () => {
    signOut();
    mockThread([comment('c1', 'Readable while signed out')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.queryByPlaceholderText('Write your comment here…')).not.toBeInTheDocument();
    expect(screen.getByText('Readable while signed out')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'sign in to comment' }));
    expect(routerPush).toHaveBeenCalledWith(expect.stringContaining('#login'), { scroll: false });
  });
});
