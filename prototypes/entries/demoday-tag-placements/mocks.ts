// Mock IRL "Contributions" (Events block) — role-grouped like production
// TeamIrlContributions (Host / Sponsor), name + "MMM yyyy" date.
export interface EventItem {
  uid: string;
  name: string;
  date: string;
  /** Upcoming events get production's blue→teal "active" gradient chip. */
  upcoming?: boolean;
}

export interface EventRoleGroup {
  /** 'host_icon' | 'sponsor_icon' → /icons/<icon>.svg, matching production. */
  icon: 'host_icon' | 'sponsor_icon';
  role: string;
  events: EventItem[];
}

export const MOCK_EVENT_GROUPS: EventRoleGroup[] = [
  {
    icon: 'host_icon',
    role: 'Host',
    events: [
      { uid: 'e1', name: 'IPFS Camp', date: 'Jun 2025' },
      { uid: 'e2', name: 'libp2p Day', date: 'Mar 2025' },
    ],
  },
  {
    icon: 'sponsor_icon',
    role: 'Sponsor',
    events: [
      { uid: 'e3', name: 'FIL Dev Summit', date: 'Nov 2024' },
      { uid: 'e4', name: 'ETHDenver', date: 'Feb 2024' },
    ],
  },
];

// Demo Day, expressed as one more contribution: the team's role is "Participant"
// (it presented), the "event" is the Demo Day itself, dated + labelled by cohort.
export interface DemoDayContribution {
  title: string; // e.g. "Demo Day F25"
  slug: string; // deep-links to /demoday/[slug]
  role: string; // the team's role in it — "Participant"
  date: string; // "MMM yyyy", same format as event chips
  cohort: string; // human cohort label, e.g. "Fall 2025 cohort"
}

export const MOCK_DEMO_DAY_CONTRIB: DemoDayContribution = {
  title: 'Demo Day F25',
  slug: 'pl-demo-day-f25',
  role: 'Participant',
  date: 'Oct 2025',
  cohort: 'Fall 2025 cohort',
};
