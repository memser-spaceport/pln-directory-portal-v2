import { DirectoryMember, RecipientOption } from '../types';

import { getMemberMeta } from './getMemberMeta';

/** One member as a row in the "Send to" field. Shared with the modal so the recipients
 *  prefilled for the hiring team are the same shape as the ones picked by hand. */
export function toRecipientOption(member: DirectoryMember): RecipientOption {
  return {
    label: member.name,
    value: member.uid,
    description: getMemberMeta(member),
    image: member.image,
    isTeamLead: member.isTeamLead,
  };
}
