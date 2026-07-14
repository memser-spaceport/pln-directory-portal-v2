import { buildTeamNewsByTeamUrl, fetchTeamNewsByTeam } from '@/services/team-news/team-news.service';

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
    expect(url).toBe(
      'https://api.example.com/v1/teams/team-1/team-news?page=2&limit=20&q=funding',
    );
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

  it('returns null on non-OK response', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    await expect(fetchTeamNewsByTeam('team-1')).resolves.toBeNull();
  });

  it('returns null when fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    await expect(fetchTeamNewsByTeam('team-1')).resolves.toBeNull();
  });
});
