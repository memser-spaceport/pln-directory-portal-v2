import { act, render, screen } from '@testing-library/react';

import type { IUserInfo } from '@/types/shared.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { MemberAccessBadges } from '@/components/common/AccessLevelBadges/MemberAccessBadges';
import { TeamAccessBadge } from '@/components/common/AccessLevelBadges/TeamAccessBadge';

const ADMIN = {
  uid: 'admin-1',
  rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
} as unknown as IUserInfo;

const MEMBER = {
  uid: 'member-1',
  rbac: { effectivePermissions: [{ code: 'member.profile.visible' }] },
} as unknown as IUserInfo;

function viewAs(user: IUserInfo | null) {
  act(() => useCurrentUserStore.getState().actions.setCurrentUser(user));
}

/* The core Tooltip renders its trigger twice (one copy per breakpoint), so every badge appears twice in the DOM. */
function isShown(label: string) {
  return screen.queryAllByText(label).length > 0;
}

describe('MemberAccessBadges', () => {
  afterEach(() => viewAs(null));

  it.each([
    ['PENDING', 'L0 · Not approved'],
    ['VERIFIED', 'L1 · Limited access'],
    ['REJECTED', 'Rejected'],
  ] as const)('shows the %s state to an admin', (state, label) => {
    viewAs(ADMIN);
    render(<MemberAccessBadges state={state} />);

    expect(isShown(label)).toBe(true);
  });

  it('shows no state badge for an approved member', () => {
    viewAs(ADMIN);
    const { container } = render(<MemberAccessBadges state="APPROVED" />);

    expect(container.innerHTML).toBe('');
  });

  it('shows the Job Aspirant badge next to the state badge', () => {
    viewAs(ADMIN);
    render(<MemberAccessBadges state="PENDING" isJobAspirant />);

    expect(isShown('L0 · Not approved')).toBe(true);
    expect(isShown('Job Aspirant')).toBe(true);
  });

  it('shows the Job Aspirant badge on a list card, where no state is passed', () => {
    viewAs(ADMIN);
    render(<MemberAccessBadges isJobAspirant />);

    expect(isShown('Job Aspirant')).toBe(true);
  });

  it.each([
    ['a member who is not an admin', MEMBER],
    ['a logged-out visitor', null],
  ])('shows nothing to %s', (_, viewer) => {
    viewAs(viewer);
    const { container } = render(<MemberAccessBadges state="PENDING" isJobAspirant />);

    expect(container.innerHTML).toBe('');
  });
});

describe('TeamAccessBadge', () => {
  afterEach(() => viewAs(null));

  it.each([
    ['L0', 'L0 · Hidden'],
    ['L1', 'L1 · Base level'],
  ])('shows %s to an admin', (accessLevel, label) => {
    viewAs(ADMIN);
    render(<TeamAccessBadge accessLevel={accessLevel} />);

    expect(isShown(label)).toBe(true);
  });

  it.each([null, undefined, 'L2'])('shows nothing for level %s', (accessLevel) => {
    viewAs(ADMIN);
    const { container } = render(<TeamAccessBadge accessLevel={accessLevel} />);

    expect(container.innerHTML).toBe('');
  });

  it('shows nothing to a member who is not an admin', () => {
    viewAs(MEMBER);
    const { container } = render(<TeamAccessBadge accessLevel="L0" />);

    expect(container.innerHTML).toBe('');
  });
});
