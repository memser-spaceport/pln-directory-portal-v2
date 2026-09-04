import { DirectoryMember } from '../types';

/** The "Team Lead · Staff Engineer · Filecoin Foundation" line under a name.
 *  Any part can be missing on a real record, so the separator only shows up
 *  between parts that exist — and a member with none gets no line at all rather
 *  than a stray dot.
 *
 *  `omitTeam` drops the team name for hiring-team rows: the modal and the menu
 *  group already name the team, so repeating it on every row spends the width
 *  the role needs. Team Lead still shows — that is the fact the suggestion is
 *  asking the referrer to weigh. */
export function getMemberMeta(member: DirectoryMember, options?: { omitTeam?: boolean }): string | undefined {
  return (
    [member.isTeamLead ? 'Team Lead' : null, member.title, options?.omitTeam ? null : member.team]
      .filter(Boolean)
      .join(' · ') || undefined
  );
}
