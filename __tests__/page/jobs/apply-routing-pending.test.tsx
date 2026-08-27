import { renderHook, act } from '@testing-library/react';

const mockOpenExternal = jest.fn();
jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants', () => ({
  openExternalApply: (...args: unknown[]) => mockOpenExternal(...args),
  jobApplyHref: () => 'https://example.com/apply',
  jobApplyQueryParams: () => '',
  JOB_QUERY_PARAMS: '',
}));

const mockOnJobApplyClicked = jest.fn();
const mockOnJobApplyDrawerOpened = jest.fn();
const mockOnJobDetailOpened = jest.fn();
const mockOnJobApplyDrawerSaved = jest.fn();
const mockOnJobApplyStepViewed = jest.fn();
const mockOnJobApplyFlowClosed = jest.fn();
const mockOnJobApplyExternalRedirected = jest.fn();

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobApplyClicked: (...a: unknown[]) => mockOnJobApplyClicked(...a),
    onJobApplyDrawerOpened: (...a: unknown[]) => mockOnJobApplyDrawerOpened(...a),
    onJobDetailOpened: (...a: unknown[]) => mockOnJobDetailOpened(...a),
    onJobApplyDrawerSaved: (...a: unknown[]) => mockOnJobApplyDrawerSaved(...a),
    onJobApplyStepViewed: (...a: unknown[]) => mockOnJobApplyStepViewed(...a),
    onJobApplyFlowClosed: (...a: unknown[]) => mockOnJobApplyFlowClosed(...a),
    onJobApplyExternalRedirected: (...a: unknown[]) => mockOnJobApplyExternalRedirected(...a),
  }),
}));

import { useJobApplyFlow, type JobDetailTarget } from '@/components/page/jobs/hooks/useJobApplyFlow';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = { uid: 'r1', roleTitle: 'Engineer', applyUrl: 'https://example.com/apply' } as unknown as IJobRole;
const teamNamed = (uid: string, name: string) => ({ uid, name }) as unknown as IJobTeam;

const target = (team: IJobTeam): JobDetailTarget => ({ role, teamId: team.uid, teamName: team.name, team });

const PL = teamNamed('cldvnyxaf01ynu21k62uopjvg', 'Protocol Labs');
const OTHER = teamNamed('t2', 'Bluesky');

const setup = (
  verdict: 'approved' | 'pending' | 'rejected',
  profileComplete = true,
  viewer: 'profile-ready' | 'logged-out' = 'profile-ready',
) =>
  renderHook(() =>
    useJobApplyFlow({
      viewer,
      verdict,
      profileComplete,
      refreshVerdict: async () => verdict,
      source: 'job-board',
    }),
  );

/**
 * Where Apply lands for an account still awaiting approval.
 *
 * The board's original rule, restored with one carve-out: unapproved accounts
 * apply on the employer's own site, except to Protocol Labs, whose hiring this
 * network runs. Both directions are asserted — sending a PL applicant off-site
 * loses the wizard the carve-out exists for, and keeping a non-PL one in it
 * hands a stranger to a team that has not vetted them.
 */
