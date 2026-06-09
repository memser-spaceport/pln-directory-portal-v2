export type GantryStage = 'IDEA' | 'BACKLOG' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED' | 'DECLINED';

export type GantryItemType = 'Bug' | 'Improvement' | 'Feature Request';

export interface GantryMemberSummary {
  uid: string;
  name: string;
  imageUrl: string | null;
}

export interface GantryObjective {
  uid: string;
  code: string;
  label: string;
}

export interface GantryPinStatus {
  limit: number;
  used: number;
}

export interface GantryPinner {
  uid: string;
  name: string;
  imageUrl?: string | null;
  note?: string | null;
}

export interface GantryItem {
  uid: string;
  title: string;
  description: string;
  acceptanceCriteria: string | null;
  stage: GantryStage;
  focusArea: string | null;
  objective: GantryObjective | null;
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
  pinners?: GantryPinner[];
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
  objective?: string[];
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
}

export interface UpdateGantryItemPayload {
  title?: string;
  description?: string;
  acceptanceCriteria?: string | null;
  focusArea?: string | null;
  objectiveUid?: string | null;
  externalTrackerUrl?: string | null;
  tags?: string[];
  type?: GantryItemType | null;
  order?: number | null;
}
