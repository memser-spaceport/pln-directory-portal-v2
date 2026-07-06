import { clusterByTeam } from '@/components/page/home/TeamNews/utils/clusterByTeam';
import type { ITeamNewsItem } from '@/types/team-news.types';

const makeItem = (
  uid: string,
  teamUid: string,
  teamName: string,
  overrides: Partial<ITeamNewsItem> = {},
): ITeamNewsItem => ({
  uid,
  teamUid,
  teamName,
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT',
  eventDate: '2026-05-01T12:00:00.000Z',
  title: `Headline ${uid}`,
  summary: null,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-05-01T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

describe('clusterByTeam', () => {
  it('returns an empty array for empty input', () => {
    expect(clusterByTeam([])).toEqual([]);
  });

  it('groups a single team with a single story into one cluster', () => {
    const item = makeItem('a', 'team-1', 'Acme');
    const clusters = clusterByTeam([item]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({ teamUid: 'team-1', teamName: 'Acme', teamLogoUrl: null });
    expect(clusters[0].items).toEqual([item]);
  });

  it('groups a single team with multiple stories into one cluster with all items present', () => {
    const a = makeItem('a', 'team-1', 'Acme');
    const b = makeItem('b', 'team-1', 'Acme');
    const clusters = clusterByTeam([a, b]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].teamUid).toBe('team-1');
    expect(clusters[0].items).toEqual([a, b]);
  });

  it('produces one cluster per distinct team, with no cross-team leakage', () => {
    const a = makeItem('a', 'team-1', 'Acme');
    const b = makeItem('b', 'team-2', 'Globex');
    const c = makeItem('c', 'team-1', 'Acme');
    const clusters = clusterByTeam([a, b, c]);
    expect(clusters).toHaveLength(2);

    const acme = clusters.find((cl) => cl.teamUid === 'team-1');
    const globex = clusters.find((cl) => cl.teamUid === 'team-2');
    expect(acme?.items).toEqual([a, c]);
    expect(globex?.items).toEqual([b]);
  });

  it('groups items sharing a teamUid together even if teamName/teamLogoUrl differ across the input', () => {
    const a = makeItem('a', 'team-1', 'Acme');
    const b = makeItem('b', 'team-1', 'Acme (renamed)', { teamLogoUrl: 'https://example.com/logo.png' });
    const clusters = clusterByTeam([a, b]);
    expect(clusters).toHaveLength(1);
    // Identity fields are taken from the first-encountered item in the group.
    expect(clusters[0].teamName).toBe('Acme');
    expect(clusters[0].items).toEqual([a, b]);
  });
});
