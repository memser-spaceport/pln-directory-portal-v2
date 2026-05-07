export type TeamNewsEventType =
  | 'FUNDING'
  | 'LAUNCH'
  | 'PARTNERSHIP'
  | 'ANNOUNCEMENT'
  | 'MILESTONE'
  | 'OTHER';

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

export interface ITeamNewsFiltersResponse {
  eventType: Array<{ value: string; count: number }>;
  focus: Array<{ value: string; count: number }>;
}
