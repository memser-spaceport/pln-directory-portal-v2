import type { LabOsProfileRef as _LabOsProfileRef } from '@/services/investors/types';
// Re-export the shared profile ref so founders components don't need to import from investors
export type { LabOsProfileRef } from '@/services/investors/types';

export type FundTag = 'PLVS' | 'NEURO' | 'CRYPTO';
export type FounderStatus = 'new' | 'in-review' | 'approved' | 'rejected' | 'hold' | 'wrong-fund';
export type ReviewFeedback = 'good' | 'bad' | 'wrong-fund' | 'needs-context';

export type FounderReviewState = {
  profile_id?: string;
  status: FounderStatus;
  feedback?: ReviewFeedback;
  note?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

// The API may return fund_tags as plain strings or enriched objects
export type FundTagObject = {
  fund: FundTag;
  confidence?: number;
  matched_terms?: string[];
  primary_signal?: string;
};

export function getFundTag(tag: FundTag | FundTagObject | null | undefined): FundTag | null {
  if (!tag) return null;
  return typeof tag === 'string' ? tag : tag.fund;
}

export type ProvenanceItem = {
  url: string;
  source: string;
  fetched_at?: string;
  matched_anchors?: string[];
  match_confidence?: number;
};

export type WarmIntroPath = {
  via: string;
  via_display: string;
  kind: string;
  source: string;
  distance: number;
  evidence: string;
};

export type PlvsFeatures = {
  recency?: number;
  stageFit?: number;
  trajectory?: number;
  domainMatch?: number;
  corroboration?: number;
  technicalDepth?: number;
};

export type RawQuality = {
  accuracy?: number;
  validity?: number;
  freshness?: number;
  uniqueness?: number;
  consistency?: number;
  completeness?: number;
};

export type FounderRawPayload = {
  fund_tags?: (FundTag | FundTagObject)[];
  provenance?: ProvenanceItem[];
  quality?: RawQuality;
  warm_intro_paths?: WarmIntroPath[];
  plvs_features?: PlvsFeatures;
  external_ids?: Record<string, string>;
  verification_status?: string;
  verification_rationale?: string[];
  plvs_recommendation?: string;
  plvs_weights_version?: string;
  is_known?: boolean;
};

export type FounderItem = {
  founderId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  whyNow?: string;
  alignmentMax?: number;
  plvsScore?: number;
  plvsRecommendation?: string;
  plnProximity?: number;
  sources: string[];
  reviewState: FounderReviewState;
  directoryMemberId?: string;
  directoryTeamId?: string;
  labOsProfile?: _LabOsProfileRef;
  rawPayload: FounderRawPayload;
};

export type FounderDetail = FounderItem & {
  dedupeKey?: string;
  source?: string;
  primaryEmail?: string | null;
  github?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  telegram?: string | null;
  farcaster?: string | null;
  website?: string | null;
  org?: string | null;
  team?: string | null;
  bio?: string | null;
  topics?: string[];
  thinEvidence?: boolean | null;
  lastSignalAt?: string | null;
  plAlignment?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FounderListResponse = {
  page: number;
  limit: number;
  total: number;
  items: FounderItem[];
};

export type ReviewFounderPayload = {
  status: FounderStatus;
  feedback?: ReviewFeedback;
  note?: string;
};

export type KpiSummary = {
  newRecordsByFund: Partial<Record<FundTag, number>>;
  alignmentDistribution: { low: number; medium: number; high: number };
  sourceCoverage: Record<string, number>;
  weeklyNewRecords: { weekStart: string; count: number }[];
};

export type FounderListParams = {
  q?: string;
  fund?: FundTag[];
  status?: FounderStatus[];
  source?: string[];
  minAlignment?: number;
  minPlnProximity?: number;
  sort?: string;
  page?: number;
  limit?: number;
};
