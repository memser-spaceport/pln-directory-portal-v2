/**
 * LAB-3217: where the member profile's Events section sits (design D6), and the IRL contributions block it replaces
 * behind the event drawer flag. Scenarios from the `profiles` spec delta of
 * `openspec/changes/lab-3211-event-drawer-and-profile-events`.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The real React Query for the member fetch; the events read is mocked below.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

const mockGetMember = jest.fn();
jest.mock('@/services/members.service', () => ({ getMember: (...args: unknown[]) => mockGetMember(...args) }));

const flag = { on: true };
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return flag.on;
  },
}));
let mockEventsData: unknown = undefined;
jest.mock('@/services/events/hooks/useMemberEvents', () => ({ useMemberEvents: () => ({ data: mockEventsData }) }));
jest.mock('@/components/page/events/EventDrawer', () => ({ EventDrawer: () => null, eventGoingToastText: () => '' }));

function mockMarker(id: string) {
  return <div data-testid={id} />;
}
jest.mock('@/components/page/member-details/ProfileDetails', () => ({ ProfileDetails: () => mockMarker('profile') }));
// Function declarations, so the hoisted jest.mock factories below can reach them.
function mockNothing() {
  return null;
}
function mockPassthrough({ children }: any) {
  return <>{children}</>;
}
jest.mock('@/components/common/profile/UnsavedEdits', () => ({ UnsavedEditsPageGuard: mockPassthrough }));
jest.mock('@/components/common/profile/SectionEditLock', () => ({
  ProfileSection: mockPassthrough,
  SectionEditLockProvider: mockPassthrough,
  SectionStatusBar: () => null,
  useSectionEditLockRegistry: () => ({}),
}));
jest.mock('@/components/page/member-details/member-irl-contributions', () => () => mockMarker('irl'));
jest.mock('@/components/page/member-details/ContactDetails', () => ({ ContactDetails: () => mockMarker('contact') }));
jest.mock('@/components/page/member-details/JobSearchStatusDetails', () => ({ JobSearchStatusDetails: mockNothing }));
jest.mock('@/components/page/member-details/ExperienceDetails', () => ({ ExperienceDetails: mockNothing }));
jest.mock('@/components/page/member-details/ContributionsDetails', () => ({
  ContributionsDetails: () => mockMarker('contributions'),
}));
jest.mock('@/components/page/member-details/RepositoriesDetails', () => ({
  RepositoriesDetails: () => mockMarker('repositories'),
}));
jest.mock('@/components/page/member-details/OneClickVerification', () => ({ OneClickVerification: mockNothing }));
jest.mock('@/components/page/member-details/TeamsDetails', () => ({ TeamsDetails: mockNothing }));
jest.mock('@/components/page/member-details/OfficeHoursDetails', () => ({
  OfficeHoursDetails: () => mockMarker('office-hours'),
}));
jest.mock('@/components/page/member-details/InvestorProfileDetails', () => ({ InvestorProfileDetails: mockNothing }));
jest.mock('@/components/page/member-details/BookWithOther', () => ({ BookWithOther: mockNothing }));
jest.mock('@/components/page/member-details/AccountCreatedView', () => ({ AccountCreatedView: mockNothing }));
jest.mock('@/components/page/member-details/MemberCvSection/MemberCvSection', () => ({ MemberCvSection: mockNothing }));
jest.mock('@/components/page/member-details/ForumActivity', () => ({ ForumActivity: mockNothing }));
jest.mock('@/components/page/member-details/TeamNewsDetails', () => ({ TeamNewsDetails: mockNothing }));
jest.mock('@/components/page/member-details/TeamNewsDetails/hooks/useMemberTeamNewsCard', () => ({
  useMemberTeamNewsCard: () => ({ visible: false }),
}));
jest.mock('@/components/page/member-details/RelationshipDetails', () => ({ RelationshipDetails: mockNothing }));
jest.mock('@/components/page/member-details/hooks', () => ({ useJobEmailProfileLinkEventCapture: () => undefined }));
jest.mock('@/components/ui/BackButton', () => ({ BackButton: mockNothing }));
jest.mock(
  '@/app/members/[id]/loading',
  () =>
    function MockMemberPageLoader() {
      return <div>Loading profile</div>;
    },
);
jest.mock('@/app/actions/members.actions', () => ({ getMemberListForQuery: jest.fn() }));
jest.mock('@/services/members/hooks/useGetMemberInvestorSettings', () => ({
  useGetMemberInvestorSettings: () => ({ data: undefined }),
}));
jest.mock('@/services/access-control/hooks/useAffinityAccess', () => ({
  useAffinityAccess: () => ({ hasAccess: false }),
}));
jest.mock('@/services/affinity/hooks/useAffinityMember', () => ({
  useAffinityMember: () => ({ data: null, isLoading: false }),
}));
jest.mock('@/hooks/useIsBelowTabletLandscape', () => ({ useIsBelowTabletLandscape: () => false }));
jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => jest.fn() }));

import MemberDetailsPage from '@/components/page/member-details/MemberDetailsPage';
import {
  memberEvent,
  PAST,
  UPCOMING,
} from '@/components/page/member-details/MemberEventsSection/MemberEventsSection.fixtures';
import { useCurrentUserStore } from '@/services/auth/store';

const group = <T,>(items: T[]) => ({ page: 1, limit: 50, total: items.length, items });
const MEMBER = {
  data: {
    formattedData: {
      id: 'member-1',
      name: 'Ana Lima',
      eventGuests: [{ uid: 'guest-1' }],
      rbac: { status: 'APPROVED', policies: [{ role: 'Founder' }] },
    },
  },
};

/** The page's sections in DOM order, the Events section by its title. */
function order() {
  return Array.from(document.querySelectorAll('[data-testid], h2')).map((el) =>
    el.tagName === 'H2' ? `events: ${el.textContent}` : el.getAttribute('data-testid'),
  );
}

