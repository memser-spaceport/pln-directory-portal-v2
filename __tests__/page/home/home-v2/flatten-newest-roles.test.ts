import { flattenNewestRoles } from '@/components/page/home/HomeV2/utils/flattenNewestRoles';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

const makeRole = (uid: string, overrides: Partial<IJobRole> = {}): IJobRole => ({
  uid,
  roleTitle: `Role ${uid}`,
  roleCategory: null,
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: `https://jobs.example.com/${uid}`,
  lastUpdated: '2026-10-01T00:00:00.000Z',
  postedDate: null,
  detectionDate: null,
  ...overrides,
});

const makeGroup = (teamUid: string, roles: IJobRole[]): IJobTeamGroup => ({
  team: { uid: teamUid, name: `Team ${teamUid}`, logoUrl: null, focusAreas: [], subFocusAreas: [] },
  totalRoles: roles.length,
  roles,
});

describe('flattenNewestRoles', () => {
  it('lists the newest roles first, one per team before a team repeats', () => {
    const groups = [
      makeGroup('a', [
        makeRole('a1', { postedDate: '2026-11-04T00:00:00.000Z' }),
        makeRole('a2', { postedDate: '2026-11-03T00:00:00.000Z' }),
      ]),
      makeGroup('b', [makeRole('b1', { postedDate: '2026-11-01T00:00:00.000Z' })]),
      makeGroup('c', [makeRole('c1', { postedDate: '2026-11-02T00:00:00.000Z' })]),
    ];

    expect(flattenNewestRoles(groups, 5).map((r) => r.uid)).toEqual(['a1', 'c1', 'b1', 'a2']);
    expect(flattenNewestRoles(groups, 2).map((r) => r.uid)).toEqual(['a1', 'c1']);
  });

  it('dates a role without a posting date by its detection, then its last update', () => {
    const groups = [
      makeGroup('a', [makeRole('updated', { lastUpdated: '2026-11-05T00:00:00.000Z' })]),
      makeGroup('b', [makeRole('detected', { detectionDate: '2026-11-06T00:00:00.000Z' })]),
    ];

    expect(flattenNewestRoles(groups, 2).map((r) => r.uid)).toEqual(['detected', 'updated']);
  });

  it('maps a role to a rail row with its team and joined locations', () => {
    const [row] = flattenNewestRoles(
      [makeGroup('t', [makeRole('r', { roleTitle: 'Engineer', location: ['Berlin', 'Remote'], applyUrl: null })])],
      1,
    );

    expect(row).toEqual({
      uid: 'r',
      title: 'Engineer',
      location: 'Berlin, Remote',
      applyUrl: null,
      teamUid: 't',
      teamName: 'Team t',
      teamLogoUrl: null,
    });
  });

  it('returns nothing for no groups', () => {
    expect(flattenNewestRoles([], 3)).toEqual([]);
  });
});
