export type TeamNewsEventType =
  | 'FUNDING'
  | 'LAUNCH'
  | 'PARTNERSHIP'
  | 'ANNOUNCEMENT'
  | 'MILESTONE'
  | 'OTHER';

export interface ITeamNewsDiscussion {
  count: number;
  latestTopicUrl: string | null;
}

export interface ITeamNewsItem {
  uid: string;
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
  eventType: TeamNewsEventType;
  eventDate: string;
  title: string;
  summary: string | null;
  sourceUrl: string;
  sourceDomain: string | null;
  tags: string[];
  focusAreas: string[];
  subFocusAreas: string[];
  createdAt: string;
  discussion: ITeamNewsDiscussion;
  isFollowed?: boolean;
}

export interface ICreateTeamNewsDiscussionRequest {
  forumTopicId: number;
  forumTopicSlug: string;
  forumTopicUrl: string;
}

export interface ITeamNewsForumLink {
  uid: string;
  newsItemUid: string;
  forumTopicId: number;
  forumTopicSlug: string;
  forumTopicUrl: string;
  createdByUid: string | null;
  createdAt: string;
}

export interface ICreateTeamNewsDiscussionResponse {
  link: ITeamNewsForumLink;
  created: boolean;
}

export interface ITeamNewsFocusArea {
  uid: string;
  title: string;
}

export interface ITeamNewsGroup {
  focusArea: ITeamNewsFocusArea;
  total: number;
  items: ITeamNewsItem[];
}

export interface ITeamNewsGroupedResponse {
  windowDays: number;
  generatedAt: string;
  groups: ITeamNewsGroup[];
}

export interface ITeamNewsListResponse {
  page: number;
  limit: number;
  total: number;
  items: ITeamNewsItem[];
}

export interface ITeamNewsByTeamResponse {
  teamUid: string;
  teamName: string;
  page: number;
  limit: number;
  total: number;
  items: ITeamNewsItem[];
}

export interface ITeamNewsFiltersResponse {
  eventType: Array<{ value: string; count: number }>;
  focus: Array<{ value: string; count: number }>;
}
