import { useBuybackPrices } from '@/services/plaa/hooks/useBuybackPrices';
import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: jest.fn() }));
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockedQuery = useQuery as jest.Mock;
const mockedCookies = getCookiesFromClient as jest.Mock;
const mockedFetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockedFetch;
  mockedCookies.mockReturnValue({ authToken: 'jwt' });
});

function useTestQuery() {
  useBuybackPrices('member-1');
  return mockedQuery.mock.calls[0][0].queryFn();
}

test("sends the member's token and returns prices", async () => {
  const data = [{ roundNumber: 12, auctionNumber: 7, clearingPrice: 1.48 }];
  mockedFetch.mockResolvedValue({ ok: true, status: 200, json: async () => data });
  await expect(useTestQuery()).resolves.toEqual(data);
  expect(mockedFetch).toHaveBeenCalledWith(
    '/api/plaa/buyback-prices',
    expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer jwt' }) }),
  );
});

test('hides prices on a 401 and never takes the sign-out path', async () => {
  mockedFetch.mockResolvedValue({ ok: false, status: 401 });
  await expect(useTestQuery()).resolves.toBeNull();
  expect(customFetch).not.toHaveBeenCalled();
});

test('rejects transient failures so the query can retry', async () => {
  mockedFetch.mockResolvedValue({ ok: false, status: 502 });
  await expect(useTestQuery()).rejects.toThrow('502');
});

test('does not send a request without a token', async () => {
  mockedCookies.mockReturnValue({ authToken: undefined });
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
