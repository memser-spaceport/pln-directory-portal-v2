/**
 * Mocked Warm Intros v2 data.
 *
 * Shapes mirror `@/services/investors/warm-intros-v2.types` exactly so the prototype
 * can hand rows straight to the production `WarmIntrosV2Table` / drawer / modal markup.
 * All people, firms, emails and Affinity ids below are invented.
 */

import { derivePathProximity } from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';
import type {
  MasterProfileDetail,
  WarmIntrosV2ConnectorSummary,
  WarmIntrosV2Facets,
  WarmIntrosV2InvestorSummary,
  WarmIntrosV2PathListItem,
  WarmIntrosV2TargetSet,
} from '@/services/investors/warm-intros-v2.types';

/** v1 InvestorList rows the target-set picker reads names + counts from. */
export const MOCK_INVESTOR_LISTS: Array<{ slug: string; name: string; member_count: number }> = [
  { slug: 'neuro-lp', name: 'Neuro Fund I LP Pipeline', member_count: 128 },
  { slug: 'gold-coinvestors', name: 'Gold PLC Co-Investors', member_count: 64 },
];

/**
 * The list picker's scope. Production only offers the two target sets; the
 * prototype adds an unscoped "All" default so the workspace opens on everything
 * rather than pre-committing to one list.
 */
export const ALL_LISTS = 'all' as const;
export type TargetSetScope = typeof ALL_LISTS | WarmIntrosV2TargetSet;

export const ALL_LISTS_LABEL = 'All investor lists';

/**
 * Short list names for the per-row badge. The full labels
 * ("Neuro Fund I LP Pipeline") are too long to sit beside a name, so the badge
 * abbreviates and carries the full label as its tooltip.
 */
export const TARGET_SET_SHORT_LABEL: Record<WarmIntrosV2TargetSet, string> = {
  'neuro-fund-i': 'Neuro Fund I',
  'gold-co-investors': 'Gold PLC',
};

/** Total members across the mocked lists — the count shown on the "All" option. */
export const ALL_LISTS_MEMBER_COUNT = MOCK_INVESTOR_LISTS.reduce((sum, l) => sum + l.member_count, 0);

// ── PL connectors ────────────────────────────────────────────────────────────
// The six PL people v2 ranks as introducers. `memberUid` present ⇒ directory
// member ⇒ the chip renders a generated avatar (getDefaultAvatar) instead of initials.

export const MOCK_CONNECTORS: Record<string, WarmIntrosV2ConnectorSummary> = {
  'pl-mara': {
    profileUid: 'mp-pl-mara',
    personKey: 'mara.velasquez',
    name: 'Mara Velasquez',
    currentOrg: 'Protocol Labs',
    currentTitle: 'Head of Capital Formation',
    memberUid: 'member-mara',
    imageUrl: null,
  },
  'pl-devin': {
    profileUid: 'mp-pl-devin',
    personKey: 'devin.okafor',
    name: 'Devin Okafor',
    currentOrg: 'Protocol Labs',
    currentTitle: 'Network Growth Lead',
    memberUid: 'member-devin',
    imageUrl: null,
  },
  'pl-ilse': {
    profileUid: 'mp-pl-ilse',
    personKey: 'ilse.brandt',
    name: 'Ilse Brandt',
    currentOrg: 'Protocol Labs',
    currentTitle: 'Ecosystem Partnerships',
    memberUid: 'member-ilse',
    imageUrl: null,
  },
  'pl-tomas': {
    profileUid: 'mp-pl-tomas',
    personKey: 'tomas.reyna',
    name: 'Tomás Reyna',
    currentOrg: 'Protocol Labs',
    currentTitle: 'Research Partnerships',
    memberUid: 'member-tomas',
    imageUrl: null,
  },
  'pl-nadia': {
    profileUid: 'mp-pl-nadia',
    personKey: 'nadia.sorensen',
    name: 'Nadia Sørensen',
    currentOrg: 'Protocol Labs',
    currentTitle: 'Portfolio Support',
    memberUid: 'member-nadia',
    imageUrl: null,
  },
  'pl-quan': {
    profileUid: 'mp-pl-quan',
    personKey: 'quan.tran',
    name: 'Quan Tran',
    currentOrg: 'Protocol Labs',
    currentTitle: 'Founder Relations',
    memberUid: null,
    imageUrl: null,
  },
};

