import { getJobByUid } from '@/services/jobs/getJobByUid';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = (uid: string): IJobRole => ({
  uid,
  roleTitle: `Role ${uid}`,
  roleCategory: 'Operations',
  seniority: null,
  location: ['US'],
  workMode: 'remote',
  applyUrl: null,
  lastUpdated: '2026-05-01T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: null,
});

const team: IJobTeam = {
  uid: 'team-1',
  name: 'Protocol Labs',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
};

const listResponse = (roles: IJobRole[]) => ({
  page: 1,
  limit: 50,
  total: roles.length,
  totalGroups: roles.length ? 1 : 0,
  totalRoles: roles.length,
  groups: roles.length ? [{ team, totalRoles: roles.length, roles }] : [],
});

describe('getJobByUid', () => {
  const originalEnv = process.env.DIRECTORY_API_URL;
  const fetchMock = jest.fn();

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.com';
    global.fetch = fetchMock;
  });

  afterAll(() => {
    process.env.DIRECTORY_API_URL = originalEnv;
  });

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('resolves the role and the team that posted it', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => listResponse([role('role-1')]) });

    const result = await getJobByUid('role-1');

    expect(result?.role.uid).toBe('role-1');
    expect(result?.team.name).toBe('Protocol Labs');
  });

  it('queries the board by jobUid, encoded, and caches for five minutes', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => listResponse([role('role 1')]) });

    await getJobByUid('role 1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/v1/job-openings?jobUid=role%201', {
      next: { revalidate: 300 },
    });
  });

  // A delisted role, which is what a link shared before the role was filled hits.
  it('returns null when the board matches nothing', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => listResponse([]) });

    expect(await getJobByUid('gone')).toBeNull();
  });

  it('returns null rather than the wrong role when the response does not carry the uid', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => listResponse([role('someone-else')]) });

    expect(await getJobByUid('role-1')).toBeNull();
  });

  it('returns null on a failed response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    expect(await getJobByUid('role-1')).toBeNull();
  });

  it('returns null when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    expect(await getJobByUid('role-1')).toBeNull();
  });
});
