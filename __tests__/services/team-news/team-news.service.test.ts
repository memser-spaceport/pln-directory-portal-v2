import {
  buildTeamNewsByTeamUrl,
  fetchTeamNewsByTeam,
  recordTeamNewsImpressions,
  sendTeamNewsImpressionsBeacon,
} from '@/services/team-news/team-news.service';

describe('buildTeamNewsByTeamUrl', () => {
  const originalEnv = process.env.DIRECTORY_API_URL;

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.com';
  });

  afterAll(() => {
    process.env.DIRECTORY_API_URL = originalEnv;
  });

  it('builds the team news URL with pagination and search params', () => {
    const url = buildTeamNewsByTeamUrl('team-1', { page: 2, limit: 20, q: 'funding' });
    expect(url).toBe('https://api.example.com/v1/teams/team-1/team-news?page=2&limit=20&q=funding');
  });

  it('omits empty search query', () => {
    const url = buildTeamNewsByTeamUrl('team-1', { page: 1, limit: 3, q: '   ' });
    expect(url).toBe('https://api.example.com/v1/teams/team-1/team-news?page=1&limit=3');
  });
});

describe('fetchTeamNewsByTeam', () => {
  const originalEnv = process.env.DIRECTORY_API_URL;
  const fetchMock = jest.fn();

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.com';
    global.fetch = fetchMock;
  });

  afterAll(() => {
    process.env.DIRECTORY_API_URL = originalEnv;
  });

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('returns parsed JSON on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        teamUid: 'team-1',
        teamName: 'Acme',
        page: 1,
        limit: 3,
        total: 1,
        items: [],
      }),
    });

    const result = await fetchTeamNewsByTeam('team-1', { page: 1, limit: 3 });
    expect(result?.teamUid).toBe('team-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/teams/team-1/team-news?page=1&limit=3',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('sends no Authorization header without a token', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    await fetchTeamNewsByTeam('team-1', { page: 1, limit: 3 });

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('sends the viewer token as a Bearer Authorization header', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    await fetchTeamNewsByTeam('team-1', { page: 1, limit: 3 }, 'token-123');

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('returns null on non-OK response', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    await expect(fetchTeamNewsByTeam('team-1')).resolves.toBeNull();
  });

  it('returns null when fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    await expect(fetchTeamNewsByTeam('team-1')).resolves.toBeNull();
  });
});

describe('recordTeamNewsImpressions', () => {
  const originalEnv = process.env.DIRECTORY_API_URL;
  const fetchMock = jest.fn();

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.com';
    global.fetch = fetchMock;
  });

  afterAll(() => {
    process.env.DIRECTORY_API_URL = originalEnv;
  });

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('POSTs the uid batch to the impressions endpoint, unauthenticated', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await recordTeamNewsImpressions(['n-1', 'n-2']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/team-news/impressions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsItemUids: ['n-1', 'n-2'] }),
      }),
    );
  });

  it('splits a batch larger than the server’s 200-uid cap', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const uids = Array.from({ length: 250 }, (_, i) => `n-${i}`);

    await recordTeamNewsImpressions(uids);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const sentBatches = fetchMock.mock.calls.map(
      (call) => (JSON.parse(call[1].body as string) as { newsItemUids: string[] }).newsItemUids.length,
    );
    expect(sentBatches).toEqual([200, 50]);
  });

  it('sends exactly one request at the cap boundary', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await recordTeamNewsImpressions(Array.from({ length: 200 }, (_, i) => `n-${i}`));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not let one failed batch stop the others (allSettled, not all)', async () => {
    const uids = Array.from({ length: 250 }, (_, i) => `n-${i}`);
    fetchMock
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    await expect(recordTeamNewsImpressions(uids)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('sendTeamNewsImpressionsBeacon', () => {
  const originalEnv = process.env.DIRECTORY_API_URL;
  const sendBeaconMock = jest.fn();

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.com';
  });

  afterAll(() => {
    process.env.DIRECTORY_API_URL = originalEnv;
  });

  beforeEach(() => {
    sendBeaconMock.mockReset();
    (navigator as unknown as { sendBeacon: typeof sendBeaconMock }).sendBeacon = sendBeaconMock;
  });

  it('sends a beacon with the uid batch and returns true on success', () => {
    sendBeaconMock.mockReturnValue(true);

    const sent = sendTeamNewsImpressionsBeacon(['n-1', 'n-2']);

    expect(sent).toBe(true);
    expect(sendBeaconMock).toHaveBeenCalledWith('https://api.example.com/v1/team-news/impressions', expect.any(Blob));
  });

  it('returns false without sending when the queue is empty', () => {
    expect(sendTeamNewsImpressionsBeacon([])).toBe(false);
    expect(sendBeaconMock).not.toHaveBeenCalled();
  });

  it('returns false when the browser has no sendBeacon support', () => {
    (navigator as unknown as { sendBeacon: unknown }).sendBeacon = undefined;
    expect(sendTeamNewsImpressionsBeacon(['n-1'])).toBe(false);
  });
});
