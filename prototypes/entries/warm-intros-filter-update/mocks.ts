// Mocked data for the Warm Intros redesign prototype. Shapes mirror the
// production `OutreachInvestor` / `PathfinderPath` types just enough to render
// the workspace table + the expanded path detail — no API, no react-query.
//
// Production source of truth:
//   components/page/investors/WarmIntrosWorkspace/WarmIntrosWorkspace.tsx
//   components/page/investors/WarmPathDetail/WarmPathDetail.tsx
import type {
  AumRange,
  CheckSizeRange,
  EmailStatus,
  EngagementTier,
  InvestorList,
  InvestorSource,
  InvestorType,
  LabOsProfileRef,
  PathConnectorType,
  SectorTag,
  StageFocus,
  WarmIntroTier,
} from '@/services/investors/types';

/** A target list (Lists IA). The workspace operates over one list at a time. */
export type ListRef = { id: string; name: string };

/** A link to a team a person belongs to. A connector can be in several teams. */
export type TeamLink = { name: string; teamUid?: string; logo?: string };

/** A person PL would actually reach out to on a given path. NEW vs production:
 *  production only renders the hop-chain node *labels* — never an email or a
 *  link to the person/team. This carries the contact info the issue asks for. */
export type ContactPerson = {
  name: string;
  /** e.g. "Founder · Modular Globe" or "Partner · Pico Ventures". */
  role: string;
  email?: string;
  /** LinkedIn / Telegram handles — rendered with the Member-page contact icons. */
  linkedin?: string;
  telegram?: string;
  /** LabOS member uid → /members/:uid. Present ⇒ in the PL network (avatar +
   *  link). Absent ⇒ a known person who is NOT in the network (grey icon). */
  memberUid?: string;
  /** Teams this person belongs to (can be several). Shown as chips in the drawer. */
  teams?: TeamLink[];
};

/** An org-level connector for the case where we know a company can route an
 *  intro but DON'T know which specific person yet. Renders with tags + the
 *  organization's own contacts instead of an individual's. */
export type OrgConnector = {
  name: string;
  /** When set, the org is in the PL network → its node/name link to /teams/:uid
   *  and it shows its real logo (vs an external firm: dashed building glyph). */
  teamUid?: string;
  /** Real logo asset for a PL-network org. */
  logo?: string;
  /** Short why-this-works note. */
  description: string;
  /** Signal chips, e.g. ["Org connection", "Person unknown"]. */
  tags: string[];
  email?: string;
  website?: string;
};

/** When a path routes through a PL portfolio team, the team + its contactable
 *  leads. Issue #1: "no way to view team leads with emails / link to the team". */
export type ConnectorTeam = {
  name: string;
  /** Team uid → /teams/:uid. */
  teamUid: string;
  leads: ContactPerson[];
};

/** One hop in the route to the investor. Production shows COMPANIES in the
 *  middle (not individual people) ending at the investor — so each node is an
 *  org/portfolio-team, or the investor themselves. */
export type ChainNode = {
  label: string;
  kind: 'org' | 'team' | 'investor';
  /** When kind==='team' (a PL portfolio team) → links to its page (new tab). */
  teamUid?: string;
  /** Real company logo asset; falls back to a generated avatar when absent. */
  logo?: string;
};

export type MockPath = {
  id: number;
  rank: number;
  proximity_code: string;
  caliber_confidence: number | null;
  /** 0–1 warmth (rendered as %). */
  score: number;
  connector_type: PathConnectorType;
  explanation: string;
  /** Hop-chain: PL → company(ies) → investor. Kept for connector-lens search;
   *  the route is now rendered people-first (see `contact` / `orgConnector`). */
  chain: ChainNode[];
  /** The single best PERSON to contact on this path. Absent on org-led paths
   *  where we know the company can connect but not the specific person. */
  contact?: ContactPerson;
  /** Present when we know an ORG can route the intro but not who specifically.
   *  Mutually exclusive with a known `contact`. */
  orgConnector?: OrgConnector;
  /** Present when the path goes through a PL portfolio team. */
  team?: ConnectorTeam;
};

/** A single node in the people-first route visual. Built from a path's
 *  `contact` / `orgConnector`, or from the investor (the end node). */
export type RouteNode = {
  label: string;
  /** Present ⇒ in PL network → avatar + /members link. */
  memberUid?: string;
  /** For an org node in the PL network → logo + link to /teams/:uid. */
  teamUid?: string;
  logo?: string;
  /** member = network person (avatar), external = known non-network person
   *  (grey icon), org = company we can route through but person unknown. */
  variant: 'member' | 'external' | 'org';
};

/** A PL portfolio team's profile, shown in-app when a path's team is tapped. */
export type TeamProfile = {
  uid: string;
  name: string;
  tagline: string;
  about: string;
  sectors: SectorTag[];
  stage: StageFocus;
  website: string;
  pl_invested_at: string;
  leads: ContactPerson[];
};

export type MockInvestor = {
  investor_id: string;
  first_name: string;
  last_name: string;
  email: string;
  firm: string;
  title: string;
  sector_tags: SectorTag[];
  stage_focus: StageFocus;
  check_size_range: CheckSizeRange;
  investor_type: InvestorType;
  engagement_tier: EngagementTier;
  relationship: WarmIntroTier;
  best_proximity_code: string | null;
  has_path: boolean;
  /** Lists this investor currently belongs to (by ListRef.id). Mutated locally. */
  list_ids: string[];
  paths: MockPath[];

  // ── Extra fields rendered only in the detail drawer (issue: same drawer on tap) ──
  email_status: EmailStatus;
  source: InvestorSource;
  linkedin_url?: string;
  firm_domain?: string;
  geo_focus?: string;
  fund_thesis?: string;
  aum_range: AumRange;
  lab_os_profile?: LabOsProfileRef | null;
  outreach: {
    touches: number;
    opened: number;
    clicked: number;
    registered: number;
    first_sent_date: string;
    last_sent_date: string;
  };
};

