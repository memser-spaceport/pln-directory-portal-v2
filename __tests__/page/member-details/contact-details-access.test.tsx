import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ContactDetails } from '@/components/page/member-details/contact-details/ContactDetails';
import { ContactDetails as ContactDetailsSection } from '@/components/page/member-details/ContactDetails/ContactDetails';
import { useCurrentUserStore } from '@/services/auth/store';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onSocialProfileLinkClicked: jest.fn(), onEditContactDetailsClicked: jest.fn() }),
}));
jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => ({ onLoginBtnClicked: jest.fn() }),
}));
jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => jest.fn(),
}));

/* The section's children are stubbed by their barrel paths. The view tests
   below import the view by its own file path, so they still exercise the real
   component — mocking the barrel does not reach them. */
jest.mock('@/components/page/member-details/contact-details', () => ({
  ContactDetails: () => <div data-testid="contact-details-view" />,
}));
jest.mock('@/components/page/member-details/member-details-login-strip', () => ({
  MemberProfileLoginStrip: () => <div data-testid="login-strip" />,
}));
jest.mock('@/components/page/member-details/ContactDetails/components/EditContactForm', () => ({
  EditContactForm: () => <div data-testid="edit-contact-form" />,
}));
jest.mock('@/hooks/useMobileNavVisibility', () => ({
  useMobileNavVisibility: jest.fn(),
}));

const REAL_EMAIL = 'jobseeker@example.com';

const member = {
  id: 'member-1',
  name: 'Ada Lovelace',
  email: REAL_EMAIL,
  linkedinHandle: 'ada-lovelace',
  telegramHandle: 'ada',
  twitter: 'ada',
  visibleHandles: ['email', 'linkedin', 'telegram'],
} as unknown as IMember;

/* `effectivePermissions` is always seeded: isAdminUser reads
   `rbac?.effectivePermissions.some(...)` with no optional chain on `.some`, so
   an rbac object without it throws rather than returning false. */
function seedUser(user: { uid: string; status: string } | null) {
  useCurrentUserStore.setState({
    currentUser: user
      ? ({ uid: user.uid, rbac: { status: user.status, effectivePermissions: [] } } as unknown as IUserInfo)
      : null,
  });
}

function renderView(isLoggedIn: boolean) {
  return render(
    <ContactDetails member={member} isLoggedIn={isLoggedIn} userInfo={{} as IUserInfo} onEdit={jest.fn()} />,
  );
}

/* The teaser swaps real handles for deterministic fakes and flags each link
   `isPreview`, which lands as a plain `preview` class. Counting those is more
   honest than matching copy: it asserts the real values are absent from the
   DOM, not merely that something looks redacted. */
const previewLinks = (container: HTMLElement) => container.querySelectorAll('a.profile-social-link.preview');

/*
 * No production code changed here — the gate is `rbac.status === 'APPROVED'`,
 * exactly as before. These lock the ticket's first scenario in place: a Job
 * Aspirant is never APPROVED (`member.profile.visible` exists precisely so they
 * are directory-visible without approval), so the existing gate already denies
 * them. Untested until now, which is why "already works" was worth proving
 * rather than asserting.
 */
describe('ContactDetails access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seedUser(null);
  });

  it('hides real handles from a Job Aspirant', () => {
    seedUser({ uid: 'viewer-1', status: 'PENDING' });
    const { container } = renderView(true);

    expect(screen.queryByText(REAL_EMAIL)).not.toBeInTheDocument();
    expect(previewLinks(container).length).toBeGreaterThan(0);
  });

  it('hides real handles from a rejected member', () => {
    seedUser({ uid: 'viewer-1', status: 'REJECTED' });
    const { container } = renderView(true);

    expect(screen.queryByText(REAL_EMAIL)).not.toBeInTheDocument();
    expect(previewLinks(container).length).toBeGreaterThan(0);
  });

  /* Duplicated across the two breakpoint slots, which are mutually exclusive by
     CSS but both present in the DOM — jsdom applies no stylesheet. */
  it('offers the logged-out visitor its login button', () => {
    const { container } = renderView(false);

    expect(screen.getAllByText('Login for access')).toHaveLength(2);
    expect(previewLinks(container).length).toBeGreaterThan(0);
  });

  it('shows real handles to an approved member', () => {
    seedUser({ uid: 'viewer-1', status: 'APPROVED' });
    const { container } = renderView(true);

    expect(previewLinks(container)).toHaveLength(0);
  });

  it('always shows a member their own contact details', () => {
    seedUser({ uid: member.id, status: 'PENDING' });
    const { container } = renderView(true);

    expect(previewLinks(container)).toHaveLength(0);
  });
});

/*
 * The section itself, one level above the view: a Job Aspirant gets no contact
 * panel at all, header included. The teaser it used to get advertised handles
 * that no approval of theirs will ever reveal — `job_aspirant` is the only
 * policy without `member.contacts.read`.
 */
describe('ContactDetails section visibility', () => {
  const renderSection = (variant?: 'default' | 'drawer') =>
    render(
      <ContactDetailsSection
        member={member}
        isLoggedIn
        userInfo={{ uid: 'viewer-1' } as IUserInfo}
        variant={variant}
      />,
    );

  const aspirantByPolicy = () =>
    useCurrentUserStore.setState({
      currentUser: {
        uid: 'viewer-1',
        rbac: { status: 'PENDING', effectivePermissions: [], policies: [{ code: 'job_aspirant' }] },
      } as unknown as IUserInfo,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    seedUser(null);
  });

  it('renders nothing for a Job Aspirant viewing someone else', () => {
    aspirantByPolicy();

    const { container } = renderSection();

    expect(container).toBeEmptyDOMElement();
  });

  /* The login cookie omits `rbac.policies`, so the common case is recognised by
     signUpSource — and only when there is no main team, since a hiring team's
     sign-up shares the source. */
  it('recognises a Job Aspirant by signUpSource alone', () => {
    useCurrentUserStore.setState({
      currentUser: {
        uid: 'viewer-1',
        signUpSource: 'job-board',
        rbac: { status: 'PENDING', effectivePermissions: [] },
      } as unknown as IUserInfo,
    });

    const { container } = renderSection();

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the section on the aspirant own profile', () => {
    useCurrentUserStore.setState({
      currentUser: {
        uid: member.id,
        signUpSource: 'job-board',
        rbac: { status: 'PENDING', effectivePermissions: [], policies: [{ code: 'job_aspirant' }] },
      } as unknown as IUserInfo,
    });

    renderSection();

    expect(screen.getByTestId('contact-details-view')).toBeInTheDocument();
  });

  /* The drawer is the job-board and investor flows showing the viewer their own
     contacts; hiding it there would break the profile step of Apply. */
  it('keeps the drawer variant for a Job Aspirant', () => {
    aspirantByPolicy();

    renderSection('drawer');

    expect(screen.getByTestId('contact-details-view')).toBeInTheDocument();
  });

  it('keeps the teaser for a plain pending member', () => {
    seedUser({ uid: 'viewer-1', status: 'PENDING' });

    renderSection();

    expect(screen.getByTestId('contact-details-view')).toBeInTheDocument();
  });

  it('keeps the teaser for a logged-out visitor', () => {
    render(<ContactDetailsSection member={member} isLoggedIn={false} userInfo={null} />);

    expect(screen.getByTestId('contact-details-view')).toBeInTheDocument();
    expect(screen.getByTestId('login-strip')).toBeInTheDocument();
  });
});
