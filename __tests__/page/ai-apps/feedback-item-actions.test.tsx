import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteFeedbackItem, useEditFeedbackNote } from '@/services/ai-app-feedback/hooks/useFeedbackItemActions';
import { useAddFeedbackComment, useEditFeedbackComment } from '@/services/ai-app-feedback/hooks/useFeedbackComments';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import {
  deleteFeedbackItem,
  editFeedbackComment,
  editFeedbackNote,
  submitAiAppFeedback,
  type AiAppFeedbackComment,
  type OverlayFeedbackPin,
} from '@/services/ai-app-feedback/ai-app-feedback.service';

/* The global jest setup mocks React Query; these hooks are about its cache, so use the real one. */
jest.unmock('@tanstack/react-query');

const mockEditNote = jest.fn();
const mockDeleteItem = jest.fn();
const mockEditReply = jest.fn();
const mockPostReply = jest.fn();
jest.mock('@/services/ai-app-feedback/ai-app-feedback.service', () => ({
  ...jest.requireActual('@/services/ai-app-feedback/ai-app-feedback.service'),
  editFeedbackNote: (...args: unknown[]) => mockEditNote(...args),
  deleteFeedbackItem: (...args: unknown[]) => mockDeleteItem(...args),
  editFeedbackComment: (...args: unknown[]) => mockEditReply(...args),
  postFeedbackComment: (...args: unknown[]) => mockPostReply(...args),
}));
const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));

const gone = () => Object.assign(new Error('gone'), { status: 404 });

const pin = (uid: string, feedbackUid: string, note = `Note ${uid}`): OverlayFeedbackPin =>
  ({
    uid,
    feedbackUid,
    note,
    feedback: { uid: feedbackUid, status: 'NEW', createdAt: '2026-10-01T00:00:00.000Z', member: null },
  }) as OverlayFeedbackPin;

/* The page's pins query, as useAppFeedbackPins keys it (scope `all`, resolved included). */
const PINS_KEY = [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_PINS, 'app-1', 'all', true];
const COMMENTS_KEY = [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_COMMENTS, 'app-1', 'fb-1'];

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  client.setQueryData(PINS_KEY, [pin('p1', 'fb-1'), pin('p2', 'fb-2')]);
  /* Nothing re-fetches these in a test; the settled invalidation would otherwise refetch with no queryFn. */
  jest.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const pins = () => client.getQueryData<OverlayFeedbackPin[]>(PINS_KEY) ?? [];
  return { client, Wrapper, pins };
}

beforeEach(() => {
  mockEditNote.mockReset();
  mockDeleteItem.mockReset();
  mockEditReply.mockReset();
  mockPostReply.mockReset();
  mockToastError.mockReset();
});

