import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { FeedCommentsThread } from '@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedComments } from '@/services/feed/hooks/useFeedComments';
import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import { useMembersSearch } from '@/services/members/hooks/useMembersSearch';
import type { IFeedComment } from '@/types/feed.types';

jest.mock('@/services/feed/hooks/useFeedComments', () => ({ useFeedComments: jest.fn() }));
jest.mock('@/services/feed/hooks/useAddFeedComment', () => ({ useAddFeedComment: jest.fn() }));
jest.mock('@/services/feed/hooks/useDeleteFeedComment', () => ({ useDeleteFeedComment: jest.fn() }));
jest.mock('@/services/members/hooks/useMembersSearch', () => ({ useMembersSearch: jest.fn() }));

const useFeedCommentsMock = useFeedComments as jest.Mock;
const useAddFeedCommentMock = useAddFeedComment as jest.Mock;
const useDeleteFeedCommentMock = useDeleteFeedComment as jest.Mock;
const useMembersSearchMock = useMembersSearch as jest.Mock;

// STABLE identities: the mention hook adopts results via an effect keyed on
// the results reference, exactly like the real hook's state value.
const NO_RESULTS: never[] = [];
const ANNA_RESULTS = [
  { uid: 'anna-uid', externalId: 'x1', name: 'Anna Chen', image: undefined, teamName: 'Lattice' },
  { uid: 'annab-uid', externalId: 'x2', name: 'Anna Board', image: undefined, teamName: 'Chorus' },
];

function mockMemberSearch() {
  useMembersSearchMock.mockImplementation((term: string) => ({
    results: term && 'anna chen'.startsWith(term.toLowerCase()) ? ANNA_RESULTS : NO_RESULTS,
    isLoading: false,
    error: null,
  }));
}

const routerPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

function comment(uid: string, text: string, isOwn = false): IFeedComment {
  return {
    uid,
    itemUid: 'n-1',
    author: { memberUid: `m-${uid}`, name: `Author ${uid}`, avatarUrl: null, role: 'Founder @ Lattice' },
    text,
    createdAt: '2026-07-01T00:00:00.000Z',
    isOwn,
  };
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
  mockMemberSearch();
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
    expect(screen.getByPlaceholderText('Write your comment here. Use @ to mention someone.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View all/ })).not.toBeInTheDocument();
  });

  it('renders comment text as inert text — a script tag never executes or nests markup', () => {
    mockThread([comment('c1', '<script>alert(1)</script>')]);
    mockMutation(useAddFeedCommentMock);
    const { container } = render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });
});

describe('FeedCommentsThread — composer', () => {
  it('submits the trimmed draft and clears the input only on success', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const input = screen.getByPlaceholderText('Write your comment here. Use @ to mention someone.');
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

    const input = screen.getByPlaceholderText('Write your comment here. Use @ to mention someone.');
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

    const input = screen.getByPlaceholderText('Write your comment here. Use @ to mention someone.');
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

describe('FeedCommentsThread — mentions', () => {
  const PLACEHOLDER = 'Write your comment here. Use @ to mention someone.';

  function typeDraft(value: string) {
    const input = screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement;
    fireEvent.change(input, { target: { value } });
    return input;
  }

  it('typing @ at a word boundary opens the dropdown in its type-to-search state', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    typeDraft('hey @');
    expect(screen.getByText('Type to search members')).toBeInTheDocument();
  });

  it('@ inside a word (email address) does NOT open the dropdown', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    typeDraft('mail me at oleg@precise');
    expect(screen.queryByText('Type to search members')).not.toBeInTheDocument();
    expect(screen.queryByText(/No members found/)).not.toBeInTheDocument();
  });

  it('selecting a member splices "@Name " into the draft and closes the dropdown', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const input = typeDraft('hey @ann');
    fireEvent.click(screen.getByText('Anna Chen'));

    expect(input).toHaveValue('hey @Anna Chen ');
    expect(screen.queryByText('Anna Board')).not.toBeInTheDocument();
  });

  it('submit carries structured mention offsets; none → mentions omitted', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    typeDraft('hey @ann');
    fireEvent.click(screen.getByText('Anna Chen'));
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(mutation.mutate).toHaveBeenCalledWith(
      {
        text: 'hey @Anna Chen',
        mentions: [{ uid: 'anna-uid', name: 'Anna Chen', offset: 4 }],
      },
      expect.any(Object),
    );

    // A mention whose text was edited away is dropped — payload omits mentions.
    mutation.mutate.mockClear();
    typeDraft('plain comment');
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));
    const [payload] = mutation.mutate.mock.calls[0];
    expect(payload.text).toBe('plain comment');
    expect(payload.mentions).toBeUndefined();
  });

  it('Enter with the dropdown open selects instead of submitting', () => {
    mockThread([]);
    const mutation = mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const input = typeDraft('hey @ann');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mutation.mutate).not.toHaveBeenCalled();
    expect(input).toHaveValue('hey @Anna Chen ');
  });

  it('Escape closes only the dropdown and stops propagation (modals must stay open)', () => {
    mockThread([]);
    mockMutation(useAddFeedCommentMock);
    const outerEscape = jest.fn();
    render(
      <div onKeyDown={(e) => e.key === 'Escape' && outerEscape()}>
        <FeedCommentsThread itemUid="n-1" kind="news" source="home" />
      </div>,
    );

    const input = typeDraft('hey @ann');
    expect(screen.getByText('Anna Chen')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('Anna Chen')).not.toBeInTheDocument();
    expect(outerEscape).not.toHaveBeenCalled();
  });

  it('renders server-supplied mentions as profile links; malformed payloads fall back to plain text', () => {
    mockThread([
      { ...comment('c1', 'welcome @Anna Chen !'), mentions: [{ uid: 'anna-uid', name: 'Anna Chen', offset: 8 }] },
      { ...comment('c2', 'bad @Anna Chen !'), mentions: [{ uid: '../evil', name: 'Anna Chen', offset: 4 }] },
    ]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const link = screen.getByRole('link', { name: '@Anna Chen' });
    expect(link).toHaveAttribute('href', '/members/anna-uid');
    // The malformed one renders as one inert text node — no link.
    expect(screen.getByText('bad @Anna Chen !')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});

describe('FeedCommentsThread — signed-out gate', () => {
  it('replaces the composer with a sign-in row that routes to #login, thread still readable', () => {
    signOut();
    mockThread([comment('c1', 'Readable while signed out')]);
    mockMutation(useAddFeedCommentMock);
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.queryByPlaceholderText('Write your comment here. Use @ to mention someone.')).not.toBeInTheDocument();
    expect(screen.getByText('Readable while signed out')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'sign in to comment' }));
    expect(routerPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });
});
