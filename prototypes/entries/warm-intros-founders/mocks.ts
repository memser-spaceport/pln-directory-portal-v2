/**
 * Founder-facing warm intros — mocked data.
 *
 * Nothing here is a new graph. The investors, the connectors and the PL-history
 * facts are the Warm Intros v2 prototype's own rows (`../warm-intros-v2/mocks`),
 * re-read from the founder's seat:
 *
 *   v2 (PL's seat)       PL member → [founder / co-investor] → investor
 *   here (founder's seat)  you → ONE person who can make the intro → investor
 *
 * So each investor keeps exactly one named connector — the bridge when the v2
 * path has one, otherwise the PL teammate — and drops everything an analyst
 * needs and a founder doesn't: score %, caliber, proximity code, target lists.
 * The investor's email is deliberately never copied onto these rows.
 */

import type { ITeam } from '@/types/teams.types';
import type { WarmIntrosV2ConnectorSummary } from '@/services/investors/warm-intros-v2.types';

import { MOCK_TEAM, type TeamFacts } from '../team-profile/mocks';
import {
  MOCK_BRIDGES,
  MOCK_CONNECTORS,
  MOCK_PATHS,
  bridgeOf,
  plHistoryOf,
  relationKindOf,
} from '../warm-intros-v2/mocks';

// ── The founder's team ───────────────────────────────────────────────────────
// team-profile's fixture is Protocol Labs itself (a fund). The reader here is a
// portfolio founder, so the same shape is re-skinned as a seed-stage company.
// Stage and industry tags are the team profile's EXISTING fields — the shortlist
// matches on them rather than asking for them a second time.

export const FOUNDER_TEAM = {
  ...MOCK_TEAM,
  id: 'tessera-labs',
  name: 'Tessera Labs',
  shortDescription: 'Verifiable data pipelines for neuro and bio research labs.',
  longDescription:
    '<p>Tessera Labs builds verifiable data pipelines for research labs — provenance, access control and reproducible compute over content-addressed storage.</p>',
  website: 'https://tessera.example',
  twitter: 'https://twitter.com/tesseralabs',
  linkedinHandle: 'https://www.linkedin.com/company/tessera-labs',
  telegramHandler: 'https://t.me/tesseralabs',
  blog: 'https://tessera.example/blog',
  contactMethod: 'https://tessera.example/contact',
  isFund: false,
  fundingStage: { title: 'Seed' },
  industryTags: [
    { uid: 'i1', title: 'Neurotech' },
    { uid: 'i2', title: 'Data infrastructure' },
    { uid: 'i3', title: 'DeSci' },
  ],
} as unknown as ITeam;

export const FOUNDER_TEAM_FACTS: TeamFacts = { foundedYear: 2024, teamSize: '8', location: 'Lisbon, Portugal' };

export const FOUNDER = { name: 'Aiko Tanaka', title: 'Co-founder & CEO' };

/** The one new fact a raise needs that the team profile has no field for. */
export const ROUND = { label: 'Seed', target: '$4M' };

// ── Investor rows ────────────────────────────────────────────────────────────

export type ConnectorKind = 'pl' | 'founder' | 'coinvestor';

export type FounderInvestorRow = {
  uid: string;
  name: string;
  firm: string | null;
  title: string | null;
  imageUrl: string | null;
  sectors: string[];
  /** Plain-word facts about the investor's history with PL. Never a score. */
  evidence: string[];
  connector: WarmIntrosV2ConnectorSummary;
  connectorKind: ConnectorKind;
  /**
   * How the connector knows the investor, as the FOUNDER may read it — one of a
   * closed set of phrases (`TIE_LABEL`), never the v2 reason line. See `TieKind`.
   */
  tie: TieKind;
  /**
   * The v2 path's own explanation. Shown to the CONNECTOR only: it is a
   * sentence about their own relationship, which they already know. It is
   * written from PL's seat and routinely carries things a founder must not
   * read — "Callum passed but stayed in touch", "two live email threads in the
   * last quarter", "model-inferred only", internal list names.
   */
  connectorReason: string | null;
  /** Someone else who could make this intro, offered only after a decline. */
  alternate: { connector: WarmIntrosV2ConnectorSummary; kind: ConnectorKind } | null;
};

/**
 * The founder-safe vocabulary for a tie. Deliberately coarse: the founder needs
 * enough to believe the path is real and to write a sensible ask, and nothing
 * that reports on someone else's inbox, deal history or PL's confidence in the
 * data. In production this is a classification the backend emits per path —
 * free text never crosses to the founder's side.
 */
