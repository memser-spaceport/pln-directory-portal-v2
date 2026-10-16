/** Mock data only. No real people from the Directory. */

export const MOCK_MEMBER = {
  name: 'Sam Rivera',
  initials: 'SR',
  email: 'sam@example.com',
};

export const NAV_ITEMS = ['Directory', 'Events', 'Jobs', 'AI Apps'];

/** The menu of the header icon. "Give feedback" first (spike LAB-2880, option 4). */
export type MenuAction = 'feedback' | 'bug' | 'support';

export const MENU_ITEMS: { label: string; action: MenuAction }[] = [
  { label: 'Give feedback', action: 'feedback' },
  { label: 'Report a bug', action: 'bug' },
  { label: 'Contact support', action: 'support' },
  { label: 'Ask a question', action: 'support' },
  { label: 'Share an idea', action: 'support' },
];

/** The picker of the drawer on the AI Apps list page. "AI Apps" is the default (LAB-2885). */
export const APP_OPTIONS = ['AI Apps', 'Grant Finder', 'Meeting Notes', 'Team Matcher'];

export const MOCK_MEMBERS = [
  { name: 'Alex Moreno', role: 'Engineer', team: 'Filecoin Data Tools' },
  { name: 'Jordan Lee', role: 'Product lead', team: 'Bacalhau' },
  { name: 'Priya Nair', role: 'Researcher', team: 'CryptoNetLab' },
  { name: 'Chris Okafor', role: 'Designer', team: 'Fleek' },
  { name: 'Mia Tanaka', role: 'Founder', team: 'Lighthouse' },
  { name: 'Leo Fischer', role: 'Engineer', team: 'IPFS Shipyard' },
];

export const MOCK_APPS = [
  { name: 'Grant Finder', text: 'Find open grants that match your team.' },
  { name: 'Meeting Notes', text: 'Turn a call recording into short notes.' },
  { name: 'Team Matcher', text: 'Find teams that work on the same problem.' },
  { name: 'Event Planner', text: 'Plan a side event at the next IRL gathering.' },
];

/** How long the "Give feedback" label shows on a full page load (INTRO_MS of the AI Apps button). */
export const LABEL_MS = 2200;
