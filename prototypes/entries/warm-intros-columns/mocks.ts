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

/** Explicit node-state description of a route — the full picture the client
 *  asked for: `Protocol Labs → [Mediator] → Investor`, where the PL node and
 *  the (optional) Mediator are each KNOWN (a named person) or UNKNOWN. When a
 *  path carries `route` it drives both the chain and the drawer; otherwise the
 *  route is derived from the legacy `contact` / `orgConnector` fields so every
 *  row renders the same shape. */
export type RoutePl =
  | { known: false }
  | (ContactPerson & {
      known: true;
      /** 0–1 strength of this PL person's tie to the next node. */
      tie?: number;
      /** Recency of last contact, e.g. "~8 months ago". */
      lastContact?: string;
    });
export type RouteMediator =
  | { known: false; team: TeamLink }
  | (ContactPerson & { known: true; team?: TeamLink });
export type PathRoute = { pl: RoutePl; mediator?: RouteMediator };

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
  /** Explicit node-state route (PL → [Mediator] → Investor). When set it drives
   *  the chain + drawer; otherwise the route is derived from the fields above. */
  route?: PathRoute;
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
  /** This node is the Protocol Labs side of the route. On a known PL person it
   *  renders the "PL" marker; combined with `plUnknown` it's the generic node. */
  pl?: boolean;
  /** PL node where we DON'T know the specific person → "Protocol Labs ?". */
  plUnknown?: boolean;
  /** Relationship-quality stat on a known PL node: tie strength + last contact. */
  tie?: number;
  lastContact?: string;
  /** For an `org` node used as a pass-through intermediary on a hop path: skip
   *  the "person unknown" (?) badge — we're routing THROUGH it, not asking who. */
  hideUnknown?: boolean;
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
  /** Additional emails — the primary shows inline, the rest behind "+N more". */
  emails?: string[];
  firm: string;
  /** Teams the investor belongs to (mirrors the founder inline-team pattern). */
  teams?: TeamLink[];
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
  /** Affinity: LP funnel stage (e.g. "Target / Enriched", "2+ Meetings Held") —
   *  shown as a status pill in the header pill row. */
  lp_stage?: string;
  /** Affinity: last contact / last email date — shown in the outreach date row. */
  last_contact?: string;
  /** Affinity: Key Contact / Relationship owner — the internal PL person who owns
   *  this relationship. Shown as a row in the Investor profile section. */
  relationship_owner?: { name: string; memberUid?: string };
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

/** A path's node-state route — explicit when authored, otherwise derived from
 *  the legacy connector fields so every row renders the same
 *  `Protocol Labs → [Mediator] → Investor` shape. A PL-rolodex connector IS the
 *  PL node; any other connector is the mediator, with the PL person unknown. */
export function resolveRoute(path: MockPath): PathRoute {
  if (path.route) return path.route;
  if (path.connector_type === 'PL' && path.contact) {
    return { pl: { known: true, ...path.contact } };
  }
  let mediator: RouteMediator | undefined;
  if (path.contact) {
    mediator = { known: true, ...path.contact, team: path.contact.teams?.[0] };
  } else if (path.orgConnector) {
    mediator = {
      known: false,
      team: { name: path.orgConnector.name, teamUid: path.orgConnector.teamUid, logo: path.orgConnector.logo },
    };
  }
  return { pl: { known: false }, mediator };
}

function personRouteNode(p: ContactPerson, extra?: Partial<RouteNode>): RouteNode {
  return { label: p.name, memberUid: p.memberUid, variant: p.memberUid ? 'member' : 'external', ...extra };
}
function teamRouteNode(t: TeamLink): RouteNode {
  return { label: t.name, teamUid: t.teamUid, logo: t.logo, variant: 'org' };
}
function plRouteNode(pl: RoutePl): RouteNode {
  if (pl.known) return personRouteNode(pl, { pl: true, tie: pl.tie, lastContact: pl.lastContact });
  return { label: 'Protocol Labs', variant: 'org', pl: true, plUnknown: true, logo: PL.logo };
}