// ── Investors ────────────────────────────────────────────────────────────────

type InvestorSeed = WarmIntrosV2InvestorSummary & {
  /** Which mocked list this investor belongs to. */
  targetSet: WarmIntrosV2TargetSet;
  /** Best connector key into MOCK_CONNECTORS. */
  connector: keyof typeof MOCK_CONNECTORS;
  /** 0–1 path strength; drives proximity code, caliber, score % and band. */
  score: number;
  /** Reason lines the drawer lists under "Best path". */
  reasons: string[];
  /** Alternate connectors, weaker than the best path. */
  alternates: Array<{ connector: keyof typeof MOCK_CONNECTORS; score: number; reason: string }>;
};

const INVESTOR_SEEDS: InvestorSeed[] = [
  {
    targetSet: 'neuro-fund-i',
    profileUid: 'mp-inv-linnea-holm',
    personKey: 'linnea.holm',
    name: 'Linnéa Holm',
    email: 'linnea@northaxis.vc',
    currentOrg: 'North Axis Capital',
    currentTitle: 'General Partner',
    sectors: ['neurotech', 'biotech', 'ai'],
    affinityPersonId: '80114221',
    memberUid: null,
    imageUrl: null,
    connector: 'pl-mara',
    score: 0.87,
    reasons: [
      'Mara and Linnéa co-hosted the Neuro Capital roundtable at LabWeek 2025 and have exchanged mail since.',
      'North Axis is an existing LP in two Protocol Labs–adjacent funds.',
    ],
    alternates: [
      { connector: 'pl-ilse', score: 0.52, reason: 'Ilse shares the DeSci Foundation advisory board with Linnéa.' },
      { connector: 'pl-devin', score: 0.24, reason: 'Overlapping attendance at two 2024 ecosystem events.' },
    ],
  },
  {
    targetSet: 'neuro-fund-i',
    profileUid: 'mp-inv-arjun-pillai',
    personKey: 'arjun.pillai',
    name: 'Arjun Pillai',
    email: 'arjun@meridianbio.fund',
    currentOrg: 'Meridian Bio Ventures',
    currentTitle: 'Managing Partner',
    sectors: ['biotech', 'neurotech'],
    affinityPersonId: '80114998',
    memberUid: null,
    imageUrl: null,
    connector: 'pl-tomas',
    score: 0.74,
    reasons: [
      'Tomás and Arjun co-authored a 2024 position paper on open neuro datasets.',
      'Meridian Bio backed a portfolio company Tomás sourced.',
    ],
    alternates: [
      { connector: 'pl-nadia', score: 0.31, reason: 'Nadia supported a shared portfolio company through diligence.' },
    ],
  },
  {
    targetSet: 'neuro-fund-i',
    profileUid: 'mp-inv-sofia-marchetti',
    personKey: 'sofia.marchetti',
    name: 'Sofia Marchetti',
    email: 'sofia@cortexpartners.com',
    currentOrg: 'Cortex Partners',
    currentTitle: 'Partner',
    sectors: ['neurotech', 'frontier-tech', 'robotics'],
    affinityPersonId: '80115402',
    memberUid: 'member-sofia',
    imageUrl: null,
    connector: 'pl-ilse',
    score: 0.68,
    reasons: ['Ilse and Sofia served together on the LabWeek programme committee.'],
    alternates: [
      { connector: 'pl-mara', score: 0.44, reason: 'Warm but dated — one intro thread in early 2024.' },
      { connector: 'pl-quan', score: 0.19, reason: 'Weak signal: shared alumni network only.' },
    ],
  },
  {
    targetSet: 'neuro-fund-i',
    profileUid: 'mp-inv-hendrik-vos',
    personKey: 'hendrik.vos',
    name: 'Hendrik Vos',
    email: 'h.vos@delftseed.nl',
    currentOrg: 'Delft Seed',
    currentTitle: 'Founding Partner',
    sectors: ['frontier-tech', 'robotics'],
    affinityPersonId: null,
    memberUid: null,
    imageUrl: null,
    connector: 'pl-devin',
    score: 0.55,
    reasons: ['Devin and Hendrik are both mentors in the same hardware accelerator cohort.'],
    alternates: [],
  },
  {
    targetSet: 'neuro-fund-i',
    profileUid: 'mp-inv-yara-nasser',
    personKey: 'yara.nasser',
    name: 'Yara Nasser',
    email: 'yara@openminds.capital',
    currentOrg: 'OpenMinds Capital',
    currentTitle: 'Principal',
    sectors: ['neurotech', 'ai', 'desci'],
    affinityPersonId: '80116077',
    memberUid: null,
    imageUrl: null,
    connector: 'pl-mara',
    score: 0.49,
    reasons: ['Mara met Yara at the Neuro Fund I kickoff; follow-up thread is still open.'],
    alternates: [
      { connector: 'pl-tomas', score: 0.36, reason: 'Tomás cited two of Yara’s DeSci essays in a workshop.' },
    ],
  },
  {
    targetSet: 'neuro-fund-i',
    profileUid: 'mp-inv-callum-doyle',
    personKey: 'callum.doyle',
    name: 'Callum Doyle',
    email: 'callum@severnhill.co',
    currentOrg: 'Severnhill',
    currentTitle: 'Investment Director',
    sectors: ['biotech', 'climate'],
    affinityPersonId: null,
    memberUid: null,
    imageUrl: null,
    connector: 'pl-nadia',
    score: 0.33,
    reasons: ['Nadia and Callum overlapped on one diligence call in 2025 — thin but real.'],
    alternates: [{ connector: 'pl-ilse', score: 0.21, reason: 'Shared conference panel, no direct correspondence.' }],
  },
  {
    targetSet: 'neuro-fund-i',
    profileUid: 'mp-inv-petra-svoboda',
    personKey: 'petra.svoboda',
    name: 'Petra Svoboda',
    email: null,
    currentOrg: 'Vltava Growth',
    currentTitle: 'Partner',
    sectors: ['saas', 'ai'],
    affinityPersonId: null,
    memberUid: null,
    imageUrl: null,
    connector: 'pl-quan',
    score: 0.18,
    reasons: ['Model-inferred only: Quan and Petra share two portfolio companies, no correspondence found.'],
    alternates: [],
  },
  {
    targetSet: 'neuro-fund-i',
    profileUid: 'mp-inv-thabo-mokoena',
    personKey: 'thabo.mokoena',
    name: 'Thabo Mokoena',
    email: 'thabo@kalaharicap.africa',
    currentOrg: 'Kalahari Capital',
    currentTitle: 'General Partner',
    sectors: ['fintech', 'infrastructure', 'ai', 'climate'],
    affinityPersonId: '80116540',
    memberUid: null,
    imageUrl: null,
    connector: 'pl-devin',
    score: 0.63,
    reasons: [
      'Devin ran a joint founder session with Kalahari in Cape Town.',
      'Two live email threads in the last quarter.',
    ],
    alternates: [{ connector: 'pl-mara', score: 0.29, reason: 'One LP-side introduction in 2024.' }],
  },

  // ── Gold PLC Co-Investors ──────────────────────────────────────────────────
  {
    targetSet: 'gold-co-investors',
    profileUid: 'mp-inv-elena-marchand',
    personKey: 'elena.marchand',
    name: 'Elena Marchand',
    email: 'elena@auventures.fr',
    currentOrg: 'Au Ventures',
    currentTitle: 'Managing Partner',
    sectors: ['crypto', 'defi', 'infrastructure'],
    affinityPersonId: '80117001',
    memberUid: 'member-elena',
    imageUrl: null,
    connector: 'pl-mara',
    score: 0.91,
    reasons: [
      'Au Ventures co-invested with Gold PLC in two consecutive rounds; Mara led both syndicates.',
      'Standing quarterly call between Mara and Elena.',
    ],
    alternates: [
      { connector: 'pl-nadia', score: 0.57, reason: 'Nadia supports a jointly held portfolio company.' },
      { connector: 'pl-devin', score: 0.34, reason: 'Met at two consecutive ecosystem summits.' },
    ],
  },
  {
    targetSet: 'gold-co-investors',
    profileUid: 'mp-inv-ken-abelard',
    personKey: 'ken.abelard',
    name: 'Ken Abelard',
    email: 'ken@bluerockdigital.com',
    currentOrg: 'Bluerock Digital',
    currentTitle: 'Partner',
    sectors: ['crypto', 'gaming'],
    affinityPersonId: '80117223',
    memberUid: null,
    imageUrl: null,
    connector: 'pl-quan',
    score: 0.71,
    reasons: ['Quan has introduced three founders to Ken since 2024; two converted to term sheets.'],
    alternates: [{ connector: 'pl-ilse', score: 0.4, reason: 'Ilse and Ken sit on the same standards working group.' }],
  },
  {
    targetSet: 'gold-co-investors',
    profileUid: 'mp-inv-ingrid-lundqvist',
    personKey: 'ingrid.lundqvist',
    name: 'Ingrid Lundqvist',
    email: 'ingrid@norrskenlp.se',
    currentOrg: 'Norrsken LP',
    currentTitle: 'Head of Ventures',
    sectors: ['climate', 'infrastructure', 'desci'],
    affinityPersonId: null,
    memberUid: null,
    imageUrl: null,
    connector: 'pl-ilse',
    score: 0.58,
    reasons: ['Ilse and Ingrid co-chaired the open-infrastructure track at two conferences.'],
    alternates: [],
  },
  {
    targetSet: 'gold-co-investors',
    profileUid: 'mp-inv-rafael-ortiz',
    personKey: 'rafael.ortiz',
    name: 'Rafael Ortiz',
    email: 'rafael@andescrypto.io',
    currentOrg: 'Andes Crypto',
    currentTitle: 'Founder & GP',
    sectors: ['crypto', 'defi'],
    affinityPersonId: '80117690',
    memberUid: null,
    imageUrl: null,
    connector: 'pl-devin',
    score: 0.42,
    reasons: ['Devin and Rafael have an open thread from a 2025 co-investment that did not close.'],
    alternates: [{ connector: 'pl-mara', score: 0.27, reason: 'Indirect: shared LP base, no direct contact.' }],
  },
  {
    targetSet: 'gold-co-investors',
    profileUid: 'mp-inv-mei-lin-chow',
    personKey: 'mei.lin.chow',
    name: 'Mei-Lin Chow',
    email: 'meilin@harborlightpartners.sg',
    currentOrg: 'Harborlight Partners',
    currentTitle: 'Partner',
    sectors: ['fintech', 'saas', 'ai'],
    affinityPersonId: null,
    memberUid: null,
    imageUrl: null,
    connector: 'pl-nadia',
    score: 0.22,
    reasons: ['Weak: one shared board observer seat, no correspondence in the last 18 months.'],
    alternates: [],
  },
  {
    targetSet: 'gold-co-investors',
    profileUid: 'mp-inv-samuel-adeyemi',
    personKey: 'samuel.adeyemi',
    name: 'Samuel Adeyemi',
    email: 'sam@lagosdeltafund.com',
    currentOrg: 'Lagos Delta Fund',
    currentTitle: 'Investment Partner',
    sectors: ['infrastructure', 'fintech'],
    affinityPersonId: '80118014',
    memberUid: null,
    imageUrl: null,
    connector: 'pl-tomas',
    score: 0.66,
    reasons: ['Tomás and Samuel ran a joint research grant programme in 2025.'],
    alternates: [
      { connector: 'pl-quan', score: 0.38, reason: 'Quan referred one founder that Lagos Delta later backed.' },
    ],
  },
];

