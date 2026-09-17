import type { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';

/* ---------------------------------------------------------------------------
   Applicants, per role — what the team sees under its own listings.
   --------------------------------------------------------------------------- */

/**
 * One application to one of this team's roles, as the team reads it.
 *
 * **Production has none of this.** Applying on the board produces an email to
 * the team (`job-board/email/applicationEmail.ts`) and nothing else; the team's
 * inbox is the only record. This is the smallest shape an in-product record
 * would need: who, what they said, when, and whether the team has looked yet —
 * plus their member record, which the applicants page renders beside the list
 * as the member page itself (`experience`, `skills`, `location`, `profile`).
 * In production that is a join to the members table, and is only carried
 * inline here because the mock has no members table to join.
 *
 * No pipeline stage. folk, Deel and Homerun draw Shortlisted / Rejected columns
 * because they are hiring tools with a workflow behind them; this team replies
 * by email (`{team} can reply to you directly`, the apply modal's own promise),
 * so the list is a record of who applied, not a board to move people across.
 * `email` is what that reply needs.
 *
 * `unseen` is the product's "new": not looked at since the team's last visit.
 * `reviewed` is the team's own tick — see the field.
 * The rows are keyed by the board's role uids (`MOCK_JOB_GROUPS`, `pl-*`), so a
 * role deleted from the section takes its applicants with it.
 */
export interface RoleApplicant {
  id: string;
  /** `/members/<id>` — the row opens their profile, as the Members rows do. */
  memberId: string;
  name: string;
  /** "Current role · their team", one line, as the refer picker's rows draw it. */
  role: string;
  /** The two halves of `role`, for the profile header beside the list. */
  title: string;
  team: string;
  location: string;
  email: string;
  avatar: string;
  /** ISO. Relative to `now`, like the roles themselves — see `MOCK_TEAM_ROLES`. */
  appliedAt: string;
  /** What they sent with the application. The row shows its first lines. */
  note: string;
  /** The CV that travelled with it, when one did. */
  cv?: { name: string; url: string; size: number };
  skills: string[];
  experience: FormattedMemberExperience[];
  /** The rest of what `/members/<id>` renders for them. */
  profile: ApplicantMemberRecord;
  unseen: boolean;
  /**
   * The team's own press — **Mark as reviewed** on the applicants page — not
   * a derived fact. It is the one stage the list carries: a founder working
   * through fifty people needs to know which ones they have already dealt
   * with, and "opened" (`unseen`) cannot say that, because stepping past a
   * row opens it too. Still no Shortlist / Reject (see above): reviewed is a
   * tick, not a column to move people across.
   */
  reviewed: boolean;
}

/**
 * The member-record fields production's profile sections read, in the shapes
 * they read them (`IMember`'s names), so the pane can hand them to the real
 * section components. Anything left out is left out the way a member leaves it
 * out: no `officeHours` hides Office Hours, as `OfficeHoursDetails` does for a
 * visitor; a missing handle draws the contact row's empty link.
 */
export interface ApplicantMemberRecord {
  bio?: string;
  openToWork?: boolean;
  teamLead?: boolean;
  linkedinHandle?: string;
  githubHandle?: string;
  twitter?: string;
  telegramHandle?: string;
  discordHandle?: string;
  blueskyHandle?: string;
  officeHours?: { interest: string[]; helpWith: string[]; pastBookings: number };
  teams: { id: string; name: string; role: string; mainTeam: boolean }[];
  contributions: { uid: string; project: string; role: string; start: string; end: string | null }[];
  repositories: { name: string; description: string }[];
}

const daysAgo = (days: number, hours = 0) =>
  new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();

const exp = (
  memberId: string,
  uid: string,
  title: string,
  company: string,
  start: string,
  end: string | null,
  location = 'Remote',
): FormattedMemberExperience => ({
  memberId,
  uid,
  title,
  company,
  startDate: `${start}-01T00:00:00.000Z`,
  endDate: end ? `${end}-01T00:00:00.000Z` : new Date().toISOString(),
  isCurrent: !end,
  location,
  isFlaggedByUser: false,
  description: '',
});

export const MOCK_APPLICANTS: Record<string, RoleApplicant[]> = {
  // Senior Distributed Systems Engineer — the role the board's own demo applies to.
  'pl-1': [
    {
      id: 'app-1',
      memberId: 'devon-park',
      name: 'Devon Park',
      role: 'Protocol Engineer · Lattice Compute',
      title: 'Protocol Engineer',
      team: 'Lattice Compute',
      location: 'Berlin, Germany',
      email: 'devon@lattice.compute',
      avatar: 'https://i.pravatar.cc/96?img=53',
      appliedAt: daysAgo(0, 5),
      note: 'I led the consensus rewrite at Lattice and have shipped two libp2p transports upstream. Most of the last two years has been on the storage-proof side, which is where I would want to start here, the retrieval market design in particular. Happy to walk through the Lattice work on a call.',
      cv: { name: 'devon-park-cv.pdf', url: '#', size: 184320 },
      skills: ['Distributed Systems', 'Go', 'libp2p', 'Consensus'],
      experience: [
        exp('devon-park', 'dp1', 'Protocol Engineer', 'Lattice Compute', '2023-03', null, 'Berlin, Germany'),
        exp('devon-park', 'dp2', 'Backend Engineer', 'Textile', '2020-06', '2023-02'),
        exp('devon-park', 'dp3', 'BSc, Computer Science', 'TU Berlin', '2016-10', '2020-05', 'Berlin, Germany'),
      ],
      profile: {
        bio: '<p>Protocol engineer working on consensus and networking for verifiable compute. I maintain two libp2p transports and spend most of my time on storage proofs and the retrieval side of the stack.</p>',
        openToWork: true,
        linkedinHandle: 'devonpark',
        githubHandle: 'devonpark',
        twitter: 'devonpark_',
        telegramHandle: 'devonpark',
        officeHours: {
          interest: ['libp2p transports', 'Consensus design'],
          helpWith: ['Go performance', 'Protocol reviews'],
          pastBookings: 7,
        },
        teams: [{ id: 'lattice-compute', name: 'Lattice Compute', role: 'Protocol Engineer', mainTeam: true }],
        contributions: [
          { uid: 'dpc1', project: 'libp2p', role: 'Transport maintainer', start: '2022-01', end: null },
          { uid: 'dpc2', project: 'Lattice Protocol', role: 'Core Contributor', start: '2023-03', end: null },
        ],
        repositories: [
          { name: 'go-libp2p-quic-lite', description: 'A trimmed QUIC transport for constrained libp2p nodes.' },
          { name: 'storage-proof-bench', description: 'Benchmarks for proof-of-replication on commodity disks.' },
        ],
      },
      unseen: true,
      reviewed: false,
    },
    {
      id: 'app-2',
      memberId: 'lina-suarez',
      name: 'Lina Suarez',
      role: 'Staff Engineer · Textile',
      title: 'Staff Engineer',
      team: 'Textile',
      location: 'Lisbon, Portugal',
      email: 'lina@textile.io',
      avatar: 'https://i.pravatar.cc/96?img=20',
      appliedAt: daysAgo(1, 3),
      note: 'Six years on distributed storage; I have been following the Filecoin retrieval work closely and wrote the Textile side of the Saturn integration. I would bring the operational side too. I ran the on-call rotation for a network of 400 nodes.',
      cv: { name: 'lina-suarez-resume.pdf', url: '#', size: 212992 },
      skills: ['Distributed Storage', 'Rust', 'Go', 'Site Reliability'],
      experience: [
        exp('lina-suarez', 'ls1', 'Staff Engineer', 'Textile', '2021-01', null, 'Lisbon, Portugal'),
        exp('lina-suarez', 'ls2', 'Senior Engineer', 'Storj', '2018-04', '2020-12'),
      ],
      profile: {
        bio: '<p>Staff engineer on distributed storage. I wrote the Textile side of the Saturn integration and ran on-call for a 400-node network, so I care as much about operating systems as building them.</p>',
        teamLead: true,
        linkedinHandle: 'linasuarez',
        githubHandle: 'lsuarez',
        blueskyHandle: 'lina.bsky.social',
        teams: [
          { id: 'textile', name: 'Textile', role: 'Staff Engineer', mainTeam: true },
          { id: 'saturn', name: 'Saturn', role: 'Contributor', mainTeam: false },
        ],
        contributions: [{ uid: 'lsc1', project: 'Saturn', role: 'Integration lead', start: '2022-06', end: '2024-02' }],
        repositories: [
          { name: 'textile-saturn', description: 'Textile bucket retrieval through the Saturn CDN.' },
          { name: 'node-runbooks', description: 'On-call runbooks for storage node fleets.' },
          { name: 'rs-car-stream', description: 'Streaming CAR file reader in Rust.' },
        ],
      },
      unseen: true,
      reviewed: false,
    },
    {
      id: 'app-3',
      memberId: 'steven-allen',
      name: 'Steven Allen',
      role: 'Systems Engineer',
      title: 'Systems Engineer',
      team: 'Independent',
      location: 'Seattle, WA',
      email: 'steven@allen.dev',
      avatar: 'https://i.pravatar.cc/96?img=8',
      appliedAt: daysAgo(6),
      note: 'Happy to talk through the Rust side of this, most of my recent work is there. I have contributed to go-ipfs and rust-fil-proofs in the past and know the codebase well enough to be useful from week one.',
      skills: ['Rust', 'Systems Programming', 'IPFS'],
      experience: [
        exp('steven-allen', 'sa1', 'Systems Engineer', 'Independent', '2022-09', null, 'Seattle, WA'),
        exp('steven-allen', 'sa2', 'Software Engineer', 'Protocol Labs', '2017-02', '2022-08'),
      ],
      profile: {
        // No bio and no office hours: the page drops both, as production does.
        linkedinHandle: 'stevenallen',
        githubHandle: 'Stebalien',
        teams: [],
        contributions: [
          { uid: 'sac1', project: 'go-ipfs', role: 'Maintainer', start: '2017-02', end: '2022-08' },
          { uid: 'sac2', project: 'rust-fil-proofs', role: 'Contributor', start: '2020-01', end: '2021-06' },
        ],
        repositories: [{ name: 'go-bitswap-lite', description: 'Minimal Bitswap client for embedded nodes.' }],
      },
      unseen: false,
      reviewed: true,
    },
  ],
  // Product Manager, Developer Tools
  'pl-2': [
    {
      id: 'app-4',
      memberId: 'maya-okonkwo',
      name: 'Maya Okonkwo',
      role: 'Product Lead · Fleek',
      title: 'Product Lead',
      team: 'Fleek',
      location: 'London, UK',
      email: 'maya@fleek.xyz',
      avatar: 'https://i.pravatar.cc/96?img=47',
      appliedAt: daysAgo(2, 8),
      note: 'I ran the CLI and SDK surface at Fleek for three years and would love to bring that here. The developer-tools roadmap you published in March reads like the one I would have written.',
      cv: { name: 'maya-okonkwo.pdf', url: '#', size: 156672 },
      skills: ['Product Management', 'Developer Experience', 'SDKs'],
      experience: [
        exp('maya-okonkwo', 'mo1', 'Product Lead', 'Fleek', '2022-05', null, 'London, UK'),
        exp('maya-okonkwo', 'mo2', 'Product Manager', 'Vercel', '2019-08', '2022-04'),
      ],
      profile: {
        bio: '<p>Product lead for developer tools. I ran the CLI and SDK surface at Fleek and the deploy experience at Vercel before that. Happiest when the first five minutes of a tool feel obvious.</p>',
        openToWork: true,
        linkedinHandle: 'mayaokonkwo',
        twitter: 'mayaok',
        telegramHandle: 'mayaok',
        officeHours: {
          interest: ['Developer experience', 'SDK design'],
          helpWith: ['Product roadmaps', 'Docs strategy'],
          pastBookings: 12,
        },
        teams: [{ id: 'fleek', name: 'Fleek', role: 'Product Lead', mainTeam: true }],
        contributions: [{ uid: 'moc1', project: 'Fleek CLI', role: 'Product Lead', start: '2022-05', end: null }],
        repositories: [],
      },
      unseen: true,
      reviewed: false,
    },
  ],
  // Protocol Researcher — nobody yet: the row shows no line at all.
  'pl-3': [],
  // Staff Security Engineer
  'pl-4': [
    {
      id: 'app-5',
      memberId: 'sarah-kim',
      name: 'Sarah Kim',
      role: 'Security Lead · Acme Capital',
      title: 'Security Lead',
      team: 'Acme Capital',
      location: 'New York, NY',
      email: 'sarah@acme.capital',
      avatar: 'https://i.pravatar.cc/96?img=44',
      appliedAt: daysAgo(9),
      note: 'Audited three of the ecosystem bridges; the threat model here is the one I know best. I am looking to move from audit work back into building the thing being audited.',
      cv: { name: 'sarah-kim-cv.pdf', url: '#', size: 198144 },
      skills: ['Security Engineering', 'Cryptography', 'Auditing'],
      experience: [
        exp('sarah-kim', 'sk1', 'Security Lead', 'Acme Capital', '2021-11', null, 'New York, NY'),
        exp('sarah-kim', 'sk2', 'Security Engineer', 'Trail of Bits', '2018-01', '2021-10'),
      ],
      profile: {
        bio: '<p>Security engineer. Audited three ecosystem bridges and a handful of wallet SDKs; before that, four years at Trail of Bits on smart-contract and cryptographic reviews.</p>',
        linkedinHandle: 'sarahkim',
        githubHandle: 'skim-sec',
        discordHandle: 'sarahk#2091',
        teams: [{ id: 'acme-capital', name: 'Acme Capital', role: 'Security Lead', mainTeam: true }],
        contributions: [],
        repositories: [
          { name: 'bridge-threat-models', description: 'Public threat models from three bridge audits.' },
          { name: 'fuzz-harnesses', description: 'Fuzzing harnesses for Solidity and Rust contracts.' },
        ],
      },
      unseen: false,
      reviewed: false,
    },
    {
      id: 'app-6',
      memberId: 'david-dias',
      name: 'David Dias',
      role: 'Research Engineer · libp2p',
      title: 'Research Engineer',
      team: 'libp2p',
      location: 'Porto, Portugal',
      email: 'david@libp2p.io',
      avatar: 'https://i.pravatar.cc/96?img=15',
      appliedAt: daysAgo(12),
      note: 'Moving from research into applied security work is the next step I want to take. The transport-security work in libp2p is the closest thing I have done to this role.',
      skills: ['Networking', 'libp2p', 'Research'],
      experience: [exp('david-dias', 'dd1', 'Research Engineer', 'libp2p', '2019-06', null, 'Porto, Portugal')],
      profile: {
        bio: '<p>Research engineer on libp2p, mostly transport security and peer routing. Moving towards applied security work.</p>',
        linkedinHandle: 'daviddias',
        githubHandle: 'daviddias',
        twitter: 'daviddias',
        officeHours: {
          interest: ['Transport security', 'Peer routing'],
          helpWith: ['libp2p onboarding'],
          pastBookings: 3,
        },
        teams: [{ id: 'libp2p', name: 'libp2p', role: 'Research Engineer', mainTeam: true }],
        contributions: [{ uid: 'ddc1', project: 'libp2p', role: 'Research Engineer', start: '2019-06', end: null }],
        repositories: [{ name: 'noise-spec-notes', description: 'Annotated notes on the libp2p Noise handshake.' }],
      },
      unseen: false,
      reviewed: false,
    },
  ],
};

/* ---------------------------------------------------------------------------
   Interested, per role — the board's "I'm interested" press, as the team reads it.
   --------------------------------------------------------------------------- */

/**
 * Someone who pressed **I'm interested** on one of this team's roles
 * (`InterestStrip` on the board) instead of applying. It is a bare press, so
 * there is no note to quote. What the team gets is the person, the time they
 * pressed, and the profile that went with it ("share your LabOS profile"),
 * plus a CV when the account keeps one. Same shape as an application
 * otherwise, so the page draws both with one row and one pane.
 */
export type RoleInterested = Omit<RoleApplicant, 'note' | 'appliedAt'> & {
  /** ISO — when they pressed I'm interested. */
  interestedAt: string;
};

export const MOCK_INTERESTED: Record<string, RoleInterested[]> = {
  'pl-1': [
    {
      id: 'int-1',
      memberId: 'amara-nwosu',
      name: 'Amara Nwosu',
      role: 'Backend Engineer · Chainsafe',
      title: 'Backend Engineer',
      team: 'Chainsafe',
      location: 'Lagos, Nigeria',
      email: 'amara@nwosu.dev',
      avatar: 'https://i.pravatar.cc/96?img=32',
      interestedAt: daysAgo(0, 2),
      cv: { name: 'amara-nwosu-cv.pdf', url: '#', size: 176128 },
      skills: ['Go', 'Distributed Systems', 'Kubernetes'],
      experience: [
        exp('amara-nwosu', 'an1', 'Backend Engineer', 'Chainsafe', '2022-02', null, 'Lagos, Nigeria'),
        exp('amara-nwosu', 'an2', 'Software Engineer', 'Paystack', '2019-07', '2022-01', 'Lagos, Nigeria'),
      ],
      profile: {
        bio: '<p>Backend engineer on validator infrastructure. Before that, payments systems at Paystack, where most of the job was making a distributed ledger boring.</p>',
        openToWork: true,
        linkedinHandle: 'amaranwosu',
        githubHandle: 'anwosu',
        teams: [],
        contributions: [],
        repositories: [{ name: 'lodestar-metrics', description: 'Prometheus exporters for Lodestar beacon nodes.' }],
      },
      unseen: true,
      reviewed: false,
    },
    {
      id: 'int-2',
      memberId: 'jonas-weber',
      name: 'Jonas Weber',
      role: 'Site Reliability Engineer',
      title: 'Site Reliability Engineer',
      team: 'Independent',
      location: 'Zurich, Switzerland',
      email: 'jonas@weber.sh',
      avatar: 'https://i.pravatar.cc/96?img=60',
      interestedAt: daysAgo(4),
      skills: ['Site Reliability', 'Rust', 'Observability'],
      experience: [exp('jonas-weber', 'jw1', 'Site Reliability Engineer', 'Independent', '2021-05', null, 'Zurich, Switzerland')],
      profile: {
        linkedinHandle: 'jonasweber',
        teams: [],
        contributions: [],
        repositories: [],
      },
      unseen: false,
      reviewed: false,
    },
  ],
  'pl-2': [
    {
      id: 'int-3',
      memberId: 'priya-raman',
      name: 'Priya Raman',
      role: 'Developer Advocate · Ceramic',
      title: 'Developer Advocate',
      team: 'Ceramic',
      location: 'Bangalore, India',
      email: 'priya@ceramic.network',
      avatar: 'https://i.pravatar.cc/96?img=45',
      interestedAt: daysAgo(1, 6),
      cv: { name: 'priya-raman-resume.pdf', url: '#', size: 143360 },
      skills: ['Developer Relations', 'Product', 'TypeScript'],
      experience: [
        exp('priya-raman', 'pr1', 'Developer Advocate', 'Ceramic', '2022-08', null, 'Bangalore, India'),
        exp('priya-raman', 'pr2', 'Solutions Engineer', 'Postman', '2019-03', '2022-07', 'Bangalore, India'),
      ],
      profile: {
        bio: '<p>Developer advocate moving towards product. I run Ceramic’s SDK feedback loop and wrote most of its getting-started docs.</p>',
        openToWork: true,
        linkedinHandle: 'priyaraman',
        twitter: 'priyaraman_',
        teams: [{ id: 'ceramic', name: 'Ceramic', role: 'Developer Advocate', mainTeam: true }],
        contributions: [],
        repositories: [],
      },
      unseen: true,
      reviewed: false,
    },
  ],
  'pl-3': [],
  'pl-4': [
    {
      id: 'int-4',
      memberId: 'tomas-ruiz',
      name: 'Tomás Ruiz',
      role: 'Security Researcher',
      title: 'Security Researcher',
      team: 'Independent',
      location: 'Madrid, Spain',
      email: 'tomas@ruiz.security',
      avatar: 'https://i.pravatar.cc/96?img=12',
      interestedAt: daysAgo(3, 4),
      skills: ['Cryptography', 'Auditing', 'Rust'],
      experience: [exp('tomas-ruiz', 'tr1', 'Security Researcher', 'Independent', '2020-01', null, 'Madrid, Spain')],
      profile: {
        githubHandle: 'truiz-sec',
        teams: [],
        contributions: [],
        repositories: [{ name: 'zk-audit-notes', description: 'Public notes from zero-knowledge circuit reviews.' }],
      },
      unseen: false,
      reviewed: false,
    },
  ],
};
