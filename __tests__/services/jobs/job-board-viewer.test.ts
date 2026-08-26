import {
  BOARD_VIEWER_STATES,
  canApplyToJobs,
  deriveBoardViewer,
  getJobsAccessVerdict,
  isJobAspirant,
  isJobProfileComplete,
  isJobSearchStatus,
  JOB_ASPIRANT_POLICY_CODE,
  JOB_SEARCH_STATUS_OPTIONS,
  jobSearchStatusDisplayLabel,
} from '@/services/jobs/job-board-viewer';
import { IUserInfo } from '@/types/shared.types';

const rbacUser = (
  status: NonNullable<IUserInfo['rbac']>['status'],
  policies: NonNullable<IUserInfo['rbac']>['policies'] = [],
): IUserInfo => ({
  uid: 'm1',
  rbac: { status, policies, effectivePermissions: [], roles: [] },
});

const JOB_ASPIRANT_POLICY = {
  uid: 'policy_job_aspirant',
  code: JOB_ASPIRANT_POLICY_CODE,
  name: 'Job Aspirant / Job Board',
  description: null,
  role: 'Job Aspirant',
  group: 'Job Board',
};

const legacyUser = (accessLevel: IUserInfo['accessLevel']): IUserInfo => ({ uid: 'm1', accessLevel });

describe('getJobsAccessVerdict', () => {
  describe('access-control v2 (rbac.status)', () => {
    it.each([
      ['PENDING', 'pending'],
      ['VERIFIED', 'pending'],
      ['APPROVED', 'approved'],
      ['REJECTED', 'rejected'],
    ] as const)('%s → %s', (status, verdict) => {
      expect(getJobsAccessVerdict(rbacUser(status), true)).toBe(verdict);
    });

    it('treats a logged-in user with no rbac object as pending', () => {
      expect(getJobsAccessVerdict({ uid: 'm1', rbac: null }, true)).toBe('pending');
      expect(getJobsAccessVerdict({ uid: 'm1' }, true)).toBe('pending');
    });
  });

  describe('legacy (accessLevel)', () => {
    it.each([
      ['L0', 'pending'],
      ['L1', 'pending'],
      ['L2', 'approved'],
      ['L3', 'approved'],
      ['L4', 'approved'],
      ['L5', 'approved'],
      ['L6', 'approved'],
      ['Rejected', 'rejected'],
    ] as const)('%s → %s', (level, verdict) => {
      expect(getJobsAccessVerdict(legacyUser(level), false)).toBe(verdict);
    });

    it('treats a logged-in user with undefined accessLevel as pending', () => {
      expect(getJobsAccessVerdict({ uid: 'm1' }, false)).toBe('pending');
    });
  });

  it('returns pending for a null user on both branches', () => {
    expect(getJobsAccessVerdict(null, true)).toBe('pending');
    expect(getJobsAccessVerdict(null, false)).toBe('pending');
  });

  it('the branches read different systems — disagreement resolves by the selected branch', () => {
    const disagreeing: IUserInfo = { ...rbacUser('APPROVED'), accessLevel: 'L0' };
    expect(getJobsAccessVerdict(disagreeing, true)).toBe('approved');
    expect(getJobsAccessVerdict(disagreeing, false)).toBe('pending');

    const reversed: IUserInfo = { ...rbacUser('REJECTED'), accessLevel: 'L4' };
    expect(getJobsAccessVerdict(reversed, true)).toBe('rejected');
    expect(getJobsAccessVerdict(reversed, false)).toBe('approved');
  });
});

describe('canApplyToJobs', () => {
  it('is true only for the approved verdict', () => {
    expect(canApplyToJobs(rbacUser('APPROVED'), true)).toBe(true);
    expect(canApplyToJobs(rbacUser('VERIFIED'), true)).toBe(false);
    expect(canApplyToJobs(rbacUser('REJECTED'), true)).toBe(false);
    expect(canApplyToJobs(null, true)).toBe(false);
  });
});

describe('isJobAspirant', () => {
  it('is true when rbac.policies carries the Job Aspirant code', () => {
    expect(isJobAspirant(rbacUser('PENDING', [JOB_ASPIRANT_POLICY]))).toBe(true);
    expect(isJobAspirant(rbacUser('PENDING'))).toBe(false);
    expect(isJobAspirant(null)).toBe(false);
  });

  it('is true from Job Board signUpSource when the cookie has no policies', () => {
    expect(
      isJobAspirant({
        uid: 'm1',
        signUpSource: 'job-board',
        rbac: { status: 'VERIFIED', policies: [], effectivePermissions: [], roles: [] },
      }),
    ).toBe(true);
    expect(isJobAspirant({ uid: 'm1', signUpSource: 'job-board' })).toBe(true);
    expect(isJobAspirant({ uid: 'm1', signUpSource: 'website' })).toBe(false);
  });
});

