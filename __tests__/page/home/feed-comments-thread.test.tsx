import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { FeedCommentsThread } from '@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedComments } from '@/services/feed/hooks/useFeedComments';
import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import type { IFeedComment } from '@/types/feed.types';

jest.mock('@/services/feed/hooks/useFeedComments', () => ({ useFeedComments: jest.fn() }));
jest.mock('@/services/feed/hooks/useAddFeedComment', () => ({ useAddFeedComment: jest.fn() }));

const useFeedCommentsMock = useFeedComments as jest.Mock;
const useAddFeedCommentMock = useAddFeedComment as jest.Mock;

const routerPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

function comment(uid: string, text: string): IFeedComment {
  return {
    uid,
    itemUid: 'n-1',
    author: { memberUid: `m-${uid}`, name: `Author ${uid}`, avatarUrl: null, role: 'Founder @ Lattice' },
    text,
    createdAt: '2026-07-01T00:00:00.000Z',
  };
}

function mockThread(items: IFeedComment[]) {
  useFeedCommentsMock.mockReturnValue({ data: { items, total: items.length } });
}

function mockMutation(overrides: Partial<Record<string, unknown>> = {}) {
  const mutation = {
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    variables: undefined,
    reset: jest.fn(),
    ...overrides,
  };
  useAddFeedCommentMock.mockReturnValue(mutation);
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
});

describe('FeedCommentsThread — list', () => {
  it('caps at 2 comments behind "View all N", expanding on click', () => {
    mockThread([comment('c1', 'First'), comment('c2', 'Second'), comment('c3', 'Third')]);
    mockMutation();
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('Third')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View all 3 comments' }));
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('renders only the composer for an empty thread', () => {
    mockThread([]);
    mockMutation();
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);
    expect(screen.getByPlaceholderText('Write your comment here…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View all/ })).not.toBeInTheDocument();
  });

  it('renders comment text as inert text — a script tag never executes or nests markup', () => {
    mockThread([comment('c1', '<script>alert(1)</script>')]);
    mockMutation();
    const { container } = render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });
});

describe('FeedCommentsThread — composer', () => {
  it('submits the trimmed draft and clears the input only on success', () => {
    mockThread([]);
    const mutation = mockMutation();
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
    const mutation = mockMutation({ isPending: true, variables: { text: 'In flight' } });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    const input = screen.getByPlaceholderText('Write your comment here…');
    fireEvent.change(input, { target: { value: 'Another one' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it('renders the in-flight comment dimmed from the mutation variables', () => {
    mockThread([]);
    mockMutation({ isPending: true, variables: { text: 'Posting this now' } });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);
    expect(screen.getByText('Posting this now')).toBeInTheDocument();
    expect(screen.getByText('· posting…')).toBeInTheDocument();
  });

  it('shows the inline error with the draft intact, clearing the error on the next keystroke', () => {
    mockThread([]);
    const mutation = mockMutation({ isError: true });
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t post your comment — try again.'.replace('’', "'"));

    const input = screen.getByPlaceholderText('Write your comment here…');
    fireEvent.change(input, { target: { value: 'retry text' } });
    expect(mutation.reset).toHaveBeenCalled();
  });
});

describe('FeedCommentsThread — signed-out gate', () => {
  it('replaces the composer with a sign-in row that routes to #login, thread still readable', () => {
    signOut();
    mockThread([comment('c1', 'Readable while signed out')]);
    mockMutation();
    render(<FeedCommentsThread itemUid="n-1" kind="news" source="home" />);

    expect(screen.queryByPlaceholderText('Write your comment here…')).not.toBeInTheDocument();
    expect(screen.getByText('Readable while signed out')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'sign in to comment' }));
    expect(routerPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });
});
