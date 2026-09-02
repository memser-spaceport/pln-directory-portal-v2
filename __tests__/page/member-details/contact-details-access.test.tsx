import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ContactDetails } from '@/components/page/member-details/contact-details/ContactDetails';
import { useCurrentUserStore } from '@/services/auth/store';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onSocialProfileLinkClicked: jest.fn() }),
}));
jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => ({ onLoginBtnClicked: jest.fn() }),
}));
jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => jest.fn(),
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
