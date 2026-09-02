import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import { AI_APPS_DEFAULT_SORT, AI_APPS_SORT } from '@/services/ai-apps/constants';

import { getAiAppsSort } from '@/services/ai-apps/utils/getAiAppsSort';
import { getCreatorOptions } from '@/services/ai-apps/utils/getCreatorOptions';
import { filterAndSortAiApps } from '@/services/ai-apps/utils/filterAndSortAiApps';

const app = (partial: Partial<AiApp> & Pick<AiApp, 'uid'>): AiApp => ({
  memberUid: 'm-1',
  appId: 'app-id',
  name: 'App',
  description: 'Description',
  status: 'READY',
  notes: null,
  url: null,
  httpUrl: null,
  host: null,
  port: null,
  deploymentId: 'dep-1',
  requiredEnvVars: [],
  providedEnvVars: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  member: { uid: 'm-1', name: 'Ada Lovelace', image: null },
  ...partial,
});

const params = (init: Record<string, string> = {}) => new URLSearchParams(init);
const uids = (apps: AiApp[]) => apps.map((a) => a.uid);

describe('search', () => {
  const subject = app({
    uid: 'a1',
    name: 'Warm Intro Matcher',
    description: 'Finds the shortest path to a founder',
    member: { uid: 'm-2', name: 'Nina Chen', image: null },
  });

  const search = (query: string) => filterAndSortAiApps([subject], params({ search: query }));

  it('matches on app name, description and creator name, case-insensitively', () => {
    expect(search('warm intro')).toHaveLength(1);
    expect(search('SHORTEST PATH')).toHaveLength(1);
    expect(search('nina')).toHaveLength(1);
  });

  it('does not match unrelated text', () => {
    expect(search('kubernetes')).toHaveLength(0);
  });

  it('treats an empty or whitespace-only query as "no search"', () => {
    expect(search('')).toHaveLength(1);
    expect(search('   ')).toHaveLength(1);
  });
});

describe('getCreatorOptions', () => {
  it('derives one alphabetical option per creator, counting their apps', () => {
    const options = getCreatorOptions([
      app({ uid: 'a1', member: { uid: 'm-2', name: 'Nina Chen', image: null } }),
      app({ uid: 'a2', member: { uid: 'm-1', name: 'Ada Lovelace', image: null } }),
      app({ uid: 'a3', member: { uid: 'm-2', name: 'Nina Chen', image: null } }),
    ]);

    expect(options).toEqual([
      { value: 'Ada Lovelace', disabled: false, count: 1 },
      { value: 'Nina Chen', disabled: false, count: 2 },
    ]);
  });

  it('returns nothing for an empty list', () => {
    expect(getCreatorOptions([])).toEqual([]);
  });
});

describe('getAiAppsSort', () => {
  it('falls back to the resting order when the param is absent or unknown', () => {
    expect(getAiAppsSort(params())).toBe(AI_APPS_DEFAULT_SORT);
    expect(getAiAppsSort(params({ sort: 'popularity' }))).toBe(AI_APPS_DEFAULT_SORT);
  });

  it('honours a known sort', () => {
    expect(getAiAppsSort(params({ sort: AI_APPS_SORT.NAME }))).toBe(AI_APPS_SORT.NAME);
  });
});

describe('filterAndSortAiApps', () => {
  const alpha = app({
    uid: 'alpha',
    name: 'Alpha',
    description: 'first',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    viewCount: 12,
    member: { uid: 'm-1', name: 'Ada Lovelace', image: null },
  });
  const beta = app({
    uid: 'beta',
    name: 'Beta',
    description: 'second',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    viewCount: 1240,
    member: { uid: 'm-2', name: 'Nina Chen', image: null },
  });
  const gamma = app({
    uid: 'gamma',
    name: 'Gamma',
    description: 'third',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    viewCount: 318,
    member: { uid: 'm-2', name: 'Nina Chen', image: null },
  });
  const all = [alpha, beta, gamma];

  it('returns everything, most recently updated first, with no params', () => {
    expect(uids(filterAndSortAiApps(all, params()))).toEqual(['alpha', 'gamma', 'beta']);
  });

  it('sorts by creation date, newest first', () => {
    expect(uids(filterAndSortAiApps(all, params({ sort: AI_APPS_SORT.CREATED })))).toEqual(['beta', 'gamma', 'alpha']);
  });

  it('sorts by name ascending', () => {
    expect(uids(filterAndSortAiApps(all, params({ sort: AI_APPS_SORT.NAME })))).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('sorts by view count, most viewed first', () => {
    expect(uids(filterAndSortAiApps(all, params({ sort: AI_APPS_SORT.VIEWS })))).toEqual(['beta', 'gamma', 'alpha']);
  });

  it('reads an absent viewCount as 0, so a never-viewed app sorts last rather than dropping out', () => {
    const rows = [
      app({ uid: 'unknown' }), // older API version: no viewCount at all
      app({ uid: 'viewed', viewCount: 5 }),
    ];

    expect(uids(filterAndSortAiApps(rows, params({ sort: AI_APPS_SORT.VIEWS })))).toEqual(['viewed', 'unknown']);
  });

  it('filters by a single creator', () => {
    expect(uids(filterAndSortAiApps(all, params({ createdBy: 'Nina Chen' })))).toEqual(['gamma', 'beta']);
  });

  it('ORs multiple creators rather than intersecting them', () => {
    const result = filterAndSortAiApps(all, params({ createdBy: 'Nina Chen|Ada Lovelace' }));
    expect(uids(result)).toEqual(['alpha', 'gamma', 'beta']);
  });

  it('combines search with the creator facet', () => {
    expect(uids(filterAndSortAiApps(all, params({ createdBy: 'Nina Chen', search: 'third' })))).toEqual(['gamma']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterAndSortAiApps(all, params({ search: 'nothing here' }))).toEqual([]);
  });

  it('never mutates or reorders the array React Query owns', () => {
    const source = [...all];
    filterAndSortAiApps(source, params({ sort: AI_APPS_SORT.NAME }));
    expect(uids(source)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('keeps API order for apps that tie on the sort key', () => {
    const tied = [
      app({ uid: 'first', updatedAt: '2026-08-01T00:00:00.000Z' }),
      app({ uid: 'second', updatedAt: '2026-08-01T00:00:00.000Z' }),
      app({ uid: 'third', updatedAt: '2026-08-01T00:00:00.000Z' }),
    ];
    expect(uids(filterAndSortAiApps(tied, params()))).toEqual(['first', 'second', 'third']);
  });

  it('sorts apps with a missing or unparseable date last, rather than dropping them', () => {
    const undated = [
      app({ uid: 'undated', updatedAt: '' }),
      app({ uid: 'dated', updatedAt: '2026-08-01T00:00:00.000Z' }),
    ];
    expect(uids(filterAndSortAiApps(undated, params()))).toEqual(['dated', 'undated']);
  });
});
