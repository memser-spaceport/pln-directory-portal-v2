export type GantryStage = 'IDEA' | 'BACKLOG' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED' | 'DECLINED';

export type GantryItemType = 'Bug Report' | 'Enhancement Request' | 'New Feature Request';

export type GantryImpactValue = 1 | 2 | 3 | 4 | 5;

/** Rating buckets keyed by impact value. The API sends JSON string keys ("1".."5") — normalized at the service parse boundary. */
export type GantryImpactDistribution = Record<GantryImpactValue, number>;

export interface GantryMemberSummary {
  uid: string;
  name: string;
  imageUrl: string | null;
}

export interface GantryObjective {
  uid: string;
  order: number;
  title: string;
  itemCount: number;
  createdAt: string;
}

export interface GantryPinBalance {
  limit: number;
  used: number;
  remaining: number;
}

export interface GantryUserPin {
  uid: string;
  note: string | null;
  createdAt: string;
  item: { uid: string; title: string; stage: GantryStage };
}

export interface GantryPinStatus {
  limit: number;
  used: number;
  remaining: number;
  pins: GantryUserPin[];
}

export interface GantryPinner {
  uid: string;
  note: string | null;
  /** Booster's impact rating; null for pins placed before the impact feature. */
  impact: GantryImpactValue | null;
  createdAt: string;
  releasedAt: string | null;
  member: { uid: string; name: string; imageUrl: string | null };
}

export interface GantryItem {
  uid: string;
  title: string;
  description: string;
  acceptanceCriteria: string | null;
  stage: GantryStage;
  focusArea: string | null;
  objectives: { uid: string; order: number; title: string }[];
  tags: string[] | null;
  type: GantryItemType | null;
  order: number | null;
  createdByUid: string;
  createdBy: GantryMemberSummary;
  promotedAt: string | null;
  promotedByUid: string | null;
  declinedReason: string | null;
  externalTrackerUrl: string | null;
  upvoteCount: number;
  viewerHasUpvoted: boolean;
  pinCount: number;
  viewerHasPinned: boolean;
  viewerPinNote: string | null;
  /** Creator's rating — item-level fields, independent of pins: never consume boost budget, survive all pin operations. */
  authorImpact: GantryImpactValue | null;
  /** Creator's goal-link reasoning. Server returns it only to curators and the author. */
  authorImpactReasoning: string | null;
  avgImpact: number | null;
  /** Number of impact ratings (not boosts). 0 ⇒ hide all impact UI. */
  impactCount: number;
  impactDistribution: GantryImpactDistribution | null;
  /** The requester's rating on their ACTIVE pin only — null after unboost. */
  viewerImpact: GantryImpactValue | null;
  pins?: GantryPinner[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GantryItemListResponse {
  items: GantryItem[];
  total: number;
}

export interface GantryListParams {
  stage?: GantryStage[];
  focusArea?: string;
  objectiveUid?: string[];
  sort?: 'default' | 'trending' | 'top_pins' | 'newest';
  tags?: string[];
  type?: string[];
  mine?: boolean;
  includeDeclined?: boolean;
  includeArchived?: boolean;
}

export interface CreateGantryItemPayload {
  title: string;
  description: string;
  acceptanceCriteria?: string | null;
  focusArea?: string | null;
  externalTrackerUrl?: string | null;
  stage?: GantryStage;
  tags?: string[];
  type?: GantryItemType;
  /** Required by the API once the impact feature is live; optional here so flag-off creates still compile. UI enforces presence. */
  authorImpact?: GantryImpactValue;
  authorImpactReasoning?: string;
}

export interface ApiGantryDraft {
  uid: string;
  variant: 'idea' | 'roadmap';
  title: string;
  description: string | null;
  tags: string[];
  type: string | null;
  stage: string | null;
  objectiveUids: string[];
  newObjectiveTitle: string | null;
  showCreateObjective: boolean;
  updatedAt: string;
}

export interface ApiGantryDraftPayload {
  variant: 'idea' | 'roadmap';
  title: string;
  description?: string;
  tags?: string[];
  type?: string | null;
  stage?: string | null;
  objectiveUids?: string[];
  newObjectiveTitle?: string | null;
  showCreateObjective?: boolean;
}

export interface UpdateGantryItemPayload {
  title?: string;
  description?: string;
  acceptanceCriteria?: string | null;
  focusArea?: string | null;
  externalTrackerUrl?: string | null;
  tags?: string[];
  type?: GantryItemType | null;
  order?: number | null;
  authorImpact?: GantryImpactValue;
  authorImpactReasoning?: string;
}

/** PATCH .../pin — the API requires at least one field; callers enforce it. */
export interface UpdateGantryPinPayload {
  impact?: GantryImpactValue;
  note?: string;
}
