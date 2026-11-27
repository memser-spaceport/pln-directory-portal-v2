import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { TeamMembersView } from '@/components/page/team-details/TeamMembers/components/TeamMembersView/TeamMembersView';
import type { IUserInfo } from '@/types/shared.types';
import type { ITeam } from '@/types/teams.types';

// LAB-3398 R7, R8: team leads and admins open the members on Admin, with "Invite a teammate" beside "Add New".

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/teams/t1',
}));
jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({ onTeamDetailSeeAllMemberClicked: jest.fn(), onTeamDetailMemberClicked: jest.fn() }),
}));
jest.mock(
  '@/components/page/team-details/TeamMembers/components/TeamMembersView/components/TeamMembersViewCard',
  () => ({
    TeamMembersViewCard: ({ hasEditAccess }: { hasEditAccess: boolean }) => (
      <div data-testid="member-card" data-edit={String(hasEditAccess)} />
    ),
  }),
);
jest.mock('@/components/page/team-details/TeamMembers/components/TeamMembersView/components/AllMembers', () => ({
  AllMembers: () => null,
}));
jest.mock('@/components/core/modal', () => ({ __esModule: true, default: () => null }));

const team = { id: 't1', name: 'Northfield' } as ITeam;
const members = [
  { id: 'm1', name: 'A' },
  { id: 'm2', name: 'B' },
] as never;

const VIEWERS: Record<string, IUserInfo> = {
  lead: { uid: 'u1', leadingTeams: ['t1'] } as IUserInfo,
  admin: { uid: 'u2', leadingTeams: [], rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] } } as never,
  member: { uid: 'u3', leadingTeams: [] } as IUserInfo,
  otherLead: { uid: 'u4', leadingTeams: ['t2'] } as IUserInfo,
};

const renderAs = (viewer: keyof typeof VIEWERS, toggleIsEditMode = jest.fn()) =>
  render(
    <TeamMembersView
      team={team}
      members={members}
      userInfo={VIEWERS[viewer]}
      toggleIsEditMode={toggleIsEditMode}
      onEditMember={jest.fn()}
    />,
  );

beforeEach(() => mockPush.mockReset());

describe('TeamMembersView invite (LAB-3398)', () => {
  it.each(['lead', 'admin'] as const)('opens on Admin for a %s, with Add New and Invite a teammate', (viewer) => {
    const toggle = jest.fn();
    renderAs(viewer, toggle);

    const tabs = within(screen.getByTestId('team-members-tabs'));
    expect(tabs.getByRole('tab', { name: 'Admin' })).toHaveAttribute('aria-selected', 'true');

    const actions = within(screen.getByTestId('team-members-actions'));
    fireEvent.click(actions.getByRole('button', { name: /Add New/ }));
    expect(toggle).toHaveBeenCalledTimes(1);

    fireEvent.click(actions.getByRole('button', { name: /Invite a teammate/ }));
    expect(mockPush).toHaveBeenCalledWith('/settings/invite');
    screen.getAllByTestId('member-card').forEach((card) => expect(card).toHaveAttribute('data-edit', 'true'));
  });

  it('keeps an explicit Members choice: no admin actions and no per-card edit', () => {
    renderAs('lead');

    fireEvent.click(screen.getByRole('tab', { name: 'Members' }));

    expect(screen.getByRole('tab', { name: 'Members' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByTestId('team-members-actions')).not.toBeInTheDocument();
    screen.getAllByTestId('member-card').forEach((card) => expect(card).toHaveAttribute('data-edit', 'false'));
  });

  it.each(['member', 'otherLead'] as const)('shows a %s no Admin tab, no Add New and no invite', (viewer) => {
    renderAs(viewer);

    expect(screen.queryByTestId('team-members-tabs')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add New/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Invite a teammate/ })).not.toBeInTheDocument();
    screen.getAllByTestId('member-card').forEach((card) => expect(card).toHaveAttribute('data-edit', 'false'));
  });
});
