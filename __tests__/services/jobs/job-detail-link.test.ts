import {
  JOB_DETAIL_PARAM,
  findJobInGroups,
  jobDetailPath,
  jobDetailShareUrl,
  writeJobDetailParam,
} from '@/services/jobs/job-detail-link';
import type { IJobRole, IJobTeam, IJobTeamGroup } from '@/types/jobs.types';

const role = (uid: string): IJobRole => ({
  uid,
  roleTitle: `Role ${uid}`,
  roleCategory: 'Engineering',
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  lastUpdated: '2026-05-01T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: null,
});

const team = (uid: string): IJobTeam => ({
  uid,
  name: `Team ${uid}`,
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
});

const group = (teamUid: string, roleUids: string[]): IJobTeamGroup => ({
  team: team(teamUid),
  totalRoles: roleUids.length,
  roles: roleUids.map(role),
});

describe('jobDetailPath', () => {
  it('builds /jobs?job=<uid>', () => {
    expect(jobDetailPath('role-1')).toBe(`/jobs?${JOB_DETAIL_PARAM}=role-1`);
  });

  it('encodes a uid that would break the query string', () => {
    expect(jobDetailPath('role with space&x')).toBe(`/jobs?${JOB_DETAIL_PARAM}=role%20with%20space%26x`);
  });
});

describe('jobDetailShareUrl', () => {
  it('prefixes the current origin — never location.href, which may carry filters', () => {
    window.history.replaceState({}, '', '/jobs?roleCategory=Engineering&sort=newest');

    expect(jobDetailShareUrl('role-1')).toBe(`${window.location.origin}/jobs?${JOB_DETAIL_PARAM}=role-1`);
  });
});

describe('findJobInGroups', () => {
  const groups = [group('t1', ['r1', 'r2']), group('t2', ['r3'])];

  it('returns the role and the team that posted it', () => {
    expect(findJobInGroups(groups, 'r2')).toEqual({ role: role('r2'), team: team('t1') });
  });

  it('returns null when the role is not on the loaded pages', () => {
    expect(findJobInGroups(groups, 'missing')).toBeNull();
  });
});

describe('writeJobDetailParam', () => {
  const setUrl = (url: string) => window.history.replaceState({}, '', url);

  it('sets the param without touching the rest of the query', () => {
    setUrl('/jobs?roleCategory=Engineering&sort=newest');

    writeJobDetailParam('role-1');

    const params = new URLSearchParams(window.location.search);
    expect(params.get(JOB_DETAIL_PARAM)).toBe('role-1');
    expect(params.get('roleCategory')).toBe('Engineering');
    expect(params.get('sort')).toBe('newest');
  });

  it('clears the param and leaves a bare path bare rather than trailing a "?"', () => {
    setUrl(`/jobs?${JOB_DETAIL_PARAM}=role-1`);

    writeJobDetailParam(null);

    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/jobs');
  });

  it('replaces a stale uid rather than appending a second one', () => {
    setUrl(`/jobs?${JOB_DETAIL_PARAM}=old-role`);

    writeJobDetailParam('new-role');

    expect(new URLSearchParams(window.location.search).getAll(JOB_DETAIL_PARAM)).toEqual(['new-role']);
  });

  it('does not navigate — the board underneath must not re-render mid-open', () => {
    setUrl('/jobs');
    const pushSpy = jest.spyOn(window.history, 'pushState');

    writeJobDetailParam('role-1');

    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });
});
