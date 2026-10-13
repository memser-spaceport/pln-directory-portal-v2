import { exp, type RoleCandidate } from './candidateMocks';

/* ---------------------------------------------------------------------------
   Suggested, per role — members the product proposes, as the team reads them.
   --------------------------------------------------------------------------- */

/**
 * **A match is a count, not a guess.** Every suggestion is measured as the
 * share of *this role's requirements* the member's profile meets — "4 of 5" —
 * and the pane lists the requirements with a tick or a fade beside each, so
 * the claim can be checked against its own working. Workable draws it that way
 * ("How Cindy matches this job": a score over a ✓/✗ checklist) and lets the
 * team choose which criteria count ("Manage matching criteria"), which is the
 * part that makes a match defensible: the team, not the product, decided what
 * a fit is. Wrangle's is the failure mode — a weighted score nobody can
 * inspect, and every card in its own screenshots reads 100%.
 *
 * **Shown as a band, not a percentage.** The page said "80%" and "100%" and
 * was corrected to *Strong match* / *Good match* (2026-09-23). A percentage
 * over a five-item checklist has the precision of a grade and the information
 * of a coin: 80 and 100 are one requirement apart, and 60 is the floor, so
 * every value the list can show is one of four. A founder scanning the list
 * is deciding whether to open a profile, and two words answer that; the count
 * ("4 of 5 requirements") stays beside the band as its working, where the
 * arithmetic is wanted. Employment Hero and Wrangle both draw bands
 * (Strong / Good / Low); Low never appears here because of the floor.
 *
 * **Requirements are posting facts and nothing else** — skills the posting
 * names, its seniority, its working hours. Anything the *network* knows is a
 * `reason`, below, and is never folded into the match: there is no honest
 * weight for "worked with three of your people", and a band that quietly
 * blends the two can't be checked at all.
 */
export type CriterionGroup = 'Skills' | 'Seniority' | 'Location';

export const CRITERION_GROUPS: CriterionGroup[] = ['Skills', 'Seniority', 'Location'];

/**
 * One of the role's requirements, in the shape the matching POC writes them
 * (LAB-2643, "How this run worked": *Claude read each posting once and wrote
 * 4–6 checkable criteria (skill, seniority, or location)*). `group` is that
 * kind; `statement` is the criterion as the POC wrote it, a full sentence
 * ("Experience with Filecoin, Web3, or crypto ecosystems").
 *
 * **`label` is the one field this design asks the POC to add.** A sentence
 * is right where the lead decides what counts (Edit criteria) and wrong
 * everywhere the criterion is a tick beside a person — a row, a checklist
 * line, an email item — where a 90-character sentence either wraps a row into
 * a paragraph or ellipsises before it says anything. So each criterion also
 * carries a 2–4 word name, written in the same pass as the statement.
 */
export interface RoleCriterion {
  id: string;
  group: CriterionGroup;
  /** The POC's criterion, as it wrote it. */
  statement: string;
  /** A 2–4 word name for the same criterion — rows, the checklist, the email. */
  label: string;
}

/**
 * Nobody under this is suggested, so "low match" is never a state the team
 * sees. Employment Hero and Wrangle both draw a Low band; on a list of tens of
 * members that band is only ever a person the product should not have offered.
 * Whole percent of the switched-on requirements met.
 */
export const MATCH_FLOOR = 60;

/**
 * At or above this share the band is *Strong match*; between the floor and it,
 * *Good match*. 80 is "at most one requirement short" on the four- and
 * five-item lists the postings carry, which is what a founder means by strong.
 */
export const STRONG_MATCH = 80;

export type SuggestionBand = 'strong' | 'good';

export const SUGGESTION_BAND_LABEL: Record<SuggestionBand, string> = {
  strong: 'Strong match',
  good: 'Good match',
};

/**
 * The band's DS `Badge` tone ("color code them"): Strong in success green,
 * Good in brand blue. Both bands are recommendations, so neither takes amber
 * or red — the colour ranks two good answers, it does not flag a bad one.
 * One map so the row and the pane can never disagree.
 */
