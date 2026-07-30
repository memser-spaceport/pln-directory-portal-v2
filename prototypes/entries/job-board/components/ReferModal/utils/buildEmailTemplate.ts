import { IJobRole } from '@/types/jobs.types';
import { MockMember } from '@/prototypes/entries/job-board/mockMembers';

import { RecipientOption } from '../types';

import { getGreeting } from './getGreeting';

/** The drafted note the referrer sends. Regenerated whenever the referred person or
 *  the recipient list changes, unless the referrer has already edited it by hand. */
export function buildEmailTemplate(
  member: MockMember,
  role: IJobRole,
  teamName: string,
  recipients: RecipientOption[],
): string {
  const where = member.team ? `${member.title} at ${member.team}` : member.title;

  return [
    getGreeting(recipients, teamName),
    ``,
    `I'd like to refer ${member.name} for your ${role.roleTitle} role.`,
    ``,
    `${member.name} is ${where}. ${member.signal}`,
    ``,
    `Happy to make the intro whenever you're ready.`,
  ].join('\n');
}
