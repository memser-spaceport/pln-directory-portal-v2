// Mocked notification feed. Mirrors the shape of the production
// `PushNotification` (types/push-notifications.types.ts) but is a local,
// self-contained type — the prototype never touches the real service, the
// WebSocket provider, or react-query.

export type HubCategory =
  | 'DEMO_DAY_LIKE'
  | 'DEMO_DAY_CONNECT'
  | 'DEMO_DAY_ANNOUNCEMENT'
  | 'DEMO_DAY_INVEST'
  | 'EVENT'
  | 'IRL_GATHERING'
  | 'FORUM_POST'
  | 'FORUM_REPLY'
  | 'GUIDE_POST'
  | 'GUIDE_REPLY'
  | 'NEW_FEATURE'
  | 'GANTRY'
  | 'TEAM_NEWS'
  | 'SYSTEM';

export type HubNotification = {
  id: string;
  category: HubCategory;
  title: string;
  description?: string;
  /** Minutes ago — resolved to a real Date at render time so the prototype has no fixed clock. */
  minutesAgo: number;
  isRead: boolean;
  /** Some notifications genuinely have no destination — the row must not pretend otherwise. */
  link?: string;
  linkText?: string;
  metadata?: {
    viewCount?: number;
    voteCount?: number;
    postCount?: number;
  };
};

/**
 * Deliberately spans every category group, both read states, and a wide time
 * range so date grouping (Today / Yesterday / Earlier) has something to group.
 * Two entries have no `link` — that's the case production renders as a
 * clickable-looking dead row.
 */
export const MOCK_NOTIFICATIONS: HubNotification[] = [
  {
    id: 'n-01',
    category: 'FORUM_REPLY',
    title: 'Kelsey Chan replied to your post',
    description:
      '"Agreed — we hit the same wall with retrieval latency on the indexer. Happy to share the benchmark harness we ended up with."',
    minutesAgo: 8,
    isRead: false,
    link: '/forum',
    metadata: { viewCount: 214, voteCount: 12, postCount: 9 },
  },
  {
    id: 'n-02',
    category: 'DEMO_DAY_INVEST',
    title: 'Protocol Ventures marked interest in Beacon Labs',
    description: 'Your team appeared in 3 investor shortlists this week.',
    minutesAgo: 42,
    isRead: false,
    link: '/demoday',
  },
  {
    id: 'n-03',
    category: 'IRL_GATHERING',
    title: 'FIL Dev Summit — Lisbon is 2 weeks away',
    description: '38 members from the directory are attending, including 6 people you follow.',
    minutesAgo: 96,
    isRead: false,
    link: '/events/irl',
  },
  {
    id: 'n-04',
    category: 'TEAM_NEWS',
    title: 'Prime Intellect raised $18M',
    description: 'To train frontier models across decentralized compute, with verifiable checkpoints between stages.',
    minutesAgo: 240,
    isRead: false,
    // A notification about one story lands on that story, in the feed — not on
    // the teams directory, which is where these used to go. `?news=<uid>` is the
    // deep link production's /home already understands (`useNewsDeepLink`), so
    // this is the one hand-off that needs no new URL vocabulary.
    link: '/prototypes/newsfeed?news=x1',
  },
  {
    id: 'n-05',
    category: 'NEW_FEATURE',
    title: 'Saved views are here',
    description: 'Save any combination of filters on Members or Teams and jump back to it in one click.',
    minutesAgo: 300,
    isRead: true,
    link: '/changelog',
    linkText: 'See what changed',
  },
  // ── Yesterday ──────────────────────────────────────────────────────────────
  {
    id: 'n-06',
    category: 'GUIDE_REPLY',
    title: 'New answer on "How do you structure a seed round SAFE?"',
    description: 'Ana Belić added a detailed breakdown with three worked examples.',
    minutesAgo: 60 * 27,
    isRead: false,
    link: '/founder-guides',
    metadata: { viewCount: 87, voteCount: 21, postCount: 5 },
  },
  {
    id: 'n-07',
    category: 'DEMO_DAY_ANNOUNCEMENT',
    title: 'Demo Day applications close Friday',
    description: 'You have a draft application that has not been submitted yet.',
    minutesAgo: 60 * 31,
    isRead: false,
    link: '/demoday',
    linkText: 'Finish application',
  },
  {
    id: 'n-08',
    category: 'GANTRY',
    title: 'Your Gantry request moved to In Progress',
    description: '"Shared observability stack for storage providers" — picked up by the Infra guild.',
    minutesAgo: 60 * 34,
    isRead: true,
    link: '/gantry',
  },
  {
    id: 'n-09',
    category: 'SYSTEM',
    title: 'Your office hours link expires in 7 days',
    // No link — this is the case production renders as a dead row that still
    // looks clickable. Here it renders as plainly non-navigable.
    minutesAgo: 60 * 40,
    isRead: true,
  },
  // ── Earlier ────────────────────────────────────────────────────────────────
  {
    id: 'n-10',
    category: 'FORUM_POST',
    title: 'New post in Storage: "Retrieval markets, one year on"',
    description: 'A retrospective on what actually shipped versus the 2025 roadmap.',
    minutesAgo: 60 * 74,
    isRead: true,
    link: '/forum',
    metadata: { viewCount: 1203, voteCount: 64, postCount: 28 },
  },
  {
    id: 'n-11',
    category: 'DEMO_DAY_LIKE',
    title: '4 investors liked your Demo Day profile',
    minutesAgo: 60 * 96,
    isRead: true,
    link: '/demoday',
  },
  {
    id: 'n-12',
    category: 'EVENT',
    title: 'You were added to the LabWeek attendee list',
    description: 'Your profile is now visible to other attendees.',
    minutesAgo: 60 * 120,
    isRead: true,
    link: '/events',
  },
  {
    id: 'n-13',
    category: 'TEAM_NEWS',
    title: 'Exo shipped on-device model sharding',
    description: 'Consumer hardware can now run a slice of a larger model locally.',
    minutesAgo: 60 * 144,
    isRead: true,
    link: '/prototypes/newsfeed?news=x3',
  },
  {
    id: 'n-14',
    category: 'SYSTEM',
    title: 'Welcome to the Protocol Labs Directory',
    description: 'Updates from forum, Demo Day, events, and the teams you follow will show up here.',
    minutesAgo: 60 * 200,
    isRead: true,
  },
];