async function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemberDetailsPage memberId="member-1" />
    </QueryClientProvider>,
  );
  await screen.findByTestId('profile');
}

beforeEach(() => {
  flag.on = true;
  mockEventsData = undefined;
  mockGetMember.mockResolvedValue(MEMBER);
  useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1' } as never });
});

it('Member with upcoming plans: the Events section is directly under Office Hours', async () => {
  mockEventsData = { upcoming: group(UPCOMING.slice(0, 1)), past: group(PAST) };

  await renderPage();

  expect(order()).toEqual(['profile', 'office-hours', 'events: Events', 'contact', 'contributions', 'repositories']);
});

it('Member with past events only: the Events section sits after Contributions and before Repositories', async () => {
  mockEventsData = { upcoming: group([]), past: group(PAST) };

  await renderPage();

  expect(order()).toEqual([
    'profile',
    'office-hours',
    'contact',
    'contributions',
    'events: Past events',
    'repositories',
  ]);
});

it('Hidden event: an event Ana hid is not shown to another member, and does not lift the section', async () => {
  mockEventsData = {
    upcoming: group([memberEvent({ uid: 'up-a', name: 'Event A', showOnProfile: false })]),
    past: group(PAST),
  };

  await renderPage();

  expect(screen.queryByText('Event A')).not.toBeInTheDocument();
  expect(order()).toEqual([
    'profile',
    'office-hours',
    'contact',
    'contributions',
    'events: Past events',
    'repositories',
  ]);
});

it('Flag off: the IRL contributions block as today, and no Events section', async () => {
  flag.on = false;
  mockEventsData = { upcoming: group(UPCOMING), past: group(PAST) };

  await renderPage();

  expect(order()).toEqual(['profile', 'office-hours', 'contact', 'contributions', 'irl', 'repositories']);
});

it('no events at all: neither the section nor the IRL block', async () => {
  mockEventsData = { upcoming: group([]), past: group([]) };

  await renderPage();

  expect(order()).toEqual(['profile', 'office-hours', 'contact', 'contributions', 'repositories']);
});
