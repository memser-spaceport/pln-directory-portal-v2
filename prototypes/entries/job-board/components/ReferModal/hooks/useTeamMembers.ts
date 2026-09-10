'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getMembersForProjectForm } from '@/services/members.service';
import { searchTeamsByName } from '@/services/teams.service';

import { DirectoryMember } from '../types';
import { toDirectoryMember } from '../utils/toDirectoryMember';

/**
 * The hiring team: the group the "Send to" menu opens on, and the leads it suggests first.
 *
 * Two production calls, no new endpoint. `searchTeamsByName` turns the job board's team
 * name into a directory uid — the board's own uids are its own (`protocol-labs`), so
 * the name is all the two sides share — and `getMembersForProjectForm` takes that uid.
 * Only an exact name match counts: `name__icontains=Protocol Labs` also returns
 * "Protocol Labs Dev Guild", and suggesting the wrong team is worse than suggesting
 * nobody, which is already the supported "type an email address" case.
 */
export function useTeamMembers(teamName: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ['job-board', 'refer-modal', 'team-members', teamName],
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

  // Who a referral is usually addressed to. Real teams run large — Filecoin
  // Foundation has 64 members on record — and an intro email to all of them isn't an
  // intro, so the leads are the suggestion: sorted first in the picker's resting menu
  // (nobody is preselected — the referrer picks), and named on the application
  // pane's "Reviewed by" line. Teams with no lead marked fall back to the whole
  // team, which is the behaviour every team had when this list was mocked at two
  // people.
  //
  // Still exported as `defaultRecipients`: the name dates from when these were
  // seeded into the refer modal's field, but production's
  // `components/page/jobs/JobApplicationPane` imports this hook from this tree and
  // destructures that key — renaming it here breaks a file prototypes must not
  // edit. Rename both sides in a production pass.
  const defaultRecipients = useMemo<DirectoryMember[]>(() => {
    const marked = members.filter((member) => member.isTeamLead);
    return marked.length ? marked : members;
  }, [members]);

  return { members, defaultRecipients, isLoading: query.isLoading, isError: query.isError };
}