describe('Apply routing while unapproved', () => {
  beforeEach(() => {
    mockOpenExternal.mockClear();
    mockOnJobApplyClicked.mockClear();
    mockOnJobApplyDrawerOpened.mockClear();
    mockOnJobDetailOpened.mockClear();
    mockOnJobApplyDrawerSaved.mockClear();
    mockOnJobApplyStepViewed.mockClear();
    mockOnJobApplyFlowClosed.mockClear();
    mockOnJobApplyExternalRedirected.mockClear();
  });

  it('sends an unapproved applicant to the employer site for a non-PL role', async () => {
    const { result } = setup('pending');

    await act(async () => {
      await result.current.onApply(target(OTHER));
    });

    expect(mockOpenExternal).toHaveBeenCalledWith('https://example.com/apply', 'job-board');
    expect(result.current.state.step).toBe('idle');
    expect(mockOnJobApplyExternalRedirected).toHaveBeenCalledTimes(1);
    expect(mockOnJobApplyStepViewed).not.toHaveBeenCalled();
  });

  it('keeps an unapproved applicant in the wizard for a Protocol Labs role', async () => {
    const { result } = setup('pending');

    await act(async () => {
      await result.current.onApply(target(PL));
    });

    expect(mockOpenExternal).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ step: 'flow', at: 'application' });
  });

  /* The carve-out is about approval, not about the team: an approved member was
     never sent outward and still isn't, whoever posted the role. */
  it('never sends an approved member outward', async () => {
    const { result } = setup('approved');

    await act(async () => {
      await result.current.onApply(target(OTHER));
    });

    expect(mockOpenExternal).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ step: 'flow', at: 'application' });
  });

  /* An unapproved PL applicant with nothing filled in still gets the middle
     step — the carve-out grants the wizard, not a way past what it collects. */
  it('routes an unfinished PL applicant to the profile step, not past it', async () => {
    const { result } = setup('pending', false);

    await act(async () => {
      await result.current.onApply(target(PL));
    });

    expect(result.current.state).toMatchObject({ step: 'flow', at: 'profile' });
  });

  /**
   * Where Apply lands for someone with no account at all.
   *
   * This used to open `JobSignUpModal` on top of the flow, which hid the rail
   * from the one visitor least sure how much further there was. The account is
   * step 2 now, so the assertion that matters is that the flow *opens* rather
   * than forks — a regression here would be invisible in the UI tests, because
   * both outcomes render a form asking the same six questions.
   */
  describe('and while logged out', () => {
    it('opens the flow on its account step rather than a modal over it', async () => {
      const { result } = setup('approved', false, 'logged-out');

      await act(async () => {
        await result.current.onApply(target(OTHER));
      });

      expect(result.current.state).toMatchObject({ step: 'flow', at: 'profile' });
      expect(mockOpenExternal).not.toHaveBeenCalled();
    });

    /* A press from a row has no drawer open yet, and takes the same path — the
       flow starts on the step rather than on the posting, because pressing Apply
       is a decision already made. Back is what returns to the reading. */
    it('starts the flow on the account step from a row press too', async () => {
      const { result } = setup('approved', false, 'logged-out');

      await act(async () => {
        await result.current.onApply(target(PL), 'row');
      });

      expect(result.current.state).toMatchObject({ step: 'flow', at: 'profile' });
    });

    /* The role-less door keeps the modal: the banner and header `Sign up`
       presses name no job, so there is no rail to draw and no flow to run. */
    it('keeps the modal for the banner press, which carries no role', () => {
      const { result } = setup('approved', false, 'logged-out');

      act(() => {
        result.current.onSignUp('banner');
      });

      expect(result.current.state).toEqual({ step: 'sign-up', target: null });
    });
  });

  it('reports the application step when an approved member applies with a complete profile', async () => {
    const { result } = setup('approved');

    await act(async () => {
      await result.current.onApply(target(OTHER));
    });

    expect(mockOnJobApplyStepViewed).toHaveBeenCalledWith(
      expect.objectContaining({ step: 'application', job_id: 'r1' }),
    );
  });

  it('reports a dismiss from the flow and skips it after a completed close', async () => {
    const { result } = setup('approved');

    await act(async () => {
      await result.current.onApply(target(OTHER));
    });
    act(() => {
      result.current.close();
    });
    expect(mockOnJobApplyFlowClosed).toHaveBeenCalledWith(
      expect.objectContaining({ step: 'application', cover_letter_started: false }),
    );

    mockOnJobApplyFlowClosed.mockClear();
    await act(async () => {
      await result.current.onApply(target(OTHER));
    });
    act(() => {
      result.current.close({ completed: true });
    });
    expect(mockOnJobApplyFlowClosed).not.toHaveBeenCalled();
  });
});
