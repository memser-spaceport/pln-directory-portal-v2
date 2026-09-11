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
 * plus the slice of their profile the applicants page shows beside the list
 * (`experience`, `skills`, `location`), which in production is the member
 * record itself and is only duplicated here because the mock has no members
 * table to join.
 *
 * No pipeline stage. folk, Deel and Homerun draw Shortlisted / Rejected columns
 * because they are hiring tools with a workflow behind them; this team replies
 * by email (`{team} can reply to you directly`, the apply modal's own promise),
 * so the list is a record of who applied, not a board to move people across.
 * `email` is what that reply needs.
 *
 * `unseen` is the product's "new": not looked at since the team's last visit.
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
  unseen: boolean;
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
      unseen: true,
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
      unseen: true,
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
      unseen: false,
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
      unseen: true,
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
      unseen: false,
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
      unseen: false,
    },
  ],
};
