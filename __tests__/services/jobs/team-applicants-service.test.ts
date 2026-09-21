const mockFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockFetch(...args),
}));

import { applicantRowSchema } from '@/schema/team-applicants';
import {
  fetchApplicantCounts,
  fetchRoleApplicants,
  isApplicantsForbiddenError,
  markApplicantSeen,
  setApplicantReviewed,
  TeamApplicantsError,
} from '@/services/jobs/team-applicants.service';

/**
 * The layer that survived cutover.
 *
 * This screen shipped against a `// MOCK: delete at cutover` service while the
 * endpoints were written to these schemas (backend #3438). The mock is gone; the
 * schemas are not, and they still parse every response — so what is tested here
 * is the transport and the contract, never a cast of invented people.
 */

const ROW = {
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

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number, body: unknown = {}) => ({ ok: false, status, json: async () => body });

const lastCall = () => mockFetch.mock.calls[mockFetch.mock.calls.length - 1];

beforeEach(() => mockFetch.mockReset());

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
  it('asks the team’s own endpoint, authenticated', async () => {
    mockFetch.mockResolvedValue(ok({ counts: [] }));

    await fetchApplicantCounts('team 1');

    const [url, init, authed] = lastCall();
    expect(url).toContain('/v1/job-openings/teams/team%201/applicant-counts');
    expect(init.method).toBe('GET');
    /* Every read here is a lead reading their own team's applicants: without the
       session `customFetch` cannot add Authorization, and the endpoint answers 403. */
    expect(authed).toBe(true);
  });

  it('hands back the counts array, not the envelope', async () => {
    const count = { roleUid: 'r-1', applicantCount: 2, interestCount: 1, newCount: 3, newestAvatars: [] };
    mockFetch.mockResolvedValue(ok({ counts: [count] }));

    await expect(fetchApplicantCounts('team-1')).resolves.toEqual([count]);
  });

  /* The schemas are still the boundary now that a real server is behind them:
     drift fails here rather than arriving as `undefined` three components on. */
  it('throws when the server drifts from the contract', async () => {
    mockFetch.mockResolvedValue(ok({ counts: [{ roleUid: 'r-1' }] }));

    await expect(fetchApplicantCounts('team-1')).rejects.toBeDefined();
  });
});

describe('fetchRoleApplicants', () => {
  it('asks for one role’s two lists', async () => {
    mockFetch.mockResolvedValue(ok({ applications: [], interests: [] }));

    await fetchRoleApplicants('team-1', 'role 1');

    const [url, init, authed] = lastCall();
    expect(url).toContain('/v1/job-openings/teams/team-1/roles/role%201/applicants');
    expect(init.method).toBe('GET');
    expect(authed).toBe(true);
  });

  /**
   * `kind` is the app's word, not the wire's. The API answers two named arrays;
   * a row that leaves its array — into the pane, into a `seen` write — has to
   * keep knowing which list it came from, and the schema rejects `kind` on the
   * way in precisely so the server cannot be the thing that sets it.
   */
  it('tags each row with the list it came from', async () => {
    mockFetch.mockResolvedValue(
      ok({ applications: [ROW], interests: [{ ...ROW, uid: 'int-1', coverLetter: null, cv: null }] }),
    );

    const { applications, interests } = await fetchRoleApplicants('team-1', 'role-1');

    expect(applications[0].kind).toBe('application');
    expect(interests[0].kind).toBe('interest');
  });
});

describe('the two writes', () => {
  /**
   * The URL says `applications` / `interests`; the app says `application` /
   * `interest`, because a single row is one of them. The mapping is one table in
   * the service, and getting it backwards is a 404 on every press.
   */
  it('pluralises the kind for the path', async () => {
    mockFetch.mockResolvedValue(ok({ uid: 'app-1', reviewed: true }));
    await setApplicantReviewed('application', 'app-1', true);
    expect(lastCall()[0]).toContain('/v1/job-openings/applications/app-1/reviewed');

    mockFetch.mockResolvedValue(ok({ uid: 'int-1', seenAt: '2026-09-21T00:00:00.000Z' }));
    await markApplicantSeen('interest', 'int-1');
    expect(lastCall()[0]).toContain('/v1/job-openings/interests/int-1/seen');
  });

  /**
   * A JSON content type on both, empty body included.
   *
   * Not ceremony: `customFetch` adds Authorization and nothing else, so a
   * bodyless POST goes out with no `Content-Type` and the API's validation layer
   * answers 415 before the handler runs. The interest endpoints learned this the
   * hard way; this pair inherits the fix rather than the bug.
   */
  it('declares JSON on a write that carries no payload', async () => {
    mockFetch.mockResolvedValue(ok({ uid: 'app-1', seenAt: '2026-09-21T00:00:00.000Z' }));

    await markApplicantSeen('application', 'app-1');

    const [, init] = lastCall();
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{}');
  });

  it('sends the tick’s new value and answers with the stored one', async () => {
    mockFetch.mockResolvedValue(ok({ uid: 'app-1', reviewed: false }));

    const result = await setApplicantReviewed('application', 'app-1', false);

    expect(JSON.parse(lastCall()[1].body)).toEqual({ reviewed: false });
    /* The server's answer, not the argument: the screen corrects itself from
       what was stored rather than from what the press assumed. */
    expect(result).toEqual({ uid: 'app-1', reviewed: false });
  });
});

describe('failures', () => {
  it('surfaces the server’s own message when it sent one', async () => {
    mockFetch.mockResolvedValue(fail(403, { message: 'You do not lead this team' }));

    await expect(fetchApplicantCounts('team-1')).rejects.toMatchObject({
      status: 403,
      message: 'You do not lead this team',
    });
  });

  /**
   * `customFetch` resolves to `undefined` when it gives up and logs the session
   * out. There is no response to read and a reload is already under way, so this
   * has to not throw on the way there — a crash here would replace the reload
   * with an error screen.
   */
  it('reports an expired session rather than throwing on a missing response', async () => {
    mockFetch.mockResolvedValue(undefined);

    await expect(markApplicantSeen('application', 'app-1')).rejects.toMatchObject({ status: 401 });
  });
});

describe('failure classification', () => {
  it('separates "not a lead of this team" from every other refusal', () => {
    expect(isApplicantsForbiddenError(new TeamApplicantsError(403, 'Forbidden'))).toBe(true);
    expect(isApplicantsForbiddenError(new TeamApplicantsError(404, 'Not found'))).toBe(false);
    expect(isApplicantsForbiddenError(new Error('Forbidden'))).toBe(false);
  });
});
