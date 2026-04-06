export enum ArticlesQueryKeys {
  ARTICLES_LIST = 'articles-list',
}

export const ARTICLES_FETCH_LIMIT = 100;

export const ARTICLE_CATEGORIES = [
  'Fundraising and Capital',
  'Legal',
  'Hiring',
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
