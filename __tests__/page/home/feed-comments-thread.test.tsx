import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { FeedCommentsThread } from '@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedComments } from '@/services/feed/hooks/useFeedComments';
import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import type { IFeedComment, IFeedCommentsResponse } from '@/types/feed.types';

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

// Quill needs a real DOM and is lazy-loaded, so it is useless in jsdom and
// would render only its loading placeholder here. Stub it as a controlled
// textarea with the same contract — value in, string out, Enter submits — so
// these tests keep covering the THREAD rather than the editor. The editor's own
// behaviour (mention anchors, toolbar off) belongs in its own suite.
interface StubEditorProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  toolbarConfig?: unknown[];
  enableMentions?: boolean;
  maxLength?: number;
}

const mockEditorProps = jest.fn();
jest.mock('@/components/ui/RichTextEditor/RichTextEditor', () => ({
  __esModule: true,
  default: (props: StubEditorProps) => {
    mockEditorProps(props);
    const { value, onChange, onSubmit, placeholder, disabled } = props;
    return (
      <textarea
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit?.();
          }
        }}
      />
    );
  },
}));

// next/dynamic would hand back the loading placeholder on first render; resolve
// the one dynamic import in the module under test eagerly instead.
jest.mock('next/dynamic', () => () => {
  return require('@/components/ui/RichTextEditor/RichTextEditor').default;
});

