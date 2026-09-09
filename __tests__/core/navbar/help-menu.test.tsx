import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { HelpMenu } from '@/components/core/navbar/components/HelpMenu';
import { useContactSupportStore } from '@/services/contact-support/store';
import { getUiFlag, setUiFlag } from '@/utils/uiFlags';

jest.mock('@/utils/uiFlags', () => ({
  getUiFlag: jest.fn(),
  setUiFlag: jest.fn(),
}));

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

const mockGetUiFlag = getUiFlag as jest.MockedFunction<typeof getUiFlag>;
const mockSetUiFlag = setUiFlag as jest.MockedFunction<typeof setUiFlag>;

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
    mockGetUiFlag.mockResolvedValue(true);
    mockSetUiFlag.mockResolvedValue(undefined);
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
      mockGetUiFlag.mockResolvedValue(false);
    });

    it('greets a member who has not seen it, and reports the impression', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      expect(await screen.findByRole('button', { name: 'Got it' })).toBeInTheDocument();
      expect(mockGetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_member-1');
      expect(mockOnHelpCalloutShown).toHaveBeenCalledTimes(1);
    });

    it('stays away once it has been dismissed', async () => {
      mockGetUiFlag.mockResolvedValue(true);

      render(<HelpMenu userInfo={userInfo} />);

      await waitFor(() => expect(mockGetUiFlag).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
      expect(mockOnHelpCalloutShown).not.toHaveBeenCalled();
    });

    it('remembers Got it for good', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

      await waitFor(() => expect(mockSetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_member-1'));
      expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
      expect(mockOnHelpCalloutDismissed).toHaveBeenCalledWith('got-it', expect.anything());
    });

    it('clears itself when the menu it was announcing opens', async () => {
      render(<HelpMenu userInfo={userInfo} />);

      await screen.findByRole('button', { name: 'Got it' });
      openMenu();

      await waitFor(() => expect(mockSetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_member-1'));
      expect(mockOnHelpCalloutDismissed).toHaveBeenCalledWith('menu-opened', expect.anything());
    });

    it('does not write a flag when there was no callout to dismiss', async () => {
      mockGetUiFlag.mockResolvedValue(true);

      render(<HelpMenu userInfo={userInfo} />);

      await waitFor(() => expect(mockGetUiFlag).toHaveBeenCalled());
      openMenu();

      await screen.findByRole('menuitem', { name: 'Contact support' });
      expect(mockSetUiFlag).not.toHaveBeenCalled();
      expect(mockOnHelpCalloutDismissed).not.toHaveBeenCalled();
    });

    // The (?) is in the header for signed-out visitors too, and the support
    // form works without a session — so they get the callout as well, under a
    // key that is not keyed to anybody.
    it('greets a signed-out visitor under the anonymous key', async () => {
      render(<HelpMenu />);

      fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));

      await waitFor(() => expect(mockSetUiFlag).toHaveBeenCalledWith('help_callout_dismissed_anon'));
    });
  });
});
