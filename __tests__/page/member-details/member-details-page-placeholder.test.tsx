/**
 * LAB-2922: the member profile renders from the server's public member while the viewer's own fetch is in flight.
 *
 * While that public stand-in is on screen the page renders as a signed-out visitor sees it, whoever is looking: that is
 * what the server rendered (so hydration matches), and an owner must not open an edit form prefilled from the redacted
 * public record. The viewer's own view, edit controls included, takes over when their fetch lands.
 */
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The real React Query, not the global stub: this test is about what the hook does with placeholder data.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

let resolveMember: (value: unknown) => void = () => {};
const mockGetMember = jest.fn(
  (..._args: unknown[]) =>
    new Promise((resolve) => {
      resolveMember = resolve;
    }),
);
jest.mock('@/services/members.service', () => ({ getMember: (...args: unknown[]) => mockGetMember(...args) }));

// What each section was handed: the only thing under test here.
jest.mock('@/components/page/member-details/ProfileDetails', () => ({
  ProfileDetails: ({ member, isLoggedIn, userInfo }: any) => (
    <div data-testid="profile-details">
      {member.name} | {member.email ?? 'no email'} | {isLoggedIn ? 'signed in' : 'public view'} |{' '}
      {userInfo?.uid ?? 'nobody'}
    </div>
  ),
}));
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
jest.mock('@/components/page/member-details/member-irl-contributions', () => () => null);
jest.mock('@/components/page/member-details/ContactDetails', () => ({ ContactDetails: mockNothing }));
jest.mock('@/components/page/member-details/JobSearchStatusDetails', () => ({ JobSearchStatusDetails: mockNothing }));
jest.mock('@/components/page/member-details/ExperienceDetails', () => ({ ExperienceDetails: mockNothing }));
jest.mock('@/components/page/member-details/ContributionsDetails', () => ({ ContributionsDetails: mockNothing }));
jest.mock('@/components/page/member-details/RepositoriesDetails', () => ({ RepositoriesDetails: mockNothing }));
jest.mock('@/components/page/member-details/OneClickVerification', () => ({ OneClickVerification: mockNothing }));
jest.mock('@/components/page/member-details/TeamsDetails', () => ({ TeamsDetails: mockNothing }));
jest.mock('@/components/page/member-details/OfficeHoursDetails', () => ({ OfficeHoursDetails: mockNothing }));
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
import { useCurrentUserStore } from '@/services/auth/store';

const member = (overrides: Record<string, unknown>) => ({
  id: 'member-1',
  name: 'Ada Lovelace',
  email: null,
  eventGuests: [],
  rbac: { status: 'APPROVED', policies: [] },
  ...overrides,
});
const PUBLIC = { data: { formattedData: member({}) } };
const OWNERS_OWN = { data: { formattedData: member({ email: 'ada@example.com' }) } };

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemberDetailsPage memberId="member-1" serverMember={PUBLIC as never} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  mockGetMember.mockClear();
  useCurrentUserStore.setState({ currentUser: null });
});

it('shows the public profile at once, with no loader', () => {
  renderPage();

  expect(screen.getByTestId('profile-details')).toHaveTextContent('Ada Lovelace | no email | public view | nobody');
  expect(screen.queryByText('Loading profile')).not.toBeInTheDocument();
});

it('keeps the owner on the public view until their own profile lands, then hands them the controls', async () => {
  useCurrentUserStore.setState({ currentUser: { uid: 'member-1', roles: [] } as never });
  renderPage();

  // Their own fetch is in flight: the redacted public record, and no signed-in controls on it.
  expect(screen.getByTestId('profile-details')).toHaveTextContent('Ada Lovelace | no email | public view | nobody');

  await act(async () => resolveMember(OWNERS_OWN));

  expect(await screen.findByText(/ada@example.com \| signed in \| member-1/)).toBeInTheDocument();
});
