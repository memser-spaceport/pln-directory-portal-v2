/**
 * Mocked Warm Intros v2 data.
 *
 * Shapes mirror `@/services/investors/warm-intros-v2.types` exactly so the prototype
 * can hand rows straight to the production `WarmIntrosV2Table` / drawer / modal markup.
 * All people, firms, emails and Affinity ids below are invented.
 */

import {
  derivePathProximity,
  hopCountFromRelationKind,
  proximityFamilyFromRelationKind,
} from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';
import type { LabOsProfileRef } from '@/services/investors/types';
import type {
  MasterProfileDetail,
  WarmIntrosV2ConnectorSummary,
  WarmIntrosV2Facets,
  WarmIntrosV2InvestorSummary,
  WarmIntrosV2PathListItem,
  WarmIntrosV2TargetSet,
} from '@/services/investors/warm-intros-v2.types';

/**
 * The three path shapes v2 emits. `pl_direct` is one hop (PL member → investor);
 * the two bridges are two hops, through a portfolio founder or a co-investor.
 */
export type RelationKind = 'pl_direct' | 'founder_bridge' | 'coinvestor_bridge';

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

/*
 * Short list names used to live here for the per-row badge. Production already
 * has them as `WARM_INTROS_V2_LIST_TAG_LABEL`, and `ListMembershipTags` reads
 * that itself — so the row renders dev's chip and this copy is gone.
 */

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

// ── Bridges ──────────────────────────────────────────────────────────────────
// The middle hop on a two-hop path: a portfolio founder the PL member knows, or
// a co-investor who already shares a cap table with the target. Same summary
// shape as a connector — they render through the same chip.

export const MOCK_BRIDGES: Record<string, WarmIntrosV2ConnectorSummary> = {
  'fd-anais': {
    profileUid: 'mp-fd-anais',
    personKey: 'anais.leclerc',
    name: 'Anaïs Leclerc',
    currentOrg: 'Synapse Foundry',
    currentTitle: 'Co-founder & CEO',
    memberUid: 'member-anais',
    imageUrl: null,
  },
  'fd-oskar': {
    profileUid: 'mp-fd-oskar',
    personKey: 'oskar.lindqvist',
    name: 'Oskar Lindqvist',
    currentOrg: 'Meshgrid Labs',
    currentTitle: 'Founder & CTO',
    memberUid: 'member-oskar',
    imageUrl: null,
  },
  'fd-priya': {
    profileUid: 'mp-fd-priya',
    personKey: 'priya.raghunathan',
    name: 'Priya Raghunathan',
    currentOrg: 'Corticon Bio',
    currentTitle: 'Co-founder',
    memberUid: null,
    imageUrl: null,
  },
  'ci-johan': {
    profileUid: 'mp-ci-johan',
    personKey: 'johan.brekke',
    name: 'Johan Brekke',
    currentOrg: 'Fjord Ventures',
    currentTitle: 'Partner',
    memberUid: null,
    imageUrl: null,
  },
  'ci-renata': {
    profileUid: 'mp-ci-renata',
    personKey: 'renata.duarte',
    name: 'Renata Duarte',
    currentOrg: 'Atlantica Capital',
    currentTitle: 'General Partner',
    memberUid: null,
    imageUrl: null,
  },
};

// ── Events ───────────────────────────────────────────────────────────────────
/**
 * Per-person event attendance, keyed by profileUid — the same source the
 * MasterProfile `events` field reads from, so the modal and the derived overlap
 * can never disagree.
 *
 * Overlaps are deliberate and sparse: if everyone shared LabWeek the note would
 * fire on every row and mean nothing.
 */