describe('JobSearchStatus', () => {
  it('guard accepts exactly the option values', () => {
    for (const option of JOB_SEARCH_STATUS_OPTIONS) {
      expect(isJobSearchStatus(option.value)).toBe(true);
    }
    expect(isJobSearchStatus('')).toBe(false);
    expect(isJobSearchStatus(null)).toBe(false);
    expect(isJobSearchStatus(undefined)).toBe(false);
    expect(isJobSearchStatus('open')).toBe(false);
  });

  it('labels known values and degrades unknown wire values to themselves', () => {
    expect(jobSearchStatusDisplayLabel('actively-looking')).toBe('Actively looking');
    expect(jobSearchStatusDisplayLabel('some-future-value')).toBe('some-future-value');
  });
});

describe('isJobProfileComplete', () => {
  it('requires both a role and an answered status', () => {
    expect(isJobProfileComplete({ role: 'Engineer' }, 'actively-looking')).toBe(true);
    expect(isJobProfileComplete({ role: 'Engineer' }, null)).toBe(false);
    expect(isJobProfileComplete({ role: '' }, 'actively-looking')).toBe(false);
    expect(isJobProfileComplete(null, 'actively-looking')).toBe(false);
  });

  it('reads mainTeam.role first, falling back to the flat role', () => {
    expect(isJobProfileComplete({ role: '', mainTeam: { role: 'CTO' } }, 'not-looking')).toBe(true);
    expect(isJobProfileComplete({ role: 'Engineer', mainTeam: null }, 'not-looking')).toBe(true);
  });

  it('falls back past an empty-string mainTeam.role (?? alone would not)', () => {
    expect(isJobProfileComplete({ role: 'Engineer', mainTeam: { role: '' } }, 'not-looking')).toBe(true);
    expect(isJobProfileComplete({ role: '   ', mainTeam: { role: '  ' } }, 'not-looking')).toBe(false);
  });
});

describe('deriveBoardViewer', () => {
  const approved = rbacUser('APPROVED');

  it('logged out wins over everything — cookies answer it authoritatively', () => {
    expect(
      deriveBoardViewer({ isLoggedIn: false, userInfo: null, isResolved: false, profileComplete: false, useV2: true }),
    ).toBe('logged-out');
  });

  it('is resolving while logged-in sub-state queries are in flight', () => {
    expect(
      deriveBoardViewer({
        isLoggedIn: true,
        userInfo: approved,
        isResolved: false,
        profileComplete: true,
        useV2: true,
      }),
    ).toBe('resolving');
  });

  it.each([
    ['PENDING', 'pending-approval'],
    ['VERIFIED', 'pending-approval'],
    ['REJECTED', 'rejected'],
  ] as const)('settled %s → %s', (status, state) => {
    expect(
      deriveBoardViewer({
        isLoggedIn: true,
        userInfo: rbacUser(status),
        isResolved: true,
        profileComplete: false,
        useV2: true,
      }),
    ).toBe(state);
  });

  it('approved splits on profile completeness', () => {
    const base = { isLoggedIn: true, userInfo: approved, isResolved: true, useV2: true };
    expect(deriveBoardViewer({ ...base, profileComplete: true })).toBe('profile-ready');
    expect(deriveBoardViewer({ ...base, profileComplete: false })).toBe('profile-incomplete');
  });

  it.each(['PENDING', 'VERIFIED'] as const)(
    'a %s Job Aspirant skips the pending-approval banner and splits like approved',
    (status) => {
      const aspirant = rbacUser(status, [JOB_ASPIRANT_POLICY]);
      const base = { isLoggedIn: true, userInfo: aspirant, isResolved: true, useV2: true };
      expect(deriveBoardViewer({ ...base, profileComplete: true })).toBe('profile-ready');
      expect(deriveBoardViewer({ ...base, profileComplete: false })).toBe('profile-incomplete');
    },
  );

  it('a pending member without the Job Aspirant policy still waits', () => {
    expect(
      deriveBoardViewer({
        isLoggedIn: true,
        userInfo: rbacUser('PENDING'),
        isResolved: true,
        profileComplete: true,
        useV2: true,
      }),
    ).toBe('pending-approval');
  });

  it('a pending Job Board signUpSource skips the banner even without the policy on the cookie', () => {
    const fromCookie: IUserInfo = { ...rbacUser('VERIFIED'), signUpSource: 'job-board' };
    expect(
      deriveBoardViewer({
        isLoggedIn: true,
        userInfo: fromCookie,
        isResolved: true,
        profileComplete: true,
        useV2: true,
      }),
    ).toBe('profile-ready');
  });

  it('an approved Job Aspirant still splits on profile completeness', () => {
    const aspirant = rbacUser('APPROVED', [JOB_ASPIRANT_POLICY]);
    const base = { isLoggedIn: true, userInfo: aspirant, isResolved: true, useV2: true };
    expect(deriveBoardViewer({ ...base, profileComplete: true })).toBe('profile-ready');
    expect(deriveBoardViewer({ ...base, profileComplete: false })).toBe('profile-incomplete');
  });

  it('every derivable state is a member of BOARD_VIEWER_STATES', () => {
    const derived = deriveBoardViewer({
      isLoggedIn: true,
      userInfo: legacyUser('L3'),
      isResolved: true,
      profileComplete: true,
      useV2: false,
    });
    expect(BOARD_VIEWER_STATES).toContain(derived);
  });
});