// Two lists only, mirroring production ("v1: Neuro + Gold") so devs can grab it.
export const MOCK_LISTS: ListRef[] = [
  { id: 'neuro-lp', name: 'Neuro LP pipeline' },
  { id: 'gold', name: 'Gold tier VCs' },
];

export const DEFAULT_LIST_ID = 'neuro-lp';

/** Full `InvestorList` records so the prototype can reuse the production
 *  `ListPicker` component verbatim (it renders member_count + is_graphed). */
export const MOCK_INVESTOR_LISTS: InvestorList[] = [
  {
    id: 'neuro-lp',
    slug: 'neuro-lp',
    name: 'Neuro LP pipeline',
    description: 'Neurotech-focused LPs and funds.',
    is_graphed: true,
    member_count: 10,
  },
  { id: 'gold', slug: 'gold', name: 'Gold tier VCs', description: 'Top-priority VC targets.', is_graphed: true, member_count: 3 },
];

/** Team profiles keyed by teamUid (the `team.teamUid` on a path). */
export const MOCK_TEAM_PROFILES: Record<string, TeamProfile> = {
  'modular-globe': {
    uid: 'modular-globe',
    name: 'Modular Globe',
    tagline: 'Composable infrastructure for neuro data pipelines',
    about:
      'Modular Globe builds the data-orchestration layer used by neurotech labs to move signal data from device to model. PL led the seed round in 2024.',
    sectors: ['neurotech', 'infrastructure'],
    stage: 'seed',
    website: 'modularglobe.xyz',
    pl_invested_at: '2024-06',
    leads: [
      { name: 'Maya Chen', role: 'CEO & Co-founder', email: 'maya@modularglobe.xyz', linkedin: 'maya-chen', telegram: 'mayachen', memberUid: 'maya-chen' },
      { name: 'Arjun Patel', role: 'CTO & Co-founder', email: 'arjun@modularglobe.xyz', linkedin: 'arjun-patel', memberUid: 'arjun-patel' },
    ],
  },
  'helios-robotics': {
    uid: 'helios-robotics',
    name: 'Helios Robotics',
    tagline: 'Autonomous field robotics for energy infrastructure',
    about:
      'Helios builds inspection robots for solar and grid infrastructure. Vertex Frontier led the seed; PL co-invested.',
    sectors: ['robotics', 'ai'],
    stage: 'seed',
    website: 'heliosrobotics.io',
    pl_invested_at: '2024-11',
    leads: [
      { name: 'Devon Okoye', role: 'CEO & Founder', email: 'devon@heliosrobotics.io', linkedin: 'devon-okoye', telegram: 'devonokoye', memberUid: 'devon-okoye' },
      { name: 'Sofia Marchetti', role: 'COO', email: 'sofia@heliosrobotics.io', linkedin: 'sofia-marchetti', memberUid: 'sofia-marchetti' },
    ],
  },
  'tidal-energy': {
    uid: 'tidal-energy',
    name: 'Tidal Energy',
    tagline: 'Grid-scale tidal power systems',
    about: 'Tidal Energy develops modular tidal turbines for coastal grids. A PL portfolio team since 2023.',
    sectors: ['climate', 'frontier-tech'],
    stage: 'series-a',
    website: 'tidalenergy.co',
    pl_invested_at: '2023-09',
    leads: [{ name: 'Priya Anand', role: 'CEO & Founder', email: 'priya@tidalenergy.co', memberUid: 'priya-anand' }],
  },
};

// Chain-node helpers (keep the route data below terse + readable). Logos are
// real assets from the demoday landing set so the badges show actual marks.
const LOGOS = '/icons/demoday/landing/logos';
const PL: ChainNode = { label: 'Protocol Labs', kind: 'org', logo: `${LOGOS}/Protocol%20Labs.svg` };
const org = (label: string, logo?: string): ChainNode => ({ label, kind: 'org', logo });
const team = (label: string, teamUid: string, logo?: string): ChainNode => ({ label, kind: 'team', teamUid, logo });

/** Is the investor themselves in the PL network (has a LabOS member profile)? */
export function isInvestorInNetwork(inv: MockInvestor): boolean {
  return inv.lab_os_profile?.type === 'member';
}

/** The investor as the end node of a people-first route. */
export function investorNode(inv: MockInvestor): RouteNode {
  const inNet = isInvestorInNetwork(inv);
  return {
    label: `${inv.first_name} ${inv.last_name}`,
    memberUid: inNet ? inv.lab_os_profile?.uid : undefined,
    variant: inNet ? 'member' : 'external',
  };
}

/** The connector node for a path: a network person (avatar), a known non-network
 *  person (grey icon), or an org we can route through but person-unknown. */
export function connectorNode(path: MockPath): RouteNode | null {
  if (path.orgConnector)
    return {
      label: path.orgConnector.name,
      variant: 'org',
      teamUid: path.orgConnector.teamUid,
      logo: path.orgConnector.logo,
    };
  if (path.contact) {
    return {
      label: path.contact.name,
      memberUid: path.contact.memberUid,
      variant: path.contact.memberUid ? 'member' : 'external',
    };
  }
  return null;
}

/** The 2-step chain for a path: the closest connector → the target investor.
 *  Both shown so the row reads "reach X, who connects to {investor}". */
export function pathChainNodes(path: MockPath, inv: MockInvestor): RouteNode[] {
  const connector = connectorNode(path);
  return connector ? [connector, investorNode(inv)] : [];
}

// ── Connector-case path factory ─────────────────────────────────────────────
// Every path-having investor gets the same three connector states so the drawer
// demonstrates all of them: member known (network person), organization unknown
// (external firm, person unknown), member unknown (known person not in the
// network). Ordered warmest → coldest. The investor's own firm is the chain
// end-org.
let _pathId = 9000;
const nextPathId = () => (_pathId += 1);

