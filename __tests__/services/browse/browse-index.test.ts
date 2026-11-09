/**
 * @jest-environment node
 */
/**
 * LAB-3093: the browse index lists every public profile A to Z, a page at a time, so links alone reach each one.
 */
import {
  BROWSE_PAGE_SIZE,
  browsePageCount,
  browsePageItems,
  browsePath,
  loadBrowseEntries,
  parseBrowsePage,
  toBrowseEntries,
} from '@/services/browse/browseIndex';

const ok = (body: unknown) => Promise.resolve({ ok: true, json: async () => body });

describe('toBrowseEntries', () => {
  it('sorts A to Z ignoring case, and drops entries without a uid or a name', () => {
    expect(
      toBrowseEntries([
        { uid: 'c', name: 'beta' },
        { uid: 'a', name: 'Alpha' },
        { uid: 'b', name: '  ' },
        { name: 'No uid' },
        null,
      ]),
    ).toEqual([
      { uid: 'a', name: 'Alpha' },
      { uid: 'c', name: 'beta' },
    ]);
  });

  it('keeps only the allowed uids when given', () => {
    expect(
      toBrowseEntries(
        [
          { uid: 'a', name: 'A' },
          { uid: 'b', name: 'B' },
        ],
        new Set(['b']),
      ),
    ).toEqual([{ uid: 'b', name: 'B' }]);
  });
});

describe('paging', () => {
  it('reads ?page= as a whole number from 1, and 1 when absent', () => {
    expect(parseBrowsePage(undefined)).toBe(1);
    expect(parseBrowsePage('3')).toBe(3);
    expect(parseBrowsePage(['2', '5'])).toBe(2);
    for (const bad of ['0', '-1', '1.5', 'abc', '01', '']) expect(parseBrowsePage(bad)).toBeNull();
  });

  it('gives page 1 one address, without ?page=', () => {
    expect(browsePath('teams')).toBe('/teams/browse');
    expect(browsePath('members', 1)).toBe('/members/browse');
    expect(browsePath('projects', 4)).toBe('/projects/browse?page=4');
  });

  it(`pages ${BROWSE_PAGE_SIZE} at a time`, () => {
    const entries = Array.from({ length: BROWSE_PAGE_SIZE + 1 }, (_, i) => ({ uid: `u${i}`, name: `N${i}` }));
    expect(browsePageCount(0)).toBe(1);
    expect(browsePageCount(entries.length)).toBe(2);
    expect(browsePageItems(entries, 2)).toEqual([entries[BROWSE_PAGE_SIZE]]);
  });
});

describe('loadBrowseEntries', () => {
  const original = process.env.DIRECTORY_API_URL;
  beforeEach(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example';
    global.fetch = jest.fn();
  });
  afterEach(() => {
    process.env.DIRECTORY_API_URL = original;
  });

  it('leaves out teams that are not in the crawl index', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) =>
      url.includes('crawl-index')
        ? ok({ teams: [{ uid: 'public', updatedAt: '2026-01-01T00:00:00.000Z' }] })
        : ok({
            teams: [
              { uid: 'public', name: 'Public' },
              { uid: 'hidden', name: 'Hidden' },
            ],
          }),
    );
    await expect(loadBrowseEntries('teams')).resolves.toEqual([{ uid: 'public', name: 'Public' }]);
  });

  it('lists every team while the API has no crawl index', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) =>
      url.includes('crawl-index') ? Promise.resolve({ ok: false }) : ok({ teams: [{ uid: 't', name: 'T' }] }),
    );
    await expect(loadBrowseEntries('teams')).resolves.toEqual([{ uid: 't', name: 'T' }]);
  });

  // LAB-3096: empty member profiles are noindex and out of the sitemap, so the browse index leaves them out too.
  it('leaves out members that are not in the member crawl index', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) =>
      url.includes('/v1/members/crawl-index')
        ? ok({ members: [{ uid: 'm', updatedAt: '2026-01-01T00:00:00.000Z' }] })
        : ok({
            members: [
              { uid: 'm', name: 'M' },
              { uid: 'empty', name: 'Empty' },
            ],
          }),
    );
    await expect(loadBrowseEntries('members')).resolves.toEqual([{ uid: 'm', name: 'M' }]);
  });

  it('lists every member while the API has no member crawl index, and answers null when the API fails', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) =>
      url.includes('crawl-index')
        ? Promise.resolve({ ok: false })
        : url.includes('/v1/members')
          ? ok({ members: [{ uid: 'm', name: 'M' }] })
          : Promise.resolve({ ok: false }),
    );
    await expect(loadBrowseEntries('members')).resolves.toEqual([{ uid: 'm', name: 'M' }]);
    await expect(loadBrowseEntries('projects')).resolves.toBeNull();
  });

  it('reads projects from their full list, with no crawl index', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) =>
      url.includes('/v1/projects') ? ok({ projects: [{ uid: 'p', name: 'P' }] }) : Promise.resolve({ ok: false }),
    );
    await expect(loadBrowseEntries('projects')).resolves.toEqual([{ uid: 'p', name: 'P' }]);
    expect((global.fetch as jest.Mock).mock.calls.map(([url]) => url)).not.toContainEqual(
      expect.stringContaining('crawl-index'),
    );
  });
});
