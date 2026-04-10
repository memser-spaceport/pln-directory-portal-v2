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

export const AVAILABLE_SCOPES = ['PLVS', 'PLCC'] as const;
export type ArticleScope = (typeof AVAILABLE_SCOPES)[number];
export const SCOPE_LABELS: Record<string, string> = {
  PLVS: 'PLVS Founder',
  PLCC: 'PLCC Founder',
};
