import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { JobBoardBanner } from '@/components/page/jobs/JobBoardBanner/JobBoardBanner';
import type { IJobAlertFilterState } from '@/types/job-alerts.types';

/**
 * The board's one banner slot — logged-out, member, Job Aspirant, pending.
 *
 * The thing most worth guarding is the pair of doors on the logged-out card:
 * Get started (sign-up) and Sign in. They used to live inside a bullet
 * sentence; they are now a boxed CTA and a text link, and a move is exactly
 * the kind of change that silently drops a click handler while still looking
 * right.
 */

const emptyFilters: IJobAlertFilterState = {
  roleCategory: [],
  seniority: [],
  workMode: [],
  focus: [],
  location: [],
};

const baseProps = {
  roleCount: 34,
  teamCount: 6,
  filterState: emptyFilters,
  profileComplete: false,
  onSignIn: jest.fn(),
  onSignUp: jest.fn(),
  onUpdateProfile: jest.fn(),
};

const renderBanner = (overrides: Partial<React.ComponentProps<typeof JobBoardBanner>> = {}) =>
  render(<JobBoardBanner viewer="logged-out" {...baseProps} {...overrides} />);

describe('the job board banner', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('logged out', () => {
    it('leads with the hiring teams and makes the case for a profile', () => {
      renderBanner();

      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText(/PL network teams are hiring\. Let them find you\./)).toBeInTheDocument();
      expect(screen.getByText('Founders reach out when your profile matches an open role.')).toBeInTheDocument();
      expect(screen.getByText(/Already at a PL network team\?/)).toBeInTheDocument();
    });

    it('opens sign-up from Get started and sign-in from the team line', () => {
      renderBanner();

      fireEvent.click(screen.getByRole('button', { name: /get started/i }));
      expect(baseProps.onSignUp).toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      expect(baseProps.onSignIn).toHaveBeenCalled();
    });

    it('keeps the standing pitch when the rail is narrowed', () => {
      renderBanner({ filterState: { ...emptyFilters, roleCategory: ['Engineering'], location: ['Berlin'] } });

      expect(screen.getByText(/PL network teams are hiring\. Let them find you\./)).toBeInTheDocument();
      expect(screen.getByText('Founders reach out when your profile matches an open role.')).toBeInTheDocument();
      expect(screen.queryByText(/Looking for/)).not.toBeInTheDocument();
    });

    it('drops the count rather than claiming zero teams', () => {
      renderBanner({
        roleCount: 0,
        teamCount: 0,
        filterState: { ...emptyFilters, roleCategory: ['Design'] },
      });

      expect(screen.getByText(/PL network teams are hiring\. Let them find you\./)).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('signed in', () => {
    it('tells a member with an empty profile what the team will see', () => {
      renderBanner({ viewer: 'profile-incomplete' });

      expect(
        screen.getByText('Interested in a role here? Your profile is what the team sees when you reach out.'),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
      expect(baseProps.onUpdateProfile).toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: /get started/i })).not.toBeInTheDocument();
    });

    it('nudges a Job Aspirant to fill the profile so teams can find them', () => {
      renderBanner({ viewer: 'profile-incomplete', isJobAspirant: true });

      expect(screen.getByText('The more complete your profile, the better teams can find you.')).toBeInTheDocument();
      expect(
        screen.queryByText('Interested in a role here? Your profile is what the team sees when you reach out.'),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
      expect(baseProps.onUpdateProfile).toHaveBeenCalled();
    });

    it('keeps the Job Aspirant nudge up after Apply-completeness until every section has a value', () => {
      renderBanner({ viewer: 'profile-ready', isJobAspirant: true, allSectionsFilled: false });

      expect(screen.getByText('The more complete your profile, the better teams can find you.')).toBeInTheDocument();
    });

    it('hides the Job Aspirant nudge once every section has a value', () => {
      const { container } = renderBanner({
        viewer: 'profile-ready',
        isJobAspirant: true,
        allSectionsFilled: true,
      });

      expect(container).toBeEmptyDOMElement();
    });

    it('gives a waiting member something to do while the profile is unfinished', () => {
      renderBanner({ viewer: 'pending-approval', profileComplete: false });

      fireEvent.click(screen.getByRole('button', { name: /complete profile/i }));
      expect(baseProps.onUpdateProfile).toHaveBeenCalled();
    });

    /**
     * Once the profile is done there is genuinely nothing to press, and a card
     * shaped like "a claim next to a button" with an empty action slot reads as
     * a control that failed to load.
     */
    it('offers no action once a waiting member has nothing left to do', () => {
      renderBanner({ viewer: 'pending-approval', profileComplete: true });

      /* This used to read "applying unlocks as soon as your account is
         approved". Approval stopped gating applying, and this is the state where
         the old sentence would cost the most — a finished profile with nothing
         left to do, told to wait for something that is not holding it up. */
      expect(screen.getByText(/Nothing here is waiting on it: browse and apply as normal/i)).toBeInTheDocument();
      expect(screen.queryByText(/applying unlocks/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    /* The unfinished-profile card gives its reason for finishing, and that reason
       changed with the gate: it used to be "so you can apply the moment it is",
       which was about the wait. Now the profile is what the application carries. */
    it('tells a waiting member with an unfinished profile that they can apply meanwhile', () => {
      renderBanner({ viewer: 'pending-approval', profileComplete: false });

      expect(screen.getByText(/We'll notify you once approved\./i)).toBeInTheDocument();
      expect(screen.getByText(/You can apply meanwhile/i)).toBeInTheDocument();
      expect(screen.queryByText(/apply the moment it is/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Three states render nothing, for three different reasons: `resolving`
   * hasn't settled (and banner-absence is already the `profile-ready`
   * presentation, so nothing can flash wrong), `rejected` would be promised an
   * approval that will not come, and `profile-ready` has no ask left — unless
   * the reader is a Job Aspirant whose sections are still empty (covered above).
   */
  it.each(['resolving', 'rejected', 'profile-ready'] as const)('renders nothing for %s', (viewer) => {
    const { container } = renderBanner({ viewer });

    expect(container).toBeEmptyDOMElement();
  });
});