const EVENTS_BY_PROFILE: Record<string, string[]> = {
  // PL connectors.
  //
  // Mara and Elena deliberately overlap on four events, so the drawer's shared-
  // events block exercises its crowded state: a pair with more events than the
  // list shows, and therefore its "Show N more" toggle. Every other pair overlaps
  // on one or none, which is the ordinary case.
  'mp-pl-mara': ['LabWeek 2025', 'Neuro Capital Roundtable', 'Token2049 2025', 'FIL Dev Summit 2025'],
  'mp-pl-tomas': ['Open Science Summit 2025', 'LabWeek 2025'],
  'mp-pl-ilse': ['LabWeek 2025'],
  'mp-pl-quan': ['ETHDenver 2024'],
  // Bridges
  'mp-fd-anais': ['ETHDenver 2024', 'LabWeek 2025'],
  'mp-fd-oskar': ['Hardware Summit 2025'],
  'mp-ci-renata': ['Climate Capital Forum 2025'],
  // Priya sits mid-chain on the Arjun path, so she overlaps with the hop on each
  // side of her — that is the case where the block has two groups and has to name
  // which pair each one belongs to.
  'mp-fd-priya': ['Open Science Summit 2025'],
  // Investors — only some overlap with the person who reaches them
  'mp-inv-elena-marchand': ['LabWeek 2025', 'Token2049 2025', 'Neuro Capital Roundtable', 'FIL Dev Summit 2025'],
  'mp-inv-arjun-pillai': ['Open Science Summit 2025'],
  'mp-inv-ken-abelard': ['ETHDenver 2024', 'Token2049 2025'],
  'mp-inv-linnea-holm': ['Neuro Capital Roundtable'],
  'mp-inv-sofia-marchetti': ['Frontier Robotics Expo 2025'],
  'mp-inv-ingrid-lundqvist': ['Climate Capital Forum 2025'],
};

function eventsFor(profileUid: string): string[] {
  return EVENTS_BY_PROFILE[profileUid] ?? [];
}

/**
 * Events both people attended. A shared event belongs to the *pair*, which is
 * why this takes two uids rather than hanging off either profile.
 */
export function sharedEventsBetween(a: string, b: string): string[] {
  const other = new Set(eventsFor(b));
  return eventsFor(a).filter((event) => other.has(event));
}

// ── Investors ────────────────────────────────────────────────────────────────

/** Proven PL co-investment, as MasterProfile.coInvestments carries it. */
type CoInvestmentSeed = {
  name: string;
  teamUid: string;
  dealStage?: string;
  dealDate?: string;
  dealAmount?: string;
  isLeadInvestor?: boolean;
};

/** PL/FIL prior-backer flags — the "PL/FIL investors" chip filters on this. */
export type PlBackingSeed = {
  backedProtocolLabs: boolean;
  backedFilecoin: boolean;
  matchKind: string;
  firmName?: string;
};

