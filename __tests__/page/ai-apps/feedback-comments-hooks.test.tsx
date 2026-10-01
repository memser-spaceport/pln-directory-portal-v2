import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAddFeedbackComment,
  useDeleteFeedbackComment,
  useFeedbackComments,
} from '@/services/ai-app-feedback/hooks/useFeedbackComments';
import type { AiAppFeedbackComment } from '@/services/ai-app-feedback/ai-app-feedback.service';

/* The global jest setup mocks React Query; these hooks are about its cache, so use the real one. */
jest.unmock('@tanstack/react-query');

const mockFetch = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/services/ai-app-feedback/ai-app-feedback.service', () => ({
  ...jest.requireActual('@/services/ai-app-feedback/ai-app-feedback.service'),
  fetchFeedbackComments: (...args: unknown[]) => mockFetch(...args),
  postFeedbackComment: (...args: unknown[]) => mockPost(...args),
  deleteFeedbackComment: (...args: unknown[]) => mockDelete(...args),
}));
const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));

const ME = { uid: 'me', name: 'Grace Hopper', image: null };
const comment = (uid: string, text: string): AiAppFeedbackComment => ({
  uid,
  text,
  kind: 'REPLY',
  createdAt: '2026-10-01T01:00:00.000Z',
  member: ME,
});

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

/** The thread and its two mutations, sharing one cache, as the thread card uses them. */
function renderThread(enabled = true) {
  const { client, Wrapper } = wrapper();
  const view = renderHook(
    () => ({
      thread: useFeedbackComments('app-1', 'fb-1', enabled),
      add: useAddFeedbackComment('app-1', 'fb-1', ME),
      remove: useDeleteFeedbackComment('app-1', 'fb-1'),
    }),
    { wrapper: Wrapper },
  );
  return { ...view, client };
}

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue([comment('c-1', 'Which chart?')]);
  mockPost.mockReset();
  mockDelete.mockReset();
  mockToastError.mockReset();
});

describe('feedback conversation hooks', () => {
  it('loads the thread only while enabled', async () => {
    renderThread(false);
    expect(mockFetch).not.toHaveBeenCalled();

    const { result } = renderThread(true);
    await waitFor(() => expect(result.current.thread.comments.map((c) => c.uid)).toEqual(['c-1']));
    expect(mockFetch).toHaveBeenCalledWith('app-1', 'fb-1');
  });

  it('shows a reply at once as sending, then as the stored reply', async () => {
    let resolve: (c: AiAppFeedbackComment) => void = () => undefined;
    mockPost.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = renderThread();
    await waitFor(() => expect(result.current.thread.comments).toHaveLength(1));

    let sending: Promise<unknown> = Promise.resolve();
    act(() => {
      sending = result.current.add.mutateAsync('On it');
    });
    await waitFor(() => expect(result.current.thread.comments).toHaveLength(2));
    expect(result.current.thread.comments[1]).toEqual(expect.objectContaining({ text: 'On it', pending: true }));

    mockFetch.mockResolvedValue([comment('c-1', 'Which chart?'), comment('c-2', 'On it')]);
    await act(async () => {
      resolve(comment('c-2', 'On it'));
      await sending;
    });
    await waitFor(() =>
      expect(result.current.thread.comments.map((c) => [c.uid, c.pending])).toEqual([
        ['c-1', undefined],
        ['c-2', undefined],
      ]),
    );
  });

  it('takes a reply that did not go back out, says so, and rejects for the field to refill', async () => {
    mockPost.mockRejectedValue(new Error('offline'));
    const { result } = renderThread();
    await waitFor(() => expect(result.current.thread.comments).toHaveLength(1));

    await act(async () => {
      await expect(result.current.add.mutateAsync('Still broken')).rejects.toThrow('offline');
    });
    expect(result.current.thread.comments.map((c) => c.uid)).toEqual(['c-1']);
    expect(mockToastError).toHaveBeenCalled();
  });

  it('a first reply on a thread that is not being fetched still settles out of "sending"', async () => {
    mockPost.mockResolvedValue(comment('c-9', 'First!'));
    const { result, client } = renderThread(false);
    await act(async () => {
      await result.current.add.mutateAsync('First!');
    });
    expect(client.getQueryData(['ai-app-feedback-comments', 'app-1', 'fb-1'])).toEqual([comment('c-9', 'First!')]);
  });

  it('deletes at once, and brings the reply back if the API refuses', async () => {
    mockDelete.mockRejectedValue(new Error('403'));
    const { result } = renderThread();
    await waitFor(() => expect(result.current.thread.comments).toHaveLength(1));

    await act(async () => {
      result.current.remove.mutate('c-1');
    });
    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(result.current.thread.comments.map((c) => c.uid)).toEqual(['c-1']);
  });
});
