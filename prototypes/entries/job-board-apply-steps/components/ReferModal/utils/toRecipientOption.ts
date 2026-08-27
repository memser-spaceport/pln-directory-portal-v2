import { DirectoryMember, RecipientOption } from '../types';

import { getMemberMeta } from './getMemberMeta';

/** One member as a row in the "Send to" field. Shared with the modal so the recipients
 *  prefilled for the hiring team are the same shape as the ones picked by hand.
 *
 *  `omitTeam` drops the "· Protocol Labs" tail for members of the hiring team itself.
 *  The modal is scoped to one team and says so in its title, the menu groups them
 *  under a "PROTOCOL LABS TEAM" heading, and the selected rows sit under a caption
 *  naming the same team — so repeating it on every row spends the width the role
 *  needs on a word already on screen three times. Anyone found by searching the
 *  wider network keeps the team, where it is the fact that places them. */
export function toRecipientOption(member: DirectoryMember, options?: { omitTeam?: boolean }): RecipientOption {
  return {
    label: member.name,
    value: member.uid,
    description: options?.omitTeam ? member.title || undefined : getMemberMeta(member),
    image: member.image,
    isTeamLead: member.isTeamLead,
  };
}