function fourCasePaths(firstName: string, firm: string, leadWithOrg = false): MockPath[] {
  const firmOrg = org(firm, `${LOGOS}/Framework.svg`);

  // Member known — PL-network founder.
  const memberKnown: Omit<MockPath, 'id' | 'rank'> = {
    proximity_code: 'F+1A',
    caliber_confidence: 0.9,
    score: 0.86,
    connector_type: 'F',
    explanation: `Alicia Mer (Modular Globe, PL portfolio) knows ${firstName} well and can broker a warm intro.`,
    chain: [PL, team('Modular Globe', 'modular-globe', '/icons/technology/filecoin.svg'), firmOrg],
    contact: {
      name: 'Alicia Mer',
      role: 'CEO & Co-founder',
      email: 'alicia@modularglobe.xyz',
      linkedin: 'alicia-mer',
      telegram: 'aliciamer',
      memberUid: 'alicia-mer',
      teams: [
        { name: 'Modular Globe', teamUid: 'modular-globe' },
        { name: 'NeuroBridge Labs', teamUid: 'neurobridge-labs' },
      ],
    },
  };

  // Organization unknown — external firm, person unknown.
  const orgUnknown: Omit<MockPath, 'id' | 'rank'> = {
    proximity_code: 'VC+1B',
    caliber_confidence: 0.55,
    score: 0.5,
    connector_type: 'VC',
    explanation: `Pico Ventures co-invests with ${firm}; someone there can broker an intro — we haven't identified who yet.`,
    chain: [PL, org('Pico Ventures', `${LOGOS}/Multicoin.svg`), firmOrg],
    orgConnector: {
      name: 'Pico Ventures',
      description: 'Reach out to the firm and ask to be routed to the partner who covers this mandate.',
      tags: ['Org connection', 'Person unknown'],
      email: 'intros@picoventures.com',
      website: 'picoventures.com',
    },
  };

  // Member unknown — known person, NOT in the PL network.
  const memberUnknown: Omit<MockPath, 'id' | 'rank'> = {
    proximity_code: 'VC+2B',
    caliber_confidence: 0.4,
    score: 0.42,
    connector_type: 'VC',
    explanation: `James Whitfield at Electric Capital has co-invested alongside ${firm}. He is not in the PL network, so reach out directly.`,
    chain: [PL, org('Electric Capital', `${LOGOS}/ElectricCapital.svg`), firmOrg],
    contact: {
      name: 'James Whitfield',
      role: 'Partner',
      email: 'james@electriccapital.com',
      linkedin: 'james-whitfield',
      teams: [{ name: 'Electric Capital', teamUid: 'electric-capital' }],
    },
  };

  // Warmest first. `leadWithOrg` surfaces the org-unknown node as the best path
  // (so it shows in the table) for the rows we want to demo it on.
  const ordered = leadWithOrg
    ? [orgUnknown, memberKnown, memberUnknown]
    : [memberKnown, orgUnknown, memberUnknown];
  return ordered.map((p, i) => ({ ...p, id: nextPathId(), rank: i + 1 }));
}

