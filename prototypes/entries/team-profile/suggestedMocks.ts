import { exp, type RoleCandidate } from './candidateMocks';

/* ---------------------------------------------------------------------------
   Suggested, per role — members the product proposes, as the team reads them.
   --------------------------------------------------------------------------- */

/**
 * **A match is a count, not a guess.** Every suggestion carries a percentage
 * that is exactly the share of *this role's requirements* the member's profile
 * meets — "4 of 5" is 80% — and the pane lists the requirements with a tick or
 * a fade beside each, so the number can be checked against its own working.
 * Workable draws it that way ("How Cindy matches this job": a score ring over a
 * ✓/✗ checklist) and lets the team choose which criteria count ("Manage
 * matching criteria"), which is the part that makes a number defensible: the
 * team, not the product, decided what a fit is. User Interviews' "100% match"
 * is the same idea over screener answers. Wrangle's is the failure mode — a
 * weighted score nobody can inspect, and every card in its own screenshots
 * reads 100%.
 *
 * **Requirements are posting facts and nothing else** — skills the posting
 * names, its seniority, its working hours. Anything the *network* knows is a
 * `reason`, below, and is never folded into the percentage: there is no honest
 * weight for "worked with three of your people", and a number that quietly
 * blends the two can't be checked at all.
 */
export type CriterionGroup = 'Skills' | 'Seniority' | 'Location';

export const CRITERION_GROUPS: CriterionGroup[] = ['Skills', 'Seniority', 'Location'];

export interface RoleCriterion {
  id: string;
  group: CriterionGroup;
  label: string;
}

/**
 * Nobody under this is suggested, so "low match" is never a state the team
 * sees. Employment Hero and Wrangle both draw a Low band; on a list of tens of
 * members that band is only ever a person the product should not have offered.
 */
export const MATCH_FLOOR = 60;

/**
 * What only this network knows about a member, one plain sentence off a fact
 * their profile already holds. Strongest first:
 *
 *   interest      raised a hand at this team before (another of its roles)
 *   contribution  worked on a project the role touches
 *   vouch         has worked with people on the hiring team
 *
 * These are the row's third line and the pane's first block. They are *not*
 * part of the percentage (see above) — they are why a lower-percentage member
 * can still be worth opening.
 */
export type SuggestionReasonKind = 'interest' | 'contribution' | 'vouch';

export const SUGGESTION_REASON_RANK: Record<SuggestionReasonKind, number> = {
  interest: 0,
  contribution: 1,
  vouch: 2,
};

export interface SuggestionReason {
  kind: SuggestionReasonKind;
  text: string;
}

/**
 * A member suggested for one of the team's roles. They have done nothing —
 * that is the difference from the other two lists — so there is no date, no
 * note, no CV, no "new" and nothing to review. What the record adds is `met`
 * (which of the role's criteria their profile satisfies) and `reasons`.
 *
 * **Everyone here opted in.** Job search status is "Only visible to you", and
 * suggesting someone *because* they are looking would break that promise. A
 * member is eligible only once they tick "Let hiring teams in the network find
 * me" under that field; nothing here mentions the status itself, only public
 * profile facts. And the match is shown to the hiring team only, never to the
 * member — a percentage about you that you cannot see is the team's working,
 * and one you can see is a grade.
 */
export type RoleSuggested = Omit<RoleCandidate, 'note' | 'appliedAt' | 'cv' | 'unseen' | 'reviewed'> & {
  /** Ids of the role's criteria this profile meets. */
  met: string[];
  /** Network signals, strongest first — see `SuggestionReasonKind`. */
  reasons: SuggestionReason[];
};

export interface SuggestionMatch {
  /** Whole percent — `met / total`, rounded. */
  percent: number;
  met: number;
  total: number;
}

/** The match against whichever criteria are switched on (`off` = switched off). */
export const suggestionMatch = (
  person: RoleSuggested,
  criteria: RoleCriterion[],
  off?: ReadonlySet<string>,
): SuggestionMatch => {
  const on = criteria.filter((c) => !off?.has(c.id));
  const met = on.filter((c) => person.met.includes(c.id)).length;
  return { percent: on.length ? Math.round((met / on.length) * 100) : 0, met, total: on.length };
};

/** Only members at or above the floor, against the criteria that are on. */
export const visibleSuggested = (
  people: RoleSuggested[],
  criteria: RoleCriterion[],
  off?: ReadonlySet<string>,
): RoleSuggested[] => people.filter((p) => suggestionMatch(p, criteria, off).percent >= MATCH_FLOOR);

/**
 * One spine, sorted by the number the row shows: a displayed percentage that
 * is not the sort key reads as a bug (71% above 94% looks broken). Ties go to
 * whoever has the stronger network signal, then by name so the order is stable.
 */
