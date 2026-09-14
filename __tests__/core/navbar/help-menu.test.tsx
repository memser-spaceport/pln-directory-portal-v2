import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

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

/**
 * The one thing that decides what the (?) does. jsdom answers `false` to every
 * media query, which is the truthful answer for a device with no pointer at
 * all — so the touch behaviour is what an unconfigured suite gets, and the
 * cursor blocks below say so explicitly.
 */
const usePointer = (kind: 'cursor' | 'touch') => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query === '(hover: hover)' && kind === 'cursor',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
};

// `roles` matters: getAnalyticsUserInfo returns null without it, so a fixture
// missing it would quietly stop the analytics payload being tested at all.
const userInfo = {
  uid: 'member-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  roles: ['MEMBER'],
} as never;

const helpButton = () => screen.getByRole('button', { name: 'Help and feedback' });
const pressHelp = () => fireEvent.click(helpButton());

describe('HelpMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Dismissed by default, so a test about the button is not also a test about
    // the callout.
    calloutStartsOpen = false;
    useContactSupportStore.getState().actions.closeModal();
  });

  /*
   * Where there is a cursor, the topic list is what hover is for, so the press
   * itself is free to go straight to the form — someone who does not hover has
   * asked for help, not for a list, and the form shows all five topics anyway.
   */
  describe('with a cursor', () => {
    beforeEach(() => usePointer('cursor'));

    it('opens the support form on Contact support', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      pressHelp();

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(useContactSupportStore.getState().topic).toBe('Contact support');
    });

    it('opens it on the first press, with no list in between', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      pressHelp();

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it('reports that the help door was used', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      pressHelp();

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(mockOnHelpMenuOpened).toHaveBeenCalledTimes(1);
    });
  });

  /*
   * The other half of the cursor's answer: the list the press walks past is
   * still reachable, by hovering the way the bar's left half is hovered.
   */
  describe('hovering with a cursor', () => {
    beforeEach(() => {
      usePointer('cursor');
      // The list only opens once the pointer has rested for the `delay`, so the
      // clock has to be driven rather than waited on.
      jest.useFakeTimers();
    });
    afterEach(() => jest.useRealTimers());

    const hoverHelp = async () => {
      fireEvent.mouseEnter(helpButton());
      fireEvent.mouseMove(helpButton());
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
    };

    it('shows the topics, and leaves the form alone', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      await hoverHelp();

      expect(screen.getByRole('menuitem', { name: 'Contact support' })).toBeInTheDocument();
      expect(useContactSupportStore.getState().open).toBe(false);
    });

    it('does not count a passing cursor as the help door being used', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      await hoverHelp();

      expect(mockOnHelpMenuOpened).not.toHaveBeenCalled();
    });

    /*
     * base-ui's own answer to this press is to keep the list open — a click
     * within 500ms of a hover-open is treated as impatient and ignored — which
     * is why the menu here is controlled rather than left to it.
     */
    it('takes the list away when the press it was offering lands on the form', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      await hoverHelp();
      await act(async () => {
        pressHelp();
      });

      expect(useContactSupportStore.getState().open).toBe(true);
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });
  });

  /*
   * On touch there is no hover to put the list anywhere else, so the tap opens
   * it — the same gesture the bar's other nested tabs answer that way.
   */
  describe('on touch', () => {
    beforeEach(() => usePointer('touch'));

    it('opens the topic list on a tap, not the form', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      pressHelp();

      expect(await screen.findByRole('menuitem', { name: 'Contact support' })).toBeInTheDocument();
      for (const label of ['Ask a question', 'Give feedback', 'Share an idea', 'Report a bug']) {
        expect(screen.getByRole('menuitem', { name: label })).toBeInTheDocument();
      }
      expect(useContactSupportStore.getState().open).toBe(false);
    });

    it('opens the support form already on the chosen topic', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      pressHelp();
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Report a bug' }));

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(useContactSupportStore.getState().topic).toBe('Report a bug');
    });

    it('reports the chosen topic on the existing get-help series', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      pressHelp();
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Give feedback' }));

      expect(mockOnNavGetHelpItemClicked).toHaveBeenCalledWith('Give feedback', expect.anything());
    });

    it('reports the help door was used once, on the tap that opened the list', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      pressHelp();

      await screen.findByRole('menuitem', { name: 'Contact support' });
      expect(mockOnHelpMenuOpened).toHaveBeenCalledTimes(1);
    });
  });

  describe('the first-visit callout', () => {
    beforeEach(() => {
      calloutStartsOpen = true;
      usePointer('cursor');
    });

    it('greets a member who has not seen it, and reports the impression', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      expect(await screen.findByRole('button', { name: 'Got it' })).toBeInTheDocument();
      expect(mockOnHelpCalloutShown).toHaveBeenCalledTimes(1);
    });

    // The exact string is the contract with the member's stored record: change
    // it and every member who already dismissed the callout sees it again.
    it('asks about the callout under its published key', () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      expect(mockCalloutKey).toHaveBeenCalledWith('help_callout');
    });

    it('stays away once it has been dismissed', async () => {
      calloutStartsOpen = false;

      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      await waitFor(() => expect(mockCalloutKey).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
      expect(mockOnHelpCalloutShown).not.toHaveBeenCalled();
    });

    it('remembers Got it for good', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

      await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('help_callout'));
      expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
      expect(mockOnHelpCalloutDismissed).toHaveBeenCalledWith('got-it', expect.anything());
    });

    it('clears itself when the form it was announcing opens', async () => {
      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      await screen.findByRole('button', { name: 'Got it' });
      pressHelp();

      await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('help_callout'));
      expect(mockOnHelpCalloutDismissed).toHaveBeenCalledWith('modal-opened', expect.anything());
    });

    // A tip standing on top of the list it was pointing at is the announcement
    // in the way of what it announced.
    it('clears itself when a tap opens the topic list instead', async () => {
      usePointer('touch');

      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      await screen.findByRole('button', { name: 'Got it' });
      pressHelp();

      await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('help_callout'));
      expect(mockOnHelpCalloutDismissed).toHaveBeenCalledWith('menu-opened', expect.anything());
    });

    it('does not write a flag when there was no callout to dismiss', async () => {
      calloutStartsOpen = false;

      render(<HelpMenu isLoggedIn userInfo={userInfo} />);

      await waitFor(() => expect(mockCalloutKey).toHaveBeenCalled());
      pressHelp();

      // Waits on the press having landed, so the assertions below are about a
      // dismissal that did not happen rather than about a click that had not
      // finished yet.
      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(mockDismiss).not.toHaveBeenCalled();
      expect(mockOnHelpCalloutDismissed).not.toHaveBeenCalled();
    });

    /*
     * The (?) is in the header for signed-out visitors and the support form
     * works without a session, so the sentence would be true for them — but it
     * is an unprompted interruption to someone who has not signed in yet.
     *
     * `calloutStartsOpen` is true throughout this block, so the fake hook is
     * saying "not dismissed": this asserts the component overrules it, not that
     * storage happened to answer no.
     */
    it('stays away from a signed-out visitor, even with nothing dismissed', async () => {
      render(<HelpMenu isLoggedIn={false} />);

      await waitFor(() => expect(mockCalloutKey).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
      expect(mockOnHelpCalloutShown).not.toHaveBeenCalled();
    });

    /*
     * `isLoggedIn` has historically been `''` rather than `false` here, so this
     * pins the behaviour for the value the app actually passes.
     *
     * It does NOT prove the `Boolean()` in the component does anything —
     * verified by mutation: removing it keeps all 12 green, because `'' && x`
     * is already falsy. That coercion is there for the `open=` prop's type.
     */
    it('treats a falsy non-boolean as signed out', async () => {
      render(<HelpMenu isLoggedIn={'' as unknown as boolean} userInfo={userInfo} />);

      await waitFor(() => expect(mockCalloutKey).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
    });

    // The button is still the support door for them — only the tip is gone.
    it('still opens the support form for a signed-out visitor', async () => {
      render(<HelpMenu isLoggedIn={false} />);

      pressHelp();

      await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
      expect(useContactSupportStore.getState().topic).toBe('Contact support');
    });
  });
});
