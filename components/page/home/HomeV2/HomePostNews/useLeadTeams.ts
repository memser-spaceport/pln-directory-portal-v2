import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import type { PostNewsTeamChoice } from '@/components/page/team-details/TeamNews/PostNewsModal';
import { useCurrentUserStore } from '@/services/auth/store';
import { useMember } from '@/services/members/hooks/useMember';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { getTeam } from '@/services/teams.service';

export interface LeadTeams {
  /** The teams the signed-in member leads, the main team first. Empty for anyone else (admins included). */
  teams: PostNewsTeamChoice[];
  /** The team \"Post as\" starts on: the main team when the member leads it, else the first lead team. */
  initialTeamUid: string;
}

type TeamRole = { teamUid?: string; teamTitle?: string; mainTeam?: unknown; team?: { uid?: string; name?: string } };

/**
 * The teams the signed-in member leads (LAB-3342). Lead status is `leadingTeams` in the client user info, which
 * UserInfoChecker keeps in step with the API. Names and the main team come from the member's own record (the same
 * `useMember` query UserInfoChecker reads, so usually cached). Logos come from each team, as `useGetTeam` reads them
 * (same query key, so the cache is shared).
 */
export function useLeadTeams(): LeadTeams {
  const { currentUser } = useCurrentUserStore();
  const leadUids = useMemo(() => dedupe(currentUser?.leadingTeams ?? []), [currentUser?.leadingTeams]);
  const isLead = Boolean(currentUser?.uid) && leadUids.length > 0;
  const member = useMember(isLead ? currentUser?.uid : undefined);
  const teamQueries = useQueries({
    queries: leadUids.map((uid) => ({
      queryKey: [TeamsQueryKeys.GET_TEAM, uid],
      queryFn: async () => {
        const response = await getTeam(uid, { with: 'logo' });
        return response.error ? null : response.data.formatedData;
      },
      enabled: isLead,
    })),
  });
  const teamData = teamQueries.map((q) => q.data as { name?: string; logo?: string } | null | undefined);
  const teamKey = teamData.map((d) => `${d?.name ?? ''}|${d?.logo ?? ''}`).join(',');

  return useMemo(() => {
    if (!isLead) return { teams: [], initialTeamUid: '' };
    const roles = rolesOf(member.data);
    const teams = leadUids.map((uid, index) => {
      const role = roles.find((r) => (r.team?.uid || r.teamUid) === uid);
      const team = teamData[index];
      return {
        uid,
        name: (role?.team?.name || role?.teamTitle || team?.name || '').trim(),
        logoUrl: team?.logo || null,
        main: Boolean(role?.mainTeam),
      };
    });
    const sorted = [...teams].sort((a, b) => Number(b.main) - Number(a.main));
    return {
      teams: sorted.map(({ uid, name, logoUrl }) => ({ uid, name, logoUrl })),
      initialTeamUid: sorted[0]?.uid ?? '',
    };
    // teamKey stands for teamData, which is a new array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLead, leadUids, member.data, teamKey]);
}

function dedupe(uids: string[]): string[] {
  return Array.from(new Set(uids.filter(Boolean)));
}

function rolesOf(data: unknown): TeamRole[] {
  const memberInfo = data && typeof data === 'object' && 'memberInfo' in data ? data.memberInfo : undefined;
  const roles = (memberInfo as { teamMemberRoles?: TeamRole[] } | undefined)?.teamMemberRoles;
  return Array.isArray(roles) ? roles : [];
}
