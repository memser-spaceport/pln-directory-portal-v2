import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { JobBoardBanner } from '@/components/page/jobs/JobBoardBanner/JobBoardBanner';
import type { IJobAlertFilterState } from '@/types/job-alerts.types';

/**
 * The board's one banner slot — four states, one card.
 *
 * The thing most worth guarding is the pair of doors. They used to be boxed
 * buttons in a CTA slot and are now text buttons inside the first bullet's
 * sentence; that is a move, not a removal, and a move is exactly the kind of
 * change that silently drops a click handler while still looking right.
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
    it('leads with the inventory and makes the case in two bullets', () => {
      renderBanner();

      expect(screen.getByText(/34 open roles/)).toBeInTheDocument();
      expect(screen.getByText(/across 6 PL network teams/)).toBeInTheDocument();
      expect(screen.getByText(/apply to hundreds of open roles with a single profile/i)).toBeInTheDocument();
    });

    /**
     * Both doors, in the sentence. "Sign in" alone would tell the likeliest
     * reader of a sign-in banner — someone with no account — that the offer
     * isn't for them.
     */
    it('still opens both doors now that they live inside the sentence', () => {
      renderBanner();

      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      expect(baseProps.onSignIn).toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'sign up' }));
      expect(baseProps.onSignUp).toHaveBeenCalled();
    });

    /**
     * Matching was removed from this board outright. Copy that promises it
     * describes a mechanism that no longer exists, which is worse than saying
     * less.
     */
    it('does not promise the matching mechanism the board no longer has', () => {
      renderBanner();

      expect(screen.getByText("Founders reach out when they're hiring for what you do.")).toBeInTheDocument();
      expect(screen.queryByText(/matches the roles/i)).not.toBeInTheDocument();
    });

    /**
     * Narrowing the rail replaces the standing pitch with the person's own
     * selection read back — the more specific thing to say to someone who just
     * told you what they want. The doors go with the bullets, which is fine:
     * the navbar's pair is one row above and Apply asks at the moment of intent.
     */
    it('swaps the pitch for the selection read-back once the rail is narrowed', () => {
      renderBanner({ filterState: { ...emptyFilters, roleCategory: ['Engineering'], location: ['Berlin'] } });

      expect(screen.getByText(/Engineering · Berlin/)).toBeInTheDocument();
      expect(screen.queryByText(/hundreds of open roles/i)).not.toBeInTheDocument();
    });

    /**
     * Zero is a filter result, not a smaller board. "Browse 0 open roles" is an
     * invitation to do nothing, and the empty state below already says there is
     * nothing there — so no read-back either, which would just rub it in.
     */
    it('drops the counts rather than claiming zero roles', () => {
      renderBanner({
        roleCount: 0,
        teamCount: 0,
        filterState: { ...emptyFilters, roleCategory: ['Design'] },
      });

      expect(screen.getByText(/Browse every open role across the PL network/)).toBeInTheDocument();
      expect(screen.queryByText(/0 open roles/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Looking for/)).not.toBeInTheDocument();
    });
  });

  describe('signed in', () => {
    /** Same two claims, minus the doors — this reader is already through both. */
    it('makes the same promise to a member with an empty profile, without the doors', () => {
      renderBanner({ viewer: 'profile-incomplete' });

      expect(screen.getByText('Update your profile to apply')).toBeInTheDocument();
      expect(screen.getByText(/^Apply to hundreds of open roles with a single profile\.$/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'sign up' })).not.toBeInTheDocument();
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

      expect(screen.getByText(/applying unlocks as soon as your account is approved/i)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  /**
   * Three states render nothing, for three different reasons: `resolving`
   * hasn't settled (and banner-absence is already the `profile-ready`
   * presentation, so nothing can flash wrong), `rejected` would be promised an
   * approval that will not come, and `profile-ready` has no ask left.
   */
  it.each(['resolving', 'rejected', 'profile-ready'] as const)('renders nothing for %s', (viewer) => {
    const { container } = renderBanner({ viewer });

    expect(container).toBeEmptyDOMElement();
  });
});
