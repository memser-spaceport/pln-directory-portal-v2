import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import FollowButton from '@/components/page/irl/follow-gathering/follow-button';

/* The bug this file guards: an unapproved member's follow row is filtered out of
   the public followers list, so `followers` never contains them. Everything here
   therefore passes an *empty* followers array while the viewer does follow the
   location — the exact state the old list-derived implementation could not
   represent. */

const mockCustomFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: any[]) => mockCustomFetch(...args),
}));

jest.mock('@/services/irl.service', () => ({
  getFollowersByLocation: jest.fn().mockResolvedValue({ data: [] }),
}));

jest.mock('@/analytics/irl.analytics', () => ({
  useIrlAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

jest.mock('@/utils/third-party.helper', () => ({
  getCookiesFromClient: () => ({ authToken: 'token' }),
}));

jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => jest.fn(),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

jest.mock('@/components/core/modal', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

const location = { uid: 'loc-1', name: 'Prague' };
const userInfo = { uid: 'member-1', name: 'Ada' };

/** The viewer is absent from the public list, as an unapproved member always is. */
const emptyPublicList = { followers: [], isFollowing: false };

/* The bell icon's alt text joins the button's accessible name, so the two states
   read as "follow Follow" and "follow Following" rather than the visible label
   alone. Matching the full name keeps "Follow" from also matching "Following". */
const followButton = () => screen.getByRole('button', { name: 'follow Follow' });
const followingButton = () => screen.getByRole('button', { name: 'follow Following' });
const confirmUnfollow = () => screen.getByRole('button', { name: 'Unfollow' });

const renderButton = (mySubscriptions: any, followProperties: any = emptyPublicList) =>
  render(
    <FollowButton
      eventLocationSummary={location}
      followProperties={followProperties}
      userInfo={userInfo}
      mySubscriptions={mySubscriptions}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockCustomFetch.mockResolvedValue({ ok: true, json: async () => ({ uid: 'sub-new' }) });
});

describe('FollowButton follow state', () => {
  it("shows Following from the viewer's own subscription even when the public list omits them", () => {
    renderButton({
      subscriptions: [{ uid: 'sub-1', entityUid: 'loc-1', isActive: true }],
      isUnavailable: false,
    });

    expect(followingButton()).toBeInTheDocument();
  });

  it('shows Follow when the viewer has no subscription', () => {
    renderButton({ subscriptions: [], isUnavailable: false });

    expect(followButton()).toBeInTheDocument();
  });

  it('ignores subscriptions belonging to a different location', () => {
    renderButton({
      subscriptions: [{ uid: 'sub-1', entityUid: 'other-loc', isActive: true }],
      isUnavailable: false,
    });

    expect(followButton()).toBeInTheDocument();
  });

  it('falls back to the public list while the self read is unavailable', () => {
    renderButton(
      { subscriptions: [], isUnavailable: true },
      { followers: [{ uid: 'sub-1', memberUid: 'member-1' }], isFollowing: true },
    );

    expect(followingButton()).toBeInTheDocument();
  });
});

describe('unfollow', () => {
  const unfollowRequests = () =>
    mockCustomFetch.mock.calls.filter(([, options]) => options?.method === 'PUT').map(([url]) => url as string);

  it('cancels the subscription the public list could not have supplied', async () => {
    renderButton({
      subscriptions: [{ uid: 'sub-1', entityUid: 'loc-1', isActive: true }],
      isUnavailable: false,
    });

    fireEvent.click(confirmUnfollow());

    await waitFor(() => expect(unfollowRequests()).toHaveLength(1));
    expect(unfollowRequests()[0]).toContain('/v1/member-subscriptions/sub-1');
    await waitFor(() => expect(followButton()).toBeInTheDocument());
  });

  it('cancels every duplicate row so the button does not flip back', async () => {
    renderButton({
      subscriptions: [
        { uid: 'sub-1', entityUid: 'loc-1', isActive: true },
        { uid: 'sub-2', entityUid: 'loc-1', isActive: true },
      ],
      isUnavailable: false,
    });

    fireEvent.click(confirmUnfollow());

    await waitFor(() => expect(unfollowRequests()).toHaveLength(2));
    expect(unfollowRequests().join(' ')).toContain('sub-2');
  });

  it('reports a failure instead of leaving the user with a silent spinner', async () => {
    mockCustomFetch.mockResolvedValue({ ok: false });
    renderButton({
      subscriptions: [{ uid: 'sub-1', entityUid: 'loc-1', isActive: true }],
      isUnavailable: false,
    });

    fireEvent.click(confirmUnfollow());

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(followingButton()).toBeInTheDocument();
  });
});

describe('follow', () => {
  it('keeps the uid the API returns so the next unfollow works without a refresh', async () => {
    renderButton({ subscriptions: [], isUnavailable: false });

    fireEvent.click(followButton());

    await waitFor(() => expect(followingButton()).toBeInTheDocument());

    fireEvent.click(confirmUnfollow());

    await waitFor(() =>
      expect(
        mockCustomFetch.mock.calls.some(
          ([url, options]) => options?.method === 'PUT' && String(url).includes('sub-new'),
        ),
      ).toBe(true),
    );
  });
});