type InvestorSeed = WarmIntrosV2InvestorSummary & {
  /** Which mocked list this investor belongs to. */
  targetSet: WarmIntrosV2TargetSet;
  /** Best connector key into MOCK_CONNECTORS. */
  connector: keyof typeof MOCK_CONNECTORS;
  /**
   * Path shape. Defaults to `pl_direct`; the two bridge kinds add a middle hop
   * and shift the proximity family to F+2 / VC+2.
   */
  relationKind?: RelationKind;
  /** The middle hop — required when relationKind is a bridge. */
  bridge?: keyof typeof MOCK_BRIDGES;
  /**
   * When true the chain is `bridge → investor` and the PL member is not a node
   * at all. Real payloads emit this shape — production's drawer builds its
   * alternates exactly this way — so it has to be represented here, or the
   * prototype only ever tests the 3-node chain and code starts assuming hop 0
   * is always a PL member. It isn't.
   */
  bridgeLeads?: boolean;
  /** 0–1 path strength; drives proximity code, caliber, score % and band. */
  score: number;
  /**
   * Reason lines the drawer lists under "Best path". A bare string keeps the
   * default provenance (first is web-verified, the rest are model-inferred);
   * the object form states its own `sourceType`.
   */
  reasons: Array<string | { text: string; source: string }>;
  /** Alternate connectors, weaker than the best path. */
  alternates: Array<{
    connector: keyof typeof MOCK_CONNECTORS;
    score: number;
    reason: string;
    /** An alternate can reach the investor a different way than the best path. */
    relationKind?: RelationKind;
  }>;
  /** Proven co-investments alongside PL — shown in the drawer and the modal. */
  coInvestments?: CoInvestmentSeed[];
  /** Set when this investor has already backed PL or Filecoin. */
  plBacking?: PlBackingSeed;
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
    plBacking: {
      backedProtocolLabs: true,
      backedFilecoin: false,
      matchKind: 'firm',
      firmName: 'North Axis Capital',
    },
    coInvestments: [
      {
        name: 'Synapse Foundry',
        teamUid: 'team-synapse',
        dealStage: 'Seed',
        dealDate: '2025-03',
        dealAmount: '$4.2M',
        isLeadInvestor: true,
      },
      {
        name: 'Corticon Bio',
        teamUid: 'team-corticon',
        dealStage: 'Series A',
        dealDate: '2024-09',
        dealAmount: '$11M',
      },
    ],
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
    relationKind: 'founder_bridge',
    bridge: 'fd-priya',
    score: 0.74,
    reasons: [
      'Tomás backed Priya’s seed round at Corticon Bio and still sits on her monthly investor call.',
      'Priya raised her Series A from Meridian Bio — Arjun led it.',
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
      {
        connector: 'pl-quan',
        score: 0.19,
        reason: 'Via Oskar Lindqvist (Meshgrid) — Cortex led his seed, Quan knows him well.',
        relationKind: 'founder_bridge',
      },
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
    relationKind: 'coinvestor_bridge',
    bridge: 'ci-johan',
    score: 0.55,
    reasons: [
      'Fjord and Delft Seed have co-led two hardware rounds; Johan and Hendrik share three cap tables.',
      'Devin ran the Fjord co-investment process himself, so the ask goes through a live relationship.',
    ],
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
    relationKind: 'founder_bridge',
    bridge: 'fd-oskar',
    score: 0.33,
    reasons: ['Oskar pitched Severnhill last spring; Callum passed but stayed in touch. Nadia backed Oskar in 2023.'],
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
    plBacking: {
      backedProtocolLabs: false,
      backedFilecoin: true,
      matchKind: 'firm',
      firmName: 'Kalahari Capital',
    },
    coInvestments: [
      { name: 'Meshgrid Labs', teamUid: 'team-meshgrid', dealStage: 'Seed', dealDate: '2025-01', dealAmount: '$2.8M' },
    ],
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
    plBacking: {
      backedProtocolLabs: true,
      backedFilecoin: true,
      matchKind: 'firm',
      firmName: 'Au Ventures',
    },
    coInvestments: [
      {
        name: 'Meshgrid Labs',
        teamUid: 'team-meshgrid',
        dealStage: 'Series A',
        dealDate: '2025-06',
        dealAmount: '$14M',
        isLeadInvestor: true,
      },
      { name: 'Synapse Foundry', teamUid: 'team-synapse', dealStage: 'Seed', dealDate: '2025-03' },
      {
        name: 'Halide Storage',
        teamUid: 'team-halide',
        dealStage: 'Series B',
        dealDate: '2024-11',
        dealAmount: '$30M',
      },
    ],
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
    relationKind: 'founder_bridge',
    bridge: 'fd-anais',
    // 2-node shape: Anaïs reaches Ken directly, no PL member in the chain.
    bridgeLeads: true,
    score: 0.71,
    reasons: [
      'Anaïs raised her Series A from Bluerock — Ken took the board seat.',
      {
        text: 'Anaïs and Ken both spoke on the open-infrastructure track at ETHDenver 2024.',
        source: 'sharedEvent',
      },
      'Quan has worked with Anaïs since Synapse Foundry’s first PL grant.',
    ],
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
    relationKind: 'coinvestor_bridge',
    bridge: 'ci-renata',
    // 2-node shape again, on the co-investor side.
    bridgeLeads: true,
    score: 0.58,
    reasons: ['Atlantica and Norrsken have co-invested four times; Ilse and Renata speak monthly.'],
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
    coInvestments: [
      { name: 'Halide Storage', teamUid: 'team-halide', dealStage: 'Seed', dealDate: '2023-08', dealAmount: '$3.1M' },
    ],
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
    plBacking: {
      backedProtocolLabs: true,
      backedFilecoin: false,
      matchKind: 'person',
      firmName: 'Lagos Delta Fund',
    },
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

/** The middle hop's role — what the bridge person is to the target. */
function bridgeRole(relationKind: RelationKind): string {
  return relationKind === 'founder_bridge' ? 'founder' : 'co_investor';
}

function buildRow(seed: InvestorSeed, index: number): WarmIntrosV2PathListItem {
  const investor = toInvestorSummary(seed);
  const connector = MOCK_CONNECTORS[seed.connector];
  const relationKind: RelationKind = seed.relationKind ?? 'pl_direct';
  const bridge = seed.bridge ? MOCK_BRIDGES[seed.bridge] : null;
  // Production derives the code from the path shape, not the hop array: two hops
  // for either bridge, and the family letter says which bridge (F / VC / PL).
  const hopCount = hopCountFromRelationKind(relationKind);
  const proximity = derivePathProximity(seed.score, hopCount, proximityFamilyFromRelationKind(relationKind));

  const alternates = seed.alternates.map((alt) => {
    const c = MOCK_CONNECTORS[alt.connector];
    const altKind: RelationKind = alt.relationKind ?? 'pl_direct';
    const altProximity = derivePathProximity(
      alt.score,
      hopCountFromRelationKind(altKind),
      proximityFamilyFromRelationKind(altKind),
    );
    return {
      profileUid: c.profileUid,
      name: c.name,
      score: alt.score,
      memberUid: c.memberUid,
      imageUrl: c.imageUrl,
      relationKind: altKind,
      reasons: [{ description: alt.reason, sourceType: 'llmPairing' }],
      proximityCode: altProximity?.proximityCode ?? null,
      caliber: altProximity?.caliber ?? null,
      scorePercent: altProximity?.scorePercent,
      scoreBand: altProximity?.scoreBand,
    };
  });

  const bridgeHop = bridge
    ? {
        profileUid: bridge.profileUid,
        name: bridge.name,
        role: bridgeRole(relationKind),
        memberUid: bridge.memberUid,
        imageUrl: bridge.imageUrl,
      }
    : null;

  const plHop = {
    profileUid: connector.profileUid,
    name: connector.name,
    role: 'pl_connector',
    score: seed.score,
    memberUid: connector.memberUid,
    imageUrl: connector.imageUrl,
  };

  const lead = bridge && seed.bridgeLeads ? bridge : connector;

  const hops = [
    // `bridgeLeads` drops the PL member from the chain entirely: the founder or
    // co-investor *is* hop 0. Both shapes occur, which is exactly why nothing
    // downstream may infer a hop's role from its index.
    ...(bridgeHop && seed.bridgeLeads ? [bridgeHop] : [plHop, ...(bridgeHop ? [bridgeHop] : [])]),
    {
      profileUid: investor.profileUid,
      name: investor.name,
      role: 'investor',
      memberUid: investor.memberUid,
      imageUrl: investor.imageUrl,
    },
  ];

  return {
    uid: `wp2-${index + 1}`,
    targetProfileUid: seed.profileUid,
    targetSet: seed.targetSet,
    rank: 1,
    score: seed.score,
    hopCount,
    hopChain: {
      relationKind,
      hops,
      reasons: seed.reasons.map((reason, i) =>
        typeof reason === 'string'
          ? { description: reason, sourceType: i === 0 ? 'webVerify' : 'llmPairing' }
          : { description: reason.text, sourceType: reason.source },
      ),
      alternates,
    },
    // Whoever actually starts the chain — the bridge when it leads, else the PL member.
    bestConnectorProfileUid: lead.profileUid,
    alternateConnectorProfileUids: alternates.map((a) => a.profileUid),
    runId: 'mock-run-2026-07',
    computedAt: '2026-07-21T09:00:00.000Z',
    proximityCode: proximity?.proximityCode ?? 'PL+1B',
    caliber: proximity?.caliber ?? null,
    scorePercent: proximity?.scorePercent ?? 0,
    scoreBand: proximity?.scoreBand,
    investor,
    bestConnector: lead,
    pathSummary: {
      explanation: (typeof seed.reasons[0] === 'string' ? seed.reasons[0] : seed.reasons[0]?.text) ?? null,
      alternateCount: alternates.length,
    },
  };
}

/** Seed lookup by target profile — the filters read plBacking off it. */
const SEED_BY_PROFILE_UID = new Map(INVESTOR_SEEDS.map((seed) => [seed.profileUid, seed]));

/** Every mocked path row, both target sets, already rank-1 sorted by score. */
export const MOCK_PATHS: WarmIntrosV2PathListItem[] = INVESTOR_SEEDS.map(buildRow).sort(
  (a, b) => b.scorePercent - a.scorePercent,
);

/**
 * "Path via" — one axis, one value. It answers *how does this intro get made*,
 * at whichever resolution you want to ask it:
 *
 *   kind   → any path of this shape       (all founder bridges)
 *   member → this PL person starts it     (anything Mara can reach, any shape)
 *   bridge → this founder / co-investor mediates it
 *
 * Dev ships the coarse half as three chips and the person half as a separate
 * "PL member" select. They are the same question, so here they are one control.
 */
export type PathVia =
  | { type: 'kind'; value: RelationKind }
  | { type: 'member'; value: string }
  | { type: 'bridge'; value: string };

export type PathFilters = {
  targetSet: TargetSetScope;
  search?: string;
  /** A set, matched as OR — same reading as `pathVia`. */
  sector?: string[];
  /**
   * A set, matched as OR: a row survives if it satisfies *any* selected route.
   * That is the standard reading of several values in one facet, and it is what
   * the checkboxes in the menu promise — ticking a second box should widen the
   * result, never narrow it to the intersection (which for these is usually
   * empty, since a path has one shape and one bridge).
   */
  pathVia?: PathVia[] | null;
  /** Only investors whose MasterProfile carries plBacking. */
  plBacker?: boolean;
};

/** The seed a row was built from — `hopChain` is typed `unknown` on the row. */
function seedForRow(row: WarmIntrosV2PathListItem): InvestorSeed | undefined {
  return SEED_BY_PROFILE_UID.get(row.targetProfileUid);
}

export function relationKindOf(row: WarmIntrosV2PathListItem): RelationKind {
  return seedForRow(row)?.relationKind ?? 'pl_direct';
}

/** The bridge person, whether it leads the chain or sits in the middle. */
export function bridgeOf(row: WarmIntrosV2PathListItem): WarmIntrosV2ConnectorSummary | null {
  const key = seedForRow(row)?.bridge;
  return key ? MOCK_BRIDGES[key] : null;
}

/**
 * True when a PL member actually starts this path. On a `bridgeLeads` row the
 * chain opens on the founder / co-investor and no PL member is a node — so the
 * "PL member" facet group must not claim its `bestConnector`.
 */
export function hasPlLead(row: WarmIntrosV2PathListItem): boolean {
  const seed = seedForRow(row);
  return !(seed?.bridge && seed.bridgeLeads);
}

/**
 * The investor's standing relationship with PL. The row itself carries neither
 * field — both live on the MasterProfile — so the table reads them from here
 * rather than fetching a profile per row.
 */
export function plHistoryOf(row: WarmIntrosV2PathListItem): {
  backing: PlBackingSeed | null;
  coInvestmentCount: number;
} {
  const seed = seedForRow(row);
  return {
    backing: seed?.plBacking ?? null,
    coInvestmentCount: seed?.coInvestments?.length ?? 0,
  };
}

/**
 * Who on a path has a LabOS profile, keyed by profileUid.
 *
 * `type` matters: `member` resolves to `/members/:uid` — the same directory the
 * path chip's green dot already stands for, so on those people the caption and the
 * dot say one thing twice. `team` is a *fund* in LabOS, which a person-level dot
 * cannot express, and is the case where the caption earns its place.
 *
 * Seeded deliberately across both: Mara is a directory member (dot + caption, the
 * redundant case) and Renata is not (`memberUid: null`, so caption only — the
 * informative one).
 */
const LAB_OS_PROFILES: Record<string, LabOsProfileRef> = {
  'mp-pl-mara': { type: 'member', uid: 'member-mara', slug: 'mara-velasquez', name: 'Mara Velasquez' },
  'mp-pl-tomas': { type: 'member', uid: 'member-tomas', slug: 'tomas-reyna', name: 'Tomás Reyna' },
  'mp-ci-renata': { type: 'team', uid: 'team-atlantica', slug: 'atlantica-capital', name: 'Atlantica Capital' },
  'mp-fd-priya': { type: 'team', uid: 'team-corticon', slug: 'corticon-bio', name: 'Corticon Bio' },
  // Investors. Only some — the badge is only worth putting in the Investor column
  // if it distinguishes rows, and it cannot do that if every row carries it.
  'mp-inv-elena-marchand': { type: 'team', uid: 'team-au-ventures', slug: 'au-ventures', name: 'Au Ventures' },
  'mp-inv-linnea-holm': { type: 'member', uid: 'member-linnea', slug: 'linnea-holm', name: 'Linnéa Holm' },
  'mp-inv-thabo-mokoena': { type: 'team', uid: 'team-kalahari', slug: 'kalahari-capital', name: 'Kalahari Capital' },
};

export function labOsOf(profileUid: string | null | undefined): LabOsProfileRef | null {
  return profileUid ? (LAB_OS_PROFILES[profileUid] ?? null) : null;
}

function matchesPathVia(row: WarmIntrosV2PathListItem, via: PathVia): boolean {
  if (via.type === 'kind') return relationKindOf(row) === via.value;
  if (via.type === 'member') return hasPlLead(row) && row.bestConnector?.profileUid === via.value;
  return bridgeOf(row)?.profileUid === via.value;
}

/**
 * Client-side stand-in for the list endpoint's filtering.
 *
 * `omit` drops one axis so a facet can be counted against everything *except*
 * itself — otherwise every option in an open dropdown reads "1", which is just
 * the current selection reflected back.
 */
export function filterPaths(params: PathFilters, omit?: 'pathVia' | 'sector' | 'plBacker'): WarmIntrosV2PathListItem[] {
  const q = params.search?.trim().toLowerCase();

  return MOCK_PATHS.filter((row) => {
    if (params.targetSet !== ALL_LISTS && row.targetSet !== params.targetSet) return false;
    if (omit !== 'sector' && params.sector?.length && !params.sector.some((sec) => row.investor.sectors.includes(sec)))
      return false;
    if (
      omit !== 'pathVia' &&
      params.pathVia?.length &&
      !params.pathVia.some((via) => matchesPathVia(row, via))
    ) {
      return false;
    }
    if (omit !== 'plBacker' && params.plBacker && !seedForRow(row)?.plBacking) return false;
    if (q) {
      const haystack =
        `${row.investor.name} ${row.investor.email ?? ''} ${row.investor.currentOrg ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export type PathViaFacets = {
  kinds: Array<{ value: RelationKind; count: number }>;
  members: Array<{ profileUid: string; name: string; count: number }>;
  bridges: Array<{ profileUid: string; name: string; role: 'founder' | 'co_investor'; count: number }>;
};

/**
 * Every "Path via" option counted against the *other* active filters, so the
 * number on an option is what you will actually get if you pick it.
 */
export function pathViaFacets(filters: PathFilters): PathViaFacets {
  const rows = filterPaths(filters, 'pathVia');

  const kinds = new Map<RelationKind, number>();
  const members = new Map<string, { profileUid: string; name: string; count: number }>();
  const bridges = new Map<
    string,
    { profileUid: string; name: string; role: 'founder' | 'co_investor'; count: number }
  >();

  for (const row of rows) {
    const kind = relationKindOf(row);
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);

    const c = row.bestConnector;
    if (c && hasPlLead(row)) {
      const prev = members.get(c.profileUid);
      members.set(c.profileUid, { profileUid: c.profileUid, name: c.name, count: (prev?.count ?? 0) + 1 });
    }

    const bridge = bridgeOf(row);
    if (bridge) {
      const prev = bridges.get(bridge.profileUid);
      bridges.set(bridge.profileUid, {
        profileUid: bridge.profileUid,
        name: bridge.name,
        role: kind === 'founder_bridge' ? 'founder' : 'co_investor',
        count: (prev?.count ?? 0) + 1,
      });
    }
  }

  const KIND_ORDER: RelationKind[] = ['pl_direct', 'founder_bridge', 'coinvestor_bridge'];

  return {
    kinds: KIND_ORDER.filter((k) => kinds.has(k)).map((value) => ({ value, count: kinds.get(value) ?? 0 })),
    members: Array.from(members.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    bridges: Array.from(bridges.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

/** Sector facet, counted against everything except the sector filter itself. */
export function sectorFacets(filters: PathFilters): WarmIntrosV2Facets['sectors'] {
  const counts = new Map<string, number>();
  for (const row of filterPaths(filters, 'sector')) {
    for (const sector of row.investor.sectors) counts.set(sector, (counts.get(sector) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

/** How many rows the PL/FIL lens would leave, given everything else. */
export function plBackerCount(filters: PathFilters): number {
  return filterPaths({ ...filters, plBacker: true }, undefined).length;
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
    coInvestments: seed.coInvestments ?? [],
    plBacking: seed.plBacking ?? null,
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
    // Same source the shared-event overlap is derived from, so the modal's list
    // and the drawer's "both attended" line can never disagree.
    events: eventsFor(seed.profileUid).map((name) => ({ name })),
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
    events: eventsFor(connector.profileUid).map((name) => ({ name })),
    bio: `${connector.name} is ${connector.currentTitle} at Protocol Labs and is one of the six connectors v2 ranks.`,
    currentOrg: connector.currentOrg,
    currentTitle: connector.currentTitle,
    enrichedAt: '2026-07-20T11:42:00.000Z',
  };
}

/**
 * Bridge people get their own profile so the middle chip on a two-hop path
 * opens something — a founder reads as a founder, not as a second investor.
 */
function bridgeProfile(bridge: WarmIntrosV2ConnectorSummary, isFounder: boolean): MasterProfileDetail {
  return {
    uid: bridge.profileUid,
    personKey: bridge.personKey,
    types: [isFounder ? 'founder' : 'investor'],
    canonicalName: bridge.name,
    memberUid: bridge.memberUid ?? null,
    affinityPersonId: null,
    emails: [
      {
        value: `${bridge.personKey.split('.')[0]}@${(bridge.currentOrg ?? 'example')
          .toLowerCase()
          .replace(/[^a-z]+/g, '')}.com`,
        sources: [{ type: 'affinity', confidence: 0.8 }],
      },
    ],
    socials: { linkedin: `https://www.linkedin.com/in/${bridge.personKey.replace(/\./g, '-')}` },
    organizations: [{ name: bridge.currentOrg }],
    experience: [{ company: bridge.currentOrg, title: bridge.currentTitle, startYear: 2020 }],
    locations: [{ city: 'Berlin', country: 'Germany' }],
    events: eventsFor(bridge.profileUid).map((name) => ({ name })),
    bio: isFounder
      ? `${bridge.name} founded ${bridge.currentOrg} and has raised from the PL network — which is what makes this path work.`
      : `${bridge.name} is ${bridge.currentTitle} at ${bridge.currentOrg} and shares cap tables with Protocol Labs.`,
    currentOrg: bridge.currentOrg,
    currentTitle: bridge.currentTitle,
    enrichedAt: '2026-07-20T11:42:00.000Z',
  };
}

export const MOCK_MASTER_PROFILES: Record<string, MasterProfileDetail> = {
  ...Object.fromEntries(INVESTOR_SEEDS.map((seed) => [seed.profileUid, investorProfile(seed)])),
  ...Object.fromEntries(Object.values(MOCK_CONNECTORS).map((c) => [c.profileUid, connectorProfile(c)])),
  ...Object.fromEntries(
    Object.entries(MOCK_BRIDGES).map(([key, b]) => [b.profileUid, bridgeProfile(b, key.startsWith('fd-'))]),
  ),
};

/** Detail-endpoint stand-in: every rank-1 path recorded for one investor. */
export function pathsForInvestor(profileUid: string, targetSet?: string): WarmIntrosV2PathListItem[] {
  return MOCK_PATHS.filter((p) => p.targetProfileUid === profileUid && (!targetSet || p.targetSet === targetSet));
}
