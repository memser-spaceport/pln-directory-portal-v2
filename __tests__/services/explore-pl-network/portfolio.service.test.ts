/**
 * @jest-environment node
 */
// The service runs on the server: jsdom has no AbortSignal.timeout.
import { getPortfolioTeams } from '@/services/explore-pl-network/portfolio.service';

const team = {
  id: 'uid-1',
  teamUid: 'uid-1',
  name: 'Agoric',
  logoUrl: null,
  mapLogoUrl: null,
  island: 'digital-human-rights',
  startYear: 2014,
  endYear: null,
  oneLiner: null,
  stage: null,
  website: null,
};

describe('getPortfolioTeams', () => {
  const originalFetch = global.fetch;
  const originalApi = process.env.DIRECTORY_API_URL;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    process.env.DIRECTORY_API_URL = 'https://api.test';
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    global.fetch = originalFetch;
    process.env.DIRECTORY_API_URL = originalApi;
    warn.mockRestore();
  });

  it('returns the teams, cached for an hour with a 5s timeout', async () => {
    const timeout = jest.spyOn(AbortSignal, 'timeout');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ teams: [team] }) });

    await expect(getPortfolioTeams()).resolves.toEqual([team]);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/v1/explore-pl-network/portfolio',
      expect.objectContaining({ next: { revalidate: 3600 }, signal: expect.any(AbortSignal) }),
    );
    expect(timeout).toHaveBeenCalledWith(5000);
    timeout.mockRestore();
  });

  it('returns [] on a non-200 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(getPortfolioTeams()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('returns [] on a timeout', async () => {
    global.fetch = jest.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));
    await expect(getPortfolioTeams()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('returns [] on invalid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    });
    await expect(getPortfolioTeams()).resolves.toEqual([]);
  });

  it('returns [] when the body has no teams array', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ teams: null }) });
    await expect(getPortfolioTeams()).resolves.toEqual([]);
  });
});