// Forum writes are gated on forum.write, the same gate the /forum composer uses.
const mockForumAccess = jest.fn();
jest.mock('@/services/access-control/hooks/useForumAccess', () => ({
  useForumAccess: () => mockForumAccess(),
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
function mockThread(items: IFeedComment[], forumTopic?: IFeedCommentsResponse['forumTopic']) {
  useFeedCommentsMock.mockReturnValue({ data: { items, forumTopic } });
}

/** What the service reports about a NodeBB topic alongside its replies. */
function forumTopicMeta(totalReplyCount: number, url: string | null = '/forum/topics/5/96') {
  return { url, totalReplyCount, like: { likeCount: 0, viewerHasLiked: false } };
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
  mockForumAccess.mockReturnValue({ canWrite: true });
});

describe('FeedCommentsThread — list', () => {
  it('caps a CARD at the 2 MOST RECENT comments (oldest-first data — last 2, not first 2)', () => {
    const onViewAll = jest.fn();
    mockThread([comment('c1', 'First'), comment('c2', 'Second'), comment('c3', 'Third')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" onViewAll={onViewAll} />);

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();

    // The overflow escalates to the modal rather than growing the card.
    fireEvent.click(screen.getByRole('button', { name: 'View all 3 comments' }));
    expect(onViewAll).toHaveBeenCalled();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });

  it('renders the WHOLE thread in the modal — no cap, nothing left to expand', () => {
    mockThread([comment('c1', 'First'), comment('c2', 'Second'), comment('c3', 'Third')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="news-modal" />);

    expect(screen.getByText('First')).toBeInTheDocument();
    // Without this the card's "View all" would land on a modal showing the
    // same two comments behind the same button.
    expect(screen.queryByRole('button', { name: /View all/ })).not.toBeInTheDocument();
  });

  it('keeps a card row visible while its reply composer is open, even as the thread grows', () => {
    const onViewAll = jest.fn();
    mockThread([comment('c1', 'First'), comment('c2', 'Second')]);
    mockMutation(useAddFeedCommentMock);
    const { rerender } = render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" onViewAll={onViewAll} />);

    const [firstReply] = screen.getAllByRole('button', { name: 'Reply' });
    fireEvent.click(firstReply);
    expect(screen.getByPlaceholderText('Reply to Author c1…')).toBeInTheDocument();

    // A third comment arrives — a bare slice(-2) would drop c1 and take the
    // open composer (and its unsent draft) with it.
    mockThread([comment('c1', 'First'), comment('c2', 'Second'), comment('c3', 'Third')]);
    rerender(<FeedCommentsThread itemUid="n-1" kind="news" source="home" onViewAll={onViewAll} />);

    expect(screen.getByPlaceholderText('Reply to Author c1…')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
  });

  it('renders only the composer for an empty thread', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);
    expect(screen.getByPlaceholderText('Write your comment here…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View all/ })).not.toBeInTheDocument();
  });

  it('strips a script tag out of comment content entirely', () => {
    mockThread([comment('c1', '<script>alert(1)</script>Hello')]);
    mockMutation(useAddFeedCommentMock);
    const { container } = render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    // Content is sanitized HTML now, so the tag is removed rather than shown
    // literally — but it must never survive in any form.
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).not.toContain('alert(1)');
    expect(screen.getByText('Hello')).toBeInTheDocument();
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
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" onViewAll={jest.fn()} />);

    // 3 top-level + 1 reply = 4, matching what the count badge shows.
    expect(screen.getByRole('button', { name: 'View all 4 comments' })).toBeInTheDocument();
    // Only the last 2 top-level comments are visible, so the reply is hidden too.
    expect(screen.queryByText('Reply to first')).not.toBeInTheDocument();
  });

  it('submits a reply with its parentUid, and closes the reply box on success', () => {
    mockThread([comment('c1', 'Top level')]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    const input = screen.getByPlaceholderText('Reply to Author c1…');
    fireEvent.change(input, { target: { value: '  Agreed  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));

    expect(mutation.mutate).toHaveBeenCalledWith({ text: 'Agreed', parentUid: 'c1' }, expect.any(Object));

    act(() => mutation.mutate.mock.calls[0][1].onSuccess());
    expect(screen.queryByPlaceholderText('Reply to Author c1…')).not.toBeInTheDocument();
  });

  it('keeps the top-level composer separate from the reply box', () => {
    mockThread([comment('c1', 'Top level')]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    fireEvent.change(screen.getByPlaceholderText('Write your comment here…'), { target: { value: 'Top-level text' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    // No parentUid — typing in the main composer must never become a reply.
    expect(mutation.mutate).toHaveBeenCalledWith({ text: 'Top-level text' }, expect.any(Object));
  });

  it('opens only one reply box at a time', () => {
    mockThread([comment('c1', 'First'), comment('c2', 'Second')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const [firstReply, secondReply] = screen.getAllByRole('button', { name: 'Reply' });
    fireEvent.click(firstReply);
    expect(screen.getByPlaceholderText('Reply to Author c1…')).toBeInTheDocument();

    fireEvent.click(secondReply);
    expect(screen.queryByPlaceholderText('Reply to Author c1…')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Reply to Author c2…')).toBeInTheDocument();
  });

  it('Cancel discards the reply draft without mutating', () => {
    mockThread([comment('c1', 'Top level')]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    fireEvent.change(screen.getByPlaceholderText('Reply to Author c1…'), { target: { value: 'never mind' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mutation.mutate).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('Reply to Author c1…')).not.toBeInTheDocument();
  });

  it('hides Reply at the depth cap — a deeper reply would render alongside its own parent', () => {
    mockThread([
      comment('c1', 'Level 0', false, [reply('c2', 'Level 1', 'c1', false, [reply('c3', 'Level 2', 'c2')])]),
    ]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    // Levels 0 and 1 can be replied to; level 2 (the cap) cannot.
    expect(screen.getAllByRole('button', { name: 'Reply' })).toHaveLength(2);
  });

  it('renders an in-flight reply under the comment it answers, not at the top of the thread', () => {
    mockThread([comment('c1', 'Answered'), comment('c2', 'Untouched')]);
    mockMutation(useAddFeedCommentMock, { isPending: true, variables: { text: 'Sending', parentUid: 'c1' } });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const pending = screen.getByText('Sending');
    // `.item` is the whole comment row. Not `.closest('div')` — comment bodies
    // are a div-wrapped <p> now, so that would stop at the content wrapper.
    const answeredRow = screen.getByText('Answered').closest('.item');
    const untouchedRow = screen.getByText('Untouched').closest('.item');

    expect(answeredRow?.contains(pending)).toBe(true);
    expect(untouchedRow?.contains(pending)).toBe(false);
    expect(screen.getByText('· posting…')).toBeInTheDocument();
  });

  it('scopes a failed reply’s error to that reply box only', () => {
    mockThread([comment('c1', 'Top level')]);
    mockMutation(useAddFeedCommentMock, { isError: true, variables: { text: 'Agreed', parentUid: 'c1' } });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));

    // Exactly one error, next to the composer that produced it — not duplicated
    // above the top-level composer.
    expect(screen.getAllByRole('alert')).toHaveLength(1);
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

describe('FeedCommentsThread — composer (HTML content)', () => {
  it('configures the editor with no toolbar — which is what keeps toasts out of the feed', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    // RichTextEditor registers its imageUploader module only when the toolbar
    // carries 'image', and that module holds the only two toast() calls in the
    // component. An empty toolbar is therefore load-bearing, not cosmetic.
    expect(mockEditorProps).toHaveBeenCalledWith(
      expect.objectContaining({ toolbarConfig: [], enableMentions: true, maxLength: 2000 }),
    );
  });

  it('treats Quill’s empty value as empty rather than as content', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    // `<p><br></p>` is truthy, so the old `!value.trim()` guard would have
    // enabled Comment and posted an empty comment.
    fireEvent.change(screen.getByPlaceholderText('Write your comment here…'), {
      target: { value: '<p><br></p>' },
    });

    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled();
    fireEvent.submit(screen.getByPlaceholderText('Write your comment here…').closest('form')!);
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it('submits on Enter', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const field = screen.getByPlaceholderText('Write your comment here…');
    fireEvent.change(field, { target: { value: '<p>ship it</p>' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(mutation.mutate).toHaveBeenCalledWith({ text: '<p>ship it</p>', parentUid: undefined }, expect.any(Object));
  });

  it('refuses a comment whose markup exceeds the server’s cap, and says why', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const field = screen.getByPlaceholderText('Write your comment here…');
    // Short to read, far too long on the wire — which is what a pile of
    // mention anchors does. The editor caps VISIBLE length, so only this
    // guard stands between the member and a bare 400.
    fireEvent.change(field, { target: { value: `<p>${'a'.repeat(2100)}</p>` } });
    fireEvent.submit(field.closest('form')!);

    expect(mutation.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/too long to post/i);

    // Clears on the next keystroke, like every other composer error.
    fireEvent.change(field, { target: { value: '<p>shorter</p>' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

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

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t post your comment — try again.');

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

describe('FeedCommentsThread — forum posts', () => {
  it('lets a member with forum.write comment and reply on a forum post', () => {
    mockThread([comment('c1', 'A real forum reply')]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="news-modal" forumMainPid={263} />);

    fireEvent.change(screen.getByPlaceholderText('Write your comment here…'), { target: { value: 'Nice work' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(mutation.mutate).toHaveBeenCalledWith({ text: 'Nice work' }, expect.any(Object));
  });

  it('leaves the thread readable but offers no composer without forum.write', () => {
    mockForumAccess.mockReturnValue({ canWrite: false });
    mockThread([comment('c1', 'A real forum reply')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="news-modal" forumMainPid={263} />);

    expect(screen.getByText('A real forum reply')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Write your comment here…')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
  });

  it('never gates a news thread on forum.write', () => {
    mockForumAccess.mockReturnValue({ canWrite: false });
    mockThread([]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="news-modal" />);

    expect(screen.getByPlaceholderText('Write your comment here…')).toBeInTheDocument();
  });

  it('links to the forum for the replies NodeBB’s single page left out', () => {
    // 50 replies exist; one page of them arrived.
    mockThread([comment('c1', 'Loaded'), comment('c2', 'Also loaded')], forumTopicMeta(50));
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="news-modal" forumMainPid={263} />);

    const link = screen.getByRole('link', { name: '48 more comments on the forum →' });
    expect(link).toHaveAttribute('href', '/forum/topics/5/96');
  });

  it('drops the number from a card’s escalation when N would understate the thread', () => {
    mockThread([comment('c1', 'One'), comment('c2', 'Two'), comment('c3', 'Three')], forumTopicMeta(50));
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="home" forumMainPid={263} onViewAll={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'View all comments' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View all \d/ })).not.toBeInTheDocument();
  });

  it('still escalates from a card when the thread fits but NodeBB has more', () => {
    const onViewAll = jest.fn();
    // Under the cap, so the count alone would hide the escalation — but the
    // card suppresses the forum link, so this would be a dead end.
    mockThread([comment('c1', 'One'), comment('c2', 'Two')], forumTopicMeta(50));
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="home" forumMainPid={263} onViewAll={onViewAll} />);

    fireEvent.click(screen.getByRole('button', { name: 'View all comments' }));
    expect(onViewAll).toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: /more comments on the forum/ })).not.toBeInTheDocument();
  });

  it('shows no forum link when the whole thread is already here', () => {
    mockThread([comment('c1', 'One'), comment('c2', 'Two')], forumTopicMeta(2));
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="news-modal" forumMainPid={263} />);

    expect(screen.queryByRole('link', { name: /on the forum/ })).not.toBeInTheDocument();
  });

  it('labels an attachment-only comment instead of rendering a blank row', () => {
    // A comment that was just an image strips to empty text by contract.
    mockThread([comment('c1', '')], forumTopicMeta(1));
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="news-modal" forumMainPid={263} />);

    expect(screen.getByRole('link', { name: /Shared an image or file/ })).toHaveAttribute('href', '/forum/topics/5/96');
  });

  it('still labels an attachment-only comment when there is no topic link', () => {
    mockThread([comment('c1', '')], forumTopicMeta(1, null));
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="news-modal" forumMainPid={263} />);

    expect(screen.getByText('Shared an image or file.')).toBeInTheDocument();
  });

  it('surfaces the forum’s own reason when it has one, in place of the generic line', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock, {
      isError: true,
      error: new Error('[[error:content-too-short, Content too short]]'),
      variables: { text: 'ok' },
    });
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="news-modal" forumMainPid={263} />);

    expect(screen.getByRole('alert')).toHaveTextContent('too short for the forum');
  });

  it('hides an untranslated NodeBB error key behind the generic line', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock, {
      isError: true,
      error: new Error('[[error:some-key-nobody-can-read]]'),
      variables: { text: 'ok' },
    });
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="news-modal" forumMainPid={263} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t post your comment — try again.');
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

  it('prefers a card’s onSignIn over the bare #login push, so the round trip keeps its place', () => {
    const onSignIn = jest.fn();
    signOut();
    mockThread([comment('c1', 'Readable while signed out')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" onViewAll={jest.fn()} onSignIn={onSignIn} />);

    fireEvent.click(screen.getByRole('button', { name: 'sign in to comment' }));
    expect(onSignIn).toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('shows no composer before the auth store hydrates — a guest must not be able to type', () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
    mockThread([comment('c1', 'Readable')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" onViewAll={jest.fn()} />);

    // Otherwise a fast guest types a comment and gets "couldn't post" instead
    // of a login prompt.
    expect(screen.queryByPlaceholderText('Write your comment here…')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'sign in to comment' })).not.toBeInTheDocument();
    expect(screen.getByText('Readable')).toBeInTheDocument();
  });
});

describe('FeedCommentsThread — read-path states', () => {
  it('shows a busy placeholder while the thread loads, not an empty box', () => {
    useFeedCommentsMock.mockReturnValue({ isPending: true });
    mockMutation(useAddFeedCommentMock);
    const { container } = render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" onViewAll={jest.fn()} />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText('No comments yet.')).not.toBeInTheDocument();
  });

  it('offers a retry when the thread fails to load', () => {
    const refetch = jest.fn();
    useFeedCommentsMock.mockReturnValue({ isError: true, refetch });
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" onViewAll={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('says the thread is empty rather than expanding to nothing', () => {
    // A forum member with read but not write access gets no composer either,
    // so without this the badge opens onto a blank box.
    mockForumAccess.mockReturnValue({ canWrite: false });
    mockThread([], forumTopicMeta(0));
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="fp_96" kind="forum" source="home" onViewAll={jest.fn()} />);

    expect(screen.queryByPlaceholderText('Write your comment here…')).not.toBeInTheDocument();
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
  });
});
