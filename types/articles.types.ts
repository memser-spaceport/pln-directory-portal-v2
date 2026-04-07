export interface IArticle {
  uid: string;
  slugURL: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  content: string;
  readingTime: number;
  coverImageUid: string | null;
  authorMemberUid: string;
  authorTeamUid: string;
  status: 'PUBLISHED' | 'DRAFT';
  publishedAt: string;
  coverImage: { url: string } | null;
  authorMember: {
    uid: string;
    name: string;
    email: string;
    image: string | { url: string } | null;
    officeHours: string | null;
    teamMemberRoles?: {
      team: { uid: string; name: string };
      role: string | null;
      mainTeam: boolean;
    }[];
  } | null;
  authorTeam: { uid: string; name: string; logo: { url: string } | null; officeHours: string | null } | null;
  totalViews: number;
  totalLikes: number;
  isLiked: boolean;
}

export interface IArticlesResponse {
  data: IArticle[];
  total: number;
  page: number;
  limit: number;
}

export interface IArticlesByCategory {
  category: string;
  articles: IArticle[];
}

/** `GET /v1/articles/author-search` — RBAC: founder_guides.create */
export interface IArticleAuthorSearchItem {
  uid: string;
  name: string;
  officeHoursUrl?: string | null;
  image: string;
}

export interface IArticleAuthorSearchResponse {
  members: IArticleAuthorSearchItem[];
  teams: IArticleAuthorSearchItem[];
}
