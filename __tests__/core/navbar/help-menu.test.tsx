import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { HelpMenu } from '@/components/core/navbar/components/HelpMenu';
import { useContactSupportStore } from '@/services/contact-support/store';

/**
 * The callout's storage now lives in `useOneTimeCallout` — local cache, member
 * record and the reconciliation between them. That is covered by
 * `__tests__/hooks/use-one-time-callout.test.tsx`; what belongs here is only
 * what this component does with the answer, so the hook is replaced by a fake
 * that is open until dismissed.
 */
const mockDismiss = jest.fn();
const mockCalloutKey = jest.fn();
let calloutStartsOpen = true;

jest.mock('@/hooks/useOneTimeCallout', () => {
  const { useState } = jest.requireActual('react');
  return {
    useOneTimeCallout: (key: string) => {
      mockCalloutKey(key);
      const [dismissedHere, setDismissedHere] = useState(false);
      return {
        open: calloutStartsOpen && !dismissedHere,
        dismiss: () => {
          mockDismiss(key);
          setDismissedHere(true);
        },
      };
    },
  };
});

const mockOnHelpMenuOpened = jest.fn();
const mockOnHelpCalloutShown = jest.fn();
const mockOnHelpCalloutDismissed = jest.fn();
jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: () => ({
    onHelpMenuOpened: mockOnHelpMenuOpened,
    onHelpCalloutShown: mockOnHelpCalloutShown,
    onHelpCalloutDismissed: mockOnHelpCalloutDismissed,
  }),
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver;
});

// `roles` matters: getAnalyticsUserInfo returns null without it, so a fixture
// missing it would quietly stop the analytics payload being tested at all.
const userInfo = {
  uid: 'member-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  roles: ['MEMBER'],
} as never;

const clickHelp = () => fireEvent.click(screen.getByRole('button', { name: 'Help and feedback' }));

describe('HelpMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Dismissed by default, so a test about the button is not also a test about
    // the callout.
    calloutStartsOpen = false;
    useContactSupportStore.getState().actions.closeModal();
  });

  describe('the help button', () => {
    it('opens the support form on Contact support', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      clickHelp();

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(useContactSupportStore.getState().topic).toBe('Contact support');
    });

    /*
     * The behaviour change itself, asserted rather than implied.
     *
     * Every other test here would pass just as well with a menu in between —
     * they only check where the click lands eventually. This one checks that
     * the first press opens the form and nothing else, which is the thing that
     * would silently regress if a list of topics were ever put back in front.
     */
    it('opens it on the first press, with nothing in between', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      clickHelp();

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it('reports that the help door was used', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      clickHelp();

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(mockOnHelpMenuOpened).toHaveBeenCalledTimes(1);
    });
  });

  describe('the first-visit callout', () => {
    beforeEach(() => {
      calloutStartsOpen = true;
    });

    it('greets a member who has not seen it, and reports the impression', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      expect(await screen.findByRole('button', { name: 'Got it' })).toBeInTheDocument();
      expect(mockOnHelpCalloutShown).toHaveBeenCalledTimes(1);
    });

    // The exact string is the contract with the member's stored record: change
    // it and every member who already dismissed the callout sees it again.
    it('asks about the callout under its published key', () => {
      render(<HelpMenu userInfo={userInfo} />);

      expect(mockCalloutKey).toHaveBeenCalledWith('help_callout');
    });

    it('stays away once it has been dismissed', async () => {
      calloutStartsOpen = false;

      render(<HelpMenu userInfo={userInfo} />);

      await waitFor(() => expect(mockCalloutKey).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
      expect(mockOnHelpCalloutShown).not.toHaveBeenCalled();
    });

    it('remembers Got it for good', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

      await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('help_callout'));
      expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
      expect(mockOnHelpCalloutDismissed).toHaveBeenCalledWith('got-it', expect.anything());
    });

    it('clears itself when the form it was announcing opens', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      await screen.findByRole('button', { name: 'Got it' });
      clickHelp();

      await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('help_callout'));
      expect(mockOnHelpCalloutDismissed).toHaveBeenCalledWith('modal-opened', expect.anything());
    });

    it('does not write a flag when there was no callout to dismiss', async () => {
      calloutStartsOpen = false;

      render(<HelpMenu userInfo={userInfo} />);

      await waitFor(() => expect(mockCalloutKey).toHaveBeenCalled());
      clickHelp();

      // Waits on the press having landed, so the assertions below are about a
      // dismissal that did not happen rather than about a click that had not
      // finished yet.
      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(mockDismiss).not.toHaveBeenCalled();
      expect(mockOnHelpCalloutDismissed).not.toHaveBeenCalled();
    });

    // The (?) is in the header for signed-out visitors too, and the support
    // form works without a session — so they get the callout as well. Which
    // storage answers for them is the hook's business, not this component's.
    it('greets a signed-out visitor too', async () => {
      render(<HelpMenu />);

      fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

      await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('help_callout'));
    });
  });
});
