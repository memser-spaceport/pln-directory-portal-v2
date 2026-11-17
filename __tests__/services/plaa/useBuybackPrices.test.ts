import { useBuybackPrices } from '@/services/plaa/hooks/useBuybackPrices';
import { useQuery } from '@tanstack/react-query';
import { hasSession } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ hasSession: jest.fn() }));
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockedQuery = useQuery as jest.Mock;
const mockedSession = hasSession as jest.Mock;
const mockedFetch = customFetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedSession.mockReturnValue(true);
});

function useTestQuery() {
  useBuybackPrices('member-1');
  return mockedQuery.mock.calls[0][0].queryFn();
}

test('uses the authenticated fetch path and returns prices', async () => {
  const data = [{ roundNumber: 12, auctionNumber: 7, clearingPrice: 1.48 }];
  mockedFetch.mockResolvedValue({ ok: true, json: async () => data });
  await expect(useTestQuery()).resolves.toEqual(data);
  expect(mockedFetch).toHaveBeenCalledWith('/api/plaa/buyback-prices', expect.any(Object), true);
});

test('rejects transient failures so the query can retry', async () => {
  mockedFetch.mockResolvedValue({ ok: false, status: 502 });
  await expect(useTestQuery()).rejects.toThrow('502');
});

test('does not start an authenticated request without a session', async () => {
  mockedSession.mockReturnValue(false);
  await expect(useTestQuery()).resolves.toBeNull();
  expect(mockedFetch).not.toHaveBeenCalled();
});

test('enables a separate query after a guest signs in', () => {
  useBuybackPrices(null);
  expect(mockedQuery.mock.calls[0][0].enabled).toBe(false);
  useBuybackPrices('member-1');
  expect(mockedQuery.mock.calls[1][0].enabled).toBe(true);
  expect(mockedQuery.mock.calls[1][0].queryKey).not.toEqual(mockedQuery.mock.calls[0][0].queryKey);
});
