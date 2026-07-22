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

export type MasterProfileType = 'pl_internal' | 'investor' | 'founder' | string;

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

export const WARM_INTROS_V2_TARGET_SETS = ['neuro-fund-i', 'gold-co-investors'] as const;
export type WarmIntrosV2TargetSet = (typeof WARM_INTROS_V2_TARGET_SETS)[number];

export const WARM_INTROS_V2_DEFAULT_TARGET_SET: WarmIntrosV2TargetSet = 'neuro-fund-i';

export const WARM_INTROS_V2_TARGET_SET_LABEL: Record<WarmIntrosV2TargetSet, string> = {
  'neuro-fund-i': 'Neuro',
  'gold-co-investors': 'Gold',
};

/** Cap for client CSV export fetches. */
export const WARM_INTROS_V2_CSV_EXPORT_LIMIT = 500;
