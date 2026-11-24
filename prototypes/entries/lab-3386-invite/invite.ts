// Pure logic for the invite prototype, kept apart from the UI so the checks in
// __tests__/ can run it without a browser.

import type { IUserInfo } from '@/types/shared.types';
import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';

import { MOCK_SIGN_UP_BASE, MOCK_TEAM, type MockMember, type Viewer } from './mocks';

/** The member's personal sign-up link (mocked; no live API issues it). */
export function buildInviteLink(inviteCode: string, base: string = MOCK_SIGN_UP_BASE): string {
  return `${base}?invite=${encodeURIComponent(inviteCode)}`;
}

/** The members search: name, team or role contains the query (case-insensitive). */
export function searchMembers(members: MockMember[], query: string): MockMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return members;
  return members.filter(
    (m) =>
      m.name.toLowerCase().includes(q) || m.mainTeam.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q),
  );
}

/** The invite line shows only when a search ran and found nobody. Populated results get no CTA. */
export function showsInviteCta(query: string, results: MockMember[]): boolean {
  return query.trim().length > 0 && results.length === 0;
}

/**
 * The mocked user info for each review-band viewer, in production's IUserInfo
 * terms: an admin holds the `directory.admin.full` RBAC permission
 * (utils/user/isAdminUser.ts), a lead has the team in `leadingTeams`.
 */
export function userInfoFor(viewer: Viewer): IUserInfo {
  if (viewer === 'admin') {
    return {
      leadingTeams: [],
      rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
    } as unknown as IUserInfo;
  }
  if (viewer === 'team-lead') return { leadingTeams: [MOCK_TEAM.id] } as unknown as IUserInfo;
  return { leadingTeams: [] } as unknown as IUserInfo;
}

/**
 * Production's own `isTeamLeaderOrAdmin` (pure, import-safe), which already
 * gates the team profile's "Add New" members action and the per-card edit.
 * "Invite a teammate" uses the same gate, so it shows only where the viewer
 * can manage members.
 */
export function canManageTeamMembers(userInfo: IUserInfo | null, teamId: string): boolean {
  return isTeamLeaderOrAdmin(userInfo, teamId);
}

export type CopyResult = 'copied' | 'fallback';

type ClipboardLike = { writeText: (text: string) => Promise<void> } | undefined;

/**
 * Copies the link. When the browser has no clipboard or refuses the write,
 * the result is 'fallback': the UI selects the link so the member can copy it by hand.
 */
export async function copyInviteLink(text: string, clipboard: ClipboardLike): Promise<CopyResult> {
  if (!clipboard?.writeText) return 'fallback';
  try {
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'fallback';
  }
}

/** Review-band surfaces, read from and written to `?view=` so a link opens one state. */
export type Surface = 'menu' | 'members' | 'team' | 'settings';

export const SURFACES: [Surface, string][] = [
  ['menu', 'Avatar menu'],
  ['members', 'Members search'],
  ['team', 'Team profile'],
  ['settings', 'Settings → Invite'],
];

export function parseSurface(value: string | null): Surface {
  return SURFACES.some(([key]) => key === value) ? (value as Surface) : 'menu';
}

export function parseViewer(value: string | null): Viewer {
  return value === 'team-lead' || value === 'admin' ? value : 'member';
}
