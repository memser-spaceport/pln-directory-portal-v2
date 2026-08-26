import { DirectoryMember } from '../types';

/** The "Team Lead · Staff Engineer · Filecoin Foundation" line under a name.
 *  Any part can be missing on a real record, so the separator only shows up
 *  between parts that exist — and a member with none gets no line at all rather
 *  than a stray dot. */
export function getMemberMeta(member: DirectoryMember): string | undefined {
  return [member.isTeamLead ? 'Team Lead' : null, member.title, member.team].filter(Boolean).join(' · ') || undefined;
}
