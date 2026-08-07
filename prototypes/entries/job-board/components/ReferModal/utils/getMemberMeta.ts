import { DirectoryMember } from '../types';

/** The "Staff Engineer · Filecoin Foundation" line under a name. Either half can be
 *  missing on a real record, so the separator only shows up when both are there —
 *  and a member with neither gets no line at all rather than a stray dot. */
export function getMemberMeta(member: DirectoryMember): string | undefined {
  return [member.title, member.team].filter(Boolean).join(' · ') || undefined;
}