export const SUGGESTION_BAND_VARIANT: Record<SuggestionBand, 'success' | 'brand'> = {
  strong: 'success',
  good: 'brand',
};

/**
 * What only this network knows about a member, one plain sentence off a fact
 * their profile already holds. Strongest first:
 *
 *   interest      raised a hand at this team before (another of its roles)
 *   contribution  worked on a project the role touches
 *   vouch         has worked with people on the hiring team
 *
 * These are the row's third line and the pane's first block. They are *not*
 * part of the match (see above) — they are why a Good match can still be
 * worth opening before a Strong one.
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
 * member — a band about you that you cannot see is the team's working, and one
 * you can see is a grade.
 */
export type RoleSuggested = Omit<RoleCandidate, 'note' | 'appliedAt' | 'cv' | 'unseen' | 'reviewed'> & {
  /** Ids of the role's criteria this profile meets. */
  met: string[];
  /**
   * Per met criterion, the profile fact that satisfies it, in a few words —
   * "Senior Engineer at Saturn since 2022". This is the per-criterion pass
   * Vova confirmed for LAB-2687 (embed everyone, keep the top results, then
   * check each criterion on those only), and it keeps a tick honest: the pane
   * shows it under the criterion, so a lead sees *why* it is met without
   * reading the whole profile. An unmet criterion has no evidence by
   * definition — the matcher found nothing on the profile, which is not the
   * same as the member lacking it, and the pane says so.
   */
  evidence?: Record<string, string>;
  /** Network signals, strongest first — see `SuggestionReasonKind`. */
  reasons: SuggestionReason[];
};

export interface SuggestionMatch {
  /** Whole percent — `met / total`, rounded. The floor, the band and the sort read it; nothing draws it. */
  percent: number;
  /** What the badge says — see `STRONG_MATCH`. */
  band: SuggestionBand;
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
  const percent = on.length ? Math.round((met / on.length) * 100) : 0;
  return { percent, band: percent >= STRONG_MATCH ? 'strong' : 'good', met, total: on.length };
};

/**
 * The working behind a match, split the way every surface shows it: the
 * switched-on criteria the profile meets and the ones it does not, each in the
 * role's own order.
 */
export const matchWorking = (
  person: RoleSuggested,
  criteria: RoleCriterion[],
  off?: ReadonlySet<string>,
): { met: RoleCriterion[]; unmet: RoleCriterion[] } => {
  const on = criteria.filter((c) => !off?.has(c.id));
  return {
    met: on.filter((c) => person.met.includes(c.id)),
    unmet: on.filter((c) => !person.met.includes(c.id)),
  };
};

/** Only members at or above the floor, against the criteria that are on. */
export const visibleSuggested = (
  people: RoleSuggested[],
  criteria: RoleCriterion[],
  off?: ReadonlySet<string>,
): RoleSuggested[] => people.filter((p) => suggestionMatch(p, criteria, off).percent >= MATCH_FLOOR);

