// MOCK: delete at cutover (LAB-2580) — this entire file is the stand-in backend
// for a team's applicants. The real endpoints do not exist yet; every export
// here is consumed only by the fetcher bodies in `team-applicants.service.ts`,
// so cutover is: delete this file, replace those bodies with real transport.

import {
  ApplicantCount,
  applicantCountsResponseSchema,
  ApplicantKind,
  ApplicantReviewedResult,
  applicantReviewedResponseSchema,
  ApplicantSeenResult,
  applicantSeenResponseSchema,
  roleApplicantsResponseSchema,
  TeamApplicant,
} from '@/schema/team-applicants';
import { fetchJobsList } from '@/services/jobs/jobs.service';

/**
 * People are **synthesised from the real role uid**, not read from a fixture
 * keyed by invented ones.
 *
 * A fixed fixture is the obvious way to mock this and it is the wrong one here:
 * its keys would be uids no environment actually has, so a lead turning the
 * flag on would open the page and find their own roles empty — the feature
 * looking broken is worse than the feature being off. Hashing the role's real
 * uid gives every role a stable, plausible cast that survives a reload and
 * differs between roles, which is what makes the screen worth looking at.
 *
 * Deliberately NOT imported from `prototypes/entries/team-profile/applicantMocks.ts`,
 * even though that file has richer people. Four production modules already
 * import from `prototypes/`, and it costs: those modules reach `next/server`,
 * which throws `Request is not defined` under jsdom, which is why every
 * apply-flow suite has to stub the component that does it. This is a fifth
 * entry nobody needs.
 *
 * Everything below is parsed through the real schemas before it is returned, so
 * the mock cannot drift from the contract it is standing in for.
 */

/** djb2. Stable across reloads, which is the only property asked of it. */
function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

interface MockPerson {
  name: string;
  headline: string;
  company: string;
  location: string;
  tags: string[];
  note: string;
}

const PEOPLE: MockPerson[] = [
  {
    name: 'Devon Park',
    headline: 'Protocol Engineer',
    company: 'Lattice Compute',
    location: 'Berlin, Germany',
    tags: ['Distributed Systems', 'Go', 'libp2p', 'Consensus'],
    note: 'I led the consensus rewrite at Lattice and have shipped two libp2p transports upstream. Most of the last two years has been on the storage-proof side, which is where I would want to start here, the retrieval market design in particular. Happy to walk through the Lattice work on a call.',
  },
  {
    name: 'Lina Suarez',
    headline: 'Staff Engineer',
    company: 'Textile',
    location: 'Lisbon, Portugal',
    tags: ['Distributed Storage', 'Rust', 'Go', 'Site Reliability'],
    note: 'Six years on distributed storage; I have been following the retrieval work closely and wrote the Textile side of the Saturn integration. I would bring the operational side too: I ran the on-call rotation for a network of 400 nodes.',
  },
  {
    name: 'Steven Allen',
    headline: 'Systems Engineer',
    company: 'Independent',
    location: 'Vancouver, Canada',
    tags: ['Go', 'IPFS', 'Networking'],
    note: 'Long-time contributor to the IPFS stack. I am looking for something with more protocol design in it than my current work has.',
  },
  {
    name: 'Maya Okonjo',
    headline: 'Developer Experience Lead',
    company: 'Fleek',
    location: 'Lagos, Nigeria',
    tags: ['Developer Experience', 'SDK Design', 'TypeScript'],
    note: 'I have spent three years making other people’s protocols usable — SDKs, docs, the first-run experience. The gap between a good protocol and an adopted one is most of my job.',
  },
  {
    name: 'Tomas Vrba',
    headline: 'Backend Engineer',
    company: 'Storj',
    location: 'Prague, Czechia',
    tags: ['Rust', 'Erasure Coding', 'Storage'],
    note: 'Worked on the repair pipeline at Storj. I would like to be closer to the incentive design than I am now.',
  },
  {
    name: 'Priya Raghavan',
    headline: 'Security Engineer',
    company: 'Least Authority',
    location: 'Remote',
    tags: ['Cryptography', 'Audits', 'Zero Knowledge'],
    note: 'I audit protocols for a living and would rather build one. Most of my recent work has been proof systems.',
  },
  {
    name: 'Jonas Weiss',
    headline: 'Infrastructure Engineer',
    company: 'Protocol Labs',
    location: 'Zurich, Switzerland',
    tags: ['Kubernetes', 'Observability', 'Go'],
    note: 'Internal move — I have been running the build infrastructure and want to work on the product side.',
  },
  {
    name: 'Amara Diallo',
    headline: 'Research Engineer',
    company: 'Consensys',
    location: 'Paris, France',
    tags: ['Consensus', 'Formal Methods', 'Rust'],
    note: 'My background is formal verification of consensus protocols. I am interested in the retrieval market work specifically.',
  },
];

const HOUR = 60 * 60 * 1000;
const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

/**
 * Reviewed and seen, in memory on purpose.
 *
 * Refresh-survival would only make the mock *look* like the server persistence
 * a lead actually expects — which the real endpoints provide at cutover and a
 * mock cannot honestly fake. `seen` in particular is per-viewer server-side;
 * a `sessionStorage` copy would be per-browser, which is a different promise.
 */
const reviewedUids = new Set<string>();
const seenUids = new Set<string>();

const rowUid = (kind: ApplicantKind, roleUid: string, index: number) => `mock-${kind}-${roleUid}-${index}`;

/**
 * How many people a role gets. Deterministic, and **zero is common on purpose**
 * — roughly a third of roles have nobody, so the empty states and the
 * "no line at all on the profile" rule are reachable without editing the mock.
 */