export const sortSuggested = (
  people: RoleSuggested[],
  criteria: RoleCriterion[],
  off?: ReadonlySet<string>,
): RoleSuggested[] => {
  const network = (p: RoleSuggested) => Math.min(...p.reasons.map((r) => SUGGESTION_REASON_RANK[r.kind]), 99);
  return [...people].sort(
    (a, b) =>
      suggestionMatch(b, criteria, off).percent - suggestionMatch(a, criteria, off).percent ||
      network(a) - network(b) ||
      a.name.localeCompare(b.name),
  );
};

/** The requirements each role is matched against, keyed like the roles. */
export const MOCK_ROLE_CRITERIA: Record<string, RoleCriterion[]> = {
  // Senior Distributed Systems Engineer
  'pl-1': [
    { id: 'ds', group: 'Skills', label: 'Distributed systems' },
    { id: 'rg', group: 'Skills', label: 'Rust or Go' },
    { id: 'sn', group: 'Skills', label: 'Storage or networking background' },
    { id: 'sr', group: 'Seniority', label: 'Senior or above' },
    { id: 'tz', group: 'Location', label: 'Americas or Europe working hours' },
  ],
  // Protocol Researcher
  'pl-3': [
    { id: 'cr', group: 'Skills', label: 'Cryptography or consensus research' },
    { id: 'fv', group: 'Skills', label: 'Formal verification' },
    { id: 'pub', group: 'Skills', label: 'Published research' },
    { id: 'pr', group: 'Seniority', label: 'Principal or above' },
    { id: 'tz', group: 'Location', label: 'Americas or Europe working hours' },
  ],
};

