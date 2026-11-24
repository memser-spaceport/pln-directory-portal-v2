/**
 * Checks for the LAB-3386 invite prototype.
 *
 * The repo's jest config ignores prototypes/, so run these with:
 *   npx jest --coverage=false --testPathIgnorePatterns /node_modules/ \
 *     prototypes/entries/lab-3386-invite
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  buildInviteLink,
  canManageTeamMembers,
  copyInviteLink,
  parseSurface,
  parseViewer,
  searchMembers,
  showsInviteCta,
  userInfoFor,
} from '../invite';
import {
  MOCK_DIRECTORY,
  MOCK_TEAM,
  MOCK_TEAM_MEMBERS,
  MOCK_VIEWER,
  QUERY_NO_RESULTS,
  QUERY_WITH_RESULTS,
} from '../mocks';
import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';
import { isAdminUser } from '@/utils/user/isAdminUser';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <img {...(props as object)} />,
}));

describe('invite link', () => {
  it('is personal and on the mock .example domain', () => {
    const link = buildInviteLink(MOCK_VIEWER.inviteCode);
    expect(link).toBe('https://labos.example/sign-up?invite=re-7f3k');
    expect(new URL(link).hostname.endsWith('.example')).toBe(true);
  });

  it('copies when the clipboard accepts the write', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    await expect(copyInviteLink('x', { writeText })).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('x');
  });

  it('falls back when the clipboard is missing or refuses', async () => {
    await expect(copyInviteLink('x', undefined)).resolves.toBe('fallback');
    await expect(copyInviteLink('x', { writeText: () => Promise.reject(new Error('no')) })).resolves.toBe('fallback');
  });
});

describe('members search CTA', () => {
  it('shows only when a search ran and found nobody', () => {
    const none = searchMembers(MOCK_DIRECTORY, QUERY_NO_RESULTS);
    const some = searchMembers(MOCK_DIRECTORY, QUERY_WITH_RESULTS);
    expect(none).toHaveLength(0);
    expect(some.length).toBeGreaterThan(0);
    expect(showsInviteCta(QUERY_NO_RESULTS, none)).toBe(true);
    expect(showsInviteCta(QUERY_WITH_RESULTS, some)).toBe(false);
    expect(showsInviteCta('   ', [])).toBe(false);
  });
});

describe('team gate', () => {
  it.each(['member', 'team-lead', 'admin'] as const)('matches production isTeamLeaderOrAdmin for %s', (viewer) => {
    const info = userInfoFor(viewer);
    expect(canManageTeamMembers(info, MOCK_TEAM.id)).toBe(isTeamLeaderOrAdmin(info, MOCK_TEAM.id));
  });

  it('marks the admin the way production does (RBAC directory.admin.full)', () => {
    expect(isAdminUser(userInfoFor('admin'))).toBe(true);
    expect(isAdminUser(userInfoFor('team-lead'))).toBe(false);
  });

  it('lets only leads of this team and admins manage members', () => {
    expect(canManageTeamMembers(userInfoFor('member'), MOCK_TEAM.id)).toBe(false);
    expect(canManageTeamMembers(userInfoFor('team-lead'), MOCK_TEAM.id)).toBe(true);
    expect(canManageTeamMembers(userInfoFor('team-lead'), 'other-team')).toBe(false);
    expect(canManageTeamMembers(userInfoFor('admin'), 'other-team')).toBe(true);
  });
});

describe('URL state', () => {
  it('reads known values and defaults the rest', () => {
    expect(parseSurface('settings')).toBe('settings');
    expect(parseSurface('nope')).toBe('menu');
    expect(parseSurface(null)).toBe('menu');
    expect(parseViewer('admin')).toBe('admin');
    expect(parseViewer('owner')).toBe('member');
  });
});

describe('mock data', () => {
  it('uses only mock ids and no photos', () => {
    for (const m of [...MOCK_DIRECTORY, ...MOCK_TEAM_MEMBERS]) {
      expect(m.id.startsWith('mock-')).toBe(true);
      expect((m as { profile?: string }).profile).toBeUndefined();
    }
  });
});

describe('rendered states', () => {
  it('members: no results shows the invite line and it opens the destination', async () => {
    const { MembersSearch } = await import('../MembersSearch');
    const onInvite = jest.fn();
    const { rerender } = render(
      <MembersSearch query={QUERY_NO_RESULTS} onQueryChange={() => {}} onInvite={onInvite} />,
    );
    expect(screen.getByTestId('members-invite-cta')).toHaveTextContent(
      'Can’t find them? They may not be on LabOS yet. Invite them.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Invite them.' }));
    expect(onInvite).toHaveBeenCalledTimes(1);

    rerender(<MembersSearch query={QUERY_WITH_RESULTS} onQueryChange={() => {}} onInvite={onInvite} />);
    expect(screen.queryByTestId('members-invite-cta')).not.toBeInTheDocument();
    expect(screen.queryByTestId('members-empty')).not.toBeInTheDocument();
  });

  it('team: "Invite a teammate" shows for lead and admin only', async () => {
    const { TeamMembersSection } = await import('../TeamMembersSection');
    const { rerender } = render(<TeamMembersSection viewer="member" onInvite={() => {}} />);
    expect(screen.queryByText('Invite a teammate')).not.toBeInTheDocument();
    expect(screen.queryByText('Add New')).not.toBeInTheDocument();
    for (const viewer of ['team-lead', 'admin'] as const) {
      rerender(<TeamMembersSection viewer={viewer} onInvite={() => {}} />);
      expect(screen.getByText('Invite a teammate')).toBeInTheDocument();
      expect(screen.getByText('Add New')).toBeInTheDocument();
    }
  });

  it('settings: copy shows Copied, then returns; blocked shows the fallback', async () => {
    jest.useFakeTimers();
    const { InviteLinkCard, COPIED_MS } = await import('../SettingsInvite');
    const writeText = jest.fn().mockResolvedValue(undefined);
    const { unmount } = render(<InviteLinkCard clipboard={{ writeText }} />);
    expect(screen.getByTestId('invite-link')).toHaveValue('https://labos.example/sign-up?invite=re-7f3k');
    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-invite'));
    });
    expect(writeText).toHaveBeenCalledWith('https://labos.example/sign-up?invite=re-7f3k');
    expect(screen.getByTestId('copy-invite')).toHaveTextContent('Copied');
    act(() => {
      jest.advanceTimersByTime(COPIED_MS);
    });
    expect(screen.getByTestId('copy-invite')).toHaveTextContent('Copy invite link');
    unmount();
    jest.useRealTimers();

    render(<InviteLinkCard clipboard={{ writeText: () => Promise.reject(new Error('blocked')) }} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-invite'));
    });
    expect(screen.getByTestId('copy-fallback')).toHaveTextContent('Press Ctrl+C or ⌘C to copy it.');
    expect(screen.getByTestId('invite-link')).toHaveFocus();
  });
});
