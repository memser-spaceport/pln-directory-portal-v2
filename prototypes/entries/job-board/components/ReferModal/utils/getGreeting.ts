import { isEmailAddress } from './isEmailAddress';

import { RecipientOption } from '../types';

export function getGreeting(recipients: RecipientOption[], teamName: string): string {
  const people = recipients.filter((r) => !isEmailAddress(r.value));
  // One named person gets a first-name greeting; anything else (several people,
  // an external address, nobody yet) is addressed to the team.
  if (recipients.length === 1 && people.length === 1) {
    return `Hi ${people[0].label.split(' ')[0]},`;
  }
  return `Hi ${teamName} team,`;
}
