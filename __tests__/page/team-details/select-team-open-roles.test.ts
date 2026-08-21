import { selectTeamOpenRoles } from '@/components/page/team-details/TeamOpenRoles/selectTeamOpenRoles';
import type { IJobRole, IJobTeamGroup, IJobsListResponse } from '@/types/jobs.types';

const role: IJobRole = {
  uid: 'role-1',
  roleTitle: 'Engineer',
  roleCategory: null,
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  lastUpdated: '2026-05-01T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: null,
};

const groupFor = (teamUid: string, roles: IJobRole[] = [role]): IJobTeamGroup => ({
  team: { uid: teamUid, name: 'Acme', logoUrl: null, focusAreas: [], subFocusAreas: [] },
  totalRoles: roles.length,
  roles,
});

const responseWith = (groups: IJobTeamGroup[]): { data: IJobsListResponse } => ({
  data: { groups, page: 1, limit: 1, total: groups.length, totalGroups: groups.length, totalRoles: 1 },
});

describe('selectTeamOpenRoles', () => {
  it('returns the group when it belongs to the requested team', () => {
    expect(selectTeamOpenRoles(responseWith([groupFor('team-1')]), 'team-1')).toEqual(groupFor('team-1'));
  });

  it('returns null when the API answered with a different team', () => {
    // What an API build without the `teamUid` param does: the param is silently dropped
    // by the non-strict schema and the newest team comes back instead. Rendering that
    // would put another company's postings on this team's profile.
    expect(selectTeamOpenRoles(responseWith([groupFor('some-other-team')]), 'team-1')).toBeNull();
  });

  it('returns null for a group with no roles', () => {
    expect(selectTeamOpenRoles(responseWith([groupFor('team-1', [])]), 'team-1')).toBeNull();
  });

  it('returns null when no groups came back', () => {
    expect(selectTeamOpenRoles(responseWith([]), 'team-1')).toBeNull();
  });

  it('returns null when the jobs API errored', () => {
    expect(selectTeamOpenRoles({ isError: true }, 'team-1')).toBeNull();
  });

  it('returns null for a missing response', () => {
    expect(selectTeamOpenRoles(null, 'team-1')).toBeNull();
    expect(selectTeamOpenRoles(undefined, 'team-1')).toBeNull();
  });
});
