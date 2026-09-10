import { IJobReferralRecipient } from '@/types/jobs.types';

import { DirectoryMember, RecipientOption } from '../types';

import { toReferralRecipient } from './toReferralRecipient';

/**
 * The picked rows as the payload's recipients.
 *
 * Every row but one is 1:1 with an address the API already understands. The team
 * row is the exception — it is an *audience*, and the send is where it becomes
 * addresses: the team's configured inbox when it has one, otherwise its leads.
 * Resolving it here rather than at pick time is what lets the field keep saying
 * "the Filecoin hiring team" on the chip and the receipt while the mail still
 * goes to people.
 *
 * Deduped by uid/address, because a referrer can reasonably add the team *and* the
 * one lead they know, and neither of them should get the note twice.
 */
export function toReferralRecipients(
  options: RecipientOption[],
  teamTargets: { leads: DirectoryMember[]; jobReferEmail?: string | null },
): IJobReferralRecipient[] {
  const inbox = teamTargets.jobReferEmail?.trim();

  const expanded = options.flatMap<IJobReferralRecipient>((option) => {
    if (!option.isTeam) return [toReferralRecipient(option)];
    if (inbox) return [{ email: inbox }];
    return teamTargets.leads.map((lead) => ({ memberUid: lead.uid, name: lead.name }));
  });

  const seen = new Set<string>();
  return expanded.filter((recipient) => {
    const key = 'email' in recipient ? `email:${recipient.email}` : `uid:${recipient.memberUid}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
