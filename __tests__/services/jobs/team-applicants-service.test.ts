/**
 * The layer that survives cutover.
 *
 * `team-applicants.mock.ts` is a stand-in backend and will be deleted when
 * LAB-2580 lands, but the schemas it answers through are the contract that
 * outlives it — so these assertions are about shapes and rules, never about the
 * mock's cast of people.
 */

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

/* The mock derives a team's roles from the real jobs list so its counts line up
   with the postings the profile shows. That call is not what is under test. */
jest.mock('@/services/jobs/jobs.service', () => ({ fetchJobsList: jest.fn() }));

/* The mock borrows real members so the profile pane has someone to fetch. Here
   it must not reach the network at all: an unmocked call would make these
   assertions depend on whatever the dev directory holds today. Refusing it also
   exercises the fallback, which is the path a mock without API access takes. */
jest.mock('@/services/members.service', () => ({
  getMembers: jest.fn().mockRejectedValue(new Error('offline in tests')),
}));

import {
  applicantCountsResponseSchema,
  applicantRowSchema,
  roleApplicantsResponseSchema,
} from '@/schema/team-applicants';
import { fetchJobsList } from '@/services/jobs/jobs.service';
import {
  fetchApplicantCounts,
  fetchRoleApplicants,
  isApplicantsForbiddenError,
  markApplicantSeen,
  setApplicantReviewed,
  TeamApplicantsError,
} from '@/services/jobs/team-applicants.service';

const asMock = fetchJobsList as jest.MockedFunction<typeof fetchJobsList>;

const TEAM = 'team-1';
const jobsListWith = (teamUid: string, roleUids: string[]) =>
  ({
    groups: [{ team: { uid: teamUid }, totalRoles: roleUids.length, roles: roleUids.map((uid) => ({ uid })) }],
  }) as unknown as Awaited<ReturnType<typeof fetchJobsList>>;

beforeEach(() => {
  asMock.mockReset();
});

describe('the applicant row contract', () => {
  const row = {
    uid: 'app-1',
    memberUid: 'm-1',
    name: 'Devon Park',
    email: 'devon@example.com',
    profileUrl: 'https://directory.plnetwork.io/members/m-1',
    avatarUrl: 'https://example.com/devon.jpg',
    headline: 'Protocol Engineer',
    currentCompany: 'Lattice Compute',
    location: 'Berlin, Germany',
    tags: ['Go'],
    createdAt: '2026-09-17T00:00:00.000Z',
    coverLetter: 'I led the consensus rewrite.',
    cv: { fileName: 'cv.pdf', size: 184320, uploadedAt: '2026-09-17T00:00:00.000Z' },
    unseen: true,
    reviewed: false,
  };

  it('accepts an interest — the same shape with no note and no CV', () => {
    expect(() => applicantRowSchema.parse({ ...row, coverLetter: null, cv: null })).not.toThrow();
  });

  it('accepts a member with no email, because Email <name> has to hide itself', () => {
    expect(() => applicantRowSchema.parse({ ...row, email: null })).not.toThrow();
  });

  it('accepts a member with no picture, because the row draws initials instead', () => {
    expect(() => applicantRowSchema.parse({ ...row, avatarUrl: null })).not.toThrow();
  });

  it('accepts a CV with no size — the API reads it from S3 and that read may fail', () => {
    const { size, ...noSize } = row.cv;
    expect(() => applicantRowSchema.parse({ ...row, cv: noSize })).not.toThrow();
  });

  /* `.strict()` is the point: a field the server grows and this schema has
     never heard of must fail here, not arrive as undefined three components
     later. `kind` specifically, because the envelope carries it and a server
     that sensibly omits it must not be the thing that breaks. */
  it('rejects a field the contract does not declare, kind included', () => {
    expect(() => applicantRowSchema.parse({ ...row, kind: 'application' })).toThrow();
    expect(() => applicantRowSchema.parse({ ...row, stage: 'shortlisted' })).toThrow();
  });

  it('requires the two flags, so "unknown" can never pass for "no"', () => {
    const { unseen, ...noUnseen } = row;
    const { reviewed, ...noReviewed } = row;
    expect(() => applicantRowSchema.parse(noUnseen)).toThrow();
    expect(() => applicantRowSchema.parse(noReviewed)).toThrow();
  });
});