// ── Row assembly ─────────────────────────────────────────────────────────────

function toInvestorSummary(seed: InvestorSeed): WarmIntrosV2InvestorSummary {
  return {
    profileUid: seed.profileUid,
    personKey: seed.personKey,
    name: seed.name,
    email: seed.email,
    currentOrg: seed.currentOrg,
    currentTitle: seed.currentTitle,
    sectors: seed.sectors,
    affinityPersonId: seed.affinityPersonId,
    memberUid: seed.memberUid,
    imageUrl: seed.imageUrl,
  };
}

function buildRow(seed: InvestorSeed, index: number): WarmIntrosV2PathListItem {
  const investor = toInvestorSummary(seed);
  const connector = MOCK_CONNECTORS[seed.connector];
  const proximity = derivePathProximity(seed.score, 1);

  const alternates = seed.alternates.map((alt) => {
    const c = MOCK_CONNECTORS[alt.connector];
    const altProximity = derivePathProximity(alt.score, 1);
    return {
      profileUid: c.profileUid,
      name: c.name,
      score: alt.score,
      memberUid: c.memberUid,
      imageUrl: c.imageUrl,
      reasons: [{ description: alt.reason, sourceType: 'llmPairing' }],
      proximityCode: altProximity?.proximityCode ?? null,
      caliber: altProximity?.caliber ?? null,
      scorePercent: altProximity?.scorePercent,
      scoreBand: altProximity?.scoreBand,
    };
  });

  return {
    uid: `wp2-${index + 1}`,
    targetProfileUid: seed.profileUid,
    targetSet: seed.targetSet,
    rank: 1,
    score: seed.score,
    hopCount: 1,
    hopChain: {
      relationKind: 'pl_direct',
      hops: [
        {
          profileUid: connector.profileUid,
          name: connector.name,
          role: 'pl_connector',
          score: seed.score,
          memberUid: connector.memberUid,
          imageUrl: connector.imageUrl,
        },
        {
          profileUid: investor.profileUid,
          name: investor.name,
          role: 'investor',
          memberUid: investor.memberUid,
          imageUrl: investor.imageUrl,
        },
      ],
      reasons: seed.reasons.map((description, i) => ({
        description,
        sourceType: i === 0 ? 'webVerify' : 'llmPairing',
      })),
      alternates,
    },
    bestConnectorProfileUid: connector.profileUid,
    alternateConnectorProfileUids: alternates.map((a) => a.profileUid),
    runId: 'mock-run-2026-07',
    computedAt: '2026-07-21T09:00:00.000Z',
    proximityCode: proximity?.proximityCode ?? 'PL+1B',
    caliber: proximity?.caliber ?? null,
    scorePercent: proximity?.scorePercent ?? 0,
    scoreBand: proximity?.scoreBand,
    investor,
    bestConnector: connector,
    pathSummary: {
      explanation: seed.reasons[0] ?? null,
      alternateCount: alternates.length,
    },
  };
}