function castSizes(roleUid: string): { applications: number; interests: number } {
  const h = hash(roleUid);
  return {
    applications: [0, 1, 2, 3, 3, 4][h % 6],
    interests: [0, 0, 1, 2, 2][(h >>> 3) % 5],
  };
}

function buildRow(kind: ApplicantKind, roleUid: string, index: number): TeamApplicant {
  const h = hash(`${kind}:${roleUid}:${index}`);
  const person = PEOPLE[h % PEOPLE.length];
  const uid = rowUid(kind, roleUid, index);
  const isApplication = kind === 'application';

  return {
    uid,
    kind,
    /* A real member uid would let the pane fetch a real profile, which is the
       one thing this mock cannot invent. It is a mock uid, so the pane shows
       its own not-found state — see the service's cutover note. */
    memberUid: `mock-member-${h % 997}`,
    name: person.name,
    email: `${person.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    profileUrl: `https://directory.plnetwork.io/members/mock-member-${h % 997}`,
    /* A deterministic stand-in face. `null` on every third person, so the row's
       initials fallback is reachable without editing the mock. */
    avatarUrl: h % 3 === 0 ? null : `https://i.pravatar.cc/96?img=${(h % 70) + 1}`,
    headline: person.headline,
    currentCompany: person.company,
    location: person.location,
    tags: person.tags,
    createdAt: hoursAgo((h % 240) + index),
    coverLetter: isApplication ? person.note : null,
    cv: isApplication && h % 3 !== 0 ? { fileName: 'cv.pdf', size: 184320, uploadedAt: hoursAgo(h % 240) } : null,
    unseen: !seenUids.has(uid),
    reviewed: reviewedUids.has(uid),
  };
}

const newest = (rows: TeamApplicant[]) => [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const mockLatency = () => new Promise<void>((resolve) => setTimeout(resolve, 250));

function castFor(roleUid: string): { applications: TeamApplicant[]; interests: TeamApplicant[] } {
  const sizes = castSizes(roleUid);
  return {
    applications: newest(Array.from({ length: sizes.applications }, (_, i) => buildRow('application', roleUid, i))),
    interests: newest(Array.from({ length: sizes.interests }, (_, i) => buildRow('interest', roleUid, i))),
  };
}

/**
 * The team's real open roles, so the counts line up with the postings the
 * profile is actually showing.
 *
 * The real endpoint derives these server-side from the team's postings and
 * takes no such detour; this one has to ask, because a mock that invented role
 * uids would put counts on roles the page does not render. Degrades to no
 * counts rather than throwing — a jobs-API blip must not take the count line
 * (or the page that reads it) down with it.
 */
async function teamRoleUids(teamUid: string): Promise<string[]> {
  try {
    const data = await fetchJobsList(new URLSearchParams({ teamUid, limit: '1' }));
    const group = data.groups?.[0];
    /* The same guard `selectTeamOpenRoles` makes, for the same reason:
       `JobsListQueryParams` is a non-strict Zod object, so an API build that
       predates `teamUid` ignores it silently and answers with another team's
       group. */
    if (!group || group.team.uid !== teamUid) return [];
    return (group.roles ?? []).map((role) => role.uid);
  } catch {
    return [];
  }
}

export async function mockFetchApplicantCounts(teamUid: string): Promise<ApplicantCount[]> {
  await mockLatency();
  const roleUids = await teamRoleUids(teamUid);

  const counts = roleUids
    .map((roleUid) => {
      const { applications, interests } = castFor(roleUid);
      const everyone = newest([...applications, ...interests]);
      return {
        roleUid,
        applicantCount: applications.length,
        interestCount: interests.length,
        newCount: everyone.filter((row) => row.unseen).length,
        newestAvatars: everyone
          .map((row) => row.avatarUrl)
          .filter((url): url is string => !!url)
          .slice(0, 3),
      };
    })
    /* A role with nobody is absent, not a zero row — the contract says the list
       is complete, so the page reads absence as "nobody" and draws no line. */
    .filter((count) => count.applicantCount > 0 || count.interestCount > 0);

  return applicantCountsResponseSchema.parse({ counts }).counts;
}

export async function mockFetchRoleApplicants(
  _teamUid: string,
  roleUid: string,
): Promise<{ applications: TeamApplicant[]; interests: TeamApplicant[] }> {
  await mockLatency();
  const cast = castFor(roleUid);

  /* Parsed through the wire schema — which has no `kind`, because the envelope
     carries it — then re-tagged the way the real service will. That keeps the
     mock honest about what the server may send. */
  const parsed = roleApplicantsResponseSchema.parse({
    applications: cast.applications.map(({ kind, ...row }) => row),
    interests: cast.interests.map(({ kind, ...row }) => row),
  });

  return {
    applications: parsed.applications.map((row) => ({ ...row, kind: 'application' as const })),
    interests: parsed.interests.map((row) => ({ ...row, kind: 'interest' as const })),
  };
}

export async function mockSetApplicantReviewed(
  _kind: ApplicantKind,
  uid: string,
  reviewed: boolean,
): Promise<ApplicantReviewedResult> {
  await mockLatency();
  if (reviewed) reviewedUids.add(uid);
  else reviewedUids.delete(uid);

  return applicantReviewedResponseSchema.parse({ uid, reviewed: reviewedUids.has(uid) });
}

export async function mockMarkApplicantSeen(_kind: ApplicantKind, uid: string): Promise<ApplicantSeenResult> {
  seenUids.add(uid);
  return applicantSeenResponseSchema.parse({ uid, seenAt: new Date().toISOString() });
}
