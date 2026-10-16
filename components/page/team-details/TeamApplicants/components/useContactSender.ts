'use client';

import { useCurrentUserStore } from '@/services/auth/store';

import { useCandidateMember } from './useCandidateMember';

export interface ContactSender {
  name: string | null;
  /** Their role on the team the page is for, from the team-member link. */
  role: string | null;
}

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);

/**
 * The signed-in lead as the Contact template introduces them (LAB-2853): their
 * name and their role on this team.
 *
 * It uses the same member read the pane uses, keyed on the lead's own uid, so a
 * lead whose profile is already cached costs nothing. It only reads while
 * `enabled` (the Suggested tab is open), so the other tabs make no extra
 * request. Until the read lands the name falls back to the user store and the
 * role is `null`; the template shortens rather than printing a blank.
 *
 * Every field is checked before use, because the read can answer a shape this
 * hook did not ask for and a template that prints "undefined" goes to a member.
 */
export function useContactSender({
  viewerUid,
  teamId,
  isLoggedIn,
  enabled,
}: {
  viewerUid: string | undefined;
  teamId: string;
  isLoggedIn: boolean;
  enabled: boolean;
}): ContactSender {
  const { currentUser } = useCurrentUserStore();
  const { data: member } = useCandidateMember(enabled && viewerUid ? viewerUid : '', isLoggedIn);

  const teams: unknown = member?.teams;
  const onTeam = Array.isArray(teams)
    ? teams.find((team: { id?: unknown }) => team && typeof team === 'object' && team.id === teamId)
    : undefined;

  return {
    name: text(member?.name) ?? text(currentUser?.name),
    role: text(onTeam?.role),
  };
}
