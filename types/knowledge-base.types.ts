export interface IKBArticleMeta {
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  author: string;
  authorUid: string;
  authorRole: string;
  authorImageUrl: string;
  authorOfficeHoursUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  viewCount: number;
  upvotes: number;
  readingTime: number;
}

export interface IKBArticle extends IKBArticleMeta {
  content: string;
}
