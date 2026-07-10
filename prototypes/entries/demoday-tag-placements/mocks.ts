// Mock IRL "Contributions" (Events block) — role-grouped like production
// TeamIrlContributions (Host / Sponsor), name + "MMM yyyy" date.
export interface EventItem {
  uid: string;
  name: string;
  date: string;
}

export interface EventRoleGroup {
  role: string;
  events: EventItem[];
}

export const MOCK_EVENT_GROUPS: EventRoleGroup[] = [
  {
    role: 'Host',
    events: [
      { uid: 'e1', name: 'IPFS Camp', date: 'Jun 2025' },
      { uid: 'e2', name: 'libp2p Day', date: 'Mar 2025' },
    ],
  },
  {
    role: 'Sponsor',
    events: [
      { uid: 'e3', name: 'FIL Dev Summit', date: 'Nov 2024' },
      { uid: 'e4', name: 'ETHDenver', date: 'Feb 2024' },
    ],
  },
];
