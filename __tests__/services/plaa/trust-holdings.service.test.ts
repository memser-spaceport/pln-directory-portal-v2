import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';

describe('getTrustHoldings', () => {
  const originalUrl = process.env.PLAA_API_URL;
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.PLAA_API_URL = originalUrl;
    jest.restoreAllMocks();
    fetchMock.mockReset();
  });

  it('returns an error without fetching when PLAA_API_URL is unset', async () => {
    delete process.env.PLAA_API_URL;

    const result = await getTrustHoldings();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.data).toBeUndefined();
    expect(result.error?.message).toBeDefined();
  });

  it('forwards the member session and does not cache protected data', async () => {
    process.env.PLAA_API_URL = 'https://plaa.example';
    const history = { quarterly: [{ label: 'Q1 2026' }], monthly: Array.from({ length: 18 }, (_, i) => ({ totalPlaa: i })) };
    fetchMock.mockResolvedValue({ ok: true, json: async () => history });

    const result = await getTrustHoldings('test-member-session');

    expect(fetchMock).toHaveBeenCalledWith('https://plaa.example/api/v1/trust-holdings', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-member-session' },
      cache: 'no-store',
    });
    expect(result.data).toBe(history);
  });

  it('reports an unauthorized API response instead of returning sample history', async () => {
    process.env.PLAA_API_URL = 'https://plaa.example';
    fetchMock.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });
    expect(await getTrustHoldings()).toEqual({ error: { message: 'API responded with 401: Unauthorized' } });
  });

  it('fetches trust holdings from the PLAA API', async () => {
    process.env.PLAA_API_URL = 'https://plaa.example';
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ portfolioCompanies: 190 }) });

    const result = await getTrustHoldings();

    expect(fetchMock).toHaveBeenCalledWith('https://plaa.example/api/v1/trust-holdings', expect.any(Object));
    expect(result.data).toEqual({ portfolioCompanies: 190 });
  });
});
