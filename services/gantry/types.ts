export type GantryStage = 'IDEA' | 'UNDER_REVIEW' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED' | 'DECLINED';

export interface GantryMemberSummary {
  uid: string;
  name: string;
  imageUrl: string | null;
}

export interface GantryFocusAreaSummary {
  uid: string;
  title: string;
}

export interface GantryItem {
  uid: string;
  title: string;
  description: string;
  acceptanceCriteria: string | null;
  stage: GantryStage;
  focusAreaUid: string | null;
  focusArea: GantryFocusAreaSummary | null;
  createdByUid: string;
  createdBy: GantryMemberSummary;
  promotedAt: string | null;
  promotedByUid: string | null;
  declinedReason: string | null;
  externalTrackerUrl: string | null;
  upvoteCount: number;
  viewerHasUpvoted: boolean;
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
  focusAreaUid?: string[];
  mine?: boolean;
  includeDeclined?: boolean;
  includeArchived?: boolean;
}

export interface CreateGantryItemPayload {
  title: string;
  description: string;
  acceptanceCriteria?: string | null;
  focusAreaUid?: string | null;
  externalTrackerUrl?: string | null;
  stage?: GantryStage;
}

export interface UpdateGantryItemPayload {
  title?: string;
  description?: string;
  acceptanceCriteria?: string | null;
  focusAreaUid?: string | null;
  externalTrackerUrl?: string | null;
}
