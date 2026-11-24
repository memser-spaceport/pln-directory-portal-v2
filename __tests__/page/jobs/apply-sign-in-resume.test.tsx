import { act, render, renderHook } from '@testing-library/react';

jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));
const mockAnalytics = {
  onJobApplyClicked: jest.fn(),
  onJobApplyStepViewed: jest.fn(),
  onJobApplySignUpSubmitted: jest.fn(),
};
jest.mock('@/analytics/jobs.analytics', () => ({ useJobsAnalytics: () => mockAnalytics }));
const mockViewer = { viewer: 'logged-out', verdict: 'pending' };
jest.mock('@/components/page/jobs/hooks/useJobBoardViewer', () => ({ useJobBoardViewer: () => mockViewer }));
const mockFlow = { onResumeGuestSignUp: jest.fn() };
jest.mock('@/components/page/jobs/hooks/useJobDetailDeepLink', () => ({ useJobDetailDeepLink: () => mockFlow }));
jest.mock('@/services/jobs/hooks/useJobInterests', () => ({
  useToggleJobInterest: () => ({ mutate: jest.fn() }),
  useRoleInterest: () => ({}),
}));
const mockGoToLogin = jest.fn();
jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => mockGoToLogin }));
type DynamicProps = { onSignIn?: () => void; onSignUp?: (d: object) => Promise<unknown>; role?: unknown };
const mockDrawerProps: DynamicProps[] = [];
jest.mock('next/dynamic', () => () => (props: DynamicProps) => {
  mockDrawerProps.push(props);
  return null;
});
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({}),
  useMutation: () => ({ mutateAsync: async () => ({}) }),
}));
jest.mock('@/services/auth/store', () => ({ useCurrentUserStore: () => ({}) }));
jest.mock('@/services/jobs/hooks/useJobApplications', () => ({ useRoleApplication: () => undefined }));
jest.mock('@/services/follow/hooks/useFollowedTeamUids', () => ({ useRememberTeamFollowed: () => jest.fn() }));
jest.mock('@/analytics/follow.analytics', () => ({ useFollowAnalytics: () => ({}) }));

import { useJobApplySurface } from '@/components/page/jobs/hooks/useJobApplySurface';
import { useJobApplyFlow } from '@/components/page/jobs/hooks/useJobApplyFlow';
import { JobApplyFlowController } from '@/components/page/jobs/JobApplyFlowController/JobApplyFlowController';
import { authEvents } from '@/components/core/login/utils/authEvents';
import type { JobSurface } from '@/analytics/jobs.analytics';
import type { IJobRole, IJobTeam, IJobTeamGroup } from '@/types/jobs.types';

const PL = { uid: 'cldvnyxaf01ynu21k62uopjvg', name: 'Protocol Labs' } as unknown as IJobTeam;
const role = { uid: 'role1' } as unknown as IJobRole;
const groups = [{ team: PL, roles: [role] }] as unknown as IJobTeamGroup[];
const target = { role, teamId: PL.uid, teamName: PL.name, team: PL };
const at = (url: string) => window.history.replaceState({}, '', url);
const search = () => window.location.search;
const surface = (isLoggedIn = false, source: JobSurface = 'job-board') =>
  renderHook(() =>
    useJobApplySurface({
      enabled: true,
      source,
      isLoggedIn,
      userInfo: undefined,
      groups,
      isLoading: false,
      deepLink: false,
    }),
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockDrawerProps.length = 0;
});

it('opens the guest step on the role page and drops the marker', () => {
  at('/jobs/openings/role1?applySignUp=role1');
  surface();
  expect(mockFlow.onResumeGuestSignUp).toHaveBeenCalledWith(target);
  expect(search()).toBe('');
});

it.each([
  ['/jobs?applySignUp=role1', 'job-board'],
  ['/teams/t1?applySignUp=role1', 'team-profile'],
  ['/jobs/openings/role2?applySignUp=role1', 'job-board'],
])('only drops a crafted marker on %s', (url, source) => {
  at(url);
  surface(false, source as JobSurface);
  expect(mockFlow.onResumeGuestSignUp).not.toHaveBeenCalled();
  expect(search()).toBe('');
});

