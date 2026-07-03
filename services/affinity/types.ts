export interface AffinityOwner {
  name: string;
  email?: string | null;
  affinity_person_id?: string | null;
  member_uid?: string | null;
}

export interface AffinityLastContact {
  date: string;
  method?: string | null;
  summary?: string | null;
}

export interface AffinityMonthBucket {
  label: string;
  count: number;
}

export interface AffinityRelationship {
  empty: boolean;
  owner: AffinityOwner | null;
  last_contact: AffinityLastContact | null;
  frequency_tier: 'high' | 'neglected' | null;
  window_months: number;
  touchpoints_6m: number;
  months: AffinityMonthBucket[];
}

export interface AffinityMemberResponse {
  member_uid: string;
  person: Record<string, unknown>;
  primary_company?: Record<string, unknown>;
  organizations?: Record<string, unknown>[];
  relationship: AffinityRelationship;
}
