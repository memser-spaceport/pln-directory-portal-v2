const mockErrorPage = jest.fn(() => null);
jest.mock('@/components/core/error', () => ({
  __esModule: true,
  default: () => mockErrorPage(),
}));
jest.mock('@/components/core/irl-error-page', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/page/irl/irl-header', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/page/irl/locations/irl-location', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/page/irl/events/addtional-resources', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/page/irl/follow-gathering/irl-follow-gathering', () => ({
  __esModule: true,
  default: () => null,
}));
const mockAttendeeList = jest.fn((_props?: unknown) => null);
jest.mock('@/components/page/irl/attendee-list/attendees-list', () => ({
  __esModule: true,
  default: (props: unknown) => mockAttendeeList(props),
}));

const mockCookies = jest.fn();
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: () => mockCookies() }));

const mockGetAllLocations = jest.fn();
const mockGetGuestsByLocation = jest.fn();
const mockGetTopicsByLocation = jest.fn();
const mockGetGuestEvents = jest.fn();
const mockGetFollowersByLocation = jest.fn();
const mockGetMyLocationSubscriptions = jest.fn();
const mockGetTopicsAndReasonForUser = jest.fn();
jest.mock('@/services/irl.service', () => ({
  getAllLocations: () => mockGetAllLocations(),
  getGuestsByLocation: (...args: unknown[]) => mockGetGuestsByLocation(...args),
  getTopicsByLocation: (...args: unknown[]) => mockGetTopicsByLocation(...args),
  getGuestEvents: (...args: unknown[]) => mockGetGuestEvents(...args),
  getFollowersByLocation: (...args: unknown[]) => mockGetFollowersByLocation(...args),
  getMyLocationSubscriptions: (...args: unknown[]) => mockGetMyLocationSubscriptions(...args),
  getTopicsAndReasonForUser: (...args: unknown[]) => mockGetTopicsAndReasonForUser(...args),
}));

const mockGetMemberPreferences = jest.fn();
jest.mock('@/services/preferences.service', () => ({
  getMemberPreferences: (...args: unknown[]) => mockGetMemberPreferences(...args),
}));

import { render } from '@testing-library/react';

import IrlPage from '@/app/events/irl/page';

const location = {
  uid: 'loc-1',
  location: 'Berlin, Germany',
  pastEvents: [],
  upcomingEvents: [{ uid: 'e1', name: 'Summit', slugURL: 'summit', type: 'PUBLIC' }],
  flag: '',
  description: '',
  resources: [],
  icon: '',
};

const publicGuests = { guests: [{ memberUid: 'someone', memberName: 'Ada', count: 1 }], totalGuests: 1 };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAllLocations.mockResolvedValue([location]);
  mockGetTopicsByLocation.mockResolvedValue([]);
  mockGetGuestEvents.mockResolvedValue([]);
  mockGetFollowersByLocation.mockResolvedValue({
    data: [
      { name: null, logo: null },
      { name: 'Ada', logo: null },
    ],
  });
  mockGetMyLocationSubscriptions.mockResolvedValue({ subscriptions: [], isUnavailable: false });
  mockGetTopicsAndReasonForUser.mockResolvedValue([]);
  mockGetMemberPreferences.mockResolvedValue({ isError: true });
  mockCookies.mockResolvedValue({
    isLoggedIn: true,
    authToken: 'stale-token',
    userInfo: { uid: 'm1', rbac: { status: 'APPROVED' } },
  });
});

describe('IRL page with a stale signed-in session', () => {
  it('shows the public gatherings when the signed-in guest call fails', async () => {
    mockGetGuestsByLocation.mockImplementation(async (_location, _params, token: string) =>
      token ? { isError: true } : publicGuests,
    );

    render(await IrlPage({ searchParams: Promise.resolve({}) }));

    expect(mockErrorPage).not.toHaveBeenCalled();
    expect(mockAttendeeList).toHaveBeenCalledWith(
      expect.objectContaining({ eventDetails: expect.objectContaining({ guests: publicGuests.guests }) }),
    );
    expect(mockGetGuestsByLocation).toHaveBeenCalledTimes(4);
  });

  it('shows the error page when the public guest call also fails', async () => {
    mockGetGuestsByLocation.mockResolvedValue({ isError: true });

    render(await IrlPage({ searchParams: Promise.resolve({}) }));

    expect(mockErrorPage).toHaveBeenCalled();
    expect(mockAttendeeList).not.toHaveBeenCalled();
  });
});
