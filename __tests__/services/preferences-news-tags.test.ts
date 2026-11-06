import { getMemberPreferences } from '@/services/preferences.service';

describe('getMemberPreferences newsTags (LAB-3000)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  const respond = (body: unknown) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => body }) as unknown as typeof fetch;
  };

  it('returns the tags and the seeded marker at the top level, not in memberPreferences', async () => {
    respond({ showEmail: true, newsTags: ['desci'], newsTagsSeeded: true });

    const result = (await getMemberPreferences('m1', 'token')) as any;

    expect(result.newsTags).toEqual(['desci']);
    expect(result.newsTagsSeeded).toBe(true);
    expect(result.memberPreferences).not.toHaveProperty('newsTags');
  });

  it('reads a response without tags as no tags, not seeded', async () => {
    respond({ showEmail: true });

    expect(await getMemberPreferences('m1', 'token')).toMatchObject({ newsTags: [], newsTagsSeeded: false });
  });
});
