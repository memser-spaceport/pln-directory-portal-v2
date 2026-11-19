/**
 * profile-agent-actions mocks: what the agent needs to act on a profile that the
 * profile entries' own mocks don't carry. The member and the team are
 * member-profile's Maya Okonkwo and team-profile's Protocol Labs, unchanged.
 */

import { MOCK_MEMBER } from '../member-profile/mocks';

export const MEMBER = {
  name: MOCK_MEMBER.name,
  firstName: MOCK_MEMBER.name.split(' ')[0],
  bookingUrl: MOCK_MEMBER.officeHours as string,
  /** Read off the booking link's slug (cal.com/<user>/15min), as member-profile's card explains. */
  sessionLength: '15 min',
  helpWith: MOCK_MEMBER.ohHelpWith as string[],
};

export const TEAM = {
  name: 'Protocol Labs',
  uid: 'protocol-labs',
};

/** People on the team who have office hours: who "Book office hours" on a team page can mean. */
export const TEAM_OFFICE_HOURS: { name: string; role: string; helpWith: string }[] = [
  { name: 'Molly Mackinlay', role: 'Project Lead, IPFS', helpWith: 'IPFS adoption, open-source roadmaps' },
  { name: 'David Dias', role: 'Research Engineer, libp2p', helpWith: 'Networking, libp2p, research collaborations' },
];

/** Open slots the agent "found" on a booking link: the next three weekdays at fixed times. */
export function nextSlots(now: Date): string[] {
  const times = ['10:00', '14:30', '16:00'];
  const days: Date[] = [];
  const d = new Date(now);
  while (days.length < 3) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
  }
  return days.map(
    (day, i) => `${day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}, ${times[i]}`,
  );
}