describe('editing a comment', () => {
  it('shows the new note at once, marked edited', async () => {
    mockEditNote.mockReturnValue(new Promise(() => {}));
    const { Wrapper, pins } = setup();
    const { result } = renderHook(() => useEditFeedbackNote('app-1'), { wrapper: Wrapper });

    act(() => result.current.mutate({ feedbackUid: 'fb-1', note: 'Clearer' }));

    await waitFor(() => expect(pins()[0].note).toBe('Clearer'));
    expect(pins()[0].feedback.editedAt).toEqual(expect.any(String));
    expect(pins()[1].note).toBe('Note p2');
    expect(mockEditNote).toHaveBeenCalledWith('app-1', 'fb-1', 'Clearer');
  });

  it('puts the old note back when the API refuses', async () => {
    mockEditNote.mockRejectedValue(new Error('500'));
    const { Wrapper, pins } = setup();
    const { result } = renderHook(() => useEditFeedbackNote('app-1'), { wrapper: Wrapper });

    act(() => result.current.mutate({ feedbackUid: 'fb-1', note: 'Clearer' }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Couldn’t save your edit. Try again.'));
    expect(pins()[0].note).toBe('Note p1');
    expect(pins()[0].feedback.editedAt).toBeUndefined();
  });

  it('a comment deleted meanwhile leaves the page, and the member is told', async () => {
    mockEditNote.mockRejectedValue(gone());
    const { Wrapper, pins } = setup();
    const { result } = renderHook(() => useEditFeedbackNote('app-1'), { wrapper: Wrapper });

    act(() => result.current.mutate({ feedbackUid: 'fb-1', note: 'Clearer' }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('This comment was deleted.'));
    expect(pins().map((p) => p.uid)).toEqual(['p2']);
  });
});

describe('deleting a comment', () => {
  it('takes its pins off the page at once', async () => {
    mockDeleteItem.mockReturnValue(new Promise(() => {}));
    const { Wrapper, pins } = setup();
    const { result } = renderHook(() => useDeleteFeedbackItem('app-1'), { wrapper: Wrapper });

    act(() => result.current.mutate('fb-1'));

    await waitFor(() => expect(pins().map((p) => p.uid)).toEqual(['p2']));
    expect(mockDeleteItem).toHaveBeenCalledWith('app-1', 'fb-1');
  });

  it('brings it back when the API refuses', async () => {
    mockDeleteItem.mockRejectedValue(new Error('500'));
    const { Wrapper, pins } = setup();
    const { result } = renderHook(() => useDeleteFeedbackItem('app-1'), { wrapper: Wrapper });

    act(() => result.current.mutate('fb-1'));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Couldn’t delete the comment. Try again.'));
    expect(pins().map((p) => p.uid)).toEqual(['p1', 'p2']);
  });

  it('already deleted is what was asked for: it stays gone, quietly', async () => {
    mockDeleteItem.mockRejectedValue(gone());
    const { Wrapper, pins } = setup();
    const { result } = renderHook(() => useDeleteFeedbackItem('app-1'), { wrapper: Wrapper });

    act(() => result.current.mutate('fb-1'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(pins().map((p) => p.uid)).toEqual(['p2']);
    expect(mockToastError).not.toHaveBeenCalled();
  });
});

describe('replies on a deleted comment', () => {
  const reply = (uid: string, text: string): AiAppFeedbackComment => ({
    uid,
    text,
    kind: 'REPLY',
    createdAt: '2026-10-01T01:00:00.000Z',
    member: { uid: 'me', name: 'Grace Hopper', image: null },
  });

  it('a reply to a comment that is gone takes the comment off the page', async () => {
    mockPostReply.mockRejectedValue(gone());
    const { Wrapper, pins } = setup();
    const { result } = renderHook(() => useAddFeedbackComment('app-1', 'fb-1', null), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync('Hello').catch(() => undefined);
    });

    expect(mockToastError).toHaveBeenCalledWith('This comment was deleted.');
    expect(pins().map((p) => p.uid)).toEqual(['p2']);
  });

  it('an edited reply shows its new text at once, marked edited, and goes back on failure', async () => {
    let reject: (e: Error) => void = () => undefined;
    mockEditReply.mockReturnValue(new Promise((_, rej) => (reject = rej)));
    const { client, Wrapper } = setup();
    client.setQueryData(COMMENTS_KEY, [reply('c-1', 'Old')]);
    const { result } = renderHook(() => useEditFeedbackComment('app-1', 'fb-1'), { wrapper: Wrapper });
    const thread = () => client.getQueryData<AiAppFeedbackComment[]>(COMMENTS_KEY) ?? [];

    act(() => result.current.mutate({ commentUid: 'c-1', text: 'New' }));
    await waitFor(() => expect(thread()[0].text).toBe('New'));
    expect(thread()[0].editedAt).toEqual(expect.any(String));
    expect(mockEditReply).toHaveBeenCalledWith('app-1', 'fb-1', 'c-1', 'New');

    await act(async () => reject(new Error('500')));
    await waitFor(() => expect(thread()[0].text).toBe('Old'));
    expect(mockToastError).toHaveBeenCalledWith('Couldn’t save your edit. Try again.');
  });
});

describe('the requests', () => {
  const real = jest.requireActual('@/services/ai-app-feedback/ai-app-feedback.service') as {
    editFeedbackNote: typeof editFeedbackNote;
    editFeedbackComment: typeof editFeedbackComment;
    deleteFeedbackItem: typeof deleteFeedbackItem;
    submitAiAppFeedback: typeof submitAiAppFeedback;
  };
  const mockCustomFetch = jest.requireMock('@/utils/fetch-wrapper').customFetch as jest.Mock;

  beforeEach(() => mockCustomFetch.mockReset());

  it('PATCHes a note, a reply, and DELETEs an item, at the API’s paths', async () => {
    mockCustomFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });

    await real.editFeedbackNote('app-1', 'fb-1', 'Clearer');
    await real.editFeedbackComment('app-1', 'fb-1', 'c-1', 'New');
    await real.deleteFeedbackItem('app-1', 'fb-1');

    const [note, edit, del] = mockCustomFetch.mock.calls;
    expect(note[0]).toMatch(/\/v1\/ai-apps\/app-1\/feedback\/fb-1\/note$/);
    expect(note[1]).toEqual(expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ note: 'Clearer' }) }));
    expect(edit[0]).toMatch(/\/v1\/ai-apps\/app-1\/feedback\/fb-1\/comments\/c-1$/);
    expect(edit[1]).toEqual(expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ text: 'New' }) }));
    expect(del[0]).toMatch(/\/v1\/ai-apps\/app-1\/feedback\/fb-1$/);
    expect(del[1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
  });

  it('a refused request carries its status, so a 404 reads as "gone"', async () => {
    mockCustomFetch.mockResolvedValue({ ok: false, status: 404 });
    await expect(real.deleteFeedbackItem('app-1', 'fb-1')).rejects.toMatchObject({ status: 404 });
    await expect(real.editFeedbackNote('app-1', 'fb-1', 'x')).rejects.toMatchObject({ status: 404 });
  });

  it('sends the item kind only when given', async () => {
    mockCustomFetch.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve({ uid: 'fb-9' }) });

    await real.submitAiAppFeedback('app-1', '<p>Hi</p>', { kind: 'COMMENT' });
    await real.submitAiAppFeedback('app-1', '<p>Hi</p>');

    expect(JSON.parse(mockCustomFetch.mock.calls[0][1].body)).toEqual({ text: '<p>Hi</p>', kind: 'COMMENT' });
    expect(JSON.parse(mockCustomFetch.mock.calls[1][1].body)).toEqual({ text: '<p>Hi</p>' });
  });
});

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));
