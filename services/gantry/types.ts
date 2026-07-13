export type GantryStage = 'IDEA' | 'BACKLOG' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED' | 'DECLINED';

export type GantryItemType = 'Bug Report' | 'Enhancement Request' | 'New Feature Request';

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
}
