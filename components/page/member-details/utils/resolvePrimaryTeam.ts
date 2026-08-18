import type { IMember } from '@/types/members.types';

export interface ResolvedPrimaryTeam {
  uid: string;
  name: string;
}

/**
 * The team a member's profile speaks for.
 *
 * Mirrors MemberDetailHeader's resolution (MemberDetailHeader.tsx:50-55),
 * including its single-team fallback, so the header and the news card can never
 * name different teams on the same page. A member on exactly one team is
 * unambiguous even when the join row lacks the `mainTeam` flag — which is a
 * different thing from picking `teams[0]` out of several, and the reason that
 * broader fallback is deliberately not here.
 *
 * Returns null unless BOTH a team and a non-empty uid resolve: members.service.ts
 * maps `id: teamMemberRole?.team?.uid || ''`, so a role whose `team` relation
 * didn't expand yields a truthy object carrying an empty id. Gating on the
 * object alone would sail past that and request `/v1/teams//team-news`.
 *
 * Note `mainTeam` can be `undefined` rather than `null` (it comes from
 * `teams.find(...)` on some paths), so never compare it against null.
 * Where more than one role is flagged primary, first-in-API-order wins — the
 * same rule every other call site already follows.
 */
export function resolvePrimaryTeam(member: IMember | null | undefined): ResolvedPrimaryTeam | null {
  if (!member) {
    return null;
  }

  const primary = member.mainTeam ?? (member.teams?.length === 1 ? member.teams[0] : null);
  const uid = primary?.id?.trim();

  if (!primary || !uid) {
    return null;
  }

  return { uid, name: primary.name?.trim() || '' };
}
