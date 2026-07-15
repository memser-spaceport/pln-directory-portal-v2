import { act, renderHook } from '@testing-library/react';
import { useRoadmapPinActions } from '@/components/page/gantry/roadmap/hooks/useRoadmapPinActions';
import type { GantryPinStatus } from '@/services/gantry/types';

jest.mock('@/utils/feature-flags', () => ({
  USE_ACCESS_CONTROL_V2: false,
  GANTRY_IMPACT_UI_ENABLED: true,
  GANTRY_IMPACT_MOCK: false,
}));

// Controllable query client — the hook re-reads item/pin-status state from cache at Save time.
const cacheState: { item?: unknown; pinStatus?: GantryPinStatus } = {};
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    getQueryData: jest.fn((key: unknown[]) => {
      if (key[0] === 'gantry-item') return cacheState.item;
      if (key[0] === 'gantry-pin-status') return cacheState.pinStatus;
      return undefined;
    }),
    getQueriesData: jest.fn(() => []),
  }),
}));

jest.mock('@/components/page/gantry/shared/flyPin', () => ({ flyPin: jest.fn() }));

const analyticsMocks = {
  onItemBoosted: jest.fn(),
  onItemUnboosted: jest.fn(),
};
const analytics = analyticsMocks as unknown as Parameters<typeof useRoadmapPinActions>[2];

const button = () => {
  const el = document.createElement('button');
  el.getBoundingClientRect = () => ({ top: 100, left: 100, bottom: 120, right: 200, width: 100, height: 20 }) as DOMRect;
  return el;
};

const pinStatus = (remaining: number): GantryPinStatus => ({ limit: 10, used: 10 - remaining, remaining, pins: [] });

function makePin(overrides: Partial<{ isPending: boolean }> = {}) {
  return { mutateAsync: jest.fn().mockResolvedValue({}), isPending: false, ...overrides } as never;
}
const pinUpdate = { mutate: jest.fn(), isPending: false } as never;

describe('useRoadmapPinActions — rate-first boost flow (impact UI on)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheState.item = undefined;
    cacheState.pinStatus = undefined;
  });

  it('boost click opens the rating popover WITHOUT committing anything', async () => {
    const pin = makePin();
    const { result } = renderHook(() => useRoadmapPinActions(pin, pinUpdate, analytics, pinStatus(5)));

    await act(() => result.current.handlePinToggle('item-1', true, button()));

    expect((pin as { mutateAsync: jest.Mock }).mutateAsync).not.toHaveBeenCalled();
    expect(result.current.ratePopover).toEqual(expect.objectContaining({ uid: 'item-1' }));
  });

  it('dismissing the popover cancels the boost entirely', async () => {
    const pin = makePin();
    const { result } = renderHook(() => useRoadmapPinActions(pin, pinUpdate, analytics, pinStatus(5)));

    await act(() => result.current.handlePinToggle('item-1', true, button()));
    act(() => result.current.handleBoostCancel());

    expect(result.current.ratePopover).toBeNull();
    expect((pin as { mutateAsync: jest.Mock }).mutateAsync).not.toHaveBeenCalled();
  });

  it('Save commits the boost with the rating and optional note in one mutation', async () => {
    const pin = makePin();
    const { result } = renderHook(() => useRoadmapPinActions(pin, pinUpdate, analytics, pinStatus(5)));

    await act(() => result.current.handlePinToggle('item-1', true, button()));
    await act(() => result.current.handleBoostRateSave({ impact: 4, note: 'ship it' }));

    expect((pin as { mutateAsync: jest.Mock }).mutateAsync).toHaveBeenCalledWith({
      uid: 'item-1',
      nextIsPinned: true,
      impact: 4,
      note: 'ship it',
      swapItemUid: undefined,
    });
    expect(result.current.ratePopover).toBeNull();
    expect(analyticsMocks.onItemBoosted).toHaveBeenCalledWith('item-1', 4);
  });

  it('Save re-checks the cache: a frozen item closes the popover with no mutation', async () => {
    const pin = makePin();
    const { result } = renderHook(() => useRoadmapPinActions(pin, pinUpdate, analytics, pinStatus(5)));

    await act(() => result.current.handlePinToggle('item-1', true, button()));
    cacheState.item = { uid: 'item-1', stage: 'SHIPPED', viewerHasPinned: false };
    await act(() => result.current.handleBoostRateSave({ impact: 4, note: '' }));

    expect((pin as { mutateAsync: jest.Mock }).mutateAsync).not.toHaveBeenCalled();
    expect(result.current.ratePopover).toBeNull();
  });

  it('exhausted balance at Save carries the rating into the swap picker; swap commits with it', async () => {
    const pin = makePin();
    const { result } = renderHook(() => useRoadmapPinActions(pin, pinUpdate, analytics, pinStatus(0)));

    await act(() => result.current.handlePinToggle('item-1', true, button()));
    expect(result.current.ratePopover).not.toBeNull(); // rating collected before the swap step

    await act(() => result.current.handleBoostRateSave({ impact: 5, note: 'urgent' }));
    expect(result.current.ratePopover).toBeNull();
    expect(result.current.swapPickerState).toEqual(expect.objectContaining({ uid: 'item-1' }));
    expect((pin as { mutateAsync: jest.Mock }).mutateAsync).not.toHaveBeenCalled();

    await act(() => result.current.handleSwapSelect('released-item'));
    expect((pin as { mutateAsync: jest.Mock }).mutateAsync).toHaveBeenCalledWith({
      uid: 'item-1',
      nextIsPinned: true,
      impact: 5,
      note: 'urgent',
      swapItemUid: 'released-item',
    });
    expect(analyticsMocks.onItemBoosted).toHaveBeenCalledWith('item-1', 5);
  });

  it('ignores boost clicks and dismissals while a pin mutation is in flight (single-flight)', async () => {
    const pin = makePin({ isPending: true });
    const { result } = renderHook(() => useRoadmapPinActions(pin, pinUpdate, analytics, pinStatus(5)));

    await act(() => result.current.handlePinToggle('item-1', true, button()));
    expect(result.current.ratePopover).toBeNull();
  });

  it('unboost stays immediate — no popover, mutation fires directly', async () => {
    const pin = makePin();
    const { result } = renderHook(() => useRoadmapPinActions(pin, pinUpdate, analytics, pinStatus(5)));

    await act(() => result.current.handlePinToggle('item-1', false, button()));

    expect((pin as { mutateAsync: jest.Mock }).mutateAsync).toHaveBeenCalledWith({ uid: 'item-1', nextIsPinned: false });
    expect(result.current.ratePopover).toBeNull();
    expect(analyticsMocks.onItemUnboosted).toHaveBeenCalledWith('item-1');
  });
});