export type TieKind = 'coinvested' | 'portfolio' | 'worked' | 'events' | 'know';

export const TIE_LABEL: Record<TieKind, (connectorFirst: string, investorFirst: string) => string> = {
  coinvested: (c, i) => `${c} and ${i} have invested together`,
  portfolio: (c, i) => `${i} is an investor in ${c}’s company`,
  worked: (c, i) => `${c} and ${i} have worked together`,
  events: (c, i) => `${c} and ${i} know each other through PL events`,
  know: (c, i) => `${c} and ${i} know each other`,
};

/** Hand-classified for the mocks; unknown rows fall back to the weakest claim. */
const TIE_BY_INVESTOR: Record<string, TieKind> = {
  'mp-inv-linnea-holm': 'events',
  'mp-inv-arjun-pillai': 'portfolio',
  'mp-inv-sofia-marchetti': 'worked',
  'mp-inv-yara-nasser': 'events',
  'mp-inv-callum-doyle': 'know',
  'mp-inv-thabo-mokoena': 'worked',
  'mp-inv-elena-marchand': 'coinvested',
  'mp-inv-ingrid-lundqvist': 'coinvested',
  'mp-inv-samuel-adeyemi': 'worked',
};

export const tieLine = (row: FounderInvestorRow, connector = row.connector): string | null =>
  // The classification belongs to the path's own connector. An alternate's tie
  // isn't classified, so nothing is claimed for it.
  connector.profileUid === row.connector.profileUid
    ? TIE_LABEL[row.tie](connector.name.split(' ')[0], row.name.split(' ')[0])
    : null;

const ALL_CONNECTORS = [...Object.values(MOCK_CONNECTORS), ...Object.values(MOCK_BRIDGES)];

function alternateFor(row: (typeof MOCK_PATHS)[number], lead: WarmIntrosV2ConnectorSummary) {
  const uids = Array.isArray(row.alternateConnectorProfileUids) ? (row.alternateConnectorProfileUids as string[]) : [];
  const connector = uids.map((uid) => ALL_CONNECTORS.find((c) => c.profileUid === uid)).find((c) => c && c !== lead);
  if (!connector) return null;
  const kind: ConnectorKind = connector.profileUid.startsWith('mp-fd')
    ? 'founder'
    : connector.profileUid.startsWith('mp-ci')
      ? 'coinvestor'
      : 'pl';
  return { connector, kind };
}

const KIND_BY_RELATION = {
  pl_direct: 'pl',
  founder_bridge: 'founder',
  coinvestor_bridge: 'coinvestor',
} as const;

export const CONNECTOR_KIND_LABEL: Record<ConnectorKind, string> = {
  pl: 'PL team',
  founder: 'PL network founder',
  coinvestor: 'Co-investor',
};

function evidenceFor(row: (typeof MOCK_PATHS)[number]): string[] {
  const { backing, coInvestmentCount } = plHistoryOf(row);
  const out: string[] = [];
  if (coInvestmentCount > 0) {
    out.push(`Co-invested with PL in ${coInvestmentCount} ${coInvestmentCount === 1 ? 'round' : 'rounds'}`);
  }
  if (backing?.backedProtocolLabs && backing?.backedFilecoin) out.push('Backed Protocol Labs and Filecoin');
  else if (backing?.backedProtocolLabs) out.push('Backed Protocol Labs');
  else if (backing?.backedFilecoin) out.push('Backed Filecoin');
  return out;
}

export const INVESTOR_ROWS: FounderInvestorRow[] = MOCK_PATHS.flatMap((row) => {
  const connector = bridgeOf(row) ?? row.bestConnector;
  if (!connector) return [];
  return [
    {
      uid: row.investor.profileUid,
      name: row.investor.name,
      firm: row.investor.currentOrg,
      title: row.investor.currentTitle,
      imageUrl: row.investor.imageUrl ?? null,
      sectors: row.investor.sectors,
      evidence: evidenceFor(row),
      connector,
      connectorKind: KIND_BY_RELATION[relationKindOf(row)],
      tie: TIE_BY_INVESTOR[row.investor.profileUid] ?? 'know',
      connectorReason: row.pathSummary.explanation,
      alternate: alternateFor(row, connector),
    },
  ];
});

/**
 * The shortlist: investors whose sectors overlap the team's industry tags. The
 * v2 mocks carry sector slugs, so the team's tags are mapped to them here — in
 * production this is the backend's join, not a client filter.
 */
const TEAM_SECTOR_SLUGS = ['neurotech', 'biotech', 'infrastructure', 'desci'];

