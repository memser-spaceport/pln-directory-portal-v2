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
};

export type WarmIntrosV2ConnectorSummary = {
  profileUid: string;
  personKey: string;
  name: string;
  currentOrg: string | null;
  currentTitle: string | null;
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

/** Thin MasterProfile read shape for upcoming modal (S3-T6). */
export type MasterProfileDetail = {
  uid: string;
  personKey: string;
  canonicalName: string;
  [key: string]: unknown;
};

export const WARM_INTROS_V2_DEFAULT_TARGET_SET = 'neuro-fund-i';
