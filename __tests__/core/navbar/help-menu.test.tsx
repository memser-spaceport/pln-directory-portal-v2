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

const mockOnNavGetHelpItemClicked = jest.fn();
const mockOnHelpMenuOpened = jest.fn();
const mockOnHelpCalloutShown = jest.fn();
const mockOnHelpCalloutDismissed = jest.fn();
jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: () => ({
    onNavGetHelpItemClicked: mockOnNavGetHelpItemClicked,
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

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Help and feedback' }));

describe('HelpMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Dismissed by default, so a test about the menu is not also a test about
    // the callout.
    calloutStartsOpen = false;
    useContactSupportStore.getState().actions.closeModal();
  });

  describe('the menu', () => {
    it('offers every support topic, not just the default one', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      openMenu();

      expect(await screen.findByRole('menuitem', { name: 'Contact support' })).toBeInTheDocument();
      for (const label of ['Ask a question', 'Give feedback', 'Share an idea', 'Report a bug']) {
        expect(screen.getByRole('menuitem', { name: label })).toBeInTheDocument();
      }
    });

    it('opens the support form already on the chosen topic', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      openMenu();
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Report a bug' }));

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(useContactSupportStore.getState().topic).toBe('Report a bug');
    });

    it('reports the chosen topic on the existing get-help series', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      openMenu();
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Give feedback' }));

      expect(mockOnNavGetHelpItemClicked).toHaveBeenCalledWith('Give feedback', expect.anything());
    });

    it('reports the open, so the topic clicks have a denominator', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      openMenu();

      await screen.findByRole('menuitem', { name: 'Contact support' });
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

    it('clears itself when the menu it was announcing opens', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      await screen.findByRole('button', { name: 'Got it' });
      openMenu();

      await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('help_callout'));
      expect(mockOnHelpCalloutDismissed).toHaveBeenCalledWith('menu-opened', expect.anything());
    });

    it('does not write a flag when there was no callout to dismiss', async () => {
      calloutStartsOpen = false;

      render(<HelpMenu userInfo={userInfo} />);

      await waitFor(() => expect(mockCalloutKey).toHaveBeenCalled());
      openMenu();

      await screen.findByRole('menuitem', { name: 'Contact support' });
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