/** The full people-first route: `PL → [Mediator] → Investor`. Two nodes when
 *  direct, three when a mediator bridges the connection. */
export function pathChainNodes(path: MockPath, inv: MockInvestor): RouteNode[] {
  const route = resolveRoute(path);
  const nodes: RouteNode[] = [plRouteNode(route.pl)];
  if (route.mediator) nodes.push(route.mediator.known ? personRouteNode(route.mediator) : teamRouteNode(route.mediator.team));
  nodes.push(investorNode(inv));
  return nodes;
}

/** Directness is the node count made plain: a mediator in the middle = one party
 *  in between, no mediator = a direct PL → investor tie. Derived from the route
 *  so the word can never disagree with the chain. */
export function pathDirectness(path: MockPath): 'Direct' | '' {
  // Only flag the special "direct" case; the chain itself conveys the hop.
  return resolveRoute(path).mediator ? '' : 'Direct';
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
    explanation: `We don't know who at Pico Ventures can connect yet — they co-invest with ${firm}, so reach out to the team and ask for the right partner.`,
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

// ── Feature 1 data: PL team members who can personally route an intro ─────────
// "Quick filter by team member" pivots on the PL-side (FIRST) node of a path.
// These are the people the chips in `ConnectorRail` filter by; a generic row is
// given a direct PL→investor path led by one of them so the dimension is real.
const PL_CONNECTORS: ContactPerson[] = [
  { name: 'Brad Holden', role: 'Investment Partner · Protocol Labs', email: 'brad@protocol.ai', linkedin: 'brad-holden', memberUid: 'brad-holden' },
  { name: 'Marc Johnson', role: 'Partner · Protocol Labs', email: 'marc@protocol.ai', linkedin: 'marc-johnson', memberUid: 'marc-johnson' },
  { name: 'Lacey Wisdom', role: 'Partnerships Lead · Protocol Labs', email: 'lacey@protocol.ai', linkedin: 'lacey-wisdom', memberUid: 'lacey-wisdom' },
  { name: 'Charlotte Kapoor', role: 'Investor Relations · Protocol Labs', email: 'charlotte@protocol.ai', linkedin: 'charlotte-kapoor', memberUid: 'charlotte-kapoor' },
];

// A direct `PL → investor` path whose FIRST node is a named PL teammate. The
// `route.pl.known` person is what Feature 1's `matchesFirstNode` filters on.
function plConnectorPath(pl: ContactPerson, inv: MockInvestor): MockPath {
  return {
    id: nextPathId(),
    rank: 0,
    proximity_code: 'PL+1A',
    caliber_confidence: 0.92,
    score: 0.9,
    connector_type: 'PL',
    explanation: `${pl.name} on the PL investment team is in direct contact with ${inv.first_name} — ask them to make the intro.`,
    chain: [PL, org(inv.firm, `${LOGOS}/Framework.svg`)],
    route: { pl: { known: true, ...pl, tie: 0.6, lastContact: '~2 weeks ago' } },
    contact: pl,
  };
}

// ── Feature 2 data: portfolio founders who can broker intros ──────────────────
// A deliberately LARGE roster — the founders directory is meant to scale to "lots
// of them". `foundersForInvestor` spreads them so a couple of hubs cover many
// investors and a long tail covers one or two (a realistic coverage gradient).
const MG = { name: 'Modular Globe', teamUid: 'modular-globe', logo: '/icons/technology/filecoin.svg' };
const HR = { name: 'Helios Robotics', teamUid: 'helios-robotics' };
const TE = { name: 'Tidal Energy', teamUid: 'tidal-energy' };
const FOUNDERS: ContactPerson[] = [
  { name: 'Alicia Mer', role: 'CEO & Co-founder · Modular Globe', email: 'alicia@modularglobe.xyz', linkedin: 'alicia-mer', telegram: 'aliciamer', memberUid: 'alicia-mer', teams: [MG] },
  { name: 'Devon Okoye', role: 'CEO & Founder · Helios Robotics', email: 'devon@heliosrobotics.io', linkedin: 'devon-okoye', telegram: 'devonokoye', memberUid: 'devon-okoye', teams: [HR] },
  { name: 'Priya Anand', role: 'CEO & Founder · Tidal Energy', email: 'priya@tidalenergy.co', memberUid: 'priya-anand', teams: [TE] },
  { name: 'Maya Chen', role: 'CEO & Co-founder · Modular Globe', email: 'maya@modularglobe.xyz', linkedin: 'maya-chen', memberUid: 'maya-chen', teams: [MG] },
  { name: 'Arjun Patel', role: 'CTO & Co-founder · Modular Globe', email: 'arjun@modularglobe.xyz', linkedin: 'arjun-patel', memberUid: 'arjun-patel', teams: [MG] },
  { name: 'Sofia Marchetti', role: 'COO · Helios Robotics', email: 'sofia@heliosrobotics.io', memberUid: 'sofia-marchetti', teams: [HR] },
  { name: 'Liam Novak', role: 'CEO & Founder · Aether Compute', email: 'liam@aethercompute.ai', linkedin: 'liam-novak', memberUid: 'liam-novak', teams: [{ name: 'Aether Compute', teamUid: 'aether-compute' }] },
  { name: 'Hana Park', role: 'CEO & Co-founder · Aether Compute', email: 'hana@aethercompute.ai', memberUid: 'hana-park', teams: [{ name: 'Aether Compute', teamUid: 'aether-compute' }] },
  { name: 'Mateo Rossi', role: 'CEO & Founder · Verdant Bio', email: 'mateo@verdantbio.com', linkedin: 'mateo-rossi', memberUid: 'mateo-rossi', teams: [{ name: 'Verdant Bio', teamUid: 'verdant-bio' }] },
  { name: 'Zoe Bennett', role: 'CSO & Co-founder · Verdant Bio', email: 'zoe@verdantbio.com', memberUid: 'zoe-bennett', teams: [{ name: 'Verdant Bio', teamUid: 'verdant-bio' }] },
  { name: 'Omar Haddad', role: 'CEO & Founder · Northwind Robotics', email: 'omar@northwind.io', linkedin: 'omar-haddad', memberUid: 'omar-haddad', teams: [{ name: 'Northwind Robotics', teamUid: 'northwind-robotics' }] },
  { name: 'Ingrid Sól', role: 'CEO & Founder · Glacier Grid', email: 'ingrid@glaciergrid.energy', memberUid: 'ingrid-sol', teams: [{ name: 'Glacier Grid', teamUid: 'glacier-grid' }] },
  { name: 'Kenji Watanabe', role: 'CEO & Co-founder · Lumen Photonics', email: 'kenji@lumenphotonics.com', linkedin: 'kenji-watanabe', memberUid: 'kenji-watanabe', teams: [{ name: 'Lumen Photonics', teamUid: 'lumen-photonics' }] },
  { name: 'Fatima Al-Rashid', role: 'CTO & Co-founder · Lumen Photonics', email: 'fatima@lumenphotonics.com', memberUid: 'fatima-al-rashid', teams: [{ name: 'Lumen Photonics', teamUid: 'lumen-photonics' }] },
];

// Realistic shape: in the real graph it's MOSTLY one founder per investor — a
// founder typically knows one of your targets — rarely two or three, across a
// roster of hundreds. So each investor gets one distinct founder; a few get 2,
// one gets 3. Coverage per founder stays near 1 (the directory is long + flat,
// not a hub gradient).
function foundersForInvestor(i: number): ContactPerson[] {
  const F = FOUNDERS;
  const out = [F[i % F.length]];
  if (i === 7) out.push(F[11], F[12]); // the rare investor reachable via 3 founders
  else if (i % 4 === 0) out.push(F[(i + 7) % F.length]); // a few reachable via 2
  return out;
}

// A founder-brokered `PL → team → investor` path. Coverage groups these by founder.
function founderPath(f: ContactPerson, inv: MockInvestor): MockPath {
  const t = f.teams?.[0];
  return {
    id: nextPathId(),
    rank: 0,
    proximity_code: 'F+1A',
    caliber_confidence: 0.88,
    score: 0.72,
    connector_type: 'F',
    explanation: `${f.name} (${t?.name ?? 'PL portfolio'}) knows ${inv.first_name} and can broker a warm intro.`,
    chain: [PL, ...(t?.teamUid ? [team(t.name, t.teamUid, t.logo)] : []), org(inv.firm, `${LOGOS}/Framework.svg`)],
    contact: f,
  };
}

const BASE_MEMBERS: MockInvestor[] = [
  {
    investor_id: 'inv-lena',
    first_name: 'Lena',
    last_name: 'Hoffmann',
    email: 'lena@catalystbio.vc',
    emails: ['lena@catalystbio.vc', 'l.hoffmann@catalyst.bio', 'lena.hoffmann@gmail.com'],
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
    teams: [
      { name: 'Catalyst Bio', teamUid: 'catalyst-bio' },
      { name: 'BioDAO', teamUid: 'biodao' },
      { name: 'Longevity Fund' },
    ],
    title: 'Partner',
    sector_tags: ['neurotech', 'biotech'],
    stage_focus: 'seed',
    check_size_range: '1M-5M',
    investor_type: 'fund',
    engagement_tier: 'T2_clicked',
    relationship: 'co_invested',
    best_proximity_code: 'PL+1A',
    has_path: true,
    list_ids: ['neuro-lp', 'gold'],
    paths: [
      {
        // DIRECT path: the connector is a Protocol Labs INSIDER (Brad Holden)
        // who knows Lena first-hand. Renders "Brad Holden ᴾᴸ → Lena" with a PL
        // marker; the `PL+1A` code (1 hop) drives the "Direct" label.
        id: 100,
        rank: 1,
        proximity_code: 'PL+1A',
        caliber_confidence: 0.95,
        score: 0.95,
        connector_type: 'PL',
        explanation:
          'Brad Holden on the PL partnerships team has been in direct contact with Lena — ask him to make the intro. Direct PL tie, no mediator needed.',
        chain: [PL, org('Catalyst Bio', `${LOGOS}/Archetype.svg`)],
        // CASE D1 — PL known → Investor (direct). We know the name (Daniel) but
        // he has no LabOS profile, so the chip is name-only. Carries the tie stat.
        route: {
          pl: {
            known: true,
            name: 'Brad Holden',
            role: 'Partner · Protocol Labs',
            email: 'brad@protocol.ai',
            linkedin: 'brad-holden',
            tie: 0.62,
            lastContact: '~3 weeks ago',
          },
        },
        contact: {
          name: 'Brad Holden',
          role: 'Partner · Protocol Labs',
          email: 'brad@protocol.ai',
          linkedin: 'brad-holden',
        },
      },
      {
        // HOP path (2 hops): you contact James, who routes through QuickNode (a
        // company he and Catalyst Bio both backed) to reach Lena. Renders THREE
        // nodes — "James Whitfield → QuickNode → Lena" — and the `VC+2B` code
        // drives the "1 in between" label. Kept at rank 2 so the drawer shows a
        // Direct and a Hop side by side.
        id: 102,
        rank: 2,
        proximity_code: 'VC+2B',
        caliber_confidence: 0.61,
        score: 0.8,
        connector_type: 'VC',
        explanation:
          'James Whitfield (Electric Capital) co-invested with Catalyst Bio in QuickNode — that shared deal is the bridge to Lena. He is not in the PL network, so reach out to him directly.',
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
        id: 101,
        rank: 3,
        proximity_code: 'F+1A',
        caliber_confidence: 0.92,
        score: 0.72,
        connector_type: 'F',
        explanation:
          'Alicia Mer co-founded Modular Globe (PL portfolio) and knows Lena well — a direct portfolio-founder intro.',
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
        id: 103,
        rank: 5,
        proximity_code: 'PL+2B',
        caliber_confidence: 0.4,
        score: 0.38,
        connector_type: 'PL',
        explanation: 'Lacey Wisdom on the PL partnerships team has a second-degree relationship she can warm up.',
        chain: [PL, org('Catalyst Bio', `${LOGOS}/Archetype.svg`)],
        contact: {
          name: 'Lacey Wisdom',
          role: 'Partnerships Lead · Protocol Labs',
          email: 'lacey@protocol.ai',
          linkedin: 'lacey-wisdom',
          memberUid: 'lacey-wisdom',
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
    best_proximity_code: 'VC+1B',
    has_path: true,
    list_ids: ['neuro-lp', 'gold'],
    paths: [
      {
        id: 201,
        rank: 1,
        proximity_code: 'VC+1B',
        caliber_confidence: 0.9,
        score: 0.85,
        connector_type: 'VC',
        explanation:
          'PL co-invested with Vertex Frontier, so someone at PL has a direct line to Marcus — we just haven’t identified who yet.',
        chain: [PL, org('Vertex Frontier', `${LOGOS}/BlueYard.svg`)],
        // CASE D2 — PL unknown → Investor (direct). We know PL can reach Marcus
        // directly, but not which teammate → "Protocol Labs ?" with no mediator.
        route: { pl: { known: false } },
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
    lab_os_profile: { type: 'member', uid: 'soren-vibe', slug: 'soren-vibe', name: 'Soren Vibe' },
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
    best_proximity_code: 'VC+2A',
    has_path: true,
    list_ids: ['neuro-lp'],
    paths: [
      {
        id: 301,
        rank: 1,
        proximity_code: 'VC+2A',
        caliber_confidence: 0.84,
        score: 0.79,
        connector_type: 'VC',
        explanation:
          'Charlotte Kapoor at PL co-invested alongside Talia Rosen (Polychain Capital), who can broker the intro to Soren.',
        chain: [PL, org('Polychain Capital', `${LOGOS}/PolychainCapital.svg`), org('Northlight Capital', `${LOGOS}/Framework.svg`)],
        // CASE I1 — PL known → Mediator known → Investor. Both middle people named;
        // the PL node carries a weak/stale tie stat (amber).
        route: {
          pl: {
            known: true,
            name: 'Charlotte Kapoor',
            role: 'Investments · Protocol Labs',
            email: 'charlotte@protocol.ai',
            tie: 0.4,
            lastContact: '~8 months ago',
          },
          mediator: {
            known: true,
            name: 'Talia Rosen',
            role: 'Partner · Polychain Capital',
            email: 'talia@polychain.capital',
            linkedin: 'talia-rosen',
            memberUid: 'talia-rosen',
            team: { name: 'Polychain Capital', teamUid: 'polychain-capital' },
          },
        },
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
        explanation:
          'We don’t know who at Hashed can connect yet — Lacey Wisdom (PL) can route through Hashed (it co-invests with Priya), so reach out to the team and ask.',
        chain: [PL, org('Hashed', `${LOGOS}/Hashed.svg`), org('Angel', `${LOGOS}/SVAngel.svg`)],
        // CASE I4 — PL known → Mediator UNKNOWN → Investor. We know the PL person
        // (Rina) but only the mediator's team (Hashed), not who there.
        route: {
          pl: {
            known: true,
            name: 'Lacey Wisdom',
            role: 'Partnerships · Protocol Labs',
            email: 'lacey@protocol.ai',
            tie: 0.55,
            lastContact: '~2 months ago',
          },
          mediator: { known: false, team: { name: 'Hashed', teamUid: 'hashed', logo: `${LOGOS}/Hashed.svg` } },
        },
        orgConnector: {
          name: 'Hashed',
          description: 'Reach out to Hashed and ask for the partner who covers the DeSci mandate.',
          tags: ['Org connection', 'Person unknown'],
          email: 'intros@hashed.com',
          website: 'hashed.com',
        },
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
    best_proximity_code: 'O+2B',
    has_path: true,
    list_ids: ['neuro-lp'],
    paths: [
      {
        // CASE I3 — PL unknown → Mediator unknown → Investor (derived). We only
        // know the advisory firm can route to the Berg office; neither the PL
        // person nor the Stonebridge person is identified.
        id: 501,
        rank: 1,
        proximity_code: 'O+2B',
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
        explanation: 'Lacey Wisdom (PL partnerships) also has a second-degree line to the Berg office.',
        chain: [PL, org('Berg Family Office', `${LOGOS}/Eniac.svg`)],
        contact: { name: 'Lacey Wisdom', role: 'Partnerships Lead', email: 'lacey@protocol.ai', linkedin: 'lacey-wisdom', memberUid: 'lacey-wisdom' },
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
        explanation:
          'Elena Fischer routes through Galaxy Digital — a shared LP that co-invests with Jump — to reach Dmitri. Two hops out, a softer VC route.',
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
const ORG_LEAD_ROWS = new Set(['inv-lukas']);
// These investors carry hand-authored routes that demonstrate the six PL/mediator
// states — they must KEEP their own paths, not get the generic factory ones.
const SHOWCASE_ROWS = new Set(['inv-lena', 'inv-marcus', 'inv-soren', 'inv-priya', 'inv-hannah', 'inv-dmitri']);
// Demo-only: give every investor multiple emails + teams so the "+N more" pattern
// is visible on any drawer (real data would come from the API). Derived from the
// investor's own name/firm, with a varied extra affiliation per investor. Any
// investor that already declares `emails`/`teams` (e.g. Lena) keeps its own.
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const EXTRA_AFFILIATIONS: TeamLink[] = [
  { name: 'Crypto Founders Circle', teamUid: 'crypto-founders-circle' },
  { name: 'Web3 Capital Collective', teamUid: 'web3-capital-collective' },
  { name: 'Frontier LP Syndicate', teamUid: 'frontier-lp-syndicate' },
  { name: 'Deep Tech Angels', teamUid: 'deep-tech-angels' },
  { name: 'Longevity Fund' },
];

// Affinity LP funnel stages + last-contact dates, assigned deterministically per
// investor so the demo shows a spread.
const LP_STAGES = ['Target / Enriched', 'Contacted', '2+ Meetings Held', 'Diligence', 'Committed'];
const LAST_CONTACTS = ['2026-05-28', '2026-05-12', '2026-04-30', '2026-06-10', '2026-03-22'];

// Internal PL relationship owners (Key Contact) — some link to a member profile.
const RELATIONSHIP_OWNERS: { name: string; memberUid?: string }[] = [
  { name: 'Maya Lindqvist', memberUid: 'maya-lindqvist' },
  { name: 'Brad Holden', memberUid: 'brad-holden' },
  { name: 'Priya Anand', memberUid: 'priya-anand' },
  { name: 'Tomas Reyes' },
  { name: 'Wei Chen', memberUid: 'wei-chen' },
];

function seedContacts(inv: MockInvestor, i: number): MockInvestor {
  const first = inv.first_name.toLowerCase();
  const last = inv.last_name.toLowerCase();
  const emails =
    inv.emails ??
    [
      inv.email,
      inv.firm_domain ? `${first}.${last}@${inv.firm_domain}` : `${first}.${last}@gmail.com`,
      `${first}${last}@proton.me`,
    ].filter((e, idx, arr) => arr.indexOf(e) === idx);
  const isAngel = !inv.firm || inv.firm.toLowerCase() === 'angel';
  const teams =
    inv.teams ??
    (isAngel
      ? [EXTRA_AFFILIATIONS[i % EXTRA_AFFILIATIONS.length]]
      : [{ name: inv.firm, teamUid: slugify(inv.firm) }, EXTRA_AFFILIATIONS[i % EXTRA_AFFILIATIONS.length]]);
  const lp_stage = inv.lp_stage ?? LP_STAGES[i % LP_STAGES.length];
  const last_contact = inv.last_contact ?? LAST_CONTACTS[i % LAST_CONTACTS.length];
  const relationship_owner = inv.relationship_owner ?? RELATIONSHIP_OWNERS[i % RELATIONSHIP_OWNERS.length];
  // "In LabOS" is a rare signal — only investors authored with a member profile
  // (Lena, Soren) keep it. Everyone else is null → no pill anywhere.
  const lab_os_profile = inv.lab_os_profile ?? null;
  return { ...inv, emails, teams, lp_stage, last_contact, relationship_owner, lab_os_profile };
}

// Rows where the org-unknown (Pico Ventures) broker is suppressed — keeps the top
// of the table clean (the org-unknown state is still demoed on lower rows).
const NO_ORG_ROWS = new Set(['inv-wei']);

// Generic (non-showcase) rows are rebuilt so Feature 1 has real data: a named PL
// teammate as the first node. Founder paths are added separately by
// `augmentFounders` (below) for ALL rows. Showcase rows keep their authored paths.
function decorateGeneric(m: MockInvestor, i: number): MockInvestor {
  const pl = PL_CONNECTORS[i % PL_CONNECTORS.length];
  const isOrgLead = ORG_LEAD_ROWS.has(m.investor_id);
  // Keep the factory's org-unknown / member-unknown states; drop its uniform
  // Alicia founder path (founder coverage comes from augmentFounders), and drop
  // the org-unknown broker on NO_ORG_ROWS.
  const factory = fourCasePaths(m.first_name, m.firm, isOrgLead).filter(
    (p) => p.connector_type !== 'F' && !(NO_ORG_ROWS.has(m.investor_id) && p.orgConnector),
  );
  // Org-lead rows keep org-unknown as the visible best path (that's their demo);
  // every other generic row leads with its named PL teammate.
  const ordered = isOrgLead ? [...factory, plConnectorPath(pl, m)] : [plConnectorPath(pl, m), ...factory];
  const paths = ordered.map((p, idx) => ({ ...p, rank: idx + 1 }));
  return { ...m, best_proximity_code: paths[0].proximity_code, paths };
}

// Gives founder-led paths to investors that don't already have one (so the 1:1
// shape holds: showcase rows keep their single authored founder; generic rows get
// the assigned set). Appended after the best/visible path so the table is unchanged.
function augmentFounders(m: MockInvestor, i: number): MockInvestor {
  const hasFounder = m.paths.some((p) => p.connector_type === 'F' && p.contact?.memberUid);
  if (hasFounder) return m;
  const add = foundersForInvestor(i).map((f) => founderPath(f, m));
  const paths = [...m.paths, ...add].map((p, idx) => ({ ...p, rank: idx + 1 }));
  return { ...m, paths };
}

export const MOCK_MEMBERS: MockInvestor[] = BASE_MEMBERS.map((m, i) => {
  const decorated = m.has_path && !SHOWCASE_ROWS.has(m.investor_id) ? decorateGeneric(m, i) : m;
  const withFounders = m.has_path ? augmentFounders(decorated, i) : decorated;
  return seedContacts(withFounders, i);
});

// ── Selectors for the two new pivots (pure derivations over the spine) ────────

/** Feature 1 — distinct PL teammates that appear as the FIRST (PL-side) node of
 *  any path for an investor on the list, with how many investors each can reach. */
export type FirstNodeChip = { name: string; memberUid?: string; role?: string; count: number };
export function firstNodeConnectors(members: MockInvestor[], listId: string): FirstNodeChip[] {
  const map = new Map<string, FirstNodeChip>();
  members
    .filter((m) => m.list_ids.includes(listId))
    .forEach((m) => {
      const names = new Set<string>();
      m.paths.forEach((p) => {
        const pl = resolveRoute(p).pl;
        if (pl.known) names.add(pl.name);
      });
      names.forEach((name) => {
        const sample = m.paths.map((p) => resolveRoute(p).pl).find((pl) => pl.known && pl.name === name);
        const entry = map.get(name) ?? {
          name,
          memberUid: sample && sample.known ? sample.memberUid : undefined,
          role: sample && sample.known ? sample.role : undefined,
          count: 0,
        };
        entry.count += 1;
        map.set(name, entry);
      });
    });
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Does any of this investor's paths route through `name` as its FIRST node? */
export function matchesFirstNode(inv: MockInvestor, name: string): boolean {
  return inv.paths.some((p) => {
    const pl = resolveRoute(p).pl;
    return pl.known && pl.name === name;
  });
}

/** A connector surfaced as an investor-row column. */
export type ConnCell = { person: ContactPerson; proximity: string };

/** DIRECT column — a PL teammate who reaches the investor with NO intermediary
 *  (their known PL node connects straight to the investor, not via a founder). */
export function directConnector(inv: MockInvestor): ConnCell | null {
  for (const p of inv.paths) {
    if (p.connector_type === 'F') continue;
    const route = resolveRoute(p);
    if (route.pl.known && !route.mediator) return { person: route.pl, proximity: p.proximity_code };
  }
  return null;
}

/** 1-hop column — ALL one-intermediary brokers (any connector type), deduped,
 *  warmest first. A broker is either a known PERSON (founder, co-investor) or an
 *  ORG whose specific person is unknown ("reach the firm and ask who"). */
export type HopBroker =
  | { kind: 'person'; name: string; memberUid?: string; proximity: string }
  | { kind: 'org'; name: string; teamUid?: string; logo?: string; proximity: string };

export function hopConnectors(inv: MockInvestor): HopBroker[] {
  const out: HopBroker[] = [];
  const seen = new Set<string>();
  for (const p of inv.paths) {
    const med = resolveRoute(p).mediator;
    if (!med) continue; // no intermediary → that's the Direct column
    if (med.known) {
      if (seen.has(med.name)) continue;
      seen.add(med.name);
      out.push({ kind: 'person', name: med.name, memberUid: med.memberUid, proximity: p.proximity_code });
    } else {
      const key = `org:${med.team.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind: 'org', name: med.team.name, teamUid: med.team.teamUid, logo: med.team.logo, proximity: p.proximity_code });
    }
  }
  return out;
}

/** Feature 2 — group founder-led paths by founder so we can show "X can warm-
 *  intro N of M targets" and lens the spine to that founder's reachable set. */
export type FounderCoverageRow = {
  memberUid: string;
  name: string;
  role: string;
  teams?: TeamLink[];
  investors: { id: string; name: string; firm: string; proximity: string }[];
};
export function founderCoverage(members: MockInvestor[], listId: string): FounderCoverageRow[] {
  const map = new Map<string, FounderCoverageRow>();
  members
    .filter((m) => m.list_ids.includes(listId))
    .forEach((m) => {
      const seen = new Set<string>();
      m.paths.forEach((p) => {
        const c = p.contact;
        if (p.connector_type !== 'F' || !c?.memberUid || seen.has(c.memberUid)) return;
        seen.add(c.memberUid);
        const row =
          map.get(c.memberUid) ?? { memberUid: c.memberUid, name: c.name, role: c.role, teams: c.teams, investors: [] };
        row.investors.push({ id: m.investor_id, name: `${m.first_name} ${m.last_name}`, firm: m.firm, proximity: p.proximity_code });
        map.set(c.memberUid, row);
      });
    });
  return [...map.values()].sort((a, b) => b.investors.length - a.investors.length || a.name.localeCompare(b.name));
}
