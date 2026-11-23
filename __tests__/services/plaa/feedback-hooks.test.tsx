// jest.setup.js stubs react-query for the whole suite. The point of this file is
// the real cache behaviour, so restore the actual implementation here.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import type { InfiniteData } from '@tanstack/react-query';
import {
  FeedbackQueryKeys,
  useAdminUpdate,
  useCreateFeedback,
  useFeedbackComments,
  useFeedbackList,
  useFeedbackRoadmap,
  useFeedbackTriage,
  useVote,
} from '@/services/plaa/feedback/useFeedback';
import { feedbackApi } from '@/services/plaa/feedback/feedback.api';
import { ROADMAP_PAGE_SIZE } from '@/components/page/aligement-assets/feedback/roadmap-board';
import { toast } from '@/components/core/ToastContainer';
import type { FeedbackItem, FeedbackListResponse } from '@/services/plaa/feedback/feedback.types';

jest.mock('@/services/plaa/feedback/feedback.api', () => ({
  feedbackApi: {
    addVote: jest.fn(),
    removeVote: jest.fn(),
    list: jest.fn(),
    triage: jest.fn(),
    comments: jest.fn(),
    roadmap: jest.fn(),
    create: jest.fn(),
    adminUpdate: jest.fn(),
  },
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
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

type ListCache = InfiniteData<FeedbackListResponse, string | undefined>;

const LIST_KEY = [FeedbackQueryKeys.LIST, {}];

function newClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function seedPages(queryClient: QueryClient, ...pages: FeedbackItem[][]) {
  queryClient.setQueryData<ListCache>(LIST_KEY, {
    pages: pages.map((items) => ({ items, next_cursor: null })),
    pageParams: pages.map(() => undefined),
  });
}

const readPages = (queryClient: QueryClient) =>
  queryClient.getQueryData<ListCache>(LIST_KEY)!.pages.map((page) => page.items);

function setup(seed: FeedbackItem) {
  const { queryClient, wrapper } = newClient();
  seedPages(queryClient, [seed]);
  queryClient.setQueryData<FeedbackItem>([FeedbackQueryKeys.ITEM, ITEM_ID], seed);

  const { result } = renderHook(() => useVote(), { wrapper });

  const readList = () => readPages(queryClient)[0][0];
  const readItem = () => queryClient.getQueryData<FeedbackItem>([FeedbackQueryKeys.ITEM, ITEM_ID])!;

  return { result, readList, readItem };
}

afterEach(() => jest.resetAllMocks());

describe('optimistic vote', () => {
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

    const { queryClient, wrapper } = newClient();
    seedPages(queryClient, [baseItem(), baseItem({ id: 'item-2', vote_count: 99 })]);
    const { result } = renderHook(() => useVote(), { wrapper });

    act(() => {
      result.current.mutate({ id: ITEM_ID, voted: false });
    });

    await waitFor(() => expect(readPages(queryClient)[0][0].vote_count).toBe(6));
    expect(readPages(queryClient)[0][1].vote_count).toBe(99);
  });

  it('updates an item that only appeared after Load more', async () => {
    let release: (value: unknown) => void = () => undefined;
    (feedbackApi.addVote as jest.Mock).mockReturnValue(new Promise((resolve) => (release = resolve)));

    const { queryClient, wrapper } = newClient();
    seedPages(queryClient, [baseItem({ id: 'first-page' })], [baseItem()]);
    const { result } = renderHook(() => useVote(), { wrapper });

    act(() => {
      result.current.mutate({ id: ITEM_ID, voted: false });
    });

    await waitFor(() => expect(readPages(queryClient)[1][0].vote_count).toBe(6));

    act(() => release({ vote_count: 6, has_voted: true }));
  });

  it('tells the member why a vote was not saved', async () => {
    (feedbackApi.addVote as jest.Mock).mockRejectedValue(new Error('You have used all of your upvotes.'));
    const { result } = setup(baseItem());

    act(() => {
      result.current.mutate({ id: ITEM_ID, voted: false });
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('You have used all of your upvotes.'));
  });
});

describe('lists load a page at a time', () => {
  const page = (id: string, next: string | null) => ({ items: [baseItem({ id })], next_cursor: next });

  type PagedHook = () => { data?: { items: { id: string }[] }; hasMore: boolean; loadMore: () => void };
  const paged: [string, PagedHook, () => jest.Mock][] = [
    ['Ideas and My submissions', () => useFeedbackList({ sort: 'top' }), () => feedbackApi.list as jest.Mock],
    ['Triage', () => useFeedbackTriage(true), () => feedbackApi.triage as jest.Mock],
    ['comments', () => useFeedbackComments(ITEM_ID), () => feedbackApi.comments as jest.Mock],
  ];

  it.each(paged)(
    '%s: Load more fetches from where the last page ended and keeps what was shown',
    async (_name, hook, api) => {
      api().mockResolvedValueOnce(page('one', 'cursor-after-one')).mockResolvedValueOnce(page('two', null));
      const { result } = renderHook(hook, { wrapper: newClient().wrapper });

      await waitFor(() => expect(result.current.data?.items.map((row) => row.id)).toEqual(['one']));
      expect(result.current.hasMore).toBe(true);

      act(() => result.current.loadMore());

      await waitFor(() => expect(result.current.data?.items.map((row) => row.id)).toEqual(['one', 'two']));
      expect(JSON.stringify(api().mock.calls[1])).toContain('cursor-after-one');
      expect(result.current.hasMore).toBe(false);
    },
  );

  it('asks for more Roadmap cards per column than the board first shows, so Show more has something to reveal', async () => {
    (feedbackApi.roadmap as jest.Mock).mockResolvedValue({
      under_review: [],
      todo: [],
      in_progress: [],
      completed: [],
    });
    renderHook(() => useFeedbackRoadmap(), { wrapper: newClient().wrapper });

    await waitFor(() => expect(feedbackApi.roadmap).toHaveBeenCalled());
    expect((feedbackApi.roadmap as jest.Mock).mock.calls[0][0]).toBeGreaterThan(ROADMAP_PAGE_SIZE);
  });
});

describe('submission receipt', () => {
  it('confirms a submission that was saved', async () => {
    (feedbackApi.create as jest.Mock).mockResolvedValue(baseItem());
    const { result } = renderHook(() => useCreateFeedback(), { wrapper: newClient().wrapper });

    act(() => {
      result.current.mutate({ type: 'feature', title: 'A title', description: 'A long enough description.' });
    });

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });

  it('shows no receipt for a submission that failed', async () => {
    (feedbackApi.create as jest.Mock).mockRejectedValue(new Error('upstream down'));
    const { result } = renderHook(() => useCreateFeedback(), { wrapper: newClient().wrapper });

    act(() => {
      result.current.mutate({ type: 'feature', title: 'A title', description: 'A long enough description.' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('an admin change', () => {
  it('sends the change for that item', async () => {
    (feedbackApi.adminUpdate as jest.Mock).mockResolvedValue(baseItem());
    const { result } = renderHook(() => useAdminUpdate(), { wrapper: newClient().wrapper });

    act(() => {
      result.current.mutate({ id: ITEM_ID, removed: true });
    });

    await waitFor(() => expect(feedbackApi.adminUpdate).toHaveBeenCalledWith(ITEM_ID, { removed: true }));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('tells the admin why a change was not saved', async () => {
    (feedbackApi.adminUpdate as jest.Mock).mockRejectedValue(new Error('This action is for admins only.'));
    const { result } = renderHook(() => useAdminUpdate(), { wrapper: newClient().wrapper });

    act(() => {
      result.current.mutate({ id: ITEM_ID, removed: true });
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This action is for admins only.'));
  });
});
