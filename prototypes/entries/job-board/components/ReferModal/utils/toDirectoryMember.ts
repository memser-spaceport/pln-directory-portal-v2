import { DirectoryMember } from '../types';

/** A `getMembersForProjectForm` record as the pickers render it. `logo` is that call's
 *  name for the member's avatar. Title and team come from their role on the hiring
 *  team when one exists, otherwise from their main team (or the first role on file).
 *
 *  `teamLead` is read off the hiring team's own role, not the record's top-level flag —
 *  that one is true for a lead of *any* team they belong to. */
export function toDirectoryMember(member: any, teamUid: string): DirectoryMember {
  const roles = member?.teamMemberRoles ?? [];
  const hiringRole = roles.find((role: any) => role?.team?.uid === teamUid);
  const mainRole = roles.find((role: any) => role?.mainTeam) ?? roles[0];
  const role = hiringRole ?? mainRole;

  return {
    uid: member?.uid,
    name: member?.name ?? '',
    title: role?.role ?? '',
    team: role?.team?.name ?? '',
    image: member?.logo ?? null,
    isTeamLead: roles.some((item: any) => item?.teamLead && item?.team?.uid === teamUid),
  };
}