const SECTOR_LABEL: Record<string, string> = {
  neurotech: 'Neurotech',
  biotech: 'Biotech',
  ai: 'AI',
  'frontier-tech': 'Frontier tech',
  robotics: 'Robotics',
  desci: 'DeSci',
  climate: 'Climate',
  saas: 'SaaS',
  fintech: 'Fintech',
  infrastructure: 'Infrastructure',
  crypto: 'Crypto',
  defi: 'DeFi',
  gaming: 'Gaming',
};

export const sectorLabels = (row: FounderInvestorRow): string =>
  row.sectors.map((slug) => SECTOR_LABEL[slug] ?? slug).join(', ');

/** Investors with a PL history lead; the v2 order (path strength) breaks ties. */
export const SHORTLIST: FounderInvestorRow[] = INVESTOR_ROWS.filter((row) =>
  row.sectors.some((slug) => TEAM_SECTOR_SLUGS.includes(slug)),
).sort((a, b) => b.evidence.length - a.evidence.length);

// ── Asks ─────────────────────────────────────────────────────────────────────
// requested → made → met, plus the connector's "no". `made` is the connector's
// press; `met` is the founder's own tick — nothing here is inferred.

export type AskStatus = 'requested' | 'made' | 'met' | 'declined';

export type IntroAsk = {
  investorUid: string;
  status: AskStatus;
  blurb: string;
  /** Days since the last status change, for the row's clock. */
  daysAgo: number;
  /**
   * Who was asked, when it isn't the row's own connector — set when the founder
   * re-asks through the alternate after a decline.
   */
  via?: WarmIntrosV2ConnectorSummary;
};

/** Who this ask (or, with no ask yet, this row) goes through. */
export const connectorOf = (row: FounderInvestorRow, ask?: IntroAsk): WarmIntrosV2ConnectorSummary =>
  ask?.via ?? row.connector;

export const connectorKindOf = (row: FounderInvestorRow, ask?: IntroAsk): ConnectorKind =>
  ask?.via && row.alternate?.connector.profileUid === ask.via.profileUid ? row.alternate.kind : row.connectorKind;

export const ASK_STATUS_LABEL: Record<AskStatus, string> = {
  requested: 'Requested',
  made: 'Intro made',
  met: 'Met',
  declined: 'Declined',
};

export function draftBlurb(row: FounderInvestorRow): string {
  const first = row.name.split(' ')[0];
  // Name the sector the match was made on, not whichever the investor lists first.
  const shared = row.sectors.find((slug) => TEAM_SECTOR_SLUGS.includes(slug));
  const label = shared ? (SECTOR_LABEL[shared] ?? shared) : 'this space';
  // Mid-sentence: "infrastructure", but "DeSci" and "AI" keep their capitals.
  const sector = /^[A-Z][a-z ]+$/.test(label) ? label.toLowerCase() : label;
  return (
    `${FOUNDER_TEAM.name} builds verifiable data pipelines for neuro and bio research labs. ` +
    `We're raising a ${ROUND.target} ${ROUND.label.toLowerCase()} round and ${first}'s work in ` +
    `${sector} is why we'd value a conversation. [Add one line on traction.]`
  );
}

// ── The investor's own profile ───────────────────────────────────────────────
// What production's Investor Details card shows for a member who invests. The
// v2 graph carries sectors only, so stages and check size are invented per row;
// focus is the row's own sectors, so the profile and the shortlist agree.

export const investorProfileHref = (uid: string) => `/prototypes/warm-intros-founders?investor=${uid}`;

export const investorByUid = (uid: string | null): FounderInvestorRow | undefined =>
  INVESTOR_ROWS.find((row) => row.uid === uid);

export function investorDetailsOf(row: FounderInvestorRow) {
  const i = INVESTOR_ROWS.indexOf(row);
  return {
    typicalCheckSize: ['250000', '500000', '1000000'][i % 3],
    investInStartupStages: [
      ['Pre-seed', 'Seed'],
      ['Seed', 'Series A'],
      ['Pre-seed', 'Seed', 'Series A'],
    ][i % 3],
    investmentFocusAreas: row.sectors.map((slug) => SECTOR_LABEL[slug] ?? slug),
  };
}

/** Seeded so the asks list opens with every state in it. */
export const SEED_ASKS: IntroAsk[] = SHORTLIST.slice(1, 4).map((row, i) => ({
  investorUid: row.uid,
  status: (['made', 'requested', 'declined'] as const)[i],
  blurb: draftBlurb(row),
  daysAgo: [5, 2, 6][i],
}));