it('drops both markers after a sign-in and does not resume', () => {
  at('/jobs/openings/role1?applySignUp=role1&applySignIn=role1&x=1');
  surface(true);
  expect(mockFlow.onResumeGuestSignUp).not.toHaveBeenCalled();
  expect(search()).toBe('?x=1');
});

it.each([
  ['keeps', 'auth:invalid-email', { code: 'email_not_found' }, '?applySignIn=role1'],
  ['drops', 'auth:invalid-email', 'rejected_access_level', ''],
  ['drops', 'auth:login-error', { error: 'exited_auth_flow' }, ''],
] as const)('%s applySignIn on %s %j', (_v, event, payload, expected) => {
  at('/jobs?applySignIn=role1#login');
  surface();
  act(() => authEvents.emit(event, payload as never));
  expect(search()).toBe(expected);
});

describe('Sign in from the controller', () => {
  const signIn = (state: object, source: JobSurface = 'job-board') => {
    at('/jobs?applySignIn=stale&a=1');
    const flow = { state, closeSignUp: jest.fn() } as never;
    const viewer = { viewer: 'logged-out', verdict: 'pending' } as never;
    render(
      <JobApplyFlowController flow={flow} viewer={viewer} isLoggedIn={false} userInfo={undefined} source={source} />,
    );
    act(() => mockDrawerProps.at(-1)!.onSignIn!());
    return mockGoToLogin.mock.calls[0][0].returnTo as string;
  };

  it.each([
    { step: 'flow', target, at: 'profile' },
    { step: 'sign-up', target },
  ])('carries the role from Job Board Apply in $step', (state) => {
    expect(signIn(state)).toBe('/jobs?applySignIn=role1&a=1');
  });

  it('sends the role sign-up modal back to the same role after submit', async () => {
    at('/jobs/openings/role1');
    const flow = { state: { step: 'sign-up', target }, closeSignUp: jest.fn() } as never;
    const viewer = { viewer: 'logged-out', verdict: 'pending' } as never;
    render(
      <JobApplyFlowController flow={flow} viewer={viewer} isLoggedIn={false} userInfo={undefined} source="job-board" />,
    );
    const modal = mockDrawerProps.at(-1)!;
    expect(modal.role).toBe(role);
    await act(async () => {
      await modal.onSignUp!({ name: 'A', email: 'a@example.com', linkedin: 'abc', jobSearchStatus: 'open' });
    });
    expect(mockAnalytics.onJobApplySignUpSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ job_id: 'role1', trigger: 'detail' }),
    );
    expect(mockGoToLogin.mock.calls[0][0].returnTo).toBe(
      '/jobs/openings/role1?prefillEmail=a%40example.com&applyTo=role1',
    );
  });

  it.each([
    [{ step: 'sign-up', target: null }, 'job-board'],
    [{ step: 'flow', target, at: 'profile' }, 'team-profile'],
  ] as const)('clears it for the role-less modal or another surface', (state, source) => {
    expect(signIn(state, source)).toBe('/jobs?a=1');
  });
});

describe('onResumeGuestSignUp', () => {
  const resume = (team: IJobTeam, viewer: 'logged-out' | 'profile-ready' = 'logged-out') => {
    const { result } = renderHook(() =>
      useJobApplyFlow({ viewer, verdict: 'pending', refreshVerdict: async () => 'pending', source: 'job-board' }),
    );
    act(() => result.current.onResumeGuestSignUp({ ...target, teamId: team.uid, team }));
    return result.current.state;
  };

  it('opens the Job Board sign-up modal for an in-app role', () => {
    expect(resume(PL)).toEqual({ step: 'sign-up', target });
    expect(mockAnalytics.onJobApplyClicked).not.toHaveBeenCalled();
  });

  it('keeps the review step for an external role and does nothing for a member', () => {
    const OTHER = { uid: 't2', name: 'Other Team', inAppApplyAvailable: false } as unknown as IJobTeam;
    expect(resume(OTHER)).toMatchObject({ step: 'flow', at: 'review' });
    expect(resume(PL, 'profile-ready')).toEqual({ step: 'idle' });
  });
});
