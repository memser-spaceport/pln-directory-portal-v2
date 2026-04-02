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
  authorMember: { uid: string; name: string; email: string; image: string | null; officeHours: string | null } | null;
  authorTeam: { uid: string; name: string; logo: { url: string } | null; officeHours: string | null } | null;
  totalViews: number;
  totalLikes: number;
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
