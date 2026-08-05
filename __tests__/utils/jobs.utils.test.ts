import { flattenLatestJobRoles } from '@/utils/jobs.utils';
import type { IJobRole, IJobTeam, IJobTeamGroup } from '@/types/jobs.types';

const buildTeam = (overrides: Partial<IJobTeam> = {}): IJobTeam => ({
  uid: 'team-1',
  name: 'Team One',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  ...overrides,
});

const buildRole = (overrides: Partial<IJobRole> = {}): IJobRole => ({
  uid: 'role-1',
  roleTitle: 'Engineer',
  roleCategory: null,
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  lastUpdated: '2024-01-01T00:00:00.000Z',
  postedDate: null,
  detectionDate: null,
  ...overrides,
});

describe('flattenLatestJobRoles', () => {
  it('flattens roles across team groups, pairing each role with its team', () => {
    const groups: IJobTeamGroup[] = [
      {
        team: buildTeam({ uid: 'team-a', name: 'Team A' }),
        totalRoles: 1,
        roles: [buildRole({ uid: 'role-a', postedDate: '2024-01-01T00:00:00.000Z' })],
      },
      {
        team: buildTeam({ uid: 'team-b', name: 'Team B' }),
        totalRoles: 1,
        roles: [buildRole({ uid: 'role-b', postedDate: '2024-01-02T00:00:00.000Z' })],
      },
    ];

    const result = flattenLatestJobRoles(groups);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.role.uid)).toEqual(['role-b', 'role-a']);
    expect(result[0].team.uid).toBe('team-b');
  });

  it('sorts newest first, falling back to detectionDate then lastUpdated', () => {
    const groups: IJobTeamGroup[] = [
      {
        team: buildTeam(),
        totalRoles: 3,
        roles: [
          buildRole({ uid: 'oldest', postedDate: '2024-01-01T00:00:00.000Z' }),
          buildRole({ uid: 'newest-by-detection', postedDate: null, detectionDate: '2024-03-01T00:00:00.000Z' }),
          buildRole({
            uid: 'newest-by-lastupdated',
            postedDate: null,
            detectionDate: null,
            lastUpdated: '2024-06-01T00:00:00.000Z',
          }),
        ],
      },
    ];

    const result = flattenLatestJobRoles(groups);

    expect(result.map((r) => r.role.uid)).toEqual(['newest-by-lastupdated', 'newest-by-detection', 'oldest']);
  });

  it('caps the result at the provided limit', () => {
    const roles = Array.from({ length: 15 }, (_, i) =>
      buildRole({ uid: `role-${i}`, postedDate: new Date(2024, 0, i + 1).toISOString() }),
    );
    const groups: IJobTeamGroup[] = [{ team: buildTeam(), totalRoles: roles.length, roles }];

    const result = flattenLatestJobRoles(groups, 10);

    expect(result).toHaveLength(10);
    // Newest (highest day-of-month) roles should be first.
    expect(result[0].role.uid).toBe('role-14');
  });

  it('returns an empty array when there are no groups', () => {
    expect(flattenLatestJobRoles([])).toEqual([]);
  });
});
