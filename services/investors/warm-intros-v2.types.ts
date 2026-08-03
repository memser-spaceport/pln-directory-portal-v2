/**
 * Warm Intros v2 types — mirror S3-T1 enriched API (camelCase).
 * Unlike v1 pathfinder (FE snake_case), v2 keeps API camelCase end-to-end.
 */

export type ScoreBand = 'green' | 'yellow' | 'red' | 'none';

export type WarmIntrosV2InvestorSummary = {
  profileUid: string;
  personKey: string;
  name: string;
  email: string | null;
  currentOrg: string | null;
  currentTitle: string | null;
  sectors: string[];
  affinityPersonId: string | null;
  memberUid: string | null;
  /** Directory member photo when linked. */
  imageUrl?: string | null;
  /** Known cohort list slugs (neuro-fund-i / gold-co-investors). */
  listSlugs?: string[];
};

export type WarmIntrosV2ConnectorSummary = {
  profileUid: string;
  personKey: string;
  name: string;
  currentOrg: string | null;
  currentTitle: string | null;
  memberUid?: string | null;
  imageUrl?: string | null;
};

export type WarmPathCanRefer = 'yes' | 'no';

export type WarmPathMyFeedback = {
  canRefer: WarmPathCanRefer | null;
  note: string | null;
  updatedAt: string;
};

export type WarmPathFeedbackSummaryRecent = {
  actorEmail: string | null;
  canRefer: WarmPathCanRefer | null;
  note: string | null;
  updatedAt: string;
};

export type WarmPathFeedbackSummary = {
  yesCount: number;
  noCount: number;
  noteCount: number;
  recent: WarmPathFeedbackSummaryRecent[];
};

export type WarmIntrosV2PathListItem = {
  uid: string;
  targetProfileUid: string;
  targetSet: string;
  rank: number;
  score: number;
  hopCount: number;
  hopChain: unknown;
  bestConnectorProfileUid: string | null;
  alternateConnectorProfileUids: unknown;
  runId?: string | null;
  computedAt?: string;
  proximityCode: string;
  caliber: 'A' | 'B' | null;
  scorePercent: number;
  scoreBand?: ScoreBand;
  investor: WarmIntrosV2InvestorSummary;
  bestConnector: WarmIntrosV2ConnectorSummary | null;
  pathSummary: { explanation: string | null; alternateCount: number };
  /** Caller’s own feedback keyed by connectorProfileUid (detail enrich). */
  myFeedbackByConnector?: Record<string, WarmPathMyFeedback>;
  /** Editors only — aggregated answers keyed by connectorProfileUid. */
  feedbackSummaryByConnector?: Record<string, WarmPathFeedbackSummary>;
};

export type UpsertWarmPathFeedbackBody = {
  connectorProfileUid: string;
  canRefer?: WarmPathCanRefer | null;
  note?: string | null;
};

export type WarmPathFeedbackRow = {
  uid: string;
  warmPathUid: string;
  targetProfileUid: string;
  targetSet: string;
  connectorProfileUid: string;
  canRefer: WarmPathCanRefer | null;
  note: string | null;
  actorUid: string | null;
  actorEmail: string | null;
  createdAt: string;
  updatedAt: string;
  investor: WarmIntrosV2InvestorSummary;
  connector: WarmIntrosV2ConnectorSummary | null;
  proximityCode: string | null;
  scorePercent: number | null;
  scoreBand?: ScoreBand | null;
  isBestConnector: boolean;
};

