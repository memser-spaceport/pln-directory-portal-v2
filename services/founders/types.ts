export type FundTag = 'PLVS' | 'NEURO' | 'CRYPTO';
export type FounderStatus = 'new' | 'in-review' | 'approved' | 'rejected' | 'hold' | 'wrong-fund';
export type ReviewFeedback = 'good' | 'bad' | 'wrong-fund' | 'needs-context';

export type FounderReviewState = {
  status: FounderStatus;
  feedback?: ReviewFeedback;
  note?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type FounderSource = {
  name: string;
  url?: string;
  confidence?: number;
};

// The API may return fund_tags as plain strings or enriched objects
export type FundTagObject = {
  fund: FundTag;
  confidence?: number;
  matched_terms?: string[];
  primary_signal?: string;
};

export function getFundTag(tag: FundTag | FundTagObject): FundTag {
  return typeof tag === 'string' ? tag : tag.fund;
}

export type FounderRawPayload = {
  fund_tags?: (FundTag | FundTagObject)[];
  provenance?: FounderSource[];
  quality?: {
    signal_strength?: number;
    evidence_count?: number;
    thin_evidence?: boolean;
  };
  network?: {
    warm_intros?: string[];
    intent_signals?: string[];
  };
  reputation?: {
    flags?: string[];
  };
  ic_framework?: Record<string, string | number | boolean>;
};

export type LabOsProfileRef = {
  type: 'member' | 'team';
  uid: string;
  slug?: string;
  name: string;
  last_active_at?: string;
};

export type FounderItem = {
  founderId: string;
  name: string;
  whyNow?: string;
  alignmentMax?: number;
  plvsScore?: number;
  sources: string[];
  reviewState: FounderReviewState;
  directoryMemberId?: string;
  labOsProfile?: LabOsProfileRef;
  rawPayload: FounderRawPayload;
};

export type FounderDetail = FounderItem;

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

// TODO: confirm exact shape with backend before implementing KpiSummaryStrip beyond skeleton
export type KpiSummary = {
  byFund: Partial<Record<FundTag, { total: number; new: number; approved: number }>>;
  alignmentBuckets: { range: string; count: number }[];
  bySources: Record<string, number>;
  weeklyCount: { week: string; count: number }[];
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