/** Every mocked path row, both target sets, already rank-1 sorted by score. */
export const MOCK_PATHS: WarmIntrosV2PathListItem[] = INVESTOR_SEEDS.map(buildRow).sort(
  (a, b) => b.scorePercent - a.scorePercent,
);

/** Facets for the PL member + sector selects, derived from the rows in scope. */
export function facetsForTargetSet(targetSet: TargetSetScope): WarmIntrosV2Facets {
  const rows = targetSet === ALL_LISTS ? MOCK_PATHS : MOCK_PATHS.filter((p) => p.targetSet === targetSet);

  const connectorCounts = new Map<string, { profileUid: string; name: string; pathCount: number }>();
  const sectorCounts = new Map<string, number>();

  for (const row of rows) {
    const c = row.bestConnector;
    if (c) {
      const prev = connectorCounts.get(c.profileUid);
      connectorCounts.set(c.profileUid, {
        profileUid: c.profileUid,
        name: c.name,
        pathCount: (prev?.pathCount ?? 0) + 1,
      });
    }
    for (const sector of row.investor.sectors) {
      sectorCounts.set(sector, (sectorCounts.get(sector) ?? 0) + 1);
    }
  }

  return {
    connectors: Array.from(connectorCounts.values()).sort((a, b) => b.pathCount - a.pathCount),
    sectors: Array.from(sectorCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Client-side stand-in for the list endpoint's filtering. */
export function filterPaths(params: {
  targetSet: TargetSetScope;
  search?: string;
  connectorProfileUid?: string;
  sector?: string;
}): WarmIntrosV2PathListItem[] {
  const q = params.search?.trim().toLowerCase();

  return MOCK_PATHS.filter((row) => {
    if (params.targetSet !== ALL_LISTS && row.targetSet !== params.targetSet) return false;
    if (params.connectorProfileUid && row.bestConnector?.profileUid !== params.connectorProfileUid) return false;
    if (params.sector && !row.investor.sectors.includes(params.sector)) return false;
    if (q) {
      const haystack =
        `${row.investor.name} ${row.investor.email ?? ''} ${row.investor.currentOrg ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// ── Master profiles ──────────────────────────────────────────────────────────
// Keyed by profileUid; covers both investors and connectors so every chip in the
// table and drawer opens something.

function investorProfile(seed: InvestorSeed): MasterProfileDetail {
  return {
    uid: seed.profileUid,
    personKey: seed.personKey,
    types: ['investor'],
    canonicalName: seed.name,
    memberUid: seed.memberUid,
    affinityPersonId: seed.affinityPersonId,
    emails: seed.email ? [{ value: seed.email, sources: [{ type: 'affinity', confidence: 0.9 }] }] : [],
    phones: [],
    socials: {
      linkedin: `https://www.linkedin.com/in/${seed.personKey.replace(/\./g, '-')}`,
      website: `https://${(seed.currentOrg ?? 'example').toLowerCase().replace(/[^a-z]+/g, '')}.com`,
    },
    organizations: [{ name: seed.currentOrg }],
    experience: [
      { company: seed.currentOrg, title: seed.currentTitle, startYear: 2019 },
      { company: 'Helix Growth', title: 'Investment Manager', startYear: 2015, endYear: 2019 },
    ],
    education: [{ school: 'Northfield University', degree: 'MSc Economics', endYear: 2013 }],
    investorMeta: {
      firm: seed.currentOrg,
      investorType: 'Venture',
      stages: ['Seed', 'Series A'],
      checkSize: '$500k – $3M',
      sectors: seed.sectors,
      thesis: 'Backs research-dense teams commercialising open scientific infrastructure.',
    },
    locations: [{ city: 'Lisbon', country: 'Portugal' }],
    listMemberships: [
      {
        listSlug: seed.targetSet,
        listName: seed.targetSet === 'neuro-fund-i' ? 'Neuro Fund I LP Pipeline' : 'Gold PLC Co-Investors',
      },
    ],
    bio: `${seed.name} is ${seed.currentTitle} at ${seed.currentOrg}, focused on ${seed.sectors.join(', ')}.`,
    currentOrg: seed.currentOrg,
    currentTitle: seed.currentTitle,
    projects: [{ name: 'Open Neuro Data Commons' }, { name: 'Frontier Compute Alliance' }],
    events: [{ name: 'LabWeek 2025' }, { name: 'Neuro Capital Roundtable' }],
    sourceSnapshots: {
      affinity: { sourceType: 'affinity', fetchedAt: '2026-07-18T00:00:00.000Z' },
      web: { sourceType: 'webVerify', fetchedAt: '2026-07-20T00:00:00.000Z' },
    },
    enrichmentVersion: 'v2.3.0',
    enrichedAt: '2026-07-20T11:42:00.000Z',
    raw: { note: 'Mocked payload — no real enrichment behind this prototype.' },
  };
}

function connectorProfile(connector: WarmIntrosV2ConnectorSummary): MasterProfileDetail {
  return {
    uid: connector.profileUid,
    personKey: connector.personKey,
    types: ['pl_internal'],
    canonicalName: connector.name,
    memberUid: connector.memberUid ?? null,
    affinityPersonId: null,
    emails: [{ value: `${connector.personKey.replace(/\./g, '.')}@protocol.ai`, sources: [{ type: 'directory' }] }],
    socials: { linkedin: `https://www.linkedin.com/in/${connector.personKey.replace(/\./g, '-')}` },
    organizations: [{ name: 'Protocol Labs' }],
    experience: [{ company: 'Protocol Labs', title: connector.currentTitle, startYear: 2021 }],
    locations: [{ city: 'Remote' }],
    bio: `${connector.name} is ${connector.currentTitle} at Protocol Labs and is one of the six connectors v2 ranks.`,
    currentOrg: connector.currentOrg,
    currentTitle: connector.currentTitle,
    enrichedAt: '2026-07-20T11:42:00.000Z',
  };
}

export const MOCK_MASTER_PROFILES: Record<string, MasterProfileDetail> = {
  ...Object.fromEntries(INVESTOR_SEEDS.map((seed) => [seed.profileUid, investorProfile(seed)])),
  ...Object.fromEntries(Object.values(MOCK_CONNECTORS).map((c) => [c.profileUid, connectorProfile(c)])),
};

/** Detail-endpoint stand-in: every rank-1 path recorded for one investor. */
export function pathsForInvestor(profileUid: string, targetSet?: string): WarmIntrosV2PathListItem[] {
  return MOCK_PATHS.filter((p) => p.targetProfileUid === profileUid && (!targetSet || p.targetSet === targetSet));
}