describe('fetchApplicantCounts', () => {
  it('omits roles nobody answered, so absence is the answer and no line is drawn', async () => {
    /* Enough roles that the mock's deterministic cast sizes produce both kinds;
       the assertion is the rule, not which uid lands on which size. */
    const roleUids = Array.from({ length: 12 }, (_, i) => `role-${i}`);
    asMock.mockResolvedValue(jobsListWith(TEAM, roleUids));

    const counts = await fetchApplicantCounts(TEAM);

    expect(() => applicantCountsResponseSchema.parse({ counts })).not.toThrow();
    expect(counts.length).toBeGreaterThan(0);
    expect(counts.length).toBeLessThan(roleUids.length);
    counts.forEach((count) => {
      expect(count.applicantCount + count.interestCount).toBeGreaterThan(0);
      expect(count.newCount).toBeLessThanOrEqual(count.applicantCount + count.interestCount);
      /* The facepile shows three at most, and a member without a picture
         contributes none rather than a gap. */
      expect(count.newestAvatars.length).toBeLessThanOrEqual(3);
    });
  });

  /* The same guard `selectTeamOpenRoles` makes: `JobsListQueryParams` is a
     non-strict Zod object, so an API build that predates `teamUid` ignores it
     and answers with another team's group. Counting that team's applicants for
     this team would be a plausible wrong answer rather than an error. */
  it('counts nothing when the jobs API answers with another team', async () => {
    asMock.mockResolvedValue(jobsListWith('someone-else', ['role-0', 'role-1']));

    await expect(fetchApplicantCounts(TEAM)).resolves.toEqual([]);
  });

  it('degrades to no counts when the jobs API is down, rather than taking the page with it', async () => {
    asMock.mockRejectedValue(new Error('jobs list unavailable'));

    await expect(fetchApplicantCounts(TEAM)).resolves.toEqual([]);
  });
});

describe('fetchRoleApplicants', () => {
  it('tags every row with the list it came from, because a row loses its envelope', async () => {
    const { applications, interests } = await fetchRoleApplicants(TEAM, 'role-with-both');

    expect(() =>
      roleApplicantsResponseSchema.parse({
        applications: applications.map(({ kind, ...row }) => row),
        interests: interests.map(({ kind, ...row }) => row),
      }),
    ).not.toThrow();
    applications.forEach((row) => expect(row.kind).toBe('application'));
    interests.forEach((row) => expect(row.kind).toBe('interest'));
  });

  it('gives an interest no note — the press carries no words', async () => {
    const { interests } = await fetchRoleApplicants(TEAM, 'role-with-both');

    interests.forEach((row) => expect(row.coverLetter).toBeNull());
  });

  it('answers the same cast for the same role, so a reload does not reshuffle the list', async () => {
    const first = await fetchRoleApplicants(TEAM, 'role-stable');
    const second = await fetchRoleApplicants(TEAM, 'role-stable');

    expect(second.applications.map((row) => row.uid)).toEqual(first.applications.map((row) => row.uid));
  });

  it('sorts each list newest first', async () => {
    const { applications } = await fetchRoleApplicants(TEAM, 'role-with-both');
    const dates = applications.map((row) => row.createdAt);

    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });
});

describe('the two writes', () => {
  it('marks reviewed and undoes it on a second press', async () => {
    const { applications } = await fetchRoleApplicants(TEAM, 'role-reviewable');
    const target = applications[0];

    await expect(setApplicantReviewed(target.kind, target.uid, true)).resolves.toEqual({
      uid: target.uid,
      reviewed: true,
    });
    await expect(setApplicantReviewed(target.kind, target.uid, false)).resolves.toEqual({
      uid: target.uid,
      reviewed: false,
    });
  });

  it('carries the mark back into the next read, so the tick is not just on screen', async () => {
    const before = await fetchRoleApplicants(TEAM, 'role-persisting');
    const target = before.applications[0];
    await setApplicantReviewed(target.kind, target.uid, true);

    const after = await fetchRoleApplicants(TEAM, 'role-persisting');

    expect(after.applications.find((row) => row.uid === target.uid)?.reviewed).toBe(true);
  });

  it('clears unseen for the row it is told about, and only that row', async () => {
    const before = await fetchRoleApplicants(TEAM, 'role-seeable');
    const target = before.applications[0];
    expect(target.unseen).toBe(true);

    await markApplicantSeen(target.kind, target.uid);
    const after = await fetchRoleApplicants(TEAM, 'role-seeable');

    expect(after.applications.find((row) => row.uid === target.uid)?.unseen).toBe(false);
    after.applications.filter((row) => row.uid !== target.uid).forEach((row) => expect(row.unseen).toBe(true));
  });

  it('is idempotent about being seen', async () => {
    const { applications } = await fetchRoleApplicants(TEAM, 'role-idempotent');
    const target = applications[0];

    const first = await markApplicantSeen(target.kind, target.uid);
    const second = await markApplicantSeen(target.kind, target.uid);

    expect(second.uid).toBe(first.uid);
  });
});

describe('failure classification', () => {
  it('separates "not a lead of this team" from every other refusal', () => {
    expect(isApplicantsForbiddenError(new TeamApplicantsError(403, 'Forbidden'))).toBe(true);
    expect(isApplicantsForbiddenError(new TeamApplicantsError(404, 'Not found'))).toBe(false);
    expect(isApplicantsForbiddenError(new Error('Forbidden'))).toBe(false);
  });
});