export const MOCK_SUGGESTED: Record<string, RoleSuggested[]> = {
  // Senior Distributed Systems Engineer
  'pl-1': [
    {
      id: 'sug-1',
      memberId: 'ines-carvalho',
      name: 'Inês Carvalho',
      role: 'Senior Engineer · Saturn',
      title: 'Senior Engineer',
      team: 'Saturn',
      location: 'Porto, Portugal',
      email: 'ines@saturn.tech',
      avatar: 'https://i.pravatar.cc/96?img=36',
      skills: ['Distributed Systems', 'Rust', 'Content Routing', 'Go'],
      experience: [
        exp('ines-carvalho', 'ic1', 'Senior Engineer', 'Saturn', '2022-04', null, 'Porto, Portugal'),
        exp('ines-carvalho', 'ic2', 'Software Engineer', 'Cloudflare', '2018-09', '2022-03', 'Lisbon, Portugal'),
      ],
      profile: {
        bio: '<p>Senior engineer on Saturn’s retrieval path. Four years on Cloudflare’s edge cache before that, which is most of what I know about making a distributed system boring to operate.</p>',
        linkedinHandle: 'inescarvalho',
        githubHandle: 'icarvalho',
        officeHours: {
          interest: ['Retrieval markets', 'Content routing'],
          helpWith: ['Rust async', 'Cache design'],
          pastBookings: 5,
        },
        teams: [{ id: 'saturn', name: 'Saturn', role: 'Senior Engineer', mainTeam: true }],
        contributions: [
          { uid: 'icc1', project: 'Saturn', role: 'Core Contributor', start: '2022-04', end: null },
          { uid: 'icc2', project: 'IPFS', role: 'Contributor', start: '2021-02', end: null },
        ],
        repositories: [{ name: 'saturn-l1-cache', description: 'The L1 node cache layer for Saturn retrievals.' }],
      },
      met: ['ds', 'rg', 'sn', 'sr', 'tz'],
      reasons: [
        { kind: 'interest', text: 'Pressed I’m interested on your Protocol Researcher role' },
        { kind: 'contribution', text: 'Core contributor to Saturn, contributor to IPFS' },
      ],
    },
    {
      id: 'sug-2',
      memberId: 'kofi-mensah',
      name: 'Kofi Mensah',
      role: 'Infrastructure Engineer · Filebase',
      title: 'Infrastructure Engineer',
      team: 'Filebase',
      location: 'Toronto, Canada',
      email: 'kofi@filebase.com',
      avatar: 'https://i.pravatar.cc/96?img=51',
      skills: ['Go', 'Distributed Storage', 'Kubernetes'],
      experience: [
        exp('kofi-mensah', 'km1', 'Infrastructure Engineer', 'Filebase', '2021-08', null, 'Toronto, Canada'),
        exp('kofi-mensah', 'km2', 'Software Engineer', 'Protocol Labs', '2019-01', '2021-07'),
      ],
      profile: {
        bio: '<p>Infrastructure engineer on an S3-compatible gateway over Filecoin and IPFS. Earlier, two and a half years on the Lotus team.</p>',
        linkedinHandle: 'kofimensah',
        githubHandle: 'kmensah',
        teams: [{ id: 'filebase', name: 'Filebase', role: 'Infrastructure Engineer', mainTeam: true }],
        contributions: [{ uid: 'kmc1', project: 'Lotus', role: 'Contributor', start: '2019-01', end: '2021-07' }],
        repositories: [],
      },
      // Not "Senior or above": the title on his profile is Infrastructure Engineer.
      met: ['ds', 'rg', 'sn', 'tz'],
      reasons: [
        { kind: 'contribution', text: 'Contributed to Lotus for two and a half years' },
        { kind: 'vouch', text: 'Worked with 3 people on your team at Protocol Labs' },
      ],
    },
    {
      id: 'sug-3',
      memberId: 'yuki-tanabe',
      name: 'Yuki Tanabe',
      role: 'Backend Engineer · Fission',
      title: 'Backend Engineer',
      team: 'Fission',
      location: 'Vancouver, Canada',
      email: 'yuki@fission.codes',
      avatar: 'https://i.pravatar.cc/96?img=26',
      skills: ['Rust', 'Distributed Systems', 'WebAssembly'],
      experience: [exp('yuki-tanabe', 'yt1', 'Backend Engineer', 'Fission', '2020-11', null, 'Vancouver, Canada')],
      profile: {
        githubHandle: 'ytanabe',
        teams: [{ id: 'fission', name: 'Fission', role: 'Backend Engineer', mainTeam: true }],
        contributions: [],
        repositories: [{ name: 'rs-ucan-store', description: 'A content-addressed UCAN store in Rust.' }],
      },
      // Exactly at the floor, and no network signal: the row's third line is the count.
      met: ['ds', 'rg', 'tz'],
      reasons: [],
    },
    {
      // Under the floor with every requirement on (2 of 5 = 40%), so hidden.
      // Switch off "Rust or Go" and "Senior or above" in Edit criteria and he
      // is 2 of 3 and appears — the demo of what the criteria control does.
      id: 'sug-6',
      memberId: 'mateo-silva',
      name: 'Mateo Silva',
      role: 'Platform Engineer · Ceramic',
      title: 'Platform Engineer',
      team: 'Ceramic',
      location: 'Mexico City, Mexico',
      email: 'mateo@ceramic.network',
      avatar: 'https://i.pravatar.cc/96?img=59',
      skills: ['TypeScript', 'Kubernetes', 'Distributed Systems'],
      experience: [exp('mateo-silva', 'ms1', 'Platform Engineer', 'Ceramic', '2022-03', null, 'Mexico City, Mexico')],
      profile: {
        githubHandle: 'msilva',
        teams: [{ id: 'ceramic', name: 'Ceramic', role: 'Platform Engineer', mainTeam: true }],
        contributions: [],
        repositories: [],
      },
      met: ['ds', 'tz'],
      reasons: [],
    },
  ],
  // Protocol Researcher — nobody applied, which is when suggestions matter most.
  'pl-3': [
    {
      id: 'sug-4',
      memberId: 'elif-demir',
      name: 'Elif Demir',
      role: 'Research Scientist · CryptoNet',
      title: 'Research Scientist',
      team: 'CryptoNet',
      location: 'Istanbul, Türkiye',
      email: 'elif@cryptonet.org',
      avatar: 'https://i.pravatar.cc/96?img=41',
      skills: ['Cryptography', 'Mechanism Design', 'Formal Verification'],
      experience: [
        exp('elif-demir', 'ed1', 'Research Scientist', 'CryptoNet', '2021-09', null, 'Istanbul, Türkiye'),
        exp('elif-demir', 'ed2', 'PhD, Cryptography', 'ETH Zürich', '2016-09', '2021-08', 'Zürich, Switzerland'),
      ],
      profile: {
        bio: '<p>Research scientist working on proofs of space and the incentive design around them.</p>',
        linkedinHandle: 'elifdemir',
        teams: [{ id: 'cryptonet', name: 'CryptoNet', role: 'Research Scientist', mainTeam: true }],
        contributions: [
          { uid: 'edc1', project: 'Filecoin', role: 'Research contributor', start: '2021-09', end: null },
        ],
        repositories: [],
      },
      met: ['cr', 'fv', 'pub', 'tz'],
      reasons: [{ kind: 'contribution', text: 'Research contributor to Filecoin since 2021' }],
    },
    {
      id: 'sug-5',
      memberId: 'rafael-ortiz',
      name: 'Rafael Ortiz',
      role: 'Protocol Researcher',
      title: 'Protocol Researcher',
      team: 'Independent',
      location: 'Buenos Aires, Argentina',
      email: 'rafael@ortiz.research',
      avatar: 'https://i.pravatar.cc/96?img=14',
      skills: ['Consensus', 'Formal Verification', 'TLA+'],
      experience: [
        exp('rafael-ortiz', 'ro1', 'Protocol Researcher', 'Independent', '2023-02', null, 'Buenos Aires, Argentina'),
      ],
      profile: {
        githubHandle: 'rortiz',
        teams: [],
        contributions: [],
        repositories: [{ name: 'tla-consensus-specs', description: 'TLA+ specifications of three BFT protocols.' }],
      },
      met: ['cr', 'fv', 'tz'],
      reasons: [],
    },
  ],
};
