jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

import {
  isAlreadyAppliedError,
  isEmailTakenError,
  isJobGoneError,
  isNotApprovedError,
  isProfileIncompleteError,
  isUnreachableTeamError,
  JobApplicationError,
} from '@/services/jobs/job-applications.service';
import {
  jobApplicationListResponseSchema,
  jobBoardSignUpInputSchema,
  submitJobApplicationInputSchema,
} from '@/schema/job-applications';

describe('apply failure classification', () => {
  /* The backend's own messages, verbatim from the contract. These predicates
     read server prose, so drift in the wording is exactly what these pin. */
  const notApproved = new JobApplicationError(403, 'Account must be approved before applying');
  const missingRole = new JobApplicationError(400, 'Current role is required before applying');
  const missingStatus = new JobApplicationError(400, 'Job search status is required before applying');
  const noLeads = new JobApplicationError(400, 'This job has no team leads with email addresses');
  const alreadyApplied = new JobApplicationError(409, 'Already applied to this job');
  const gone = new JobApplicationError(404, 'Not found');

  it('separates the refusals that mean different things to the person', () => {
    expect(isNotApprovedError(notApproved)).toBe(true);
    expect(isJobGoneError(gone)).toBe(true);
    expect(isAlreadyAppliedError(alreadyApplied)).toBe(true);
  });

  it('tells the two kinds of 400 apart — one the person can fix, one they cannot', () => {
    expect(isProfileIncompleteError(missingRole)).toBe(true);
    expect(isProfileIncompleteError(missingStatus)).toBe(true);
    expect(isUnreachableTeamError(missingRole)).toBe(false);

    expect(isUnreachableTeamError(noLeads)).toBe(true);
    expect(isProfileIncompleteError(noLeads)).toBe(false);
  });

  it('does not classify unrelated failures', () => {
    const serverError = new JobApplicationError(500, 'Internal server error');

    expect(isNotApprovedError(serverError)).toBe(false);
    expect(isAlreadyAppliedError(serverError)).toBe(false);
    expect(isJobGoneError(serverError)).toBe(false);
    expect(isUnreachableTeamError(serverError)).toBe(false);
    expect(isProfileIncompleteError(serverError)).toBe(false);
  });

  it('survives a non-JobApplicationError without throwing — a network failure is not a 409', () => {
    for (const predicate of [isAlreadyAppliedError, isNotApprovedError, isJobGoneError, isUnreachableTeamError]) {
      expect(predicate(new TypeError('Failed to fetch'))).toBe(false);
      expect(predicate(undefined)).toBe(false);
      expect(predicate(null)).toBe(false);
    }
  });

  it('reads 409 on sign-up as the email already having an account', () => {
    expect(isEmailTakenError(new JobApplicationError(409, 'Email already exists'))).toBe(true);
    expect(isEmailTakenError(new JobApplicationError(400, 'Bad request'))).toBe(false);
  });
});

describe('wire contract', () => {
  it('accepts the applications envelope the API actually returns', () => {
    const parsed = jobApplicationListResponseSchema.parse({
      applications: [{ uid: 'app-1', jobUid: 'job-1', appliedAt: '2026-08-20T10:00:00.000Z' }],
    });

    expect(parsed.applications[0].jobUid).toBe('job-1');
  });

  it('rejects the old mock shape rather than accepting it silently', () => {
    // roleUid/teamUid was our pre-cutover invention; if it ever comes back,
    // the parse boundary is where it should stop.
    expect(() =>
      jobApplicationListResponseSchema.parse({
        applications: [{ roleUid: 'job-1', teamUid: 'team-1', appliedAt: '2026-08-20T10:00:00.000Z' }],
      }),
    ).toThrow();
  });

  it('sends the letter and nothing else — the job uid belongs in the path', () => {
    expect(() =>
      submitJobApplicationInputSchema.parse({ coverLetter: 'Hello', teamUid: 'team-1' } as never),
    ).toThrow();

    expect(submitJobApplicationInputSchema.parse({ coverLetter: '  Hello  ' }).coverLetter).toBe('Hello');
  });

  it('holds the server-side letter bounds so a doomed request is caught first', () => {
    expect(() => submitJobApplicationInputSchema.parse({ coverLetter: '   ' })).toThrow();
    expect(() => submitJobApplicationInputSchema.parse({ coverLetter: 'x'.repeat(2001) })).toThrow();
    expect(() => submitJobApplicationInputSchema.parse({ coverLetter: 'x'.repeat(2000) })).not.toThrow();
  });

  it('treats the sign-up company as optional, and an existing team as a uid', () => {
    const withTeam = jobBoardSignUpInputSchema.parse({
      name: 'Ada',
      email: 'ada@example.com',
      role: 'Engineer',
      team: { uid: 'team-1' },
    });
    expect(withTeam.team?.uid).toBe('team-1');

    const withoutTeam = jobBoardSignUpInputSchema.parse({
      name: 'Ada',
      email: 'ada@example.com',
      role: 'Engineer',
    });
    expect(withoutTeam.team).toBeUndefined();
  });

  it('will not send a sign-up missing what the endpoint requires', () => {
    expect(() => jobBoardSignUpInputSchema.parse({ name: 'Ada', email: 'not-an-email', role: 'Engineer' })).toThrow();
    expect(() => jobBoardSignUpInputSchema.parse({ name: 'Ada', email: 'ada@example.com', role: '' })).toThrow();
  });
});
