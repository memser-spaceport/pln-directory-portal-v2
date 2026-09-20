import {
  JOB_DETAIL_PARAM,
  findJobInGroups,
  jobDetailPath,
  jobBoardShareUrl,
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
  it('builds /jobs/openings/<uid>', () => {
    expect(jobDetailPath('role-1')).toBe('/jobs/openings/role-1');
  });

  it('encodes a uid that would break the path', () => {
    expect(jobDetailPath('role with space&x')).toBe('/jobs/openings/role%20with%20space%26x');
  });
});

describe('jobDetailShareUrl', () => {
  it('prefixes the current origin — never location.href, which may carry filters', () => {
    window.history.replaceState({}, '', '/jobs?roleCategory=Engineering&sort=newest');

    expect(jobDetailShareUrl('role-1')).toBe(`${window.location.origin}/jobs/openings/role-1`);
  });

  it('tags a link meant for someone else with the share channel', () => {
    expect(jobDetailShareUrl('role-1', 'copy_link')).toBe(
      `${window.location.origin}/jobs/openings/role-1?utm_source=job_refer_share&utm_medium=copy_link`,
    );
  });
});

describe('jobBoardShareUrl', () => {
  it('builds the board deep link, not the opening page', () => {
    expect(jobBoardShareUrl('role-1', 'copy_link')).toBe(
      `${window.location.origin}/jobs?job=role-1&utm_source=job_refer_share&utm_medium=copy_link`,
    );
  });

  /* `?job=` already opened the query string, so a second `?` would make the
     UTMs part of the uid and break the arrival attribution. */
  it('joins the attribution UTMs with & and keeps the uid readable', () => {
    const url = jobBoardShareUrl('role-1', 'linkedin');

    expect(url).toContain('/jobs?job=role-1&utm_source=');
    expect(url.match(/\?/g)).toHaveLength(1);
  });

  it('encodes a uid with URL-significant characters', () => {
    expect(jobBoardShareUrl('role with space&x', 'copy_link')).toContain('?job=role%20with%20space%26x&utm_source=');
  });

  it('prefixes the current origin — never location.href, which may carry filters', () => {
    window.history.replaceState({}, '', '/jobs?roleCategory=Engineering&job=other-role');

    expect(jobBoardShareUrl('role-1', 'copy_link')).toBe(
      `${window.location.origin}/jobs?job=role-1&utm_source=job_refer_share&utm_medium=copy_link`,
    );
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