const BASE_MEMBERS: MockInvestor[] = [
  {
    investor_id: 'inv-lena',
    first_name: 'Lena',
    last_name: 'Hoffmann',
    email: 'lena@catalystbio.vc',
    email_status: 'verified',
    source: 'W26',
    linkedin_url: 'https://www.linkedin.com/in/lena-hoffmann',
    firm_domain: 'catalystbio.vc',
    geo_focus: 'US / EU',
    fund_thesis: 'Early-stage neurotech and computational biology with a translational angle.',
    aum_range: '100-500M',
    lab_os_profile: { type: 'member', uid: 'lena-hoffmann', slug: 'lena-hoffmann', name: 'Lena Hoffmann' },
    outreach: {
      touches: 4,
      opened: 3,
      clicked: 2,
      registered: 1,
      first_sent_date: '2025-11-02',
      last_sent_date: '2026-03-14',
    },
    firm: 'Catalyst Bio',
    title: 'Partner',
    sector_tags: ['neurotech', 'biotech'],
    stage_focus: 'seed',
    check_size_range: '1M-5M',
    investor_type: 'fund',
    engagement_tier: 'T2_clicked',
    relationship: 'co_invested',
    best_proximity_code: 'F+1A',
    has_path: true,
    list_ids: ['neuro-lp', 'gold'],
    paths: [
      {
        id: 101,
        rank: 1,
        proximity_code: 'F+1A',
        caliber_confidence: 0.92,
        score: 0.88,
        connector_type: 'F',
        explanation:
          'Alicia Mer co-founded Modular Globe (PL portfolio) and works closely with Mei Chen, who knows Lena well — a two-person founder route is the warmest path.',
        chain: [PL, team('Modular Globe', 'modular-globe', '/icons/technology/filecoin.svg'), org('Catalyst Bio', `${LOGOS}/Archetype.svg`)],
        contact: {
          name: 'Alicia Mer',
          role: 'CEO & Co-founder',
          email: 'alicia@modularglobe.xyz',
          linkedin: 'alicia-mer',
          telegram: 'aliciamer',
          memberUid: 'alicia-mer',
          // A connector can sit in several PL teams — shown as chips in the drawer.
          teams: [
            { name: 'Modular Globe', teamUid: 'modular-globe', logo: '/icons/technology/filecoin.svg' },
            { name: 'NeuroBridge Labs', teamUid: 'neurobridge-labs', logo: '/icons/technology/ipfs.svg' },
          ],
        },
        team: {
          name: 'Modular Globe',
          teamUid: 'modular-globe',
          leads: [
            { name: 'Mei Chen', role: 'Head of BD · Modular Globe', email: 'mei@modularglobe.xyz', linkedin: 'mei-chen', memberUid: 'mei-chen', teams: [{ name: 'Modular Globe', teamUid: 'modular-globe', logo: '/icons/technology/filecoin.svg' }] },
          ],
        },
      },
      {
        // Org-led: we know the firm can route an intro, but not WHO yet.
        id: 104,
        rank: 2,
        proximity_code: 'VC+1B',
        caliber_confidence: 0.6,
        score: 0.62,
        connector_type: 'VC',
        explanation: 'Pico Ventures co-invested in two Catalyst Bio rounds, so someone there can broker an intro to Lena — we just haven’t identified the specific partner yet.',
        chain: [PL, org('Pico Ventures', `${LOGOS}/Multicoin.svg`), org('Catalyst Bio', `${LOGOS}/Archetype.svg`)],
        orgConnector: {
          name: 'Pico Ventures',
          description: 'Reach out to the firm and ask to be routed to the partner who covers Catalyst Bio co-investments.',
          tags: ['Org connection', 'Person unknown'],
          email: 'intros@picoventures.com',
          website: 'picoventures.com',
        },
      },
      {
        id: 102,
        rank: 3,
        proximity_code: 'VC+2B',
        caliber_confidence: 0.61,
        score: 0.54,
        connector_type: 'VC',
        explanation: 'James Whitfield at Electric Capital has co-invested alongside Catalyst Bio and can broker an intro. He is not in the PL network, so reach out directly.',
        chain: [PL, org('Electric Capital', `${LOGOS}/ElectricCapital.svg`), org('Catalyst Bio', `${LOGOS}/Archetype.svg`)],
        contact: {
          name: 'James Whitfield',
          role: 'Partner',
          email: 'james@electriccapital.com',
          linkedin: 'james-whitfield',
          teams: [{ name: 'Electric Capital', teamUid: 'electric-capital' }],
        },
      },
      {
        id: 103,
        rank: 3,
        proximity_code: 'PL+2B',
        caliber_confidence: 0.4,
        score: 0.38,
        connector_type: 'PL',
        explanation: 'Rina Calabrese on the PL partnerships team has a second-degree relationship she can warm up.',
        chain: [PL, org('Catalyst Bio', `${LOGOS}/Archetype.svg`)],
        contact: {
          name: 'Rina Calabrese',
          role: 'Partnerships Lead · Protocol Labs',
          email: 'rina@protocol.ai',
          linkedin: 'rina-calabrese',
          memberUid: 'rina-calabrese',
        },
      },
    ],
  },
  {
    investor_id: 'inv-marcus',
    first_name: 'Marcus',
    last_name: 'True',
    email: 'marcus@vertexfrontier.com',
    email_status: 'verified',
    source: 'OpenVC',
    linkedin_url: 'https://www.linkedin.com/in/marcus-true',
    firm_domain: 'vertexfrontier.com',
    geo_focus: 'US',
    fund_thesis: 'Frontier AI, robotics, and the infrastructure layer underneath them.',
    aum_range: '500M-1B',
    lab_os_profile: null,
    outreach: {
      touches: 3,
      opened: 2,
      clicked: 1,
      registered: 0,
      first_sent_date: '2025-12-09',
      last_sent_date: '2026-02-20',
    },
    firm: 'Vertex Frontier',
    title: 'Principal',
    sector_tags: ['ai', 'robotics', 'infrastructure'],
    stage_focus: 'seed',
    check_size_range: '500K-1M',
    investor_type: 'fund',
    engagement_tier: 'T3_opened',
    relationship: 'co_invested',
    best_proximity_code: 'F+1A',
    has_path: true,
    list_ids: ['neuro-lp', 'gold'],
    paths: [
      {
        id: 201,
        rank: 1,
        proximity_code: 'F+1A',
        caliber_confidence: 0.9,
        score: 0.85,
        connector_type: 'F',
        explanation:
          'Devon Okoye founded Helios Robotics (PL portfolio). Vertex Frontier led the Helios seed, so Devon can intro Marcus directly.',
        chain: [PL, team('Helios Robotics', 'helios-robotics', '/icons/technology/ipfs.svg'), org('Vertex Frontier', `${LOGOS}/BlueYard.svg`)],
        contact: {
          name: 'Devon Okoye',
          role: 'CEO & Founder',
          email: 'devon@heliosrobotics.io',
          linkedin: 'devon-okoye',
          telegram: 'devonokoye',
          memberUid: 'devon-okoye',
          teams: [{ name: 'Helios Robotics', teamUid: 'helios-robotics' }],
        },
        team: {
          name: 'Helios Robotics',
          teamUid: 'helios-robotics',
          leads: [
            { name: 'Devon Okoye', role: 'CEO & Founder', email: 'devon@heliosrobotics.io', linkedin: 'devon-okoye', telegram: 'devonokoye', memberUid: 'devon-okoye' },
            { name: 'Sofia Marchetti', role: 'COO', email: 'sofia@heliosrobotics.io', linkedin: 'sofia-marchetti', memberUid: 'sofia-marchetti' },
          ],
        },
      },
      {
        id: 202,
        rank: 2,
        proximity_code: 'VC+1B',
        caliber_confidence: 0.7,
        score: 0.66,
        connector_type: 'VC',
        explanation: 'Co-invested with Multicoin Capital, who can pass along a warm note.',
        chain: [PL, org('Multicoin Capital', `${LOGOS}/Multicoin.svg`), org('Vertex Frontier', `${LOGOS}/BlueYard.svg`)],
        contact: { name: 'Nina Brandt', role: 'GP', email: 'nina@multicoin.capital', linkedin: 'nina-brandt', memberUid: 'nina-brandt', teams: [{ name: 'Multicoin Capital', teamUid: 'multicoin-capital' }] },
      },
      {
        id: 203,
        rank: 3,
        proximity_code: 'JB+2B',
        caliber_confidence: 0.5,
        score: 0.45,
        connector_type: 'JB',
        explanation: 'CoinFund co-invested alongside Vertex Frontier; a PL member there can broker the note.',
        chain: [PL, org('CoinFund', `${LOGOS}/CoinFund.svg`), org('Vertex Frontier', `${LOGOS}/BlueYard.svg`)],
        contact: { name: 'Theo Lindqvist', role: 'Partner', email: 'theo@coinfund.io', linkedin: 'theo-lindqvist', memberUid: 'theo-lindqvist', teams: [{ name: 'CoinFund', teamUid: 'coinfund' }] },
      },
      {
        id: 204,
        rank: 4,
        proximity_code: 'O+2B',
        caliber_confidence: 0.3,
        score: 0.31,
        connector_type: 'O',
        explanation: 'A weaker secondary route through a conference acquaintance.',
        chain: [PL, org('Vertex Frontier', `${LOGOS}/BlueYard.svg`)],
        contact: { name: 'Ada Brooks', role: 'Advisor', email: 'ada@brooks.partners', linkedin: 'ada-brooks', memberUid: 'ada-brooks', teams: [{ name: 'Vertex Frontier', teamUid: 'vertex-frontier' }] },
      },
    ],
  },
  {
    investor_id: 'inv-soren',
    first_name: 'Soren',
    last_name: 'Vibe',
    email: 'soren@northlight.capital',
    email_status: 'catch_all',
    source: 'Dealroom',
    linkedin_url: 'https://www.linkedin.com/in/soren-vibe',
    firm_domain: 'northlight.capital',
    geo_focus: 'EU',
    fund_thesis: 'Series A climate and frontier-tech with hardware depth.',
    aum_range: '1B+',
    lab_os_profile: null,
    outreach: {
      touches: 2,
      opened: 2,
      clicked: 1,
      registered: 0,
      first_sent_date: '2026-01-15',
      last_sent_date: '2026-04-02',
    },
    firm: 'Northlight Capital',
    title: 'General Partner',
    sector_tags: ['climate', 'frontier-tech'],
    stage_focus: 'series-a',
    check_size_range: '5M+',
    investor_type: 'fund',
    engagement_tier: 'T2_clicked',
    relationship: 'engaged',
    best_proximity_code: 'VC+1A',
    has_path: true,
    list_ids: ['neuro-lp'],
    paths: [
      {
        id: 301,
        rank: 1,
        proximity_code: 'VC+1A',
        caliber_confidence: 0.84,
        score: 0.79,
        connector_type: 'VC',
        explanation: 'Northlight co-led a round with Polychain Capital, a close PL co-investor — a strong VC intro.',
        chain: [PL, org('Polychain Capital', `${LOGOS}/PolychainCapital.svg`), org('Northlight Capital', `${LOGOS}/Framework.svg`)],
        contact: {
          name: 'Talia Rosen',
          role: 'Partner',
          email: 'talia@polychain.capital',
          linkedin: 'talia-rosen',
          memberUid: 'talia-rosen',
          teams: [{ name: 'Polychain Capital', teamUid: 'polychain-capital' }],
        },
      },
      {
        id: 302,
        rank: 2,
        proximity_code: 'F+2B',
        caliber_confidence: 0.55,
        score: 0.49,
        connector_type: 'F',
        explanation: 'Two hops via a founder Soren previously backed.',
        chain: [PL, team('Tidal Energy', 'tidal-energy', '/icons/technology/drand.svg'), org('Northlight Capital', `${LOGOS}/Framework.svg`)],
        contact: {
          name: 'Priya Anand',
          role: 'CEO & Founder',
          email: 'priya@tidalenergy.co',
          linkedin: 'priya-anand',
          telegram: 'priyaanand',
          memberUid: 'priya-anand',
          teams: [{ name: 'Tidal Energy', teamUid: 'tidal-energy' }],
        },
        team: {
          name: 'Tidal Energy',
          teamUid: 'tidal-energy',
          leads: [
            { name: 'Priya Anand', role: 'CEO & Founder', email: 'priya@tidalenergy.co', linkedin: 'priya-anand', telegram: 'priyaanand', memberUid: 'priya-anand' },
          ],
        },
      },
    ],
  },
  {
    investor_id: 'inv-priya',
    first_name: 'Priya',
    last_name: 'Nadar',
    email: 'priya.nadar@gmail.com',
    email_status: 'unverified',
    source: 'Exa',
    linkedin_url: 'https://www.linkedin.com/in/priya-nadar',
    geo_focus: 'US',
    fund_thesis: 'Pre-seed DeSci and biotech, writing small angel checks.',
    aum_range: 'unknown',
    lab_os_profile: null,
    outreach: {
      touches: 1,
      opened: 0,
      clicked: 0,
      registered: 0,
      first_sent_date: '2026-02-28',
      last_sent_date: '2026-02-28',
    },
    firm: 'Angel',
    title: 'Angel investor',
    // Sector not captured for this angel (shows "—"); stage is known.
    sector_tags: [],
    stage_focus: 'pre-seed',
    check_size_range: '<100K',
    investor_type: 'angel',
    engagement_tier: 'T4_cold',
    relationship: 'cold_match',
    best_proximity_code: 'JB+2B',
    has_path: true,
    list_ids: ['neuro-lp'],
    paths: [
      {
        id: 401,
        rank: 1,
        proximity_code: 'JB+2B',
        caliber_confidence: 0.48,
        score: 0.42,
        connector_type: 'JB',
        explanation: 'Sana Iqbal co-chairs a DeSci working group at Hashed with Priya and can make a soft intro.',
        chain: [PL, org('Hashed', `${LOGOS}/Hashed.svg`), org('Angel', `${LOGOS}/SVAngel.svg`)],
        contact: { name: 'Sana Iqbal', role: 'DeSci Lead', email: 'sana@hashed.com', linkedin: 'sana-iqbal', memberUid: 'sana-iqbal', teams: [{ name: 'Hashed', teamUid: 'hashed' }] },
      },
      {
        id: 402,
        rank: 2,
        proximity_code: 'F+2B',
        caliber_confidence: 0.4,
        score: 0.36,
        connector_type: 'F',
        explanation: 'Arjun Patel (Modular Globe, PL portfolio) knows Priya from a DeSci hackathon and can vouch.',
        chain: [PL, team('Modular Globe', 'modular-globe', '/icons/technology/filecoin.svg'), org('Angel', `${LOGOS}/SVAngel.svg`)],
        contact: {
          name: 'Arjun Patel',
          role: 'CTO & Co-founder',
          email: 'arjun@modularglobe.xyz',
          linkedin: 'arjun-patel',
          memberUid: 'arjun-patel',
          teams: [{ name: 'Modular Globe', teamUid: 'modular-globe', logo: '/icons/technology/filecoin.svg' }],
        },
      },
    ],
  },
  {
    investor_id: 'inv-hannah',
    first_name: 'Hannah',
    last_name: 'Berg',
    email: 'hannah@bergfamilyoffice.com',
    email_status: 'verified',
    source: 'Visible',
    linkedin_url: 'https://www.linkedin.com/in/hannah-berg',
    firm_domain: 'bergfamilyoffice.com',
    geo_focus: 'US / Global',
    fund_thesis: 'Later-stage climate and consumer; opportunistic family-office mandate.',
    aum_range: '1B+',
    lab_os_profile: null,
    outreach: {
      touches: 3,
      opened: 2,
      clicked: 0,
      registered: 0,
      first_sent_date: '2025-10-21',
      last_sent_date: '2026-03-30',
    },
    firm: 'Berg Family Office',
    title: 'Director of Investments',
    sector_tags: ['climate', 'consumer'],
    stage_focus: 'series-b+',
    check_size_range: '5M+',
    investor_type: 'family_office',
    engagement_tier: 'T3_opened',
    relationship: 'engaged',
    best_proximity_code: 'O+1B',
    has_path: true,
    list_ids: ['neuro-lp'],
    paths: [
      {
        // Org-led best path: we know the advisory firm can route an intro to the
        // Berg family office, but not which person — surfaces an org node in the table.
        id: 501,
        rank: 1,
        proximity_code: 'O+1B',
        caliber_confidence: 0.5,
        score: 0.5,
        connector_type: 'O',
        explanation: 'Stonebridge Advisors advises the Berg family office — someone there can make the intro, but we haven’t pinned down who yet.',
        chain: [PL, org('Stonebridge Advisors', `${LOGOS}/Eniac.svg`), org('Berg Family Office', `${LOGOS}/Eniac.svg`)],
        orgConnector: {
          name: 'Stonebridge Advisors',
          description: 'Reach out to the advisory firm and ask for the partner who covers the Berg mandate.',
          tags: ['Org connection', 'Person unknown'],
          email: 'intros@stonebridge.com',
          website: 'stonebridge.com',
        },
      },
      {
        id: 502,
        rank: 2,
        proximity_code: 'PL+2B',
        caliber_confidence: 0.36,
        score: 0.34,
        connector_type: 'PL',
        explanation: 'Rina Calabrese (PL partnerships) also has a second-degree line to the Berg office.',
        chain: [PL, org('Berg Family Office', `${LOGOS}/Eniac.svg`)],
        contact: { name: 'Rina Calabrese', role: 'Partnerships Lead', email: 'rina@protocol.ai', linkedin: 'rina-calabrese', memberUid: 'rina-calabrese' },
      },
    ],
  },
  {
    investor_id: 'inv-tomas',
    first_name: 'Tomás',
    last_name: 'Reyes',
    email: 'tomas@syndicate.xyz',
    email_status: 'catch_all',
    source: 'RootData',
    geo_focus: 'LATAM',
    fund_thesis: 'Seed gaming and crypto via a rolling syndicate.',
    aum_range: '<50M',
    lab_os_profile: null,
    outreach: {
      touches: 0,
      opened: 0,
      clicked: 0,
      registered: 0,
      first_sent_date: '',
      last_sent_date: '',
    },
    firm: 'Reyes Syndicate',
    title: 'Lead',
    // Sparse external record — no sector or stage captured yet (shows "—" in table).
    sector_tags: [],
    stage_focus: 'unknown',
    check_size_range: '100-500K',
    investor_type: 'syndicate',
    engagement_tier: 'T4_cold',
    relationship: 'cold_match',
    best_proximity_code: null,
    has_path: false,
    list_ids: ['neuro-lp'],
    paths: [],
  },
  {
    investor_id: 'inv-wei',
    first_name: 'Wei',
    last_name: 'Chen',
    email: 'wei@coinbase.com',
    email_status: 'verified',
    source: 'OpenVC',
    linkedin_url: 'https://www.linkedin.com/in/wei-chen',
    firm_domain: 'coinbase.com',
    geo_focus: 'US / Asia',
    fund_thesis: 'Crypto infrastructure and onchain consumer apps.',
    aum_range: '1B+',
    lab_os_profile: null,
    outreach: { touches: 3, opened: 2, clicked: 1, registered: 0, first_sent_date: '2025-12-01', last_sent_date: '2026-03-10' },
    firm: 'Coinbase Ventures',
    title: 'Investment Partner',
    sector_tags: ['crypto', 'infrastructure'],
    stage_focus: 'series-a',
    check_size_range: '1M-5M',
    investor_type: 'fund',
    engagement_tier: 'T2_clicked',
    relationship: 'co_invested',
    best_proximity_code: 'VC+1A',
    has_path: true,
    list_ids: ['neuro-lp', 'gold'],
    paths: [
      {
        id: 701,
        rank: 1,
        proximity_code: 'VC+1A',
        caliber_confidence: 0.86,
        score: 0.8,
        connector_type: 'VC',
        explanation: 'Coinbase Ventures co-invested with PL in two onchain-infra rounds — a direct partner intro is warm.',
        chain: [PL, org('Coinbase Ventures', `${LOGOS}/Coinbase.svg`), org('Coinbase Ventures', `${LOGOS}/Coinbase.svg`)],
        contact: {
          name: 'Priyanka Rao',
          role: 'Investment Partner',
          email: 'priyanka@coinbase.com',
          linkedin: 'priyanka-rao',
          memberUid: 'priyanka-rao',
          teams: [{ name: 'Coinbase Ventures', teamUid: 'coinbase-ventures' }],
        },
      },
      {
        id: 702,
        rank: 2,
        proximity_code: 'F+1B',
        caliber_confidence: 0.66,
        score: 0.6,
        connector_type: 'F',
        explanation: 'Devon Okoye (Helios Robotics, PL portfolio) raised from Coinbase Ventures and can intro Wei directly.',
        chain: [PL, team('Helios Robotics', 'helios-robotics', '/icons/technology/ipfs.svg'), org('Coinbase Ventures', `${LOGOS}/Coinbase.svg`)],
        contact: {
          name: 'Devon Okoye',
          role: 'CEO & Founder',
          email: 'devon@heliosrobotics.io',
          linkedin: 'devon-okoye',
          telegram: 'devonokoye',
          memberUid: 'devon-okoye',
          teams: [{ name: 'Helios Robotics', teamUid: 'helios-robotics', logo: '/icons/technology/ipfs.svg' }],
        },
      },
      {
        id: 703,
        rank: 3,
        proximity_code: 'VC+2B',
        caliber_confidence: 0.5,
        score: 0.45,
        connector_type: 'VC',
        explanation: 'Coinbase Ventures co-invested with Multicoin; a PL member there can pass a note.',
        chain: [PL, org('Multicoin Capital', `${LOGOS}/Multicoin.svg`), org('Coinbase Ventures', `${LOGOS}/Coinbase.svg`)],
        contact: { name: 'Nina Brandt', role: 'GP', email: 'nina@multicoin.capital', linkedin: 'nina-brandt', memberUid: 'nina-brandt', teams: [{ name: 'Multicoin Capital', teamUid: 'multicoin-capital' }] },
      },
    ],
  },
  {
    investor_id: 'inv-lukas',
    first_name: 'Lukas',
    last_name: 'Brandt',
    email: 'lukas@galaxy.com',
    email_status: 'verified',
    source: 'Dealroom',
    linkedin_url: 'https://www.linkedin.com/in/lukas-brandt',
    firm_domain: 'galaxy.com',
    geo_focus: 'EU',
    fund_thesis: 'Digital assets, mining, and compute infrastructure.',
    aum_range: '1B+',
    lab_os_profile: null,
    outreach: { touches: 2, opened: 1, clicked: 0, registered: 0, first_sent_date: '2026-01-20', last_sent_date: '2026-02-15' },
    firm: 'Galaxy',
    title: 'Principal',
    sector_tags: ['crypto', 'infrastructure'],
    stage_focus: 'series-b+',
    check_size_range: '5M+',
    investor_type: 'fund',
    engagement_tier: 'T3_opened',
    relationship: 'engaged',
    best_proximity_code: 'F+2B',
    has_path: true,
    list_ids: ['neuro-lp'],
    paths: [
      {
        id: 801,
        rank: 1,
        proximity_code: 'F+2B',
        caliber_confidence: 0.58,
        score: 0.52,
        connector_type: 'F',
        explanation: 'Maya Chen (Modular Globe, PL portfolio) previously raised from Galaxy and can broker an intro to Lukas.',
        chain: [PL, team('Modular Globe', 'modular-globe', '/icons/technology/filecoin.svg'), org('Galaxy', `${LOGOS}/Galaxy.svg`)],
        contact: {
          name: 'Maya Chen',
          role: 'CEO & Co-founder',
          email: 'maya@modularglobe.xyz',
          linkedin: 'maya-chen',
          telegram: 'mayachen',
          memberUid: 'maya-chen',
          // A connector can sit in several PL teams — shown as chips in the drawer.
          teams: [
            { name: 'Modular Globe', teamUid: 'modular-globe', logo: '/icons/technology/filecoin.svg' },
            { name: 'NeuroBridge Labs', teamUid: 'neurobridge-labs', logo: '/icons/technology/ipfs.svg' },
          ],
        },
        team: {
          name: 'Modular Globe',
          teamUid: 'modular-globe',
          leads: [
            { name: 'Maya Chen', role: 'CEO & Co-founder', email: 'maya@modularglobe.xyz', linkedin: 'maya-chen', telegram: 'mayachen', memberUid: 'maya-chen', teams: [{ name: 'Modular Globe', teamUid: 'modular-globe', logo: '/icons/technology/filecoin.svg' }, { name: 'NeuroBridge Labs', teamUid: 'neurobridge-labs', logo: '/icons/technology/ipfs.svg' }] },
            { name: 'Arjun Patel', role: 'CTO & Co-founder', email: 'arjun@modularglobe.xyz', linkedin: 'arjun-patel', memberUid: 'arjun-patel', teams: [{ name: 'Modular Globe', teamUid: 'modular-globe', logo: '/icons/technology/filecoin.svg' }] },
          ],
        },
      },
      {
        id: 802,
        rank: 2,
        proximity_code: 'VC+2B',
        caliber_confidence: 0.5,
        score: 0.44,
        connector_type: 'VC',
        explanation: 'Galaxy co-invested with CoinFund, a PL co-investor who can pass along a warm note.',
        chain: [PL, org('CoinFund', `${LOGOS}/CoinFund.svg`), org('Galaxy', `${LOGOS}/Galaxy.svg`)],
        contact: { name: 'Owen Park', role: 'General Partner', email: 'owen@coinfund.io', linkedin: 'owen-park', memberUid: 'owen-park', teams: [{ name: 'CoinFund', teamUid: 'coinfund' }] },
      },
    ],
  },
  {
    investor_id: 'inv-sofiak',
    first_name: 'Sofia',
    last_name: 'Klein',
    email: 'sofia@panteracapital.com',
    email_status: 'unverified',
    source: 'RootData',
    linkedin_url: 'https://www.linkedin.com/in/sofia-klein',
    firm_domain: 'panteracapital.com',
    geo_focus: 'US',
    fund_thesis: 'Early-stage crypto and frontier compute.',
    aum_range: '1B+',
    lab_os_profile: null,
    outreach: { touches: 0, opened: 0, clicked: 0, registered: 0, first_sent_date: '', last_sent_date: '' },
    firm: 'Pantera Capital',
    title: 'Partner',
    sector_tags: ['crypto', 'frontier-tech'],
    stage_focus: 'seed',
    check_size_range: '1M-5M',
    investor_type: 'fund',
    engagement_tier: 'T4_cold',
    relationship: 'cold_match',
    best_proximity_code: null,
    has_path: false,
    list_ids: ['neuro-lp'],
    paths: [],
  },
  {
    investor_id: 'inv-dmitri',
    first_name: 'Dmitri',
    last_name: 'Sokolov',
    email: 'dmitri@jumpcrypto.com',
    email_status: 'catch_all',
    source: 'Exa',
    linkedin_url: 'https://www.linkedin.com/in/dmitri-sokolov',
    firm_domain: 'jumpcrypto.com',
    geo_focus: 'Global',
    fund_thesis: 'Market infrastructure, trading, and protocol-level bets.',
    aum_range: '1B+',
    lab_os_profile: null,
    outreach: { touches: 1, opened: 1, clicked: 0, registered: 0, first_sent_date: '2026-02-05', last_sent_date: '2026-02-05' },
    firm: 'Jump Crypto',
    title: 'Vice President',
    sector_tags: ['crypto', 'ai'],
    stage_focus: 'series-a',
    check_size_range: '5M+',
    investor_type: 'fund',
    engagement_tier: 'T3_opened',
    relationship: 'engaged',
    best_proximity_code: 'VC+2B',
    has_path: true,
    list_ids: ['neuro-lp'],
    paths: [
      {
        id: 1001,
        rank: 1,
        proximity_code: 'VC+2B',
        caliber_confidence: 0.5,
        score: 0.46,
        connector_type: 'VC',
        explanation: 'Two hops out via a shared LP that co-invests with Jump — a softer VC route.',
        chain: [PL, org('Jump Crypto', `${LOGOS}/Jump.svg`), org('Jump Crypto', `${LOGOS}/Jump.svg`)],
        contact: {
          name: 'Elena Fischer',
          role: 'Partner',
          email: 'elena@jumpcrypto.com',
          linkedin: 'elena-fischer',
          teams: [{ name: 'Jump Crypto', teamUid: 'jump-crypto' }],
        },
      },
      {
        id: 1002,
        rank: 2,
        proximity_code: 'F+1B',
        caliber_confidence: 0.62,
        score: 0.55,
        connector_type: 'F',
        explanation: 'Priya Anand (Tidal Energy, PL portfolio) previously raised from Jump and can broker an intro.',
        chain: [PL, team('Tidal Energy', 'tidal-energy', '/icons/technology/drand.svg'), org('Jump Crypto', `${LOGOS}/Jump.svg`)],
        contact: {
          name: 'Priya Anand',
          role: 'CEO & Founder',
          email: 'priya@tidalenergy.co',
          linkedin: 'priya-anand',
          telegram: 'priyaanand',
          memberUid: 'priya-anand',
          teams: [{ name: 'Tidal Energy', teamUid: 'tidal-energy', logo: '/icons/technology/drand.svg' }],
        },
      },
    ],
  },
  {
    investor_id: 'inv-yuki',
    first_name: 'Yuki',
    last_name: 'Tanaka',
    email: 'yuki@northstar.vc',
    email_status: 'verified',
    source: 'OpenVC',
    linkedin_url: 'https://www.linkedin.com/in/yuki-tanaka',
    firm_domain: 'northstar.vc',
    geo_focus: 'Asia',
    fund_thesis: 'Seed deep-tech and neurotech across APAC.',
    aum_range: '500M-1B',
    lab_os_profile: null,
    outreach: { touches: 1, opened: 1, clicked: 0, registered: 0, first_sent_date: '2026-02-10', last_sent_date: '2026-02-10' },
    firm: 'Northstar Ventures',
    title: 'Partner',
    sector_tags: ['neurotech', 'frontier-tech'],
    stage_focus: 'seed',
    check_size_range: '1M-5M',
    investor_type: 'fund',
    engagement_tier: 'T3_opened',
    relationship: 'engaged',
    best_proximity_code: 'F+1B',
    has_path: true,
    list_ids: ['neuro-lp'],
    paths: [
      {
        // Org-led, but the org is a PL-network TEAM: logo + clickable to its
        // profile, person still unknown.
        id: 1101,
        rank: 1,
        proximity_code: 'F+1B',
        caliber_confidence: 0.6,
        score: 0.6,
        connector_type: 'F',
        explanation:
          'Modular Globe (PL portfolio) is connected to Yuki — open the team to find the right person to broker the intro.',
        chain: [PL, team('Modular Globe', 'modular-globe', '/icons/technology/filecoin.svg'), org('Northstar Ventures', `${LOGOS}/BlueYard.svg`)],
        orgConnector: {
          name: 'Modular Globe',
          teamUid: 'modular-globe',
          logo: '/icons/technology/filecoin.svg',
          description: 'A Modular Globe team member can broker the intro — open the team profile to find who.',
          tags: ['Team connection', 'Person unknown'],
          email: 'team@modularglobe.xyz',
          website: 'modularglobe.xyz',
        },
      },
    ],
  },
];

// Standardize: every investor that has a path shows the three connector cases
// (member known · org unknown · member unknown). Cold investors (no path) are
// left untouched. best_proximity_code is pinned to the warmest case so the table
// badge matches the drawer's best path.
// These rows lead with the org-unknown node (so it surfaces in the table) — they
// land at the 2nd (Brandt) and 4th (Hoffmann) rows once proximity ties and the
// table sorts by last name.
const ORG_LEAD_ROWS = new Set(['inv-lukas', 'inv-lena']);
export const MOCK_MEMBERS: MockInvestor[] = BASE_MEMBERS.map((m) =>
  m.has_path
    ? { ...m, best_proximity_code: 'F+1A', paths: fourCasePaths(m.first_name, m.firm, ORG_LEAD_ROWS.has(m.investor_id)) }
    : m,
);
