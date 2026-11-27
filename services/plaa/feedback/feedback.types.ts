export type FeedbackType = 'feature' | 'bug' | 'improvement';

export type FeedbackStatus = 'under_review' | 'todo' | 'in_progress' | 'completed' | 'declined' | 'duplicate';

export type LinearStatus = 'pending' | 'created' | 'failed';

export const VOTABLE_STATUSES: FeedbackStatus[] = ['under_review', 'todo', 'in_progress'];

export type RoadmapColumn = 'under_review' | 'todo' | 'in_progress' | 'completed';

export const ROADMAP_COLUMNS: RoadmapColumn[] = ['under_review', 'todo', 'in_progress', 'completed'];

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  under_review: 'Under Review',
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
  duplicate: 'Duplicate',
};

export const TYPE_LABELS: Record<FeedbackType, string> = {
  feature: 'New feature',
  bug: 'Bug',
  improvement: 'Improvement',
};

export interface FeedbackAuthor {
  member_uid: string;
  display_name: string;
  image_url?: string;
}

export interface FeedbackStatusEvent {
  from_status: FeedbackStatus | null;
  to_status: FeedbackStatus;
  note: string | null;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  importance: string | null;
  link_url: string | null;
  screenshot_count: number;
  status: FeedbackStatus;
  status_changed_at: string;
  completed_at: string | null;
  created_at: string;
  is_public: boolean;
  author: FeedbackAuthor;
  vote_count: number;
  has_voted: boolean;
  comment_count: number;
  status_events?: FeedbackStatusEvent[];
  duplicate_of: { id: string; title: string } | null;
  linear_status?: LinearStatus;
  linear_issue_identifier?: string | null;
  linear_issue_url?: string | null;
  source_path?: string | null;
  user_agent?: string | null;
  removed_at?: string | null;
}

export interface FeedbackComment {
  id: string;
  author: FeedbackAuthor | null;
  body: string | null;
  hidden: boolean;
  is_admin_author: boolean;
  created_at: string;
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  next_cursor: string | null;
}

export interface FeedbackCommentListResponse {
  items: FeedbackComment[];
  next_cursor: string | null;
}

export type RoadmapResponse = Record<RoadmapColumn, FeedbackItem[]>;

export interface CreateFeedbackInput {
  type: FeedbackType;
  title: string;
  description: string;
  importance?: string;
  link_url?: string;
  source_path?: string;
  screenshots?: File[];
}

export interface FeedbackListParams {
  type?: FeedbackType;
  /** `proposed` means open but not started. */
  status?: 'open' | 'proposed' | FeedbackStatus;
  sort?: 'top' | 'new';
  mine?: boolean;
  cursor?: string;
  limit?: number;
}

export interface VoteBudget {
  limit: number;
  used: number;
  remaining: number;
}

export interface FeedbackMe {
  is_admin: boolean;
  vote_budget: VoteBudget;
}

export interface VoteResponse {
  vote_count: number;
  has_voted: boolean;
  budget: VoteBudget;
}

export class FeedbackApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'FeedbackApiError';
  }
}
