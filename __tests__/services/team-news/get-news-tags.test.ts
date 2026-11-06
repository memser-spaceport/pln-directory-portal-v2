import { getNewsTags } from '@/services/team-news/team-news.service';

describe('getNewsTags (LAB-3000)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('returns the grouped tag list from GET /v1/team-news/tags', async () => {
    const list = [{ slug: 'ai-robotics', title: 'AI & Robotics', children: [{ slug: 'ai', title: 'AI' }] }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => list }) as unknown as typeof fetch;

    await expect(getNewsTags()).resolves.toEqual(list);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toMatch(/\/v1\/team-news\/tags$/);
  });

  it('throws when the request fails, so the page can say the list could not load', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    await expect(getNewsTags()).rejects.toThrow('503');
  });
});
