import { getHuskyResponseBySlug } from '@/services/discovery.service';

jest.mock('@/utils/home.utils', () => ({
  formatNumber: (n: number) => n,
}));

describe('getHuskyResponseBySlug', () => {
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

  it('returns isError with status for a 404 even when the body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => {
        throw new Error('Unexpected token < in JSON');
      },
    });

    const result = await getHuskyResponseBySlug('dead-slug');

    expect(result).toEqual({ isError: true, status: 404, message: null });
  });

  it('does not increment the view count for a failed slug', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'not found' }),
    });

    await getHuskyResponseBySlug('dead-slug', true);

    // only the GET — no follow-up PATCH for the view count
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'GET' });
  });

  it('increments the view count after a successful fetch when increaseView is set', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: 'What is IPFS?',
        answer: 'A protocol',
        answerSources: [],
        relatedQuestions: [{ content: 'follow-up' }],
        viewCount: 1,
        shareCount: 0,
      }),
    });

    const result = await getHuskyResponseBySlug('live-slug', true);

    expect(result.data?.question).toBe('What is IPFS?');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PATCH' });
  });

  it('returns isError when a 200 body is not valid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad body');
      },
    });

    const result = await getHuskyResponseBySlug('weird-slug');

    expect(result).toEqual({ isError: true, status: 200, message: null });
  });

  it('tolerates a response without relatedQuestions', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: 'Q',
        answer: 'A',
        answerSources: [],
        viewCount: 0,
        shareCount: 0,
      }),
    });

    const result = await getHuskyResponseBySlug('sparse-slug');

    expect(result.data?.followupQuestions).toEqual([]);
  });
});
