// jest.setup.js stubs react-query for the whole suite. The point of this file is
// the real cache behaviour, so restore the actual implementation here.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { FeedbackQueryKeys, useVote } from '@/services/plaa/feedback/useFeedback';
import { feedbackApi } from '@/services/plaa/feedback/feedback.api';
import type { FeedbackItem, FeedbackListResponse } from '@/services/plaa/feedback/feedback.types';

jest.mock('@/services/plaa/feedback/feedback.api', () => ({
  feedbackApi: { addVote: jest.fn(), removeVote: jest.fn() },
}));

const ITEM_ID = 'item-1';

function baseItem(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    id: ITEM_ID,
    type: 'feature',
    title: 'Fixture',
    description: 'A fixture description.',
    importance: null,
    link_url: null,
    screenshot_count: 0,
    status: 'under_review',
    status_changed_at: '2026-10-20T10:00:00.000Z',
    completed_at: null,
    created_at: '2026-10-19T10:00:00.000Z',
    is_public: true,
    author: { member_uid: 'm1', display_name: 'Ada' },
    vote_count: 5,
    has_voted: false,
    comment_count: 0,
    duplicate_of: null,
    ...overrides,
  };
}

function setup(seed: FeedbackItem) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData<FeedbackListResponse>([FeedbackQueryKeys.LIST, {}], { items: [seed], next_cursor: null });
  queryClient.setQueryData<FeedbackItem>([FeedbackQueryKeys.ITEM, ITEM_ID], seed);

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useVote(), { wrapper });

  const readList = () => queryClient.getQueryData<FeedbackListResponse>([FeedbackQueryKeys.LIST, {}])!.items[0];
  const readItem = () => queryClient.getQueryData<FeedbackItem>([FeedbackQueryKeys.ITEM, ITEM_ID])!;

  return { result, readList, readItem };
}

afterEach(() => jest.resetAllMocks());

describe('AC-T4.2 optimistic vote', () => {
  it('updates the list and the item before the request resolves', async () => {
    let release: (value: unknown) => void = () => undefined;
    (feedbackApi.addVote as jest.Mock).mockReturnValue(new Promise((resolve) => (release = resolve)));

    const { result, readList, readItem } = setup(baseItem());

    act(() => {
      result.current.mutate({ id: ITEM_ID, voted: false });
    });

    await waitFor(() => expect(readList().vote_count).toBe(6));
    expect(readList().has_voted).toBe(true);
    expect(readItem().vote_count).toBe(6);
    expect(readItem().has_voted).toBe(true);

    act(() => release({ vote_count: 6, has_voted: true }));
  });

  it('rolls both back when the request fails', async () => {
    (feedbackApi.addVote as jest.Mock).mockRejectedValue(new Error('upstream down'));
    const { result, readList, readItem } = setup(baseItem());

    act(() => {
      result.current.mutate({ id: ITEM_ID, voted: false });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(readList().vote_count).toBe(5);
    expect(readList().has_voted).toBe(false);
    expect(readItem().vote_count).toBe(5);
    expect(readItem().has_voted).toBe(false);
  });

  it('decrements when removing an existing vote', async () => {
    (feedbackApi.removeVote as jest.Mock).mockResolvedValue({ vote_count: 4, has_voted: false });
    const { result, readList } = setup(baseItem({ has_voted: true, vote_count: 5 }));

    act(() => {
      result.current.mutate({ id: ITEM_ID, voted: true });
    });

    await waitFor(() => expect(readList().vote_count).toBe(4));
    expect(readList().has_voted).toBe(false);
    expect(feedbackApi.removeVote).toHaveBeenCalledWith(ITEM_ID);
    expect(feedbackApi.addVote).not.toHaveBeenCalled();
  });

  it('leaves other items in the list alone', async () => {
    (feedbackApi.addVote as jest.Mock).mockResolvedValue({ vote_count: 6, has_voted: true });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const other = baseItem({ id: 'item-2', vote_count: 99 });
    queryClient.setQueryData<FeedbackListResponse>([FeedbackQueryKeys.LIST, {}], {
      items: [baseItem(), other],
      next_cursor: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useVote(), { wrapper });

    act(() => {
      result.current.mutate({ id: ITEM_ID, voted: false });
    });

    await waitFor(() =>
      expect(queryClient.getQueryData<FeedbackListResponse>([FeedbackQueryKeys.LIST, {}])!.items[0].vote_count).toBe(6),
    );
    expect(queryClient.getQueryData<FeedbackListResponse>([FeedbackQueryKeys.LIST, {}])!.items[1].vote_count).toBe(99);
  });
});