/**
 * One spine, sorted by the share the band is read off: a Good match above a
 * Strong one would read as a bug, and inside a band the count still orders
 * (4 of 5 before 3 of 5 — the pane shows it). Ties go to whoever has the
 * stronger network signal, then by name so the order is stable.
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
    {
      id: 'ds',
      group: 'Skills',
      statement: 'Experience designing and operating distributed systems in production',
      label: 'Distributed systems',
    },
    { id: 'rg', group: 'Skills', statement: 'Hands-on proficiency in Rust or Go', label: 'Rust or Go' },
    {
      id: 'sn',
      group: 'Skills',
      statement: 'Background in peer-to-peer storage or networking protocols',
      label: 'Protocol experience',
    },
    {
      id: 'sr',
      group: 'Seniority',
      statement: '5+ years of infrastructure engineering at senior level or above',
      label: '5+ yrs infra, senior',
    },
    {
      id: 'tz',
      group: 'Location',
      statement: 'Working hours overlapping the Americas or Europe (remote)',
      label: 'Americas or Europe hours',
    },
  ],
  // Protocol Researcher
  'pl-3': [
    {
      id: 'cr',
      group: 'Skills',
      statement: 'Research experience in cryptography or consensus protocols',
      label: 'Cryptography or consensus',
    },
    {
      id: 'fv',
      group: 'Skills',
      statement: 'Experience with formal verification or specification languages such as TLA+ or Coq',
      label: 'Formal verification',
    },
    { id: 'pub', group: 'Skills', statement: 'A track record of published research', label: 'Published research' },
    {
      id: 'pr',
      group: 'Seniority',
      statement: 'Principal-level research experience or above',
      label: 'Principal level',
    },
    {
      id: 'tz',
      group: 'Location',
      statement: 'Working hours overlapping the Americas or Europe (remote)',
      label: 'Americas or Europe hours',
    },
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
      evidence: {
        ds: 'Runs Saturn’s retrieval path; four years on Cloudflare’s edge cache',
        rg: 'Rust and Go on her profile; maintains saturn-l1-cache',
        sn: 'Content routing on Saturn, contributor to IPFS',
        sr: 'Senior Engineer since 2022, 7 years in infrastructure',
        tz: 'Porto, Portugal',
      },
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
      // Not "5+ yrs infra, senior": the title on his profile is Infrastructure
      // Engineer, and the matcher reads the profile, not his history's length.
      met: ['ds', 'rg', 'sn', 'tz'],
      evidence: {
        ds: 'S3-compatible gateway over Filecoin and IPFS at Filebase',
        rg: 'Go on his profile; two and a half years on Lotus',
        sn: 'Distributed storage at Filebase and on Lotus',
        tz: 'Toronto, Canada',
      },
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
      evidence: {
        ds: 'Distributed systems on his profile; backend at Fission',
        rg: 'Rust on his profile; wrote rs-ucan-store',
        tz: 'Vancouver, Canada',
      },
      reasons: [],
    },
    {
      // The fourth at or above the floor, so the suggested-candidates email
      // (which names the top three) has someone to leave to the page.
      id: 'sug-7',
      memberId: 'priya-raman',
      name: 'Priya Raman',
      role: 'Senior Software Engineer · Tableland',
      title: 'Senior Software Engineer',
      team: 'Tableland',
      location: 'Berlin, Germany',
      email: 'priya@tableland.xyz',
      avatar: 'https://i.pravatar.cc/96?img=45',
      skills: ['TypeScript', 'SQL', 'Distributed Systems'],
      experience: [
        exp('priya-raman', 'pr1', 'Senior Software Engineer', 'Tableland', '2021-06', null, 'Berlin, Germany'),
        exp('priya-raman', 'pr2', 'Software Engineer', 'Zalando', '2016-03', '2021-05', 'Berlin, Germany'),
      ],
      profile: {
        linkedinHandle: 'priyaraman',
        teams: [{ id: 'tableland', name: 'Tableland', role: 'Senior Software Engineer', mainTeam: true }],
        contributions: [],
        repositories: [],
      },
      met: ['ds', 'sr', 'tz'],
      evidence: {
        ds: 'Distributed systems on her profile; replicated SQL at Tableland',
        sr: 'Senior Software Engineer since 2021, 9 years in total',
        tz: 'Berlin, Germany',
      },
      reasons: [{ kind: 'vouch', text: 'Worked with 2 people on your team on the Tableland–Filecoin bridge' }],
    },
    {
      // Under the floor with every requirement on (2 of 5 = 40%), so hidden.
      // Switch off "Rust or Go" and "5+ yrs infra, senior" in Edit criteria and he
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
      evidence: { ds: 'Platform engineering at Ceramic', tz: 'Mexico City, Mexico' },
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
      evidence: {
        cr: 'Research scientist on proofs of space at CryptoNet',
        fv: 'Formal verification on her profile',
        pub: 'PhD in cryptography, ETH Zürich',
        tz: 'Istanbul, Türkiye',
      },
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
      evidence: {
        cr: 'Consensus on his profile; independent protocol researcher',
        fv: 'TLA+ specifications of three BFT protocols',
        tz: 'Buenos Aires, Argentina',
      },
      reasons: [],
    },
  ],
};
