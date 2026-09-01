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

/**
 * `profileComplete` was the second parameter and is gone from the hook: the
 * routing no longer consults the profile, because every in-app application stops
 * at step 2 now. The positional slot is kept as `_profileComplete` rather than
 * removed so the many `setup(verdict, false)` / `setup(verdict, true, 'logged-out')`
 * calls below keep meaning what they say — the third argument is the one several
 * of them are actually reaching for.
 */
const setup = (
  verdict: 'approved' | 'pending' | 'rejected',
  _profileComplete = true,
  viewer: 'profile-ready' | 'logged-out' | 'rejected' = 'profile-ready',
) =>
  renderHook(() =>
    useJobApplyFlow({
      viewer,
      verdict,
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

  /* These land on `profile` where they used to land on `application`.
     `onApply` no longer skips the middle step for a complete profile — that step
     now asks for "I've reviewed my profile", and a confirmation nobody is shown
     is not a confirmation. What each of these tests is *about* is unchanged:
     whether Apply keeps you in the wizard or sends you off-site. */
  it('keeps an unapproved applicant in the wizard for a Protocol Labs role', async () => {
    const { result } = setup('pending');

    await act(async () => {
      await result.current.onApply(target(PL));
    });

    expect(mockOpenExternal).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ step: 'flow', at: 'profile' });
  });

  /* The carve-out is about approval, not about the team: an approved member was
     never sent outward and still isn't, whoever posted the role. */
  it('never sends an approved member outward', async () => {
    const { result } = setup('approved');

    await act(async () => {
      await result.current.onApply(target(OTHER));
    });

    expect(mockOpenExternal).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ step: 'flow', at: 'profile' });
  });

  /* An unapproved PL applicant with nothing filled in still gets the middle
     step — the carve-out grants the wizard, not a way past what it collects.

     This no longer distinguishes anything on its own (every in-app application
     stops at step 2 now, filled in or not), and is kept as the unfinished half of
     the pair above: the two together say the routing does not consult the profile
     at all any more. */
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
   * A non-PL role leaves the site — the same rule as a pending account, and the
   * footer already labels the press "Continue to apply" with a sentence beside
   * it naming whose site and that it opens in a new tab. Protocol Labs still
   * opens the flow on its account step: that is the one employer whose hiring
   * this board runs, so the account is the ask at the moment of intent rather
   * than a modal over the top.
   */
  describe('and while logged out', () => {
    it('sends a visitor to the employer site for a non-PL role', async () => {
      const { result } = setup('approved', false, 'logged-out');

      await act(async () => {
        await result.current.onApply(target(OTHER));
      });

      expect(mockOpenExternal).toHaveBeenCalledWith('https://example.com/apply', 'job-board');
      expect(result.current.state.step).toBe('idle');
      expect(mockOnJobApplyExternalRedirected).toHaveBeenCalledTimes(1);
      expect(mockOnJobApplyStepViewed).not.toHaveBeenCalled();
    });

    it('opens the flow on its account step for a Protocol Labs role', async () => {
      const { result } = setup('approved', false, 'logged-out');

      await act(async () => {
        await result.current.onApply(target(PL));
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

  /**
   * Coming back from Privy, which is where the promise gets kept or broken.
   *
   * A brand-new account is `pending`, so for any non-PL team the press that
   * started this was already routed off-site, and the footer said as much:
   * "Continue to apply", on the employer's own site. Resume used to open the
   * profile step unconditionally, handing that person the in-app letter instead
   * — and letting them finish it. It consults the same rule `onApply` does now.
   *
   * It resumes on the reading step rather than redirecting: this runs from an
   * effect on page load, and `window.open` without a user gesture is blocked.
   * The review step's footer carries the external press as a real button.
   */
  describe('and resuming after sign-up', () => {
    it('resumes a non-PL application on the reading step, where the off-site press lives', () => {
      const { result } = setup('pending');

      act(() => {
        result.current.onResumeAfterSignUp(target(OTHER));
      });

      expect(result.current.state).toMatchObject({ step: 'flow', at: 'review' });
    });

    it('never opens a tab on the way back — nothing here is a user gesture', () => {
      const { result } = setup('pending');

      act(() => {
        result.current.onResumeAfterSignUp(target(OTHER));
      });

      expect(mockOpenExternal).not.toHaveBeenCalled();
      expect(mockOnJobApplyExternalRedirected).not.toHaveBeenCalled();
    });

    it('resumes a Protocol Labs application on the profile step, as before', () => {
      const { result } = setup('pending');

      act(() => {
        result.current.onResumeAfterSignUp(target(PL));
      });

      expect(result.current.state).toMatchObject({ step: 'flow', at: 'profile' });
    });

    it('resumes an approved member on the profile step whoever posted the role', () => {
      const { result } = setup('approved');

      act(() => {
        result.current.onResumeAfterSignUp(target(OTHER));
      });

      expect(result.current.state).toMatchObject({ step: 'flow', at: 'profile' });
    });

    it('reports the step it actually resumed on', () => {
      const { result } = setup('pending');

      act(() => {
        result.current.onResumeAfterSignUp(target(OTHER));
      });

      expect(mockOnJobApplyStepViewed).toHaveBeenCalledWith(expect.objectContaining({ step: 'review', job_id: 'r1' }));
    });

    /**
     * A rejected account gets plain browsing — no banner, because the pending
     * copy would promise an approval that will not come. `onApply` has always
     * refused them and rows never offer the slot, but resume reaches the flow
     * without passing either. Nothing downstream would catch it: the drawer's
     * `canApply` asks about login, completeness and the review tick, not access,
     * so they could reach the letter and press send.
     *
     * Both systems are asserted because either can carry the rejection —
     * `getJobsAccessVerdict` reads RBAC and access level, and `deriveBoardViewer`
     * has a `rejected` state of its own.
     */
    it('refuses a rejected verdict', () => {
      const { result } = setup('rejected');

      act(() => {
        result.current.onResumeAfterSignUp(target(PL));
      });

      expect(result.current.state.step).toBe('idle');
      expect(mockOnJobApplyDrawerOpened).not.toHaveBeenCalled();
      expect(mockOnJobApplyStepViewed).not.toHaveBeenCalled();
    });

    it('refuses a rejected viewer even when the verdict says otherwise', () => {
      const { result } = setup('approved', true, 'rejected');

      act(() => {
        result.current.onResumeAfterSignUp(target(PL));
      });

      expect(result.current.state.step).toBe('idle');
    });

    /* The resume's own fallback, for a role that closed while they were away.
       "Update your profile to apply" is the one thing that drawer says, and for
       a rejected account it is not true. */
    it('does not offer the profile drawer to a rejected account either', () => {
      const { result } = setup('rejected');

      act(() => {
        result.current.onUpdateProfile();
      });

      expect(result.current.state.step).toBe('idle');
      expect(mockOnJobApplyDrawerOpened).not.toHaveBeenCalled();
    });

    it('still offers it to everyone else', () => {
      const { result } = setup('pending');

      act(() => {
        result.current.onUpdateProfile();
      });

      expect(result.current.state.step).toBe('profile-only');
    });
  });

  /* Renamed with the routing it reports on: a complete profile used to land on
     the application and now lands on the profile step, so that is the step the
     view event names. The assertion is the same one — that `onApply` reports
     where it actually put you. */
  it('reports the profile step when an approved member applies with a complete profile', async () => {
    const { result } = setup('approved');

    await act(async () => {
      await result.current.onApply(target(OTHER));
    });

    expect(mockOnJobApplyStepViewed).toHaveBeenCalledWith(expect.objectContaining({ step: 'profile', job_id: 'r1' }));
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
      expect.objectContaining({ step: 'profile', cover_letter_started: false }),
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