export type WarmPathFeedbackQueueParams = {
  targetProfileUid?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export type WarmPathFeedbackQueueResponse = {
  items: WarmPathFeedbackRow[];
  total: number;
  limit: number;
  offset: number;
};

export type WarmIntrosV2ListParams = {
  targetSet?: string;
  search?: string;
  connectorProfileUid?: string;
  sector?: string;
  minScore?: number;
  rank?: number;
  limit?: number;
  offset?: number;
  /** hopChain.relationKind: pl_direct | founder_bridge | coinvestor_bridge */
  relationKind?: string;
  /** When true, only hopCount=1 (PL direct) paths. */
  directOnly?: boolean;
  /** When true, only investors with MasterProfile.plBacking set. */
  plBacker?: boolean;
};

export type WarmIntrosV2ListResponse = {
  paths: WarmIntrosV2PathListItem[];
  total: number;
};

export type WarmIntrosV2InvestorPathsResponse = {
  paths: WarmIntrosV2PathListItem[];
  investor: WarmIntrosV2InvestorSummary;
};

export type WarmIntrosV2Facets = {
  connectors: Array<{ profileUid: string; name: string; pathCount: number }>;
  sectors: Array<{ value: string; count: number }>;
};

/** Provenance reference on a Sourced field value. */
export type MasterProfileSourceRef = {
  type: string;
  id?: string;
  fetchedAt?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
};

/** Provenance wrapper used on emails / phones / socials. */
export type MasterProfileSourced<T> = {
  value: T;
  sources: MasterProfileSourceRef[];
};

export type MasterProfileType = 'pl_internal' | 'investor' | 'co_investor' | 'founder' | string;

export type MasterProfileListMembership = {
  listId?: string;
  listSlug?: string;
  listName?: string;
  affinityPersonId?: string;
  [key: string]: unknown;
};

/**
 * MasterProfile GET `/v1/master-profiles/:uid` shape (camelCase).
 * Json-heavy fields stay loosely typed; display helpers unwrap Sourced wrappers.
 */
export type MasterProfileDetail = {
  uid: string;
  personKey: string;
  types?: MasterProfileType[];
  canonicalName: string;
  memberUid?: string | null;
  affinityPersonId?: string | null;
  investorOutreachId?: string | null;
  emails?: MasterProfileSourced<string>[] | string[] | null;
  phones?: MasterProfileSourced<string>[] | string[] | null;
  /** Typically `Record<provider, Sourced<string>>`; tolerate wrapped maps. */
  socials?: Record<string, MasterProfileSourced<string> | string> | MasterProfileSourced<Record<string, string>> | null;
  organizations?: unknown;
  experience?: unknown;
  education?: unknown;
  investorMeta?: Record<string, unknown> | null;
  funds?: unknown;
  investedIn?: unknown;
  /** Proven PL co-investments (teamUid + deal metadata). */
  coInvestments?: unknown;
  /** PL/FIL prior-backer flags from Affinity list 166215. */
  plBacking?: {
    backedProtocolLabs: boolean;
    backedFilecoin: boolean;
    matchKind: string;
    firmName?: string;
    affinityOrgId?: number;
    source?: string;
  } | null;
  locations?: unknown;
  listMemberships?: MasterProfileListMembership[] | unknown;
  bio?: string | null;
  currentOrg?: string | null;
  currentTitle?: string | null;
  raw?: Record<string, unknown> | null;
  sourceSnapshots?: Record<string, unknown> | null;
  contentHash?: string | null;
  enrichmentVersion?: string | null;
  enrichedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Optional top-level (or mirrored from raw) when present. */
  projects?: unknown;
  events?: unknown;
  [key: string]: unknown;
};

export const WARM_INTROS_V2_ALL_TARGET_SET = 'all' as const;

export const WARM_INTROS_V2_TARGET_SETS = ['neuro-fund-i', 'gold-co-investors'] as const;
export type WarmIntrosV2TargetSet = (typeof WARM_INTROS_V2_TARGET_SETS)[number];

/** URL / selector values including the "All" sentinel (omit targetSet in API when `all`). */
export const WARM_INTROS_V2_SELECTOR_VALUES = [WARM_INTROS_V2_ALL_TARGET_SET, ...WARM_INTROS_V2_TARGET_SETS] as const;
export type WarmIntrosV2SelectorValue = (typeof WARM_INTROS_V2_SELECTOR_VALUES)[number];

export const WARM_INTROS_V2_DEFAULT_TARGET_SET: WarmIntrosV2SelectorValue = WARM_INTROS_V2_ALL_TARGET_SET;

/** Display names aligned with v1 InvestorList names (+ selector "All"). */
export const WARM_INTROS_V2_TARGET_SET_LABEL: Record<WarmIntrosV2SelectorValue, string> = {
  all: 'All',
  'neuro-fund-i': 'Neuro Fund I LP Pipeline',
  'gold-co-investors': 'Gold PLC Co-Investors',
};

/** Compact chip labels for table / drawer density. */
export const WARM_INTROS_V2_LIST_TAG_LABEL: Record<WarmIntrosV2TargetSet, string> = {
  'neuro-fund-i': 'Neuro Fund I',
  'gold-co-investors': 'Gold PLC',
};

/** v1 InvestorList.slug → Warm Intros v2 targetSet. */
export const WARM_INTROS_V2_TARGET_SET_BY_LIST_SLUG: Record<string, WarmIntrosV2TargetSet> = {
  'neuro-lp': 'neuro-fund-i',
  'gold-coinvestors': 'gold-co-investors',
};

/** Warm Intros v2 targetSet → v1 InvestorList.slug. */
export const WARM_INTROS_V2_LIST_SLUG_BY_TARGET_SET: Record<WarmIntrosV2TargetSet, string> = {
  'neuro-fund-i': 'neuro-lp',
  'gold-co-investors': 'gold-coinvestors',
};

/** Cap for client CSV export fetches. */
export const WARM_INTROS_V2_CSV_EXPORT_LIMIT = 500;

/** Paths below this score (0–1) are excluded from list/detail/facets (= 20%). */
export const WARM_INTROS_V2_MIN_SCORE = 0.2;
