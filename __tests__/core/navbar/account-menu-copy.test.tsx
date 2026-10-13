import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AccountMenu } from '@/components/core/navbar/components/AccountMenu/AccountMenu';

// LAB-2663: the avatar menu's copy. The items, their order, their targets and
// their analytics are unchanged; only the words are.

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/members',
  useSearchParams: () => new URLSearchParams(),
}));

const mockOnNavGetHelpItemClicked = jest.fn();
jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: () => ({ onNavGetHelpItemClicked: mockOnNavGetHelpItemClicked }),
}));

const mockClearAllAuthCookies = jest.fn();
jest.mock('@/utils/third-party.helper', () => ({
  ...jest.requireActual('@/utils/third-party.helper'),
  clearAllAuthCookies: () => mockClearAllAuthCookies(),
}));
const mockEmitAuthEvent = jest.fn();
jest.mock('@/components/core/login/utils', () => ({
  authEvents: { emit: (...args: unknown[]) => mockEmitAuthEvent(...args) },
}));
const mockBroadcastLogout = jest.fn();
jest.mock('@/components/core/login/components/BroadcastChannel', () => ({
  broadcastLogout: () => mockBroadcastLogout(),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ reset: jest.fn() }) }));
jest.mock('react-use', () => ({ ...jest.requireActual('react-use'), useMedia: () => false }));
jest.mock('@/services/auth/store', () => ({ useCurrentUserStore: () => ({ currentUser: null }) }));

const userInfo = { uid: 'u1', name: 'Maya Chen', email: 'maya@northfield.vc' } as never;

const openMenu = async () => {
  render(<AccountMenu userInfo={userInfo} authToken="" isLoggedIn />);
  await userEvent.click(screen.getByRole('button'));
  return screen.findByRole('menu');
};

describe('AccountMenu — copy (LAB-2663)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('leads with "My profile" instead of the member name, and still opens their profile', async () => {
    const menu = await openMenu();

    const items = within(menu).getAllByRole('menuitem');
    expect(items[0]).toHaveTextContent('My profile');
    expect(within(menu).queryByRole('menuitem', { name: /Maya Chen/ })).not.toBeInTheDocument();
    expect(within(menu).queryByText(/maya@northfield\.vc/)).not.toBeInTheDocument();

    await userEvent.click(items[0]);
    expect(mockPush).toHaveBeenCalledWith('/members/u1');
  });

  it('keeps the dividers but drops their "Support" and "Settings" group labels', async () => {
    const menu = await openMenu();

    expect(within(menu).getAllByRole('separator')).toHaveLength(2);
    expect(within(menu).queryByText('Support')).not.toBeInTheDocument();
    // "Settings" survives only as the link's own label, never as a heading above it.
    expect(within(menu).getAllByText('Settings')).toHaveLength(1);
    expect(within(menu).getByText('Settings').closest('[role="menuitem"]')).not.toBeNull();
  });

  it('says "Settings", not "Account Settings", and still links to the settings page', async () => {
    const menu = await openMenu();

    expect(within(menu).queryByText(/Account Settings/)).not.toBeInTheDocument();
    const settings = within(menu).getByRole('menuitem', { name: /^Settings$/ });
    expect(settings.closest('a')).toHaveAttribute('href', '/settings/profile');

    await userEvent.click(settings);
    expect(mockOnNavGetHelpItemClicked.mock.calls[0][0]).toBe('Settings Profile');
  });

  it('keeps Changelog where it was, with its analytics', async () => {
    const menu = await openMenu();

    const changelog = within(menu).getByRole('menuitem', { name: /Changelog/ });
    expect(changelog.closest('a')).toHaveAttribute('href', '/changelog');

    await userEvent.click(changelog);
    expect(mockOnNavGetHelpItemClicked.mock.calls[0][0]).toBe('Changelog');
  });

  it('says "Sign out", not "Logout", and signs the member out as before', async () => {
    const menu = await openMenu();

    expect(within(menu).queryByText(/Logout/)).not.toBeInTheDocument();
    const items = within(menu).getAllByRole('menuitem');
    expect(items[items.length - 1]).toHaveTextContent('Sign out');

    await userEvent.click(within(menu).getByRole('menuitem', { name: /Sign out/ }));
    expect(mockClearAllAuthCookies).toHaveBeenCalledTimes(1);
    expect(mockEmitAuthEvent).toHaveBeenCalledWith('auth:logout');
    expect(mockBroadcastLogout).toHaveBeenCalledTimes(1);
  });

  it('keeps the item order: My profile, Changelog, Settings, Sign out', async () => {
    const menu = await openMenu();

    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent?.trim()),
    ).toEqual(['My profile', 'Changelog', 'Settings', 'Sign out']);
  });
});
