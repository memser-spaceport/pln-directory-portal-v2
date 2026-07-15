import type { ReactNode } from 'react';

jest.unmock('@tanstack/react-query');

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGantryPin } from '@/services/gantry/hooks/useGantryPin';
import { GantryQueryKeys } from '@/services/gantry/constants';
import type { GantryItem, GantryItemListResponse, GantryPinStatus } from '@/services/gantry/types';

jest.mock('@/services/gantry/gantry.service', () => {
  class PinBalanceExhaustedError extends Error {}
  return {
    addGantryPin: jest.fn(),
    removeGantryPin: jest.fn(),
    PinBalanceExhaustedError,
  };
});

const service = jest.requireMock('@/services/gantry/gantry.service');

const item = (uid: string, overrides: Partial<GantryItem> = {}): GantryItem =>
  ({
    uid,
    title: uid,
    stage: 'IDEA',
    pinCount: 2,
    viewerHasPinned: false,
    viewerPinNote: null,
    authorImpact: null,
    authorImpactReasoning: null,
    avgImpact: 3,
    impactCount: 2,
    impactDistribution: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0 },
    viewerImpact: null,
    ...overrides,
  }) as GantryItem;

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useGantryPin(), { wrapper });
  return { queryClient, result };
}

const listKey = [GantryQueryKeys.ITEMS, 'board'];
const getList = (qc: QueryClient) => qc.getQueryData<GantryItemListResponse>(listKey)!;
const findIn = (qc: QueryClient, uid: string) => getList(qc).items.find((i) => i.uid === uid)!;

describe('useGantryPin — impact-aware optimistic updates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('boost adds the rating to the aggregate optimistically and clears it on unboost', async () => {
    service.addGantryPin.mockReturnValue(new Promise(() => {})); // never resolves — freeze optimistic state
    const { queryClient, result } = setup();
    queryClient.setQueryData(listKey, { items: [item('a')], total: 1 });

    act(() => {
      result.current.mutate({ uid: 'a', nextIsPinned: true, impact: 5, note: 'why' });
    });

    await waitFor(() => expect(findIn(queryClient, 'a').viewerImpact).toBe(5));
    const patched = findIn(queryClient, 'a');
    expect(patched.viewerHasPinned).toBe(true);
    expect(patched.pinCount).toBe(3);
    expect(patched.impactCount).toBe(3);
    expect(patched.avgImpact).toBeCloseTo(11 / 3);
    expect(patched.viewerPinNote).toBe('why');
  });

  it('swap removes the released item’s pin rating in BOTH the list and its detail cache; authorImpact survives', async () => {
    service.addGantryPin.mockReturnValue(new Promise(() => {}));
    const { queryClient, result } = setup();
    const released = item('released', { viewerHasPinned: true, viewerImpact: 4, authorImpact: 2 });
    queryClient.setQueryData(listKey, { items: [item('target'), released], total: 2 });
    queryClient.setQueryData([GantryQueryKeys.ITEM, 'released'], released);

    act(() => {
      result.current.mutate({ uid: 'target', nextIsPinned: true, impact: 3, swapItemUid: 'released' });
    });

    await waitFor(() => expect(findIn(queryClient, 'target').viewerImpact).toBe(3));
    const releasedInList = findIn(queryClient, 'released');
    const releasedDetail = queryClient.getQueryData<GantryItem>([GantryQueryKeys.ITEM, 'released'])!;
    for (const releasedItem of [releasedInList, releasedDetail]) {
      expect(releasedItem.viewerHasPinned).toBe(false);
      expect(releasedItem.viewerImpact).toBeNull();
      expect(releasedItem.impactCount).toBe(1); // the pin rating (4) left the aggregate…
      expect(releasedItem.authorImpact).toBe(2); // …the author's rating is untouched
    }
  });

  it('rolls back BOTH items and the pin balance when the swap mutation fails', async () => {
    service.addGantryPin.mockRejectedValue(new Error('boom'));
    const { queryClient, result } = setup();
    const released = item('released', { viewerHasPinned: true, viewerImpact: 4 });
    const status: GantryPinStatus = { limit: 10, used: 10, remaining: 0, pins: [] };
    queryClient.setQueryData(listKey, { items: [item('target'), released], total: 2 });
    queryClient.setQueryData([GantryQueryKeys.ITEM, 'released'], released);
    queryClient.setQueryData([GantryQueryKeys.PIN_STATUS], status);

    await act(async () => {
      await result.current
        .mutateAsync({ uid: 'target', nextIsPinned: true, impact: 3, swapItemUid: 'released' })
        .catch(() => {});
    });

    expect(findIn(queryClient, 'target')).toEqual(item('target'));
    expect(findIn(queryClient, 'released')).toEqual(released);
    expect(queryClient.getQueryData<GantryItem>([GantryQueryKeys.ITEM, 'released'])).toEqual(released);
    expect(queryClient.getQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS])).toEqual(status);
  });

  it('flag-off legacy boost (no impact) still works — pin patch only, aggregate untouched', async () => {
    service.addGantryPin.mockReturnValue(new Promise(() => {}));
    const { queryClient, result } = setup();
    queryClient.setQueryData(listKey, { items: [item('a')], total: 1 });

    act(() => {
      result.current.mutate({ uid: 'a', nextIsPinned: true });
    });

    await waitFor(() => expect(findIn(queryClient, 'a').viewerHasPinned).toBe(true));
    const patched = findIn(queryClient, 'a');
    expect(patched.pinCount).toBe(3);
    expect(patched.impactCount).toBe(2);
    expect(patched.viewerImpact).toBeNull();
  });
});
