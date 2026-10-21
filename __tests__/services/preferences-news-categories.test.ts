import { getMemberPreferences } from '@/services/preferences.service';

describe('getMemberPreferences newsCategories (LAB-2941)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  const respond = (body: unknown) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => body }) as unknown as typeof fetch;
  };

  it('returns the stored categories at the top level, not in memberPreferences', async () => {
    respond({ showEmail: true, newsCategories: ['LAUNCH'] });

    const result = (await getMemberPreferences('m1', 'token')) as any;

    expect(result.newsCategories).toEqual(['LAUNCH']);
    expect(result.memberPreferences).not.toHaveProperty('newsCategories');
  });

  it('defaults to every category', async () => {
    respond({ showEmail: true });

    expect(((await getMemberPreferences('m1', 'token')) as any).newsCategories).toHaveLength(6);
  });
});
