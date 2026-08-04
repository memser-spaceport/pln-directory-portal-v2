import { IJobRole } from '@/types/jobs.types';

import { DirectoryMember, Referrer, RecipientOption } from '../types';

import { getGreeting } from './getGreeting';
import { getMemberSignal } from './getMemberSignal';
import { getRoleUrl } from './getRoleUrl';
import { getSignature } from './getSignature';

interface EmailTemplateInput {
  member: DirectoryMember;
  role: IJobRole;
  /** The hiring team — who the note is addressed to. */
  teamName: string;
  recipients: RecipientOption[];
  /** Who's signing it. Null when signed out. */
  referrer: Referrer | null;
}

/**
 * The drafted note the referrer sends. Regenerated whenever the referred person, the
 * recipient list or the referrer's own details change, unless the referrer has already
 * edited it by hand — "Reset to template" is the way back.
 *
 * Every line is assembled from what the directory actually knows, so each one can drop
 * out: a member with no role or team on record loses the "is ‹role› at ‹team›" clause, a
 * member with no skills tagged loses the "why them" sentence (see `getMemberSignal`), a
 * role with no apply link loses the link line, and a signed-out referrer loses the
 * sign-off. The greeting and the refer line are the only two that always survive.
 */
export function buildEmailTemplate(input: EmailTemplateInput): string {
  const { member, role, teamName, recipients, referrer } = input;

  // "Staff Engineer at Filecoin Foundation", or just one half of it — real records are
  // missing a role or a team often enough that the line has to survive both.
  const where = [member.title, member.team].filter(Boolean).join(' at ');
  const about = [where ? `${member.name} is ${where}.` : '', getMemberSignal(member)].filter(Boolean).join(' ');

  const roleUrl = getRoleUrl(role);
  const signature = getSignature(referrer);

  return [
    getGreeting(recipients, teamName),
    ``,
    `I'd like to refer ${member.name} for your ${role.roleTitle} role.`,
    ...(about ? [``, about] : []),
    ...(roleUrl ? [``, `The role: ${roleUrl}`] : []),
    ``,
    `Happy to make the intro whenever you're ready.`,
    ...(signature ? [``, signature] : []),
  ].join('\n');
}
