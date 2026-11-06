import { renderHook } from '@testing-library/react';

import { newestDeals, useHomeDeals } from '@/components/page/home/HomeV2/useHomeDeals';
import type { IDeal } from '@/types/deals.types';

let mockHasAccess = false;
jest.mock('@/services/deals/hooks/useDealsAccess', () => ({ useDealsAccess: () => ({ hasAccess: mockHasAccess }) }));

const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: (options: unknown) => mockUseQuery(options),
}));

const deal = (uid: string, createdAt: string): IDeal =>
  ({ uid, vendorName: uid, shortDescription: '', createdAt, offerValue: null }) as unknown as IDeal;

const DEALS = [
  deal('old', '2026-09-01T00:00:00.000Z'),
  deal('newest', '2026-11-03T00:00:00.000Z'),
  deal('mid', '2026-10-01T00:00:00.000Z'),
  deal('newer', '2026-11-01T00:00:00.000Z'),
];

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseQuery.mockReturnValue({ data: DEALS });
});

describe('useHomeDeals', () => {
  it('without deals access, requests nothing and returns null', () => {
    mockHasAccess = false;
    const { result } = renderHook(() => useHomeDeals());

    expect(result.current).toBeNull();
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('with access, returns the three newest and the catalogue size', () => {
    mockHasAccess = true;
    const { result } = renderHook(() => useHomeDeals());

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    expect(result.current?.deals.map((d) => d.uid)).toEqual(['newest', 'newer', 'mid']);
    expect(result.current?.total).toBe(4);
  });

  it('returns null for an empty or malformed response', () => {
    mockHasAccess = true;
    mockUseQuery.mockReturnValue({ data: [] });
    expect(renderHook(() => useHomeDeals()).result.current).toBeNull();
    mockUseQuery.mockReturnValue({ data: { memberInfo: {} } });
    expect(renderHook(() => useHomeDeals()).result.current).toBeNull();
  });
});

describe('newestDeals', () => {
  it('sorts by createdAt, newest first', () => {
    expect(newestDeals(DEALS, 2).map((d) => d.uid)).toEqual(['newest', 'newer']);
  });
});
