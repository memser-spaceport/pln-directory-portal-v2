'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getMembersForProjectForm } from '@/services/members.service';
import { searchTeamsByName } from '@/services/teams.service';

import { DirectoryMember } from '../types';

/** A `getMembersForProjectForm` record as the pickers render it. `logo` is that call's
 *  name for the member's avatar; the role · team line comes from their main team, or
 *  from whichever team came first for members who never marked one.
 *
 *  `teamLead` is read off the hiring team's own role, not the record's top-level flag —
 *  that one is true for a lead of *any* team they belong to. */
function toDirectoryMember(member: any, teamUid: string): DirectoryMember {
  const roles = member?.teamMemberRoles ?? [];
  const mainRole = roles.find((role: any) => role?.mainTeam) ?? roles[0];

  return {
    uid: member?.uid,
    name: member?.name ?? '',
    title: mainRole?.role ?? '',
    team: mainRole?.team?.name ?? '',
    image: member?.logo ?? null,
    isTeamLead: roles.some((role: any) => role?.teamLead && role?.team?.uid === teamUid),
  };
}

/**
 * The hiring team: the group the "Send to" menu opens on, and the leads it prefills.
 *
 * Two production calls, no new endpoint. `searchTeamsByName` turns the job board's team
 * name into a directory uid — the board's own uids are its own (`protocol-labs`), so
 * the name is all the two sides share — and `getMembersForProjectForm` takes that uid.
 * Only an exact name match counts: `name__icontains=Protocol Labs` also returns
 * "Protocol Labs Dev Guild", and mailing the wrong team is worse than prefilling
 * nobody, which is already the supported "type an email address" case.
 */
export function useTeamMembers(teamName: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ['prototype', 'job-board', 'refer-modal', 'team-members', teamName],
    queryFn: async () => {
      const teams = await searchTeamsByName(teamName);

      if (!Array.isArray(teams)) {
        throw new Error('Failed to look up the hiring team');
      }

      const target = teamName.trim().toLowerCase();
      const team = teams.find((item: any) => item?.label?.trim().toLowerCase() === target);

      if (!team?.value) {
        return [];
      }

      const result: any = await getMembersForProjectForm(team.value as any);

      if (result?.isError) {
        throw new Error(result?.message ?? 'Failed to load the hiring team');
      }

      return ((result?.data ?? []) as any[])
        .map((member) => toDirectoryMember(member, team.value))
        .filter((member) => !!member.uid && !!member.name);
    },
    enabled: enabled && !!teamName.trim(),
    staleTime: 5 * 60 * 1000,
  });

  const members = useMemo<DirectoryMember[]>(() => query.data ?? [], [query.data]);

  // Who a referral is actually addressed to. Real teams run large — Filecoin
  // Foundation has 64 members on record — and an intro email to all of them isn't an
  // intro, so only the leads are prefilled. The rest of the team stays one keystroke
  // away in the same menu. Teams with no lead marked fall back to the whole team,
  // which is the behaviour every team had when this list was mocked at two people.
  const defaultRecipients = useMemo<DirectoryMember[]>(() => {
    const leads = members.filter((member) => member.isTeamLead);
    return leads.length ? leads : members;
  }, [members]);

  return { members, defaultRecipients, isLoading: query.isLoading, isError: query.isError };
}
